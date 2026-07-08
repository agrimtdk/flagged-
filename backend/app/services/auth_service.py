import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.google_oauth import google_oauth_service
from app.services.organization_service import OrganizationService
from app.services.user_service import UserService
from app.services.token_service import TokenService
from app.exceptions import AppException
from typing import Tuple, Any, Optional

logger = logging.getLogger("app.services.auth")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.org_service = OrganizationService(db)
        self.user_service = UserService(db)
        self.token_service = TokenService(db)

    async def login_with_google(self, code: str, redirect_uri: Optional[str] = None) -> Tuple[str, str, Any]:
        """
        Coordinates Google OAuth exchange, bootstraps first-time organizations/owners,
        generates JWT sessions, and commits transaction boundaries.
        """
        # 1. Exchange code with Google
        oauth_user = await google_oauth_service.exchange_code_and_get_user(code, redirect_uri)
        email = oauth_user["email"].lower()

        # 2. Check if user already exists
        user = await self.user_service.get_user_by_email(email)
        
        if user:
            # Existing User Sign In
            if not user.is_active:
                raise AppException(403, "INACTIVE_USER", "Your account has been deactivated.")
                
            org_id = user.organization_id
            role = user.role
            logger.info(f"Existing user login: {email} under organization: {org_id}")
            
        else:
            # 3. New User Onboarding (Bootstrap Organization & Owner User)
            domain = email.split("@")[1]
            
            # Prevent consumer accounts (gmail/yahoo) from creating generic "Gmail Corporation" tenants
            if domain in ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"]:
                org_name = f"{oauth_user['full_name']}'s Personal Org"
            else:
                org_name = f"{domain.split('.')[0].title()} Corporation"
                
            logger.info(f"Onboarding new organization '{org_name}' for email: {email}")
            
            # Begin bootstrap transaction
            org = await self.org_service.create_organization(org_name)
            user = await self.user_service.create_user(
                organization_id=org.id,
                email=email,
                full_name=oauth_user["full_name"],
                role="Owner", # First user is Owner
                avatar_url=oauth_user.get("avatar_url")
            )
            org_id = org.id
            role = "Owner"

        # 4. Generate JWT Tokens
        access_token, refresh_token = await self.token_service.create_session(
            str(user.id),
            str(org_id),
            role
        )

        # 5. Commit transaction boundary (Services own transactions)
        await self.db.commit()
        
        return access_token, refresh_token, user

import pytest
from app.core.context import org_id_ctx
from app.core.database import inject_tenant_context_on_begin
from unittest.mock import MagicMock, patch

# A mock decorator that does not execute actual SQLAlchemy event bindings
def dummy_decorator(*args, **kwargs):
    def wrapper(fn):
        return fn
    return wrapper


@patch("app.core.database.event.listens_for", side_effect=dummy_decorator)
def test_rls_context_variables_and_listener(mock_listens_for):
    # 1. Verify ContextVar stores and resolves variables
    tenant_uuid = "11111111-2222-3333-4444-555555555555"
    token = org_id_ctx.set(tenant_uuid)
    
    try:
        assert org_id_ctx.get() == tenant_uuid
        
        # 2. Test database event interceptor handles calls without crashes
        mock_session = MagicMock()
        mock_transaction = MagicMock()
        mock_connection = MagicMock()
        
        inject_tenant_context_on_begin(mock_session, mock_transaction, mock_connection)
        
        # Verify lists decorator was called to register before_cursor_execute
        mock_listens_for.assert_called_once_with(mock_connection, "before_cursor_execute", once=True)
        
    finally:
        org_id_ctx.reset(token)


@patch("app.core.database.event.listens_for", side_effect=dummy_decorator)
def test_rls_bypassed_when_no_context(mock_listens_for):
    # When tenant_uuid is empty, no event listener is attached
    org_id_ctx.set("")
    
    mock_session = MagicMock()
    mock_transaction = MagicMock()
    mock_connection = MagicMock()
    
    inject_tenant_context_on_begin(mock_session, mock_transaction, mock_connection)
    
    # Event listener should NOT be registered
    mock_listens_for.assert_not_called()

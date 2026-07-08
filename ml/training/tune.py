import logging
import numpy as np
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
from ml.configs import config

logger = logging.getLogger("ml.training.tune")


def tune_hyperparameters(model, param_grid: dict, X_train, y_train, model_name: str):
    """
    Runs stratified randomized search tuning for a given model, optimizing for PR-AUC (average_precision).
    """
    logger.info(f"Initiating hyperparameter tuning for {model_name}...")
    print(f"Tuning {model_name} using RandomizedSearchCV...")
    
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=config.RANDOM_SEED)
    
    # We optimize for 'average_precision' (PR-AUC) as defined in the SDD
    search = RandomizedSearchCV(
        estimator=model,
        param_distributions=param_grid,
        n_iter=5, # Cap iterations to maintain fast pipeline runtimes
        scoring="average_precision",
        cv=cv,
        random_state=config.RANDOM_SEED,
        n_jobs=-1
    )
    
    search.fit(X_train, y_train)
    
    print(f"Tuning completed. Best parameters for {model_name}: {search.best_params_}")
    print(f"Best cross-validated PR-AUC: {search.best_score_:.4f}")
    
    return search.best_estimator_, search.best_params_

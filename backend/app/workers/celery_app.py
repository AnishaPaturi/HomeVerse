"""
Celery Application Configuration
"""
from celery import Celery
import os

CELERY_BROKER = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
CELERY_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

celery_app = Celery(
    "homeverse",
    broker=CELERY_BROKER,
    backend=CELERY_BACKEND,
    include=["app.workers.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

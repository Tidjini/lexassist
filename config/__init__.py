# Assure que l'app Celery est créée et configurée (settings CELERY_* de Django) dès le
# démarrage de Django — sans ça, @shared_task se lie à une app Celery par défaut non
# configurée (broker RabbitMQ localhost par défaut) au lieu de Redis + task_always_eager.
from .celery import app as celery_app

__all__ = ("celery_app",)

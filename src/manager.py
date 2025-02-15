from django.db import models
from django.db.models import QuerySet

from django.utils import timezone


class BaseQuerySet(QuerySet):
    def delete(self):
        """
        handle soft-deleting Queryset
        """
        return self.update(deleted_at=timezone.now())

    def hard_delete(self):
        """
        hard delete
        """
        return super().delete()

    def restore(self):
        """
        restores a soft-deleted item
        """
        return self.update(deleted_at=None)
    

class BaseManager(models.Manager):
    def get_queryset(self):
        return BaseQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)
    
    
class AllObjectsManager(models.Manager):
    def get_queryset(self):
        return BaseQuerySet(self.model, using=self._db)
    
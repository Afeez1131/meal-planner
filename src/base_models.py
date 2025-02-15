from django.db import models
from django.utils import timezone
from src.manager import AllObjectsManager, BaseManager


class SoftDeleteModel(models.Model):
    """
    Abstract base class for soft deletion.
    """
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    objects = BaseManager()
    all_objects = AllObjectsManager()
    
    class Meta:
       abstract = True
       
    def delete(self, *args, **kwargs):
        """
        handles soft-deleting a single instance
        """
        self.deleted_at = timezone.now()
        super().save(*args, **kwargs)
    
    @property
    def is_soft_deleted(self):
        """
        if an instance is soft-deleted or not

        Returns:
            bool: True or False
        """
        return bool(self.deleted_at)
    
    def restore(self, *args, **kwargs):
        """
        restore a soft deleted instance

        Raises:
            ValueError: if the instance is not soft-deleted.
        """
        if not self.is_soft_deleted:
            raise ValueError("This object is not soft-deleted and cannot be restored.")
        self.deleted_at = None
        super().save(*args, **kwargs)
        
    
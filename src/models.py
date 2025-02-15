from django.db import models

from src.base_models import SoftDeleteModel
from src.enums import FoodGroupChoices, FoodSubgroupChoices, MealTypeChoices
from django.utils.crypto import get_random_string

# Create your models here.

class Food(SoftDeleteModel):
   name = models.CharField(max_length=50)
   group = models.CharField(
      max_length=50, 
      choices=FoodGroupChoices.choices
      )
   sub_group = models.CharField(
      max_length=50,
      choices=FoodSubgroupChoices.choices
   )
   
   
class MealPlan(SoftDeleteModel):
   unique_id = models.CharField(max_length=8, unique=True, null=True)
   data = models.JSONField(null=True, blank=True)
   created = models.DateTimeField(auto_now_add=True)
   updated = models.DateTimeField(auto_now=True)
   
   def __str__(self):
      return f'Meal Plan {self.unique_id}'

   @classmethod
   def generate_unique_id(cls):
        while True:
            new_id = get_random_string(length=8)
            if not cls.objects.filter(unique_id=new_id).exists():
                return new_id
             
   def save(self, *args, **kwargs):
      if not self.unique_id:
         self.unique_id = self.generate_unique_id()
      super().save(*args, **kwargs)


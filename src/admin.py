from django.contrib import admin
from src.base_admin import CustomModelAdmin
from src.models import Food, MealPlan

    
@admin.register(Food)
class FoodAdmin(CustomModelAdmin):
    list_display = ['name', 'group', 'sub_group']
    
    
@admin.register(MealPlan)
class MealPlanAdmin(CustomModelAdmin):
    list_display = ['unique_id', 'created', 'updated']
    list_filter = ['created', 'updated']
    

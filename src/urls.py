from django.urls import path
from . import views

app_name = 'src'

urlpatterns = [
    path('', views.Homepage.as_view(), name='homepage'),
    path('ajax-load-foods', views.ajax_load_foods, name='ajax_load_foods'),
    path('ajax-save-plan', views.ajax_save_meal_plan, name='ajax_save_meal_plan'),
    path('ajax-retrieve-plan/<str:unique_id>', views.ajax_retrieve_meal_plan, name='ajax_retrieve_meal_plan'),
]
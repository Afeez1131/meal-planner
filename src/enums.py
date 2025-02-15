from django.db.models import TextChoices


class FoodGroupChoices(TextChoices):
    BASE = "base"
    EXTRA = "extras"
    

class FoodSubgroupChoices(TextChoices):
    RICE = "rice"
    SWALLOW = "swallow"
    SOUP = "soup"
    PROTEIN = "protein"
    SIDES = "sides"
    OTHER = "other"
    
    
class MealTypeChoices(TextChoices):
    SAHOOR = "sahoor"
    IFTAR = "iftar"
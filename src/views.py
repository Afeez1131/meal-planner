from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views import generic
from planner import settings
from src.enums import FoodGroupChoices, FoodSubgroupChoices, MealTypeChoices
from src.models import Food, MealPlan

from django.views.decorators.http import require_http_methods
import json

class Homepage(generic.TemplateView):
    template_name = 'src/index.html'
    
    
"""
const foodDatabase = {
base: {
"Rice Dishes": ["Jollof Rice", "White Rice", "Coconut Rice", "Fried Rice"],
Swallows: ["Amala", "Eba", "Pounded Yam", "Semovita", "Fufu"],
Other: ["Yam", "Beans", "Bread", "Pap", "Custard"],
},
extras: {
Proteins: ["Chicken", "Fish", "Beef", "Eggs", "Ponmo"],
Soups: ["Ewedu", "Egusi", "Okro", "Vegetable Soup", "Gbegiri"],
Sides: ["Plantain", "Coleslaw", "Salad", "Moin-Moin"],
},
};

{
  "base": {
    "rice": [
      "Basmati Rice",
      "Chinese Fried Rice",
      "Coconut Rice",
      "Concoction Rice",
      "Fried Rice",
      "Jollof Rice",
      "Native Rice",
      "Ofada Rice",
      "Palm Oil Rice",
      "Rice Porridge",
      "Rice and Beans",
      "Tuwo Shinkafa",
      "White Rice"
    ],
    "swallow": [
      "Amala",
      "Cassava Fufu",
      "Eba",
      "Fufu",
      "Lafun",
      "Millet Swallow (Tuwon Masara)",
      "Plantain Fufu",
      "Pounded Yam",
      "Semo"
    ],
    "other": [
      "Agege Bread",
      "Agidi",
      "Akamu/Ogi/Pap",
      "Beans",
      "Boiled Plantain",
      "Bread",
      "Cocoyam",
      "Cornflakes",
      "Custard",
      "Ekuru",
      "Garri",
      "Golden Morn",
      "Ikokore",
      "Irish Potato",
      "Masa",
      "Noodles",
      "Quaker Oats",
      "Spaghetti",
      "Sweet Potato",
      "Wheat Meal",
      "Yam"
    ]
  },
  "extra": {
    "soup": [
      "Afang Soup",
      "Ayamase (Designer Stew)",
      "Banga Soup",
      "Bitter Leaf Soup",
      "Edikang Ikong",
      "Efo Elegusi",
      "Efo Riro",
      "Egusi Soup",
      "Ewedu Soup",
      "Fisherman Soup",
      "Gbegiri",
      "Miyan Kuka",
      "Ofe Nsala",
      "Ofe Owerri",
      "Ogbono Soup",
      "Oha Soup",
      "Okra Soup",
      "Pepper Soup",
      "Vegetable Soup",
      "White Soup"
    ],
    "protein": [
      "Assorted Meat",
      "Asun",
      "Beef",
      "Boiled Egg",
      "Bokoto",
      "Bush Meat",
      "Chicken",
      "Dambu Nama (Shredded Dried Meat)",
      "Fish",
      "Fried Chicken",
      "Fried Egg",
      "Fried Fish",
      "Gizzard",
      "Goat Meat",
      "Grilled Chicken",
      "Grilled Fish",
      "Isiewu",
      "Kidney",
      "Kilishi",
      "Kpomo Alata (Peppered Ponmo)",
      "Liver",
      "Nkwobi",
      "Omelette",
      "Ponmo",
      "Scrambled Egg",
      "Shaki",
      "Snail",
      "Stock Fish",
      "Suya",
      "Turkey",
      "Wara (Local Cheese)"
    ],
    "sides": [
      "Abacha (African Salad)",
      "Adalu (Beans and Corn Porridge)",
      "Akara",
      "Boli (Roasted Plantain)",
      "Bournvita",
      "Chicken Stew",
      "Chin Chin",
      "Coleslaw",
      "Danwake (Bean Dumplings)",
      "Dodo (Fried Plantain)",
      "Ewa Agoyin",
      "Fish Roll",
      "Fish Stew",
      "Fried Yam",
      "Fura de Nunu",
      "Jollof Sauce",
      "Kilishi (Northern Nigerian Dry Meat)",
      "Kuli Kuli",
      "Kunu",
      "Masa (Rice Cake)",
      "Meat Pie",
      "Milo",
      "Moin Moin",
      "Obe Ata",
      "Ofada Stew",
      "Okpa (Bambara Nut Pudding)",
      "Plantain Chips",
      "Pof Pof (Puff Puff)",
      "Salad",
      "Tea",
      "Tigernut Milk",
      "Tomato Stew",
      "Ugba (Oil Bean Salad)",
      "Yam Chips",
      "Zobo"
    ]
  }
}
"""

def create_food_payload():
    # Fetch all foods, ordered by name
    foods = Food.objects.order_by('name')
    
    # Create a nested dictionary to organize foods
    response = {}
    
    # Iterate through food groups
    for group in FoodGroupChoices.values:
        # Filter foods for this group
        group_foods = foods.filter(group=group)
        
        # Create a subdictionary for this group
        response[group] = {}
        
        # Iterate through subgroups
        for sub in FoodSubgroupChoices.values:
            # Filter foods for this subgroup within the current group
            subgroup_foods = group_foods.filter(sub_group=sub)
            
            # Store food names for this subgroup
            response[group][sub] = [food.name for food in subgroup_foods]
    
    # Optional: Remove empty subgroups
    response = {
        group: {sub: foods for sub, foods in subgroups.items() if foods}
        for group, subgroups in response.items()
        if subgroups
    }
    
    return response

def ajax_load_foods(request):
    payload = create_food_payload()
    return JsonResponse(payload)



@require_http_methods(["POST"])
def ajax_save_meal_plan(request):

    try:
        # data = request.POST.get('plan', [])
        data = json.loads(request.body)
        meal_plan = MealPlan.objects.create(data=data)

        # Generate shareable URL
        share_url = f"{settings.BASE_URL}{reverse('src:homepage')}?id={meal_plan.unique_id}"
        print('url: ', share_url)
        return JsonResponse({
            'success': True, 
            'share_url': share_url,
            'unique_id': meal_plan.unique_id
        })
    except Exception as e:
        print(str(e))
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
    

@require_http_methods(["GET"])
def ajax_retrieve_meal_plan(request, unique_id):
    try:
        meal_plan = MealPlan.objects.get(unique_id=unique_id)   
        print('meal plan: ', meal_plan.data)     
        return JsonResponse(meal_plan.data, safe=False)
    except MealPlan.DoesNotExist:
        return JsonResponse({'error': 'Plan not found'}, status=404)
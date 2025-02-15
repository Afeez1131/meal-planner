import json
from django.core.management.base import BaseCommand
from src.models import Food, FoodGroupChoices, FoodSubgroupChoices  # Replace 'your_app' with your actual app name

class Command(BaseCommand):
    help = "Loads food data from a JSON file into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--json",
            type=str,
            help="Path to the JSON file containing food data",
            required=True,
        )

    def handle(self, *args, **options):
        json_file_path = options["json"]

        try:
            with open(json_file_path, "r", encoding="utf-8") as file:
                data = json.load(file)
                print('data: ', data)
            if "food_categories" not in data:
                self.stderr.write(self.style.ERROR("Invalid JSON format. Missing 'food_categories' key."))
                return

            food_categories = data["food_categories"]
            created_count = 0
            updated_count = 0

            for item in food_categories:
                name = item.get("name")
                group = item.get("type")
                sub_group = item.get("group")

                if not all([name, group, sub_group]):
                    self.stderr.write(
                        self.style.WARNING(f"Skipping incomplete entry: {item}")
                    )
                    continue

                # Map the group and sub_group to the choices
                group_value = (
                    FoodGroupChoices.BASE if group.lower() == "base" else FoodGroupChoices.EXTRA
                )
                sub_group_value = getattr(FoodSubgroupChoices, sub_group.upper(), None)

                if not sub_group_value:
                    self.stderr.write(
                        self.style.WARNING(f"Unknown subgroup '{sub_group}' for item: {name}. Skipping.")
                    )
                    continue

                # Check if the food already exists
                food, created = Food.objects.update_or_create(
                    name=name,
                    defaults={
                        "group": group_value,
                        "sub_group": sub_group_value,
                    },
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully loaded {created_count} new foods and updated {updated_count} existing foods."
                )
            )

        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"File not found: {json_file_path}"))
        except Exception as e: #json.JSONDecodeError:
            print(str(e))
            self.stderr.write(self.style.ERROR("Invalid JSON format. Please check the file."))
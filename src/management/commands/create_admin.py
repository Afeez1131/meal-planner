from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from decouple import config

class Command(BaseCommand):
    help = "Create an admin user if it doesn't already exist"

    def handle(self, *args, **options):
        # Check if the admin user already exists
        if not User.objects.filter(username='admin').exists():
            password = config('ADMIN_PASSWORD')
            # Create the superuser
            User.objects.create_superuser(
                username='admin',
                email='admin@gmail.com',
                password=password
            )
            self.stdout.write(self.style.SUCCESS("Admin user 'admin' created successfully."))
        else:
            self.stdout.write(self.style.NOTICE("Admin user 'admin' already exists. Skipping creation."))
            
from django.contrib import admin

class CustomModelAdmin(admin.ModelAdmin):
    actions = ['restore_selected']
    
    def restore_selected(self, request, queryset):
        queryset.restore()
        self.message_user(request, f"Successfully restored {queryset.count()} items.")
    restore_selected.short_description = "Restore selected items"
    
    def get_queryset(self, request):
        return self.model.all_objects.all()
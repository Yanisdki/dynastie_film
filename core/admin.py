from django.contrib import admin
from .models import Project, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_published', 'order')
    list_filter = ('is_published', 'category')
    search_fields = ('title',)
    prepopulated_fields = {'slug': ('title',)} # Remplit le slug automatiquement
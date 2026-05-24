from django.db import models
from django.utils.text import slugify

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

class Project(models.Model):
    # Identité
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    
    # Classification (Prêt pour la partie Inspiration/Filtrage)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='projects')
    
    # Médias (Le coeur du portfolio)
    cover_image = models.ImageField(upload_to='projects/covers/')
    
    # Workflow
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', '-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
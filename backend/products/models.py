from django.db import models
from django.utils import timezone
import uuid
import re
class Products(models.Model):
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4,editable=False)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True,editable=False)
    CATEGORY_CHOICE = {
        "Food" : " Food",
        "Cloths" : " Cloths",
        "Utensils" : " Utensils",
        "Furniture" : " Furniture",
        "Cosmetics" : "Cosmetics"
    }
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICE)
    description = models.CharField(blank=True,null=True,max_length=500)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    unit_price = models.DecimalField(max_digits=10,decimal_places=2)
    quantity = models.PositiveIntegerField()
    # reorder_level = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    product_image = models.ImageField(null=True,blank=True,upload_to="images/")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    def _build_base_sku(self):
        name_part = re.sub(r"[^A-Za-z0-9]", "", (self.name or "").upper())[:3].ljust(3, "X")
        date_part = timezone.localdate().strftime("%Y%m%d")
        return f"ITM-{name_part}-{date_part}"

    def save(self, *args, **kwargs):
        if not self.sku:
            base_sku = self._build_base_sku()
            candidate = base_sku
            suffix = 1
            while Products.objects.filter(sku=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_sku}{suffix:02d}"
                suffix += 1
            self.sku = candidate

        return super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.name}"

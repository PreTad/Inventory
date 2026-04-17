import re
import uuid
from django.db import models
from django.utils import timezone
from products.models import Products
# Create your models here.


class Order(models.Model):
     id = models.UUIDField(primary_key=True, default=uuid.uuid4,editable=False)
     order_number = models.CharField(max_length=30,unique=True,editable=False)
     STATUS_CHOICE = [
        ("placed", "Placed"),
        ("fulfilled", "Fulfilled"),
        ("cancelled", "Cancelled"),
     ]
     status = models.CharField(choices=STATUS_CHOICE, max_length=20, default="placed")
     
     customer_name = models.CharField(max_length=255, blank=True, null=True)
     customer_phone = models.CharField(max_length=30, blank=True, null=True)
     
     total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
     
     created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
     updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
     
     def _build_base_order_number(self):
        # Build a stable, date-based prefix for order numbers.
        name_part = "XXX"
        first_item = self.items.select_related("product").order_by("id").first()
        if first_item and first_item.product and first_item.product.name:
            name_part = re.sub(r"[^A-Za-z0-9]", "", first_item.product.name.upper())[:3].ljust(3, "X")
        date_part = timezone.localdate().strftime("%Y%m%d")
        return f"ORD-{name_part}-{date_part}"

     def save(self, *args, **kwargs):
        if not self.order_number:
            base_ = self._build_base_order_number()
            candidate = base_
            suffix = 1
            while Order.objects.filter(order_number=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_}{suffix:02d}"
                suffix += 1
            self.order_number = candidate
        return super().save(*args, **kwargs)
    
     def __str__(self):
        if self.customer_name:
            return self.customer_name
        return self.order_number or f"Order {self.pk}"
    
     
class OrderItem(models.Model):
    order = models.ForeignKey(Order,on_delete=models.CASCADE,related_name="items")
    product = models.ForeignKey(Products,on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    
    def save(self, *args, **kwargs):
        self.line_total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        total = sum(item.line_total for item in self.order.items.all())
        self.order.total = total
        self.order.save(update_fields=["total"])

from django.db import models
from django.conf import settings
from products.models import Products

class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="cart",
        null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.email if self.user else 'Guest'}"

    @property
    def total_price(self):
        return sum(cart_item.line_total for cart_item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart, 
        on_delete=models.CASCADE, 
        related_name="items" 
    )
    product = models.ForeignKey(Products, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        # This prevents duplicate rows for the same product in one cart
        unique_together = ('cart', 'product')

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    @property
    def line_total(self):
        """
        Calculates price based on CURRENT product price.
        If your Products model field is called 'price', use self.product.price
        """
        return self.quantity * self.product.unit_price
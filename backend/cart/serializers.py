from rest_framework import serializers
from .models import Cart, CartItem
from products.models import Products

class ProductSimpleSerializer(serializers.ModelSerializer):
    """Shows basic product info in the cart response"""
    class Meta:
        model = Products
        fields = ['id', 'name', 'unit_price', 'sku', 'product_image']

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSimpleSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Products.objects.all(), 
        source='product', 
        write_only=True
    )
    # line_total is a @property in the model
    line_total = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'line_total']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.ReadOnlyField()
    
    # Add these virtual fields so the API knows it CAN accept them
    product_id = serializers.UUIDField(write_only=True, required=False)
    quantity = serializers.IntegerField(write_only=True, default=1, required=False)
    user = serializers.ReadOnlyField(source = "user.id")

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total_price', 'product_id', 'quantity', 'created_at']

    def create(self, validated_data):
        # Grab the product info if provided
        product_id = validated_data.pop('product_id', None)
        quantity = validated_data.pop('quantity', 1)
        
        # Get or create the cart for the user
        cart, _ = Cart.objects.get_or_create(user=self.context['request'].user)

        # If a product was sent, add it to the cart immediately
        if product_id:
            product = Products.objects.get(pk=product_id)
            item, created = CartItem.objects.get_or_create(cart=cart, product=product)
            if not created:
                item.quantity += quantity
            else:
                item.quantity = quantity
            item.save()
            
        return cart

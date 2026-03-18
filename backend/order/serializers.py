from rest_framework import serializers
from .models import *
from django.db import IntegrityError, transaction
from django.db.models import F
from django.core.exceptions import *

class OrderItemsSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = OrderItem
        fields = [
            "product",
            "quantity",
            "line_total"
        ]
        read_only_fields =[
            "line_total",
            "unit_price",
        ]

class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemsSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "customer_name",
            "customer_phone",
            "items",
            
        ]
        read_only_fields = [
            "status",
            "items.line_total"
            "total",
        ]

    def create(self, validated_data):

        items_data = validated_data.pop("items")
        
        with transaction.atomic():
            order = Order.objects.create(**validated_data)
            total = 0

            for item in items_data:
                quantity = item["quantity"]
                unit_price = item["unit_price"]

                product = item["product"]

                current_quantity = Products.objects.filter(
                    id=product.id
                ).values_list("quantity", flat=True).first()

                if quantity > current_quantity:
                    raise serializers.ValidationError(f' Not enough {product.name} to order!')

                line_total = quantity * unit_price

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    line_total=line_total,
                )

                Products.objects.filter(id=product.id).update(
                    quantity=F("quantity") - quantity
                )

                total += line_total

            order.total = total
            order.save()

        return order           
    
    
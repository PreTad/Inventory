from rest_framework import serializers
from .models import *
from django.db import IntegrityError, transaction
from django.core.exceptions import *
class OrderItemsSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = OrderItem
        fields = '__all__'

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
            "total",
            "items",
        ]

    def create(self, validated_data):

        items_data = validated_data.pop("items")
        
        with transaction.atomic():
            order = Order.objects.create(**validated_data)
            total = 0

            for item in items_data:
                quantity = item["quantity"]
                unit_price = item["unit_price"]
                line_total = quantity * unit_price

                OrderItem.objects.create(
                    order=order,
                    product=item["product"],
                    quantity=quantity,
                    unit_price=unit_price,
                    line_total=line_total,
                )

                total += line_total

            order.total = total
            order.save()

        return order           
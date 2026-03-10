from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from .serializers import *
from .models import *
# Create your views here.

class OrdersView(ModelViewSet):
    serializer_class = OrderSerializer
    queryset = Order.objects.all()
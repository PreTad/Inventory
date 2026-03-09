from django.shortcuts import render
from rest_framework import generics
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .serializers import *
from .models import *
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema

# Create your views here.
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="category",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            required=False,
            description="Filter products by category. ",
        ),
        OpenApiParameter(
            name="name",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            required=False,
            description="Filter by Name",
        ),
        
    ]
)
class ProductView(ModelViewSet):
    
    # permission_classes = [IsAuthenticated]
    serializer_class = ProductViewSerializer
    queryset = Products.objects.all()
    
    def get_queryset(self):
        
        category = self.request.query_params.get("category")
        name = self.request.query_params.get("name")
        # category = self.request.query_params.get("category")
        
        if category:
            queryset = Products.objects.filter(category__istartswith = category)
        if name:
            queryset = Products.objects.filter(name__istartswith = name)
        
        return queryset
    

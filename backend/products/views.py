from django.shortcuts import render
from rest_framework import generics
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .serializers import *
from .models import *
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema
from rest_framework import filters
from django.db.models import Q
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
            name="search",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            required=False,
            description="Search by Name or SKU",
        ),
        
    ]
)
class ProductView(ModelViewSet):
    
    # permission_classes = [IsAuthenticated]
    serializer_class = ProductViewSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name','sku']
    def get_queryset(self):
        
        queryset = Products.objects.all()
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")        
        
        if category:
            queryset = Products.objects.filter(category__istartswith = category)
        if search:
            queryset = Products.objects.filter(Q(name__icontains = search) | Q(sku__istartswith = search)).order_by('created_at')
        
        return queryset
    

from rest_framework import response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .serializers import *
from .models import *
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema
from rest_framework import filters
from rest_framework.views import APIView
from paginations import ProductListPagination
from django.db.models import Q,Sum,F,Count

# @extend_schema(
#     parameters=[
#         OpenApiParameter(
#             name="category",
#             type=OpenApiTypes.STR,
#             location=OpenApiParameter.QUERY,
#             required=False,
#             description="Filter products by category.",
#         ),
#         OpenApiParameter(
#             name="search",
#             type=OpenApiTypes.STR,
#             location=OpenApiParameter.QUERY,
#             required=False,
#             description="Search by name or SKU.",
#         ),
#     ]
# )
class ProductView(ModelViewSet):
    serializer_class = ProductViewSerializer
    pagination_class = ProductListPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'sku']

    def get_queryset(self):
        queryset = Products.objects.all().order_by('-created_at', '-id')
        
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")        
        
        if category:
            queryset = queryset.filter(category__istartswith=category)
            
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(sku__istartswith=search)
            )
        
        return queryset
class InventoryStatsView(APIView):
    
    def get(self, request):
        
        products = Products.objects.all()
        total_items = products.count()
        stats = products.aggregate(
            total_val=Sum(F('quantity') * F('unit_price')),
        )
        inventory_value = stats['total_val'] or 0
        low_stocks = products.filter(quantity__lt = 10).count()
        low_stocks_ = products.filter(quantity__lt = 10).values('name','quantity')
        
        stock = products.values('category').annotate(
            name = F('category'),
            stock_volume = Count('id')
        ).values('name','stock_volume')
        
        stock_value = products.values('category').annotate(
            name = F('category'),
            stock_value = Sum(F('unit_price') * F('quantity'))
        ).values('name','stock_value')
        
        return response.Response({
            "total_items" : total_items,
            "inventory_value" : inventory_value,
            "low_stocks" : low_stocks,
            "stock" : list(stock),
            "stock_value" : list(stock_value),
            "low_stocks_" : list(low_stocks_)
            })

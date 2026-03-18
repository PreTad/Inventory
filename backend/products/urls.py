from django.urls import path,include
from .views import *
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"products",ProductView,basename="products")
urlpatterns = [
    path('',include(router.urls))
] 

from django.urls import path
from . import views

urlpatterns = [
    path('payments/initialize/', views.initialize_payment, name='initialize-payment'),
    path('payments/verify/<str:tx_ref>/', views.verify_payment, name='verify-payment'),
    path('payments/attach-order/', views.attach_order_to_transaction, name='attach-order-to-transaction'),
]

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import Cart, CartItem
from .serializers import CartSerializer
from products.models import Products

class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.none()
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users only see their own cart
        if getattr(self, "swagger_fake_view", False):
            return Cart.objects.none()
        if not self.request.user.is_authenticated:
            return Cart.objects.none()
        return Cart.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get("product_id") or request.data.get("id")
        if not product_id:
            raise ValidationError({"product_id": "Send product_id (or id)."})

        try:
            quantity = int(request.data.get("quantity", 1))
        except (TypeError, ValueError):
            raise ValidationError({"quantity": "Quantity must be a whole number."})

        if quantity < 1:
            raise ValidationError({"quantity": "Quantity must be at least 1."})

        try:
            product = Products.objects.get(pk=product_id)
        except Products.DoesNotExist:
            return Response({"product_id": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"product_id": "Invalid product id format."}, status=status.HTTP_400_BAD_REQUEST)

        # We use get_or_create to handle existing items in the cart.
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product
        )

        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity

        cart_item.save()
        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        product_id = request.data.get("product_id") or request.data.get("id")
        if not product_id:
            raise ValidationError({"product_id": "Send product_id (or id)."})
        CartItem.objects.filter(cart__user=request.user, product_id=product_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

import uuid
import json
from decimal import Decimal, InvalidOperation
from urllib import error, request as urllib_request
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Transaction
from order.models import Order
from order.serializers import OrderSerializer


def _chapa_request(method, endpoint, payload=None):
    url = f"{settings.CHAPA_API_URL}/{endpoint}"
    headers = {
        "Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}",
        "Content-Type": "application/json",
    }
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib_request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib_request.urlopen(req, timeout=20) as chapa_response:
            raw_data = chapa_response.read().decode("utf-8")
            return chapa_response.getcode(), json.loads(raw_data)
    except error.HTTPError as http_error:
        raw_data = http_error.read().decode("utf-8") if http_error.fp else "{}"
        try:
            parsed = json.loads(raw_data)
        except json.JSONDecodeError:
            parsed = {"message": "Chapa returned an invalid error response."}
        return http_error.code, parsed
    except (error.URLError, TimeoutError):
        return None, {"message": "Unable to connect to Chapa. Please try again."}
    except json.JSONDecodeError:
        return None, {"message": "Chapa returned an invalid response."}


def _validate_amount(amount_value):
    try:
        amount = Decimal(str(amount_value))
    except (InvalidOperation, TypeError, ValueError):
        return None
    return amount if amount > 0 else None


def _default_customer_name(user):
    full_name = ""
    if hasattr(user, "get_full_name"):
        full_name = user.get_full_name().strip()
    if full_name:
        return full_name

    for attr in ("full_name", "name", "username"):
        value = getattr(user, attr, "")
        if value:
            return str(value).strip()

    return getattr(user, "email", "") or "Customer"


def _normalize_order_payload(order_payload, user):
    if not isinstance(order_payload, dict):
        return None

    items = order_payload.get("items")
    if not isinstance(items, list):
        return None

    normalized_items = []
    for item in items:
        if not isinstance(item, dict):
            continue
        product = item.get("product") or item.get("product_id") or item.get("id")
        quantity = item.get("quantity")
        normalized_items.append(
            {
                "product": product,
                "quantity": quantity,
            }
        )

    payload = {
        "customer_name": order_payload.get("customer_name") or _default_customer_name(user),
        "customer_phone": order_payload.get("customer_phone") or "",
        "items": normalized_items,
    }
    return payload


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_payment(request):
    if not settings.CHAPA_SECRET_KEY:
        return Response(
            {"message": "CHAPA_SECRET_KEY is not configured."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    tx_ref = f"tx-{uuid.uuid4().hex[:10]}"
    order_id = request.data.get("order_id")
    order_payload = request.data.get("order_payload")
    order = None
    if order_id:
        order = get_object_or_404(Order, pk=order_id)
    elif order_payload:
        normalized_payload = _normalize_order_payload(order_payload, request.user)
        serializer = OrderSerializer(data=normalized_payload)
        if normalized_payload is None or not serializer.is_valid():
            return Response(
                {
                    "message": "Invalid order payload. Please refresh your cart and try again.",
                    "errors": {} if normalized_payload is None else serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        order_payload = normalized_payload
    amount = _validate_amount(request.data.get("amount"))
    if amount is None:
        return Response(
            {"message": "Invalid amount. Provide a positive numeric value."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if order and amount != order.total:
        return Response(
            {"message": "Payment amount must match order total."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not request.user.email:
        return Response(
            {"message": "A valid user email is required to initialize payment."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    transaction = Transaction.objects.create(
        user=request.user,
        order=order,
        order_payload=order_payload,
        amount=amount,
        tx_ref=tx_ref
    )

    callback_url = f"{settings.CHAPA_CALLBACK_BASE_URL.rstrip('/')}/api/payments/verify/{tx_ref}/"
    payload = {
        "amount": str(amount),
        "currency": "ETB",
        "email": request.user.email,
        "tx_ref": tx_ref,
        "callback_url": callback_url,
        "return_url": settings.CHAPA_RETURN_URL,
    }

    status_code, chapa_data = _chapa_request("POST", "initialize", payload=payload)
    if status_code is None or status_code >= 400:
        transaction.status = "failed"
        transaction.save(update_fields=["status"])
        return Response(
            chapa_data,
            status=status.HTTP_502_BAD_GATEWAY if status_code is None else status_code,
        )

    return Response(
        {
            **chapa_data,
            "local_tx_ref": tx_ref,
        },
        status=status_code,
    )

@api_view(['GET'])
def verify_payment(request, tx_ref):
    if not settings.CHAPA_SECRET_KEY:
        return Response(
            {"message": "CHAPA_SECRET_KEY is not configured."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    transaction = get_object_or_404(Transaction, tx_ref=tx_ref)
    status_code, chapa_data = _chapa_request("GET", f"verify/{tx_ref}")
    if status_code is None:
        return Response(chapa_data, status=status.HTTP_502_BAD_GATEWAY)

    if chapa_data.get("status") == "success":
        # Chapa's internal status: 'success', 'failed', 'pending'
        payment_state = chapa_data.get("data", {}).get("status", "").lower()
        
        if payment_state == "success":
            transaction.status = "success"
            if transaction.order_id:
                transaction.order.status = "fulfilled"
                transaction.order.save(update_fields=["status"])
            elif transaction.order_payload:
                normalized_payload = _normalize_order_payload(transaction.order_payload, transaction.user)
                serializer = OrderSerializer(data=normalized_payload)
                if normalized_payload is None or not serializer.is_valid():
                    transaction.save(update_fields=["status"])
                    return Response(
                        {
                            "message": "Payment succeeded, but order creation failed.",
                            "errors": {} if normalized_payload is None else serializer.errors,
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
                try:
                    order = serializer.save()
                except Exception as exc:
                    transaction.save(update_fields=["status"])
                    details = getattr(exc, "detail", None)
                    return Response(
                        {
                            "message": "Payment succeeded, but order creation failed.",
                            "errors": details if details is not None else str(exc),
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
                order.status = "fulfilled"
                order.save(update_fields=["status"])
                transaction.order = order
        elif payment_state in {"failed", "cancelled"}:
            transaction.status = "failed"
        # If 'pending', we leave it as 'pending'

        update_fields = ["status"]
        if transaction.order_id:
            update_fields.append("order")
        transaction.save(update_fields=update_fields)

    return Response(chapa_data, status=status_code)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def attach_order_to_transaction(request):
    tx_ref = request.data.get("tx_ref")
    order_id = request.data.get("order_id")

    if not tx_ref or not order_id:
        return Response(
            {"message": "tx_ref and order_id are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    transaction = get_object_or_404(Transaction, tx_ref=tx_ref, user=request.user)
    order = get_object_or_404(Order, pk=order_id)

    if transaction.order_id and str(transaction.order_id) != str(order.id):
        return Response(
            {"message": "Transaction is already attached to another order."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if transaction.amount != order.total:
        return Response(
            {"message": "Order total does not match transaction amount."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    transaction.order = order
    transaction.save(update_fields=["order"])

    if transaction.status == "success" and order.status != "fulfilled":
        order.status = "fulfilled"
        order.save(update_fields=["status"])

    return Response({"message": "Order attached to transaction."}, status=status.HTTP_200_OK)

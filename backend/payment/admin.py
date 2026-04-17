from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "tx_ref", "amount", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("tx_ref", "user__email")

from django.contrib import admin

from .models import (
    EscrowContract,
    EscrowDispute,
    InspectionReport,
    LogisticsBooking,
    User,
    Vehicle,
    WalletTransaction,
)

admin.site.register(User)
admin.site.register(Vehicle)
admin.site.register(EscrowContract)
admin.site.register(InspectionReport)
admin.site.register(LogisticsBooking)
admin.site.register(EscrowDispute)
admin.site.register(WalletTransaction)

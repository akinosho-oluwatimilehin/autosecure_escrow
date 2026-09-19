from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        BUYER = 'BUYER', 'Customer / Buyer'
        DEALERSHIP = 'DEALERSHIP', 'Car Dealership'
        REPAIR_SHOP = 'REPAIR_SHOP', 'Car Repair Shop / Inspector Hub'
        LOGISTICS = 'LOGISTICS', 'Auto Transport Carrier'

    role = models.CharField(
        max_length=20, 
        choices=Role.choices, 
        default=Role.BUYER,
        help_text="Determines user platform permissions and dashboard views"
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    company_name = models.CharField(max_length=255, blank=True, null=True, help_text="Registered business name for Dealership, Repair Shop, or Carrier")
    address = models.TextField(blank=True, null=True, help_text="Physical office/lot address")

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Vehicle(models.Model):
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    vin = models.CharField(max_length=17, unique=True)
    mileage = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    transmission = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    is_available = models.BooleanField(default=True)  # <-- Add this field
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.year} {self.make} {self.model} ({self.vin})"

class EscrowContract(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Approval'
        ACTIVE = 'ACTIVE', 'Active / Escrow Funded'
        INSPECTION = 'INSPECTION', 'Under Inspection'
        LOGISTICS = 'LOGISTICS', 'In Transit'
        COMPLETED = 'COMPLETED', 'Completed / Funds Released'
        DISPUTED = 'DISPUTED', 'Dispute Raised'
        CANCELLED = 'CANCELLED', 'Cancelled'

    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='buyer_contracts')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_contracts')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='escrow_contracts', null=True, blank=True)
    inspector = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inspector_contracts')
    carrier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='carrier_contracts')
    
    vehicle_details = models.CharField(max_length=255, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Escrow #{self.id} - {self.vehicle or self.vehicle_details} ({self.get_status_display()})"


class InspectionReport(models.Model):
    class Recommendation(models.TextChoices):
        PASS = 'PASS', 'Pass / Vehicle Approved'
        FAIL = 'FAIL', 'Fail / Significant Issues Detected'
        CONDITIONAL = 'CONDITIONAL', 'Conditional / Repairs Required'

    escrow = models.OneToOneField(EscrowContract, on_delete=models.CASCADE, related_name='inspection_report')
    inspector = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_inspections')
    overall_condition = models.CharField(max_length=50)
    odometer_reading = models.IntegerField(help_text="Current mileage verified during inspection")
    notes = models.TextField(help_text="Detailed mechanics notes regarding engine, bodywork, and structural integrity")
    recommendation = models.CharField(max_length=20, choices=Recommendation.choices, default=Recommendation.PASS)
    passed_inspection = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inspection for Escrow #{self.escrow.id} - {self.get_recommendation_display()}"


class LogisticsBooking(models.Model):
    class Status(models.TextChoices):
        ASSIGNED = 'ASSIGNED', 'Carrier Assigned'
        PICKED_UP = 'PICKED_UP', 'Picked Up / In Transit'
        DELIVERED = 'DELIVERED', 'Delivered to Destination'
        DELAYED = 'DELAYED', 'Transit Delayed'

    escrow = models.OneToOneField(EscrowContract, on_delete=models.CASCADE, related_name='logistics_booking')
    carrier = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_shipments')
    pickup_address = models.TextField()
    delivery_address = models.TextField()
    tracking_number = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ASSIGNED)
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Logistics #{self.tracking_number} - {self.get_status_display()}"


class EscrowDispute(models.Model):
    class DisputeReason(models.TextChoices):
        VEHICLE_CONDITION_MISMATCH = 'VEHICLE_CONDITION_MISMATCH', 'Vehicle Condition Mismatch'
        UNDISCLOSED_DAMAGE = 'UNDISCLOSED_DAMAGE', 'Undisclosed Damage'
        LOGISTICS_DELAY_DAMAGE = 'LOGISTICS_DELAY_DAMAGE', 'Transit Damage / Failure'
        DOCUMENTATION_ISSUE = 'DOCUMENTATION_ISSUE', 'Title / Documentation Issue'
        OTHER = 'OTHER', 'Other'

    class DisputeStatus(models.TextChoices):
        OPEN = 'OPEN', 'Open / Under Investigation'
        IN_REVIEW = 'IN_REVIEW', 'In Review by Arbiter'
        RESOLVED = 'RESOLVED', 'Resolved'

    class ResolutionOutcome(models.TextChoices):
        FULL_REFUND_BUYER = 'FULL_REFUND_BUYER', 'Full Refund to Buyer'
        FULL_PAYOUT_SELLER = 'FULL_PAYOUT_SELLER', 'Full Payout to Seller'
        PARTIAL_REFUND = 'PARTIAL_REFUND', 'Partial Refund / Split Settlement'

    escrow = models.OneToOneField(EscrowContract, on_delete=models.CASCADE, related_name='dispute')
    raised_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='raised_disputes')
    reason = models.CharField(max_length=50, choices=DisputeReason.choices)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=DisputeStatus.choices, default=DisputeStatus.OPEN)
    
    # Resolution fields
    resolution_outcome = models.CharField(max_length=30, choices=ResolutionOutcome.choices, null=True, blank=True)
    buyer_refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    seller_payout_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    arbiter_notes = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Dispute #{self.id} for Escrow #{self.escrow.id} ({self.get_status_display()})"


class WalletTransaction(models.Model):
    class TransactionType(models.TextChoices):
        DEPOSIT = 'DEPOSIT', 'Deposit / Escrow Lock'
        PAYOUT = 'PAYOUT', 'Payout Release'
        REFUND = 'REFUND', 'Dispute Refund'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wallet_transactions')
    escrow = models.ForeignKey(EscrowContract, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    reference = models.CharField(max_length=100, unique=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_transaction_type_display()} - NGN {self.amount} ({self.user.username})"

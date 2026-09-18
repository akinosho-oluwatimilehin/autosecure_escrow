import uuid
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, status, viewsets, serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    EscrowContract,
    EscrowDispute,
    InspectionReport,
    LogisticsBooking,
    User,
    Vehicle,
    WalletTransaction,
)
from .permissions import (
    IsBuyerUser,
    IsContractParticipant,
    IsDealershipUser,
    IsLogisticsUser,
    IsRepairShopUser,
)
from .serializers import (
    CancelEscrowSerializer,
    CustomTokenObtainPairSerializer,
    DispatchInspectorSerializer,
    EscrowContractCreateSerializer,
    EscrowContractDetailSerializer,
    FundEscrowSerializer,
    InspectionReportSerializer,
    LogisticsBookingSerializer,
    LogisticsStatusUpdateSerializer,
    OpenDisputeSerializer,
    ResolveDisputeSerializer,
    SubmitInspectionReportSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    VehicleSerializer,
)


def home_view(request):
    """Display a simple landing page at the project root."""
    return HttpResponse("<h1>AutoSecure Escrow</h1><p>API server is running.</p>")


# =============================================================================
# 1. AUTHENTICATION & USER PROFILE VIEWS
# =============================================================================

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Takes user credentials and returns access/refresh JWT tokens alongside role data.
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Public endpoint to register a new user with a designated role 
    (BUYER, DEALERSHIP, REPAIR_SHOP, or LOGISTICS).
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "message": "User account created successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "company_name": getattr(user, 'company_name', '')
            }
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET / PUT / PATCH /api/auth/profile/
    Authenticated endpoint to view or update profile information for the current user.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# =============================================================================
# 2. VEHICLE INVENTORY VIEWS
# =============================================================================

class VehicleViewSet(viewsets.ModelViewSet):
    """
    - GET /api/vehicles/ : Public listing of all available vehicles (filterable by ?make=).
    - POST /api/vehicles/ : Dealerships can list a new vehicle.
    - GET / PUT / PATCH / DELETE /api/vehicles/{id}/ : View or manage vehicle listings.
    """
    queryset = Vehicle.objects.filter(is_available=True)
    serializer_class = VehicleSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsDealershipUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Vehicle.objects.all()
        if self.action == 'list':
            queryset = queryset.filter(is_available=True)
            make = self.request.query_params.get('make')
            if make:
                queryset = queryset.filter(make__iexact=make)
        return queryset

    def perform_create(self, serializer):
        serializer.save(dealership=self.request.user)


# =============================================================================
# 3. ESCROW CONTRACT & FUNDING VIEWS
# =============================================================================

class EscrowContractListCreateView(generics.ListCreateAPIView):
    """
    - GET /api/escrows/ : Returns contracts where the current user is a participant.
    - POST /api/escrows/ : Buyers can draft a new Escrow Contract for an available vehicle.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EscrowContractCreateSerializer
        return EscrowContractDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == user.Role.BUYER:
            return EscrowContract.objects.filter(buyer=user)
        elif user.role == user.Role.DEALERSHIP:
            return EscrowContract.objects.filter(dealership=user)
        elif user.role == user.Role.REPAIR_SHOP:
            return EscrowContract.objects.filter(repair_shop=user)
        elif user.role == user.Role.LOGISTICS:
            return EscrowContract.objects.filter(logisticsbooking__carrier=user)
        return EscrowContract.objects.none()

    def perform_create(self, serializer):
        serializer.save()


class EscrowContractDetailView(generics.RetrieveAPIView):
    """
    GET /api/escrows/{id}/ : Retrieve full contract breakdown. Restricted to participants.
    """
    queryset = EscrowContract.objects.all()
    serializer_class = EscrowContractDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsContractParticipant]


class FundEscrowView(generics.GenericAPIView):
    """
    POST /api/escrows/{id}/fund/ : Buyer locks funds into escrow for a DRAFT contract.
    Marks contract status as FUNDED and reserves the vehicle.
    """
    permission_classes = [permissions.IsAuthenticated, IsBuyerUser]
    serializer_class = FundEscrowSerializer

    def post(self, request, pk):
        contract = get_object_or_404(EscrowContract, pk=pk, buyer=request.user)
        
        if contract.status != EscrowContract.Status.DRAFT:
            return Response(
                {"error": f"Cannot fund contract in state '{contract.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            contract.status = EscrowContract.Status.FUNDED
            contract.save()

            vehicle = contract.vehicle
            vehicle.is_available = False
            vehicle.save()

        return Response({
            "message": "Escrow account funded successfully. Funds locked.",
            "contract_id": contract.id,
            "status": contract.status,
            "payment_reference": serializer.validated_data.get('payment_reference', '')
        }, status=status.HTTP_200_OK)


# =============================================================================
# 4. FIELD INSPECTIONS & REPORT MANAGEMENT VIEWS
# =============================================================================

class DispatchInspectorView(generics.UpdateAPIView):
    """
    PATCH /api/escrows/{id}/dispatch-inspector/ : Repair Shop assigns a field inspector
    and schedules the inspection time for a funded contract.
    """
    queryset = EscrowContract.objects.all()
    serializer_class = DispatchInspectorSerializer
    permission_classes = [permissions.IsAuthenticated, IsRepairShopUser]

    def get_queryset(self):
        return EscrowContract.objects.filter(repair_shop=self.request.user)

    def perform_update(self, serializer):
        contract = self.get_object()
        if contract.status != EscrowContract.Status.FUNDED:
            raise serializers.ValidationError(
                {"status": f"Cannot dispatch inspector for a contract in '{contract.get_status_display()}' state."}
            )
        serializer.save()


class SubmitInspectionReportView(generics.CreateAPIView):
    """
    POST /api/escrows/{id}/submit-report/ : Repair Shop submits full diagnostic report.
    Automatically transitions contract status to PASSED or FAILED.
    """
    permission_classes = [permissions.IsAuthenticated, IsRepairShopUser]
    serializer_class = SubmitInspectionReportSerializer

    def create(self, request, pk):
        contract = get_object_or_404(EscrowContract, pk=pk, repair_shop=request.user)

        if contract.status != EscrowContract.Status.FUNDED:
            return Response(
                {"error": f"Inspection reports can only be submitted for FUNDED contracts. Current state: '{contract.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if hasattr(contract, 'inspection_report'):
            return Response(
                {"error": "An inspection report has already been submitted for this contract."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            report = serializer.save(
                escrow_contract=contract,
                repair_shop=request.user,
                inspector=request.user
            )

            if report.overall_status == InspectionReport.OverallStatus.PASSED:
                contract.status = EscrowContract.Status.PASSED
            else:
                contract.status = EscrowContract.Status.FAILED
            contract.save()

        return Response({
            "message": "Inspection report submitted successfully.",
            "contract_id": contract.id,
            "contract_status": contract.status,
            "report_id": report.id
        }, status=status.HTTP_201_CREATED)


class InspectionReportDetailView(generics.RetrieveAPIView):
    """
    GET /api/escrows/{id}/report/ : Retrieve inspection report details for a contract.
    Accessible by contract participants (Buyer, Dealership, Repair Shop).
    """
    serializer_class = InspectionReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        contract_id = self.kwargs.get('pk')
        contract = get_object_or_404(EscrowContract, pk=contract_id)
        
        if self.request.user not in [contract.buyer, contract.dealership, contract.repair_shop]:
            self.permission_denied(self.request, message="You do not have permission to view this report.")

        return get_object_or_404(InspectionReport, escrow_contract=contract)


# =============================================================================
# 5. LOGISTICS & DELIVERY TRACKING VIEWS
# =============================================================================

class LogisticsBookingCreateView(generics.CreateAPIView):
    """
    POST /api/logistics/book/ : Assign a logistics carrier to an active, funded contract.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LogisticsBookingSerializer

    def perform_create(self, serializer):
        contract = serializer.validated_data['escrow_contract']
        
        if contract.status not in [EscrowContract.Status.PASSED, EscrowContract.Status.FUNDED]:
            raise serializers.ValidationError(
                {"escrow_contract": "Logistics can only be booked for funded or inspection-passed contracts."}
            )

        tracking_num = f"TRK-{uuid.uuid4().hex[:8].upper()}"
        carrier_user = self.request.user if self.request.user.role == self.request.user.Role.LOGISTICS else serializer.validated_data.get('carrier')
        
        serializer.save(
            carrier=carrier_user,
            tracking_number=tracking_num,
            status=LogisticsBooking.Status.DISPATCHED
        )


class LogisticsBookingListView(generics.ListAPIView):
    """
    GET /api/logistics/ : List active delivery bookings for the authenticated carrier or participant.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LogisticsBookingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == user.Role.LOGISTICS:
            return LogisticsBooking.objects.filter(carrier=user)
        elif user.role == user.Role.BUYER:
            return LogisticsBooking.objects.filter(escrow_contract__buyer=user)
        elif user.role == user.Role.DEALERSHIP:
            return LogisticsBooking.objects.filter(escrow_contract__dealership=user)
        return LogisticsBooking.objects.none()


class LogisticsBookingDetailView(generics.RetrieveAPIView):
    """
    GET /api/logistics/{id}/ : Retrieve real-time shipment status and tracking details.
    """
    queryset = LogisticsBooking.objects.all()
    serializer_class = LogisticsBookingSerializer
    permission_classes = [permissions.IsAuthenticated]


class LogisticsStatusUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/logistics/{id}/update-status/ : Carrier updates transit state, GPS location, or ETA.
    Automates escrow completion when marked DELIVERED.
    """
    queryset = LogisticsBooking.objects.all()
    serializer_class = LogisticsStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsLogisticsUser]

    def perform_update(self, serializer):
        with transaction.atomic():
            booking = serializer.save()
            
            if booking.status == LogisticsBooking.Status.DELIVERED:
                contract = booking.escrow_contract
                contract.status = EscrowContract.Status.COMPLETED
                contract.save()


# =============================================================================
# 6. DISPUTES, CANCELLATION & REFUND RESOLUTION VIEWS
# =============================================================================

class OpenDisputeView(APIView):
    """
    POST /api/escrows/{id}/dispute/
    Allows the Buyer or Dealership to open a dispute on an active/funded contract.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            escrow = EscrowContract.objects.select_for_update().get(pk=pk)
        except EscrowContract.DoesNotExist:
            return Response({"detail": "Escrow contract not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [escrow.buyer, escrow.dealership]:
            raise PermissionDenied("You are not a participant in this escrow contract.")

        serializer = OpenDisputeSerializer(data=request.data, context={'escrow': escrow})
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            dispute = serializer.save(
                escrow=escrow,
                initiated_by=request.user,
                status='OPEN'
            )
            escrow.status = 'DISPUTED'
            escrow.save(update_fields=['status'])

        return Response(
            {
                "message": "Dispute initiated successfully. Escrow funds locked.",
                "dispute_id": dispute.id,
                "escrow_status": escrow.status
            },
            status=status.HTTP_201_CREATED
        )


class CancelAndRefundEscrowView(APIView):
    """
    POST /api/escrows/{id}/cancel/
    Allows contract cancellation and immediate refund to the buyer prior to final delivery/inspection.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            escrow = EscrowContract.objects.select_for_update().get(pk=pk)
        except EscrowContract.DoesNotExist:
            return Response({"detail": "Escrow contract not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [escrow.buyer, escrow.dealership] and not request.user.is_staff:
            raise PermissionDenied("You do not have permission to cancel this contract.")

        allowed_cancel_states = [
            getattr(EscrowContract.Status, 'DRAFT', 'DRAFT'),
            getattr(EscrowContract.Status, 'FUNDED', 'FUNDED'),
            getattr(EscrowContract.Status, 'FAILED', 'FAILED')
        ]

        if escrow.status not in allowed_cancel_states:
            raise ValidationError(f"Escrow contract cannot be cancelled in status '{escrow.status}'.")

        serializer = CancelEscrowSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Release vehicle back to available state
            if hasattr(escrow, 'vehicle') and escrow.vehicle:
                escrow.vehicle.is_available = True
                escrow.vehicle.save()

            # Process wallet refund if funds were locked
            if escrow.status in [getattr(EscrowContract.Status, 'FUNDED', 'FUNDED'), getattr(EscrowContract.Status, 'FAILED', 'FAILED')]:
                WalletTransaction.objects.create(
                    user=escrow.buyer,
                    escrow=escrow,
                    amount=escrow.amount,
                    transaction_type='REFUND',
                    description=f"Full refund for cancelled escrow #{escrow.id}. Reason: {serializer.validated_data['cancellation_reason']}"
                )

            escrow.status = 'CANCELLED'
            escrow.save(update_fields=['status'])

        return Response(
            {
                "message": f"Escrow contract #{escrow.id} cancelled successfully. Vehicle relisted and funds processed.",
                "escrow_status": escrow.status
            },
            status=status.HTTP_200_OK
        )


class ResolveDisputeAdminView(APIView):
    """
    POST /api/escrows/{id}/resolve-dispute/
    Admin/Arbiter view to resolve active disputes and allocate full/partial refund payouts.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            escrow = EscrowContract.objects.select_for_update().get(pk=pk)
        except EscrowContract.DoesNotExist:
            return Response({"detail": "Escrow contract not found."}, status=status.HTTP_404_NOT_FOUND)

        if escrow.status != 'DISPUTED' or not hasattr(escrow, 'dispute'):
            raise ValidationError("This escrow is not currently in an active disputed state.")

        serializer = ResolveDisputeSerializer(data=request.data, context={'escrow': escrow})
        serializer.is_valid(raise_exception=True)

        outcome = serializer.validated_data['resolution_outcome']
        notes = serializer.validated_data['resolution_notes']

        with transaction.atomic():
            dispute = escrow.dispute

            if outcome == 'REFUND_BUYER_FULL':
                buyer_amount = escrow.amount
                seller_amount = 0
            elif outcome == 'RELEASE_SELLER_FULL':
                buyer_amount = 0
                seller_amount = escrow.amount
            elif outcome == 'PARTIAL_REFUND':
                buyer_amount = serializer.validated_data.get('buyer_refund_amount', 0)
                seller_amount = serializer.validated_data.get('seller_payout_amount', 0)

            if buyer_amount > 0:
                WalletTransaction.objects.create(
                    user=escrow.buyer,
                    escrow=escrow,
                    amount=buyer_amount,
                    transaction_type='REFUND',
                    description=f"Dispute resolution payout for Escrow #{escrow.id}: {notes}"
                )

            if seller_amount > 0:
                WalletTransaction.objects.create(
                    user=escrow.dealership,
                    escrow=escrow,
                    amount=seller_amount,
                    transaction_type='PAYOUT',
                    description=f"Dispute resolution payout for Escrow #{escrow.id}: {notes}"
                )

            dispute.status = 'RESOLVED'
            dispute.resolution_notes = notes
            dispute.save()

            escrow.status = 'REFUNDED' if buyer_amount == escrow.amount else 'RESOLVED'
            escrow.save(update_fields=['status'])

            # Relist vehicle if full refund was issued
            if buyer_amount == escrow.amount and hasattr(escrow, 'vehicle') and escrow.vehicle:
                escrow.vehicle.is_available = True
                escrow.vehicle.save()

        return Response(
            {
                "message": "Dispute resolved successfully.",
                "resolution": outcome,
                "buyer_refund": str(buyer_amount),
                "seller_payout": str(seller_amount),
                "escrow_status": escrow.status
            },
            status=status.HTTP_200_OK
        )
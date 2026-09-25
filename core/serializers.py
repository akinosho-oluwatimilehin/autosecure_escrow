import re

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User, Vehicle, EscrowContract, 
    InspectionReport, LogisticsBooking, 
    EscrowDispute, WalletTransaction
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims into the JWT payload
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name

        return token

    def validate(self, attrs):
        username_or_email = attrs.get('username', '').strip()
        if username_or_email and '@' in username_or_email:
            user_by_email = User.objects.filter(email__iexact=username_or_email).first()
            if user_by_email:
                attrs['username'] = user_by_email.username

        data = super().validate(attrs)

        # Return user details alongside access/refresh tokens in response body
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'phone': self.user.phone,
            'company_name': self.user.company_name,
        }
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone', 'company_name', 'address']

    def validate_username(self, value):
        if not value:
            return value

        cleaned = re.sub(r'\s+', '_', value.strip())
        cleaned = re.sub(r'[^A-Za-z0-9._@+-]', '', cleaned)
        cleaned = cleaned.strip('._-')

        if not cleaned:
            raise serializers.ValidationError('Username must include at least one letter or number.')

        return cleaned

    def _generate_username(self, username, email):
        base = (username or email or 'user').strip()
        base = re.sub(r'\s+', '_', base)
        base = re.sub(r'[^A-Za-z0-9._@+-]', '', base)

        if '@' in base:
            base = base.split('@', 1)[0]

        if not base:
            base = (email or 'user').split('@', 1)[0].strip()
            base = re.sub(r'\s+', '_', base)
            base = re.sub(r'[^A-Za-z0-9._@+-]', '', base)

        if not base:
            base = 'user'
        base = base[:30].strip('._-') or 'user'
        candidate = base
        counter = 1

        while User.objects.filter(username__iexact=candidate).exists():
            candidate = f'{base}{counter}'
            counter += 1

        return candidate

    def create(self, validated_data):
        username = self._generate_username(
            validated_data.get('username', ''),
            validated_data.get('email', ''),
        )

        user = User.objects.create_user(
            username=username,
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', User.Role.BUYER),
            phone=validated_data.get('phone', ''),
            company_name=validated_data.get('company_name', ''),
            address=validated_data.get('address', '')
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'company_name', 'address']
        read_only_fields = ['id']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'company_name', 'address']
        read_only_fields = ['id', 'username', 'role']


class VehicleSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'seller', 'make', 'model', 'year', 'vin', 
            'mileage', 'price', 'transmission', 'description', 
            'is_available', 'created_at'
        ]
        read_only_fields = ['id', 'seller', 'created_at']
        
class InspectionReportSerializer(serializers.ModelSerializer):
    inspector = UserSerializer(read_only=True)

    class Meta:
        model = InspectionReport
        fields = ['id', 'escrow', 'inspector', 'overall_condition', 'odometer_reading', 'notes', 'recommendation', 'passed_inspection', 'created_at']
        read_only_fields = ['id', 'inspector', 'created_at']


class SubmitInspectionReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionReport
        fields = ['overall_condition', 'odometer_reading', 'notes', 'recommendation', 'passed_inspection']


class LogisticsBookingSerializer(serializers.ModelSerializer):
    carrier = UserSerializer(read_only=True)

    class Meta:
        model = LogisticsBooking
        fields = ['id', 'escrow', 'carrier', 'pickup_address', 'delivery_address', 'tracking_number', 'status', 'estimated_delivery', 'delivered_at', 'created_at']
        read_only_fields = ['id', 'carrier', 'tracking_number', 'status', 'delivered_at', 'created_at']


class LogisticsStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogisticsBooking
        fields = ['status', 'estimated_delivery', 'delivered_at']


class EscrowDisputeSerializer(serializers.ModelSerializer):
    raised_by = UserSerializer(read_only=True)

    class Meta:
        model = EscrowDispute
        fields = ['id', 'escrow', 'raised_by', 'reason', 'description', 'status', 'resolution_outcome', 'buyer_refund_amount', 'seller_payout_amount', 'arbiter_notes', 'created_at', 'resolved_at']
        read_only_fields = ['id', 'raised_by', 'created_at', 'resolved_at']


class EscrowContractSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    inspector = UserSerializer(read_only=True)
    carrier = UserSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)

    class Meta:
        model = EscrowContract
        fields = ['id', 'buyer', 'seller', 'vehicle', 'inspector', 'carrier', 'vehicle_details', 'amount', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'buyer', 'created_at', 'updated_at']


class EscrowContractDetailSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    inspector = UserSerializer(read_only=True)
    carrier = UserSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)
    inspection_report = InspectionReportSerializer(read_only=True)
    logistics_booking = LogisticsBookingSerializer(read_only=True)
    dispute = EscrowDisputeSerializer(read_only=True)

    class Meta:
        model = EscrowContract
        fields = [
            'id', 'buyer', 'seller', 'vehicle', 'inspector', 'carrier', 
            'vehicle_details', 'amount', 'status', 'inspection_report', 
            'logistics_booking', 'dispute', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EscrowContractCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EscrowContract
        fields = ['id', 'seller', 'vehicle', 'inspector', 'carrier', 'vehicle_details', 'amount', 'status']
        read_only_fields = ['id', 'status']

    def validate_seller(self, value):
        if value.role != User.Role.DEALERSHIP:
            raise serializers.ValidationError("Seller must hold the DEALERSHIP role.")
        return value

    def validate_vehicle(self, value):
        if value and not value.is_available:
            raise serializers.ValidationError("Selected vehicle is no longer available.")
        return value

    def validate(self, data):
        vehicle = data.get('vehicle')
        seller = data.get('seller')
        if vehicle and seller and vehicle.seller_id != seller.id:
            raise serializers.ValidationError({"vehicle": "Selected vehicle does not belong to the selected seller."})
        return data

    def create(self, validated_data):
        validated_data['buyer'] = self.context['request'].user
        return super().create(validated_data)


class CancelEscrowSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=255, help_text="Optional reason for cancellation")

    def validate(self, data):
        contract = self.context.get('contract')
        if not contract:
            raise serializers.ValidationError("Escrow contract context is missing.")
        
        if contract.status in [EscrowContract.Status.COMPLETED, EscrowContract.Status.CANCELLED]:
            raise serializers.ValidationError(f"Cannot cancel contract that is already {contract.get_status_display().lower()}.")
            
        return data


class FundEscrowSerializer(serializers.Serializer):
    payment_reference = serializers.CharField(max_length=100, required=True, help_text="Gateway reference token or transaction ID")


class ReleaseEscrowSerializer(serializers.Serializer):
    confirmation = serializers.BooleanField(required=True, help_text="Explicit confirmation to release locked funds to seller")

    def validate_confirmation(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm release of funds.")
        return value


class DispatchInspectorSerializer(serializers.Serializer):
    inspector_id = serializers.IntegerField(required=True)

    def validate_inspector_id(self, value):
        try:
            inspector = User.objects.get(id=value, role=User.Role.REPAIR_SHOP)
        except User.DoesNotExist:
            raise serializers.ValidationError("Selected inspector does not exist or does not hold REPAIR_SHOP role.")
        return value


class AssignCarrierSerializer(serializers.Serializer):
    carrier_id = serializers.IntegerField(required=True)
    pickup_address = serializers.CharField(required=True)
    delivery_address = serializers.CharField(required=True)

    def validate_carrier_id(self, value):
        try:
            carrier = User.objects.get(id=value, role=User.Role.LOGISTICS)
        except User.DoesNotExist:
            raise serializers.ValidationError("Selected carrier does not exist or does not hold LOGISTICS role.")
        return value


class OpenDisputeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EscrowDispute
        fields = ['reason', 'description']


class ResolveDisputeSerializer(serializers.Serializer):
    resolution_outcome = serializers.ChoiceField(choices=EscrowDispute.ResolutionOutcome.choices)
    buyer_refund_amount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    seller_payout_amount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    arbiter_notes = serializers.CharField(required=False, allow_blank=True)


class WalletTransactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = WalletTransaction
        fields = ['id', 'user', 'escrow', 'amount', 'transaction_type', 'reference', 'timestamp']
        read_only_fields = ['id', 'user', 'timestamp']

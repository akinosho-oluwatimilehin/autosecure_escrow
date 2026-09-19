from rest_framework import permissions
from .models import User

class IsDealershipUser(permissions.BasePermission):
    """
    Allows access only to authenticated users with the DEALERSHIP role.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == User.Role.DEALERSHIP
        )

class IsBuyerUser(permissions.BasePermission):
    """
    Allows access only to authenticated users with the BUYER role.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == User.Role.BUYER
        )

class IsContractParticipant(permissions.BasePermission):
    """
    Allows access only to users who are parties to the specific EscrowContract
    (Buyer, Dealership, assigned Repair Shop, or assigned Logistics carrier).
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        return user in [obj.buyer, obj.seller, obj.inspector, obj.carrier]

class IsLogisticsUser(permissions.BasePermission):

    """
    Allows access only to authenticated users with the LOGISTICS role.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == User.Role.LOGISTICS
        )

class IsRepairShopUser(permissions.BasePermission):
    """
    Allows access only to authenticated users with the REPAIR_SHOP role.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == User.Role.REPAIR_SHOP
        )

    

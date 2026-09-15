from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    VehicleViewSet,
    EscrowContractListCreateView,
    EscrowContractDetailView,
    FundEscrowView,
    DispatchInspectorView,
    SubmitInspectionReportView,
    InspectionReportDetailView,
    LogisticsBookingCreateView,
    LogisticsBookingListView,
    LogisticsBookingDetailView,
    LogisticsStatusUpdateView,
)

# Router for Vehicle ModelViewSet
router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')

urlpatterns = [
    # -------------------------------------------------------------------------
    # 1. Authentication & User Profile Endpoints
    # -------------------------------------------------------------------------
    path('auth/register/', UserRegistrationView.as_view(), name='auth_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),

    # -------------------------------------------------------------------------
    # 2. Vehicle Inventory Endpoints (ModelViewSet Router)
    # -------------------------------------------------------------------------
    path('', include(router.urls)),

    # -------------------------------------------------------------------------
    # 3. Escrow Contract & Funding Endpoints
    # -------------------------------------------------------------------------
    path('escrows/', EscrowContractListCreateView.as_view(), name='escrow_list_create'),
    path('escrows/<int:pk>/', EscrowContractDetailView.as_view(), name='escrow_detail'),
    path('escrows/<int:pk>/fund/', FundEscrowView.as_view(), name='escrow_fund'),

    # -------------------------------------------------------------------------
    # 4. Field Inspection & Diagnostic Report Endpoints
    # -------------------------------------------------------------------------
    path('escrows/<int:pk>/dispatch-inspector/', DispatchInspectorView.as_view(), name='escrow_dispatch_inspector'),
    path('escrows/<int:pk>/submit-report/', SubmitInspectionReportView.as_view(), name='escrow_submit_report'),
    path('escrows/<int:pk>/report/', InspectionReportDetailView.as_view(), name='escrow_report_detail'),

    # -------------------------------------------------------------------------
    # 5. Carrier Delivery & Logistics Tracking Endpoints
    # -------------------------------------------------------------------------
    path('logistics/', LogisticsBookingListView.as_view(), name='logistics_list'),
    path('logistics/book/', LogisticsBookingCreateView.as_view(), name='logistics_create'),
    path('logistics/<int:pk>/', LogisticsBookingDetailView.as_view(), name='logistics_detail'),
    path('logistics/<int:pk>/update-status/', LogisticsStatusUpdateView.as_view(), name='logistics_update_status'),
]
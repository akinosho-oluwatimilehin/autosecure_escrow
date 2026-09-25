from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import EscrowContract, InspectionReport, LogisticsBooking, User, Vehicle, WalletTransaction


class RootUrlTests(TestCase):
    def test_root_url_returns_success(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('AutoSecure Escrow', response.content.decode())


class AuthFlowTests(APITestCase):
    def test_register_sanitizes_full_name_and_stores_role(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'Ada Lovelace',
            'email': 'ada@example.com',
            'password': 'pass1234',
            'role': 'BUYER',
            'first_name': 'Ada',
            'last_name': 'Lovelace',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='ada@example.com')
        self.assertEqual(user.role, User.Role.BUYER)
        self.assertNotIn(' ', user.username)
        self.assertTrue(user.check_password('pass1234'))

    def test_login_accepts_email_as_username(self):
        user = User.objects.create_user(
            username='ada_lovelace',
            email='ada@example.com',
            password='pass1234',
            role=User.Role.BUYER,
        )

        response = self.client.post('/api/auth/login/', {
            'username': 'ada@example.com',
            'password': 'pass1234',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['role'], User.Role.BUYER)
        self.assertEqual(response.data['user']['email'], user.email)


class EscrowLifecycleApiTests(APITestCase):
    def setUp(self):
        self.buyer = User.objects.create_user(
            username='buyer',
            password='testpass123',
            role=User.Role.BUYER,
        )
        self.seller = User.objects.create_user(
            username='dealer',
            password='testpass123',
            role=User.Role.DEALERSHIP,
            company_name='Prime Motors',
        )
        self.inspector = User.objects.create_user(
            username='inspector',
            password='testpass123',
            role=User.Role.REPAIR_SHOP,
            company_name='Trusted Inspection Hub',
        )
        self.carrier = User.objects.create_user(
            username='carrier',
            password='testpass123',
            role=User.Role.LOGISTICS,
            company_name='Auto Haul',
        )
        self.outsider = User.objects.create_user(
            username='outsider',
            password='testpass123',
            role=User.Role.BUYER,
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def create_vehicle(self):
        self.authenticate(self.seller)
        response = self.client.post('/api/vehicles/', {
            'make': 'Toyota',
            'model': 'Camry',
            'year': 2021,
            'vin': '4T1B11HK2MU000001',
            'mileage': 42000,
            'price': '4500000.00',
            'transmission': 'Automatic',
            'description': 'Clean title, accident-free.',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return Vehicle.objects.get(id=response.data['id'])

    def create_escrow(self, vehicle):
        self.authenticate(self.buyer)
        response = self.client.post('/api/escrows/', {
            'seller': self.seller.id,
            'vehicle': vehicle.id,
            'vehicle_details': '2021 Toyota Camry',
            'amount': '4500000.00',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return EscrowContract.objects.get(id=response.data['id'])

    def fund_escrow(self, escrow):
        self.authenticate(self.buyer)
        response = self.client.post(
            f'/api/escrows/{escrow.id}/fund/',
            {'payment_reference': f'PAY-{escrow.id}-001'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        escrow.refresh_from_db()
        return escrow

    def dispatch_inspector(self, escrow):
        self.authenticate(self.inspector)
        response = self.client.patch(
            f'/api/escrows/{escrow.id}/dispatch-inspector/',
            {'inspector_id': self.inspector.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        escrow.refresh_from_db()
        return escrow

    def submit_passing_report(self, escrow):
        self.authenticate(self.inspector)
        response = self.client.post(f'/api/escrows/{escrow.id}/submit-report/', {
            'overall_condition': 'GOOD',
            'odometer_reading': 42110,
            'notes': 'Engine, transmission, frame, and interior passed inspection.',
            'recommendation': InspectionReport.Recommendation.PASS,
            'passed_inspection': True,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        escrow.refresh_from_db()
        return escrow

    def book_delivery(self, escrow):
        self.authenticate(self.carrier)
        response = self.client.post('/api/logistics/book/', {
            'escrow': escrow.id,
            'pickup_address': '12 Dealer Road, Lagos',
            'delivery_address': '44 Buyer Avenue, Abuja',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return LogisticsBooking.objects.get(id=response.data['id'])

    def test_complete_vehicle_escrow_lifecycle(self):
        vehicle = self.create_vehicle()
        escrow = self.create_escrow(vehicle)

        self.assertEqual(escrow.status, EscrowContract.Status.PENDING)
        self.assertEqual(escrow.buyer, self.buyer)
        self.assertEqual(escrow.seller, self.seller)

        escrow = self.fund_escrow(escrow)
        vehicle.refresh_from_db()
        self.assertEqual(escrow.status, EscrowContract.Status.ACTIVE)
        self.assertFalse(vehicle.is_available)
        self.assertTrue(WalletTransaction.objects.filter(
            escrow=escrow,
            user=self.buyer,
            transaction_type=WalletTransaction.TransactionType.DEPOSIT,
        ).exists())

        escrow = self.dispatch_inspector(escrow)
        self.assertEqual(escrow.status, EscrowContract.Status.INSPECTION)
        self.assertEqual(escrow.inspector, self.inspector)

        escrow = self.submit_passing_report(escrow)
        self.assertEqual(escrow.status, EscrowContract.Status.LOGISTICS)
        self.assertTrue(InspectionReport.objects.filter(escrow=escrow).exists())

        booking = self.book_delivery(escrow)
        escrow.refresh_from_db()
        self.assertEqual(booking.carrier, self.carrier)
        self.assertEqual(booking.status, LogisticsBooking.Status.ASSIGNED)
        self.assertTrue(booking.tracking_number.startswith('TRK-'))
        self.assertEqual(escrow.carrier, self.carrier)
        self.assertEqual(escrow.status, EscrowContract.Status.LOGISTICS)

        self.authenticate(self.carrier)
        response = self.client.patch(
            f'/api/logistics/{booking.id}/update-status/',
            {'status': LogisticsBooking.Status.DELIVERED},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        escrow.refresh_from_db()
        self.assertEqual(escrow.status, EscrowContract.Status.COMPLETED)

    def test_only_dealership_can_create_vehicle_listing(self):
        self.authenticate(self.buyer)
        response = self.client.post('/api/vehicles/', {
            'make': 'Honda',
            'model': 'Accord',
            'year': 2020,
            'vin': '1HGCV1F30LA000001',
            'mileage': 50000,
            'price': '3500000.00',
            'transmission': 'Automatic',
            'description': '',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Vehicle.objects.exists())

    def test_only_buyer_can_create_escrow(self):
        vehicle = self.create_vehicle()
        self.authenticate(self.seller)

        response = self.client.post('/api/escrows/', {
            'seller': self.seller.id,
            'vehicle': vehicle.id,
            'amount': '4500000.00',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_escrow_rejects_unavailable_vehicle(self):
        vehicle = self.create_vehicle()
        vehicle.is_available = False
        vehicle.save()

        self.authenticate(self.buyer)
        response = self.client.post('/api/escrows/', {
            'seller': self.seller.id,
            'vehicle': vehicle.id,
            'amount': '4500000.00',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vehicle', response.data)

    def test_non_participant_cannot_view_escrow_detail(self):
        vehicle = self.create_vehicle()
        escrow = self.create_escrow(vehicle)

        self.authenticate(self.outsider)
        response = self.client.get(f'/api/escrows/{escrow.id}/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_inspection_report_is_rejected(self):
        vehicle = self.create_vehicle()
        escrow = self.create_escrow(vehicle)
        escrow = self.fund_escrow(escrow)
        escrow = self.dispatch_inspector(escrow)
        self.submit_passing_report(escrow)

        self.authenticate(self.inspector)
        response = self.client.post(f'/api/escrows/{escrow.id}/submit-report/', {
            'overall_condition': 'GOOD',
            'odometer_reading': 42125,
            'notes': 'Second report should not be accepted.',
            'recommendation': InspectionReport.Recommendation.PASS,
            'passed_inspection': True,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(InspectionReport.objects.filter(escrow=escrow).count(), 1)

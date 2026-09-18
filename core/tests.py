from django.test import TestCase


class RootUrlTests(TestCase):
    def test_root_url_returns_success(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('AutoSecure Escrow', response.content.decode())

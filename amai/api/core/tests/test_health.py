from django.test import TestCase
from django.urls import reverse


class HealthViewTests(TestCase):
    def test_healthz_returns_ok(self):
        response = self.client.get(reverse("healthz"))

        self.assertEqual(200, response.status_code)
        self.assertEqual("ok", response.json()["status"])

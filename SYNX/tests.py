from django.test import TestCase
from django.urls import reverse

from .models import LostFound


class LostFoundViewsTests(TestCase):
    def test_home_page_renders_landing_content(self):
        response = self.client.get(reverse('home'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'LOST//FOUND')
        self.assertContains(response, 'LOST SOMETHING?')

    def test_report_view_saves_item(self):
        response = self.client.post(reverse('report_item'), {
            'item_name': 'Black Wallet',
            'description': 'Leather wallet found by the library entrance.',
            'category': 'Personal Item',
            'location': 'Main Library',
            'date': '2026-10-02',
            'status': 'FOUND',
            'reporter_name': 'Ava Smith',
            'owner_name': 'N/A',
        })

        self.assertEqual(response.status_code, 302)
        self.assertTrue(LostFound.objects.filter(item_name='Black Wallet').exists())

    def test_detail_page_loads_item(self):
        item = LostFound.objects.create(
            item_name='Wireless Headphones',
            description='Black headphones found near the lab.',
            category='Electronics',
            location='STEM Lab',
            date='2026-10-01',
            status='FOUND',
            reporter_name='Jin Park',
            owner_name='',
        )

        response = self.client.get(reverse('item_detail', args=[item.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Wireless Headphones')

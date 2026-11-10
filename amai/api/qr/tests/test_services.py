from django.test import TestCase
from django.utils import timezone

from model_bakery import baker

from core.tests.helpers import make_staff
from payments.tests.helpers import make_registration
from qr.choices import CheckInResult
from qr.models import AttendeePass, CheckIn
from qr.services import CheckInService, PassService, extract_code, hash_pass_token
from registrations.choices import RegistrationStatus
from registrations.models import Registration


def confirmed(delegates="2"):
    registration = make_registration(delegates=delegates)
    registration.status = RegistrationStatus.CONFIRMED
    registration.save()
    return registration


class PassServiceTests(TestCase):
    def test_issue_stores_only_the_hash_of_the_token(self):
        registration = confirmed("2")

        attendee_pass, token = PassService.issue(registration)

        self.assertEqual(hash_pass_token(token), attendee_pass.token_hash)
        self.assertNotIn(token, attendee_pass.token_hash)
        self.assertEqual(2, attendee_pass.admits)

    def test_a_pass_admits_as_many_people_as_the_registration_covers(self):
        self.assertEqual(3, PassService.issue(confirmed("3"))[0].admits)

    def test_five_or_more_defaults_to_one_until_staff_say_otherwise(self):
        registration = confirmed("5 or more")

        self.assertEqual(1, PassService.issue(registration)[0].admits)
        self.assertEqual(8, PassService.issue(registration, admits=8)[0].admits)

    def test_reissuing_kills_the_old_link_and_keeps_check_ins(self):
        registration = confirmed("2")
        attendee_pass, old = PassService.issue(registration)
        baker.make(CheckIn, attendee_pass=attendee_pass)

        _, new = PassService.issue(registration)

        self.assertIsNone(PassService.find_by_token(old))
        self.assertEqual(registration, PassService.find_by_token(new).registration)
        self.assertEqual(1, AttendeePass.objects.get().check_ins.count())
        self.assertEqual(1, AttendeePass.objects.count())

    def test_reissuing_clears_a_revocation(self):
        registration = confirmed()
        attendee_pass, _ = PassService.issue(registration)
        attendee_pass.revoked_at = timezone.now()
        attendee_pass.save()

        PassService.issue(registration)

        attendee_pass.refresh_from_db()
        self.assertIsNone(attendee_pass.revoked_at)

    def test_pass_url_uses_the_site_address(self):
        self.assertEqual("https://example.test/c/?t=abc", PassService.pass_url("abc"))


class ExtractCodeTests(TestCase):
    def test_reads_the_token_out_of_a_scanned_link(self):
        self.assertEqual(
            "tok123", extract_code("https://events.amaindiaevents.org/c/?t=tok123")
        )

    def test_leaves_a_typed_code_alone(self):
        self.assertEqual("AMAI-AC27-000001", extract_code("  AMAI-AC27-000001 "))
        self.assertEqual("", extract_code(None))

    def test_a_link_without_a_token_gives_nothing(self):
        self.assertEqual("", extract_code("https://events.amaindiaevents.org/c/"))


class CheckInServiceTests(TestCase):
    def setUp(self):
        self.operator = make_staff("checkin_operator")
        self.registration = confirmed("2")
        self.attendee_pass, self.token = PassService.issue(self.registration)

    def scan(self, code, gate=""):
        return CheckInService.check_in(code=code, operator=self.operator, gate=gate)

    def test_a_valid_token_checks_one_person_in(self):
        outcome = self.scan(self.token, gate="Main")

        self.assertEqual(CheckInResult.OK, outcome.result)
        self.assertEqual((1, 2), (outcome.admitted, outcome.admits))
        check_in = CheckIn.objects.get()
        self.assertEqual(self.operator, check_in.checked_in_by)
        self.assertEqual(self.operator.email, check_in.operator_label)
        self.assertEqual("Main", check_in.gate)

    def test_a_scanned_qr_link_works_like_the_token(self):
        outcome = self.scan(PassService.pass_url(self.token))

        self.assertEqual(CheckInResult.OK, outcome.result)

    def test_the_registration_id_works_when_a_phone_will_not_scan(self):
        outcome = self.scan(self.registration.public_id.lower())

        self.assertEqual(CheckInResult.OK, outcome.result)

    def test_a_pass_for_two_admits_two_then_refuses_the_third(self):
        results = [self.scan(self.token).result for _ in range(3)]

        self.assertEqual(
            [CheckInResult.OK, CheckInResult.OK, CheckInResult.ALREADY_CHECKED_IN],
            results,
        )
        self.assertEqual(2, CheckIn.objects.count())

    def test_already_checked_in_says_when_the_last_person_arrived(self):
        self.scan(self.token)
        self.scan(self.token)

        outcome = self.scan(self.token)

        self.assertEqual((2, 2), (outcome.admitted, outcome.admits))
        self.assertIsNotNone(outcome.last_checked_in_at)

    def test_garbage_and_empty_codes_are_invalid(self):
        for code in (
            "nonsense",
            "",
            "   ",
            "AMAI-ZZ99-000099",
            "https://x.test/c/?t=wrong",
        ):
            with self.subTest(code=code):
                self.assertEqual(CheckInResult.INVALID, self.scan(code).result)
        self.assertEqual(0, CheckIn.objects.count())

    def test_an_unconfirmed_registration_cannot_enter(self):
        self.registration.status = RegistrationStatus.PENDING_PAYMENT
        self.registration.save()

        self.assertEqual(CheckInResult.NOT_PAID, self.scan(self.token).result)
        self.assertEqual(
            CheckInResult.NOT_PAID, self.scan(self.registration.public_id).result
        )
        self.assertEqual(0, CheckIn.objects.count())

    def test_a_cancelled_registration_cannot_enter(self):
        self.registration.status = RegistrationStatus.CANCELLED
        self.registration.save()

        self.assertEqual(CheckInResult.NOT_PAID, self.scan(self.token).result)

    def test_a_revoked_pass_cannot_enter(self):
        self.attendee_pass.revoked_at = timezone.now()
        self.attendee_pass.save()

        self.assertEqual(CheckInResult.REVOKED, self.scan(self.token).result)
        self.assertEqual(0, CheckIn.objects.count())

    def test_a_confirmed_registration_with_no_pass_cannot_enter(self):
        baker.make(
            Registration,
            public_id="AMAI-AC27-000077",
            event=self.registration.event,
            ticket_category=self.registration.ticket_category,
            status=RegistrationStatus.CONFIRMED,
            delegates="1",
        )

        self.assertEqual(CheckInResult.NOT_PAID, self.scan("AMAI-AC27-000077").result)


class CheckInSearchTests(TestCase):
    def setUp(self):
        self.registration = confirmed("2")
        PassService.issue(self.registration)

    def test_finds_confirmed_registrations_by_name_company_id_or_mobile(self):
        for query in ("asha", "rao chem", "000001", "98100"):
            with self.subTest(query=query):
                self.assertEqual(
                    [self.registration], list(CheckInService.search(query))
                )

    def test_ignores_unconfirmed_registrations_and_short_queries(self):
        self.registration.status = RegistrationStatus.PENDING_PAYMENT
        self.registration.save()

        self.assertEqual([], list(CheckInService.search("asha")))
        self.assertEqual([], list(CheckInService.search("a")))
        self.assertEqual([], list(CheckInService.search("")))

    def test_reports_how_many_have_arrived(self):
        baker.make(CheckIn, attendee_pass=self.registration.attendee_pass)

        self.assertEqual(1, CheckInService.search("asha")[0].admitted_count)

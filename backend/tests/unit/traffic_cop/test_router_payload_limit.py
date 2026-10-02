import unittest
from backend.traffic_cop.router import handle_waste_intake, MAX_INPUT_LENGTH


class TestRouterPayloadLimit(unittest.TestCase):

  def test_oversized_payload_is_blocked(self):
    text = "a" * (MAX_INPUT_LENGTH + 1)
    response = handle_waste_intake(text)

    self.assertEqual(response["status"], "BLOCKED")
    self.assertIn("maximum allowed length", response["message"])

  def test_payload_at_exact_limit_is_not_blocked_for_size(self):
    # Exactly at the limit should pass the size check (not exceed it),
    # and fall through to normal safe-text handling.
    text = "a" * MAX_INPUT_LENGTH
    response = handle_waste_intake(text)

    self.assertNotEqual(response["status"], "BLOCKED")


if __name__ == "__main__":
  unittest.main()

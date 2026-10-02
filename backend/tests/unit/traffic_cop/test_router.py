import unittest
from backend.traffic_cop.router import handle_waste_intake


class TestRouterScenarios(unittest.TestCase):

  def test_router_single_hazmat(self):
    text = "Customer threw away an old car battery."
    response = handle_waste_intake(text)

    self.assertEqual(response["status"], "DIVERTED")
    self.assertEqual(len(response["matched_buckets"]), 1)
    self.assertEqual(
        response["bucket_details"][0]["system_action"], "QUARANTINE_FIRE_BAY"
    )

  def test_router_multiple_hazmats(self):
    text = "Load contains an old car battery and some motor oil."
    response = handle_waste_intake(text)

    self.assertEqual(response["status"], "DIVERTED")
    self.assertEqual(len(response["matched_buckets"]), 2)
    self.assertEqual(len(response["bucket_details"]), 2)

  def test_router_blocks_profanity(self):
    text = "Just dropping off regular cardboard, fck off!"
    response = handle_waste_intake(text)

    self.assertEqual(response["status"], "BLOCKED")
    self.assertIn("Profanity detected", response["message"])


if __name__ == "__main__":
  unittest.main()
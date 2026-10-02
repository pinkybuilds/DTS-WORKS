import unittest
from backend.traffic_cop.safety_filter import safety_filter


class TestSafetyFilterScenarios(unittest.TestCase):

  def test_single_hazmat(self):
    text = "Customer threw away an old car battery."
    result = safety_filter(text)

    self.assertFalse(result["is_safe"])
    self.assertTrue(result["flags"]["hazmat"])
    self.assertEqual(len(result["matched_buckets"]), 1)
    self.assertIn("car battery", result["flags"]["hazmat_triggers"])

  def test_multiple_hazmats(self):
    text = "Load contains an old car battery and some motor oil."
    result = safety_filter(text)

    self.assertFalse(result["is_safe"])
    self.assertTrue(result["flags"]["hazmat"])
    self.assertEqual(len(result["matched_buckets"]), 2)
    self.assertIn("car battery", result["flags"]["hazmat_triggers"])
    self.assertIn("motor oil", result["flags"]["hazmat_triggers"])

  def test_profanity_trigger(self):
    text = "Just dropping off regular cardboard, bitch!"
    result = safety_filter(text)

    self.assertFalse(result["is_safe"])
    self.assertTrue(result["flags"]["profanity"])


if __name__ == "__main__":
  unittest.main()
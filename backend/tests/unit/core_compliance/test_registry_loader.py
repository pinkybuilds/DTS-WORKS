
import unittest

from backend.core_compliance.registry_loader import RegistryLoader


class TestRegistryLoader(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        RegistryLoader.clear_cache()

    def setUp(self):
        RegistryLoader.clear_cache()

    def test_ewc_registry_loads(self):
        registry = RegistryLoader.load("ewc")

        self.assertIsInstance(registry, list)
        self.assertGreater(len(registry), 0)

    def test_pops_registry_loads(self):
        registry = RegistryLoader.load("pops")

        self.assertIsInstance(registry, list)
        self.assertGreater(len(registry), 0)

    def test_hazardous_properties_registry_loads(self):
        registry = RegistryLoader.load("hazardous_properties")

        self.assertIsInstance(registry, list)
        self.assertGreater(len(registry), 0)

    def test_disposal_recovery_registry_loads(self):
        registry = RegistryLoader.load("disposal_recovery")

        self.assertIsInstance(registry, list)
        self.assertGreater(len(registry), 0)

    def test_container_types_registry_loads(self):
        registry = RegistryLoader.load("container_types")

        self.assertIsInstance(registry, list)
        self.assertGreater(len(registry), 0)

    def test_ewc_code_can_be_found(self):
        result = RegistryLoader.find_by_code(
            "ewc",
            "010101",
        )

        self.assertIsNotNone(result)
        self.assertEqual(result["code"], "010101")

    def test_pops_code_can_be_found(self):
        result = RegistryLoader.find_by_code(
            "pops",
            "PFOS",
        )

        self.assertIsNotNone(result)
        self.assertEqual(result["code"], "PFOS")
        self.assertEqual(
            result["chemicalName"],
            "Perfluorooctane sulfonic acid (and derivatives)",
        )

    def test_hazardous_property_can_be_found(self):
        result = RegistryLoader.find_by_code(
            "hazardous_properties",
            "HP_1",
        )

        self.assertIsNotNone(result)
        self.assertEqual(result["code"], "HP_1")
        self.assertEqual(result["shortDesc"], "Explosive")
        self.assertIn("longDesc", result)

    def test_disposal_recovery_code_can_be_found(self):
        result = RegistryLoader.find_by_code(
            "disposal_recovery",
            "R1",
        )

        self.assertIsNotNone(result)
        self.assertEqual(result["code"], "R1")

    def test_container_type_can_be_found(self):
        result = RegistryLoader.find_by_code(
            "container_types",
            "BAG",
        )

        self.assertIsNotNone(result)
        self.assertEqual(result["code"], "BAG")
        self.assertEqual(
            result["description"],
            "Bag / Sack (e.g. rubble bag, refuse sack)",
        )

    def test_unknown_code_returns_none(self):
        result = RegistryLoader.find_by_code(
            "ewc",
            "NOT_A_REAL_CODE",
        )

        self.assertIsNone(result)

    def test_unknown_registry_raises_error(self):
        with self.assertRaises(ValueError):
            RegistryLoader.load("not_a_real_registry")

    def test_registry_contains_known_code(self):
        self.assertTrue(
            RegistryLoader.contains_code(
                "ewc",
                "010101",
            )
        )

    def test_registry_does_not_contain_unknown_code(self):
        self.assertFalse(
            RegistryLoader.contains_code(
                "ewc",
                "NOT_A_REAL_CODE",
            )
        )

    def test_registry_cache_returns_same_data(self):
        first_load = RegistryLoader.load("ewc")
        second_load = RegistryLoader.load("ewc")

        self.assertIs(first_load, second_load)

    def test_clear_cache_reloads_registry(self):
        first_load = RegistryLoader.load("ewc")

        RegistryLoader.clear_cache()

        second_load = RegistryLoader.load("ewc")

        self.assertIsNot(first_load, second_load)
        self.assertEqual(first_load, second_load)


if __name__ == "__main__":
    unittest.main()





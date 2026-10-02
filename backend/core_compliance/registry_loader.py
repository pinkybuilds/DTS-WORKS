import json
from pathlib import Path
from typing import Any, Dict


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
REGISTRY_DIR = DATA_DIR / "registry"


class RegistryLoader:
    """
    Provides application-level access to the reference
    registries stored in the project-level registry directory.

    Registry files are loaded from their configured locations
    and exposed through a read-only loader interface.

    This loader does not modify registry files or make compliance
    decisions. It only loads and retrieves reference data.
    """

    _cache: Dict[str, Any] = {}

    REGISTRY_PATHS = {
        "ewc": REGISTRY_DIR / "ewc" / "codes.json",
        "pops": REGISTRY_DIR / "pops" / "codes.json",
        "hazardous_properties": (
            REGISTRY_DIR / "hazardous_properties" / "codes.json"
        ),
        "hazard_statements": (
            REGISTRY_DIR / "hazard_statements" / "codes.json"
        ),
        "disposal_recovery": (
            REGISTRY_DIR / "disposal_recovery" / "codes.json"
        ),
        "container_types": (
            REGISTRY_DIR / "container_types" / "codes.json"
        ),
    }

    @classmethod
    def load(cls, registry_name: str) -> Any:
        """
        Load a registry from its configured JSON file.

        Registry contents are cached after the first load.
        """

        if registry_name not in cls.REGISTRY_PATHS:
            raise ValueError(
                f"Unknown registry: {registry_name}"
            )

        if registry_name in cls._cache:
            return cls._cache[registry_name]

        path = cls.REGISTRY_PATHS[registry_name]

        if not path.exists():
            raise FileNotFoundError(
                f"Registry file not found: {path}"
            )

        try:
            with path.open("r", encoding="utf-8") as file:
                data = json.load(file)

        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Registry contains invalid JSON: {path}"
            ) from exc

        cls._cache[registry_name] = data

        return data

    @classmethod
    def get_all(cls, registry_name: str) -> Any:
        """
        Return the complete contents of a registry.
        """

        return cls.load(registry_name)

    @classmethod
    def find_by_code(
        cls,
        registry_name: str,
        code: str,
    ) -> Any:
        """
        Find a registry entry by code.

        Supports:
        - list-based registries containing objects with a 'code' field
        - dictionary-based registries keyed directly by code
        """

        if not isinstance(code, str):
            return None

        code = code.strip()

        if not code:
            return None

        registry = cls.load(registry_name)

        if isinstance(registry, dict):
            return registry.get(code)

        if isinstance(registry, list):
            for entry in registry:
                if (
                    isinstance(entry, dict)
                    and entry.get("code") == code
                ):
                    return entry

        return None

    @classmethod
    def contains_code(
        cls,
        registry_name: str,
        code: str,
    ) -> bool:
        """
        Check whether a code exists in a registry.
        """

        return (
            cls.find_by_code(
                registry_name,
                code,
            )
            is not None
        )

    @classmethod
    def clear_cache(cls) -> None:
        """
        Clear cached registry data.

        Useful for tests or intentional registry reloads.
        """

        cls._cache.clear()
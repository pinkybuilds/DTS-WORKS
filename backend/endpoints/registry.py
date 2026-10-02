import re
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from backend.core_compliance.registry_loader import RegistryLoader


router = APIRouter(
    prefix="/registry",
    tags=["Registry"],
)


ALLOWED_REGISTRIES = {
    "ewc",
    "pops",
    "hazardous_properties",
    "disposal_recovery",
    "container_types",
}


def _normalise_code_query(query: str) -> str:
    return re.sub(r"\D", "", query)


def _normalise_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def _natural_code_sort_key(code: str) -> tuple[str, int]:
    match = re.match(
        r"^([A-Za-z]+)(\d+)",
        code.strip(),
    )

    if match:
        prefix = match.group(1).upper()
        number = int(match.group(2))
        return (prefix, number)

    return (code.upper(), 0)


def _text_matches(
    entry: dict[str, Any],
    query: str,
) -> bool:
    query_words = _normalise_text(query).split()

    if not query_words:
        return False

    searchable_values: list[str] = []

    for key, value in entry.items():
        if isinstance(value, (str, int, float)):
            searchable_values.append(
                _normalise_text(str(value))
            )

    searchable_text = " ".join(searchable_values)
    searchable_words = searchable_text.split()

    for word in query_words:
        # Allow simple plural searches such as:
        # "metals" -> "metal"
        if word.endswith("s") and len(word) > 3:
            word = word[:-1]

        if not any(
            searchable_word.startswith(word)
            for searchable_word in searchable_words
        ):
            return False

    return True


def _code_matches(
    entry: dict[str, Any],
    query: str,
) -> bool:
    code_query = _normalise_code_query(query)

    if not code_query:
        return False

    code = str(entry.get("code", ""))

    return re.sub(r"\D", "", code).startswith(code_query)


def _search_registry(
    registry_name: str,
    query: str | None,
    limit: int,
) -> list[dict[str, Any]]:
    registry = RegistryLoader.get_all(registry_name)

    # Registry files are expected to contain lists of entries.
    if not isinstance(registry, list):
        raise ValueError(
            f"Registry '{registry_name}' must contain a list of entries."
        )

    # No search query: return the registry in natural code order.
    if query is None:
        return sorted(
            registry,
            key=lambda entry: _natural_code_sort_key(
                str(entry.get("code", ""))
            )
            if isinstance(entry, dict)
            else ("", 0),
        )[:limit]

    search = query.strip()

    if not search:
        return sorted(
            registry,
            key=lambda entry: _natural_code_sort_key(
                str(entry.get("code", ""))
            )
            if isinstance(entry, dict)
            else ("", 0),
        )[:limit]

    # Numeric-only searches are treated as code searches.
    #
    # Examples:
    # "16" -> codes beginning with 16
    # "16 01" -> normalised to 1601
    if re.search(r"\d", search) and not re.search(
        r"[a-zA-Z]",
        search,
    ):
        matches = [
            entry
            for entry in registry
            if isinstance(entry, dict)
            and _code_matches(entry, search)
        ]

        return sorted(
            matches,
            key=lambda entry: _natural_code_sort_key(
                str(entry.get("code", ""))
            ),
        )[:limit]

    # Code searches such as R1 or D1 get their own
    # relevance ranking:
    #
    # 1. Exact code match
    # 2. Code prefix match
    # 3. Other text relevance
    query_normalised = _normalise_text(search)

    code_query = search.upper().strip()

    code_matches: list[dict[str, Any]] = []
    text_matches: list[tuple[int, dict[str, Any]]] = []

    for entry in registry:
        if not isinstance(entry, dict):
            continue

        code = str(entry.get("code", "")).strip()
        code_upper = code.upper()

        if code_upper == code_query:
            code_matches.append(entry)
            continue

        if code_upper.startswith(code_query):
            code_matches.append(entry)
            continue

        if not _text_matches(entry, search):
            continue

        description = _normalise_text(
            str(entry.get("description", ""))
        )

        subchapter = _normalise_text(
            str(entry.get("subChapter", ""))
        )

        chapter = _normalise_text(
            str(entry.get("chapter", ""))
        )

        # Lower relevance score = better match.
        #
        # Description matches are prioritised because the
        # description is the actual waste description shown
        # to the operator.
        if description == query_normalised:
            relevance = 0
        elif description.startswith(query_normalised):
            relevance = 1
        elif query_normalised in description:
            relevance = 2
        elif subchapter.startswith(query_normalised):
            relevance = 3
        elif query_normalised in subchapter:
            relevance = 4
        elif chapter.startswith(query_normalised):
            relevance = 5
        elif query_normalised in chapter:
            relevance = 6
        else:
            relevance = 7

        text_matches.append(
            (relevance, entry)
        )

    # Code matches are more relevant than text matches.
    #
    # Within code matches:
    # - exact code comes first
    # - then prefix matches in natural numeric order
    exact_code_matches = [
        entry
        for entry in code_matches
        if str(entry.get("code", "")).strip().upper()
        == code_query
    ]

    prefix_code_matches = [
        entry
        for entry in code_matches
        if str(entry.get("code", "")).strip().upper()
        != code_query
    ]

    prefix_code_matches.sort(
        key=lambda entry: _natural_code_sort_key(
            str(entry.get("code", ""))
        )
    )

    text_matches.sort(
        key=lambda item: (
            item[0],
            _natural_code_sort_key(
                str(item[1].get("code", ""))
            ),
        )
    )

    ordered_results = (
        exact_code_matches
        + prefix_code_matches
        + [
            entry
            for _, entry in text_matches
        ]
    )

    return ordered_results[:limit]


@router.get("/{registry_name}")
def get_registry(
    registry_name: str,
    query: str | None = Query(
        default=None,
        min_length=1,
    ),
    limit: int = Query(
        default=8,
        ge=1,
        le=50,
    ),
) -> list[dict[str, Any]]:
    registry_name = registry_name.strip().lower()

    if registry_name not in ALLOWED_REGISTRIES:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Unknown registry '{registry_name}'. "
                f"Available registries: "
                f"{', '.join(sorted(ALLOWED_REGISTRIES))}"
            ),
        )

    try:
        return _search_registry(
            registry_name=registry_name,
            query=query,
            limit=limit,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc
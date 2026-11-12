
from importlib import import_module
from types import SimpleNamespace

import pytest
from fastapi import HTTPException


organisations_router = import_module(
    "backend.organisations.router"
)


class FakeQuery:
    def __init__(self, supabase, table_name):
        self.supabase = supabase
        self.table_name = table_name
        self.filters = {}

    def select(self, columns):
        return self

    def eq(self, column, value):
        self.filters[column] = value
        return self

    def in_(self, column, values):
        self.filters[column] = values
        return self

    def execute(self):
        data = self.supabase.data.get(self.table_name, [])

        for column, value in self.filters.items():
            if isinstance(value, list):
                data = [
                    item for item in data
                    if item.get(column) in value
                ]
            else:
                data = [
                    item for item in data
                    if item.get(column) == value
                ]

        return SimpleNamespace(data=data)


class FakeSupabase:
    def __init__(self, data):
        self.data = data

    def table(self, table_name):
        return FakeQuery(self, table_name)


def mock_supabase(monkeypatch, data):
    fake = FakeSupabase(data)

    monkeypatch.setattr(
        organisations_router,
        "supabase",
        fake,
    )

    return fake


def test_returns_all_user_organisations(monkeypatch):
    mock_supabase(
        monkeypatch,
        {
            "organisation_members": [
                {
                    "user_id": "user-123",
                    "organisation_id": "org-1",
                    "role": "OWNER",
                },
                {
                    "user_id": "user-123",
                    "organisation_id": "org-2",
                    "role": "MEMBER",
                },
            ],
            "organisations": [
                {"id": "org-1", "name": "First Organisation"},
                {"id": "org-2", "name": "Second Organisation"},
            ],
        },
    )

    result = organisations_router.get_user_organisations(
        user_id="user-123"
    )

    assert result == [
        {
            "organisation_id": "org-1",
            "organisation_name": "First Organisation",
            "role": "OWNER",
        },
        {
            "organisation_id": "org-2",
            "organisation_name": "Second Organisation",
            "role": "MEMBER",
        },
    ]


def test_returns_one_organisation_for_single_membership(monkeypatch):
    mock_supabase(
        monkeypatch,
        {
            "organisation_members": [
                {
                    "user_id": "user-123",
                    "organisation_id": "org-1",
                    "role": "ADMIN",
                },
            ],
            "organisations": [
                {"id": "org-1", "name": "My Organisation"},
            ],
        },
    )

    result = organisations_router.get_user_organisations(
        user_id="user-123"
    )

    assert len(result) == 1
    assert result[0]["organisation_id"] == "org-1"
    assert result[0]["organisation_name"] == "My Organisation"
    assert result[0]["role"] == "ADMIN"


def test_returns_empty_list_when_user_has_no_memberships(monkeypatch):
    fake = mock_supabase(
        monkeypatch,
        {
            "organisation_members": [],
            "organisations": [],
        },
    )

    result = organisations_router.get_user_organisations(
        user_id="user-123"
    )

    assert result == []
    assert fake.data["organisations"] == []


def test_does_not_return_organisations_without_membership(monkeypatch):
    mock_supabase(
        monkeypatch,
        {
            "organisation_members": [
                {
                    "user_id": "user-123",
                    "organisation_id": "org-1",
                    "role": "OWNER",
                },
            ],
            "organisations": [
                {"id": "org-1", "name": "My Organisation"},
                {
                    "id": "org-2",
                    "name": "Someone Else's Organisation",
                },
            ],
        },
    )

    result = organisations_router.get_user_organisations(
        user_id="user-123"
    )

    assert len(result) == 1
    assert result[0]["organisation_id"] == "org-1"
    assert result[0]["organisation_name"] == "My Organisation"


def test_supabase_error_returns_service_unavailable(monkeypatch):
    class BrokenSupabase:
        def table(self, table_name):
            raise Exception("Database connection failed")

    monkeypatch.setattr(
        organisations_router,
        "supabase",
        BrokenSupabase(),
    )

    with pytest.raises(HTTPException) as error:
        organisations_router.get_user_organisations(
            user_id="user-123"
        )

    assert error.value.status_code == 503
    assert error.value.detail == "Unable to retrieve your organisations."

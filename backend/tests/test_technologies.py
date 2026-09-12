"""Backend tests for the dynamic 'Technologies We Teach' feature."""
import os
import uuid
import requests
import pytest
from datetime import datetime

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://skill-academy-pro-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@cloudwavetechnologies.com"
ADMIN_PASSWORD = "Admin@1234"

DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data
    return data["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Public endpoint ----------
class TestPublicTechnologies:
    def test_public_technologies_shape(self, session):
        r = session.get(f"{API}/technologies")
        assert r.status_code == 200
        d = r.json()
        assert "technologies" in d and isinstance(d["technologies"], list)
        assert "presentation" in d and isinstance(d["presentation"], dict)
        pres = d["presentation"]
        for k in ["tech_style", "tech_speed", "tech_direction", "tech_delay", "tech_loop", "tech_hover"]:
            assert k in pres, f"missing presentation key: {k}"

    def test_public_only_active_and_day_filter(self, session):
        r = session.get(f"{API}/technologies")
        d = r.json()
        today = DAY_NAMES[datetime.now().weekday()]
        for t in d["technologies"]:
            assert t.get("active") is True, "inactive tech leaked to public"
            dt = t.get("day_theme") or "everyday"
            assert dt in ("everyday", today), f"tech {t.get('name')} day_theme={dt} not allowed on {today}"

    def test_public_no_mongo_id(self, session):
        d = session.get(f"{API}/technologies").json()
        for t in d["technologies"]:
            assert "_id" not in t


# ---------- Admin CRUD ----------
class TestAdminTechCRUD:
    created_id = None

    def test_admin_list(self, session, admin_headers):
        r = session.get(f"{API}/admin/data/technologies", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_tech(self, session, admin_headers):
        payload = {
            "name": f"TEST_Tech_{uuid.uuid4().hex[:6]}",
            "day_theme": "everyday",
            "icon_url": "",
            "svg": "<svg></svg>",
            "color": "#123456",
            "active": True,
            "sort_order": 999,
        }
        r = session.post(f"{API}/admin/data/technologies", headers=admin_headers, json=payload)
        assert r.status_code in (200, 201), f"create failed {r.status_code} {r.text}"
        d = r.json()
        assert d.get("name") == payload["name"]
        assert "id" in d
        TestAdminTechCRUD.created_id = d["id"]
        TestAdminTechCRUD.created_name = payload["name"]

    def test_get_created_in_list(self, session, admin_headers):
        assert TestAdminTechCRUD.created_id
        lst = session.get(f"{API}/admin/data/technologies", headers=admin_headers).json()
        assert any(t.get("id") == TestAdminTechCRUD.created_id for t in lst)

    def test_update_tech(self, session, admin_headers):
        assert TestAdminTechCRUD.created_id
        r = session.put(
            f"{API}/admin/data/technologies/{TestAdminTechCRUD.created_id}",
            headers=admin_headers,
            json={"name": TestAdminTechCRUD.created_name + "_upd", "day_theme": "monday"},
        )
        assert r.status_code == 200, r.text
        # verify persisted
        lst = session.get(f"{API}/admin/data/technologies", headers=admin_headers).json()
        item = next((t for t in lst if t.get("id") == TestAdminTechCRUD.created_id), None)
        assert item is not None
        assert item["name"].endswith("_upd")
        assert item["day_theme"] == "monday"

    def test_deactivate_tech_not_in_public(self, session, admin_headers):
        assert TestAdminTechCRUD.created_id
        # ensure day matches today so we can test 'active' toggling
        today = DAY_NAMES[datetime.now().weekday()]
        session.put(
            f"{API}/admin/data/technologies/{TestAdminTechCRUD.created_id}",
            headers=admin_headers,
            json={"day_theme": today, "active": True},
        )
        pub_before = session.get(f"{API}/technologies").json()["technologies"]
        assert any(t.get("id") == TestAdminTechCRUD.created_id for t in pub_before), "should appear when active+matching-day"

        # deactivate
        r = session.put(
            f"{API}/admin/data/technologies/{TestAdminTechCRUD.created_id}",
            headers=admin_headers,
            json={"active": False},
        )
        assert r.status_code == 200
        pub_after = session.get(f"{API}/technologies").json()["technologies"]
        assert not any(t.get("id") == TestAdminTechCRUD.created_id for t in pub_after), "inactive tech should NOT appear in public"

    def test_reorder(self, session, admin_headers):
        # create a second tech and swap sort_orders
        p2 = {"name": f"TEST_Tech2_{uuid.uuid4().hex[:6]}", "day_theme": "everyday",
              "active": True, "sort_order": 998, "color": "#abcdef"}
        r2 = session.post(f"{API}/admin/data/technologies", headers=admin_headers, json=p2)
        assert r2.status_code in (200, 201)
        second_id = r2.json()["id"]

        # swap
        session.put(f"{API}/admin/data/technologies/{TestAdminTechCRUD.created_id}",
                    headers=admin_headers, json={"sort_order": 500})
        session.put(f"{API}/admin/data/technologies/{second_id}",
                    headers=admin_headers, json={"sort_order": 501})
        lst = session.get(f"{API}/admin/data/technologies", headers=admin_headers).json()
        a = next(t for t in lst if t["id"] == TestAdminTechCRUD.created_id)
        b = next(t for t in lst if t["id"] == second_id)
        assert a["sort_order"] == 500
        assert b["sort_order"] == 501
        # cleanup second
        session.delete(f"{API}/admin/data/technologies/{second_id}", headers=admin_headers)

    def test_delete_tech(self, session, admin_headers):
        assert TestAdminTechCRUD.created_id
        r = session.delete(
            f"{API}/admin/data/technologies/{TestAdminTechCRUD.created_id}",
            headers=admin_headers,
        )
        assert r.status_code in (200, 204)
        lst = session.get(f"{API}/admin/data/technologies", headers=admin_headers).json()
        assert not any(t.get("id") == TestAdminTechCRUD.created_id for t in lst)


# ---------- Presentation settings ----------
class TestPresentationSettings:
    def test_update_presentation_and_persist(self, session, admin_headers):
        # snapshot current settings
        pub_before = session.get(f"{API}/technologies").json()["presentation"]

        new_settings = {
            "tech_style": "Fade",
            "tech_speed": 7,
            "tech_direction": "right",
            "tech_delay": 250,
            "tech_loop": False,
            "tech_hover": "zoom",
        }
        r = session.put(f"{API}/admin/settings", headers=admin_headers, json=new_settings)
        assert r.status_code == 200, r.text

        d = session.get(f"{API}/technologies").json()["presentation"]
        for k, v in new_settings.items():
            assert d.get(k) == v, f"{k} expected {v} got {d.get(k)}"

        # restore to a reasonable default (Float) as requested
        restore = {
            "tech_style": "Float",
            "tech_speed": pub_before.get("tech_speed", 5),
            "tech_direction": pub_before.get("tech_direction", "left"),
            "tech_delay": pub_before.get("tech_delay", 150),
            "tech_loop": pub_before.get("tech_loop", True),
            "tech_hover": pub_before.get("tech_hover", "3d-tilt"),
        }
        session.put(f"{API}/admin/settings", headers=admin_headers, json=restore)


# ---------- Regression smoke ----------
class TestRegressionSmoke:
    @pytest.mark.parametrize("path", [
        "/courses", "/batches", "/students", "/placements", "/settings",
    ])
    def test_public_endpoints(self, session, path):
        r = session.get(f"{API}{path}")
        assert r.status_code == 200, f"{path} -> {r.status_code}"

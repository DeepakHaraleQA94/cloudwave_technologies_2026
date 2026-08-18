"""CloudWave backend API tests."""
import os, io, csv, uuid, pytest, requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    # local fallback for testing agent env
    with open('/app/frontend/.env') as f:
        for l in f:
            if l.startswith('REACT_APP_BACKEND_URL'):
                BASE_URL = l.split('=', 1)[1].strip()
BASE = BASE_URL.rstrip('/')
API = f"{BASE}/api"

ADMIN_EMAIL = "admin@cloudwavetechnologies.com"
ADMIN_PASSWORD = "Admin@1234"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and data["user"]["email"] == ADMIN_EMAIL
    return data["token"]


@pytest.fixture
def h(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Auth ----------------
class TestAuth:
    def test_login_wrong(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "bad"}, timeout=20)
        assert r.status_code == 401

    def test_me(self, h):
        r = requests.get(f"{API}/auth/me", headers=h, timeout=20)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=20)
        assert r.status_code == 401

    def test_forgot(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": ADMIN_EMAIL}, timeout=20)
        assert r.status_code == 200 and r.json()["ok"] is True


# ---------------- Public endpoints ----------------
class TestPublic:
    @pytest.mark.parametrize("path", [
        "/settings", "/courses", "/batches", "/trainers", "/testimonials",
        "/faqs", "/blog", "/gallery", "/videos", "/events", "/placements", "/theme/active"
    ])
    def test_public_get(self, path):
        r = requests.get(f"{API}{path}", timeout=20)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"

    def test_courses_have_data(self):
        r = requests.get(f"{API}/courses", timeout=20)
        courses = r.json()
        assert isinstance(courses, list) and len(courses) >= 5
        assert all("slug" in c and c.get("published") for c in courses)

    def test_course_by_slug(self):
        courses = requests.get(f"{API}/courses").json()
        slug = courses[0]["slug"]
        r = requests.get(f"{API}/courses/{slug}", timeout=20)
        assert r.status_code == 200
        assert r.json()["slug"] == slug

    def test_course_404(self):
        r = requests.get(f"{API}/courses/nonexistent-slug-xyz", timeout=20)
        assert r.status_code == 404


# ---------------- Enquiry submission ----------------
ENQUIRY_ID_HOLDER = {}

class TestEnquiry:
    def test_submit_success(self):
        courses = requests.get(f"{API}/courses").json()
        cid, cname = courses[0]["id"], courses[0]["name"]
        payload = {
            "name": "TEST Ravi Kumar",
            "email": "test_ravi@example.com",
            "mobile": "9876543210",
            "course_id": cid, "course_name": cname,
            "message": "Interested in weekend batch",
            "consent": True,
        }
        r = requests.post(f"{API}/enquiries", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") and d.get("enquiry_id", "").startswith("CW")
        ENQUIRY_ID_HOLDER["eid"] = d["enquiry_id"]

    def test_invalid_mobile(self):
        payload = {"name": "X", "email": "x@x.com", "mobile": "12345",
                   "consent": True, "course_name": "Foo"}
        r = requests.post(f"{API}/enquiries", json=payload, timeout=20)
        assert r.status_code == 422

    def test_missing_consent(self):
        payload = {"name": "X", "email": "x@x.com", "mobile": "9876500001",
                   "consent": False, "course_name": "Foo"}
        r = requests.post(f"{API}/enquiries", json=payload, timeout=20)
        assert r.status_code == 422

    def test_invalid_email(self):
        payload = {"name": "X", "email": "notemail", "mobile": "9876543210",
                   "consent": True}
        r = requests.post(f"{API}/enquiries", json=payload, timeout=20)
        assert r.status_code == 422


# ---------------- Admin enquiries mgmt ----------------
class TestAdminEnquiries:
    def test_list(self, h):
        r = requests.get(f"{API}/admin/enquiries?page=1&page_size=20", headers=h, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "items" in d and "total" in d and d["total"] >= 1

    def test_search(self, h):
        r = requests.get(f"{API}/admin/enquiries?search=TEST%20Ravi", headers=h, timeout=20)
        assert r.status_code == 200
        assert any("TEST Ravi" in i.get("name", "") for i in r.json()["items"])

    def test_update_status_and_note(self, h):
        items = requests.get(f"{API}/admin/enquiries?search=TEST%20Ravi", headers=h).json()["items"]
        assert items
        eid = items[0]["id"]
        r = requests.put(f"{API}/admin/enquiries/{eid}", json={"status": "Contacted", "follow_up_date": "2026-02-01"}, headers=h, timeout=20)
        assert r.status_code == 200 and r.json()["status"] == "Contacted"
        # Add note
        r = requests.post(f"{API}/admin/enquiries/{eid}/notes", json={"text": "Called student"}, headers=h, timeout=20)
        assert r.status_code == 200
        # GET to verify persistence
        got = requests.get(f"{API}/admin/enquiries?search=TEST%20Ravi", headers=h).json()["items"][0]
        assert got["status"] == "Contacted"
        assert got["follow_up_date"] == "2026-02-01"
        assert len(got["notes"]) >= 1

    def test_export(self, h):
        r = requests.get(f"{API}/admin/enquiries-export", headers=h, timeout=30)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        rows = list(csv.reader(io.StringIO(r.text)))
        assert rows[0][0] == "Enquiry ID"


# ---------------- Contact ----------------
class TestContact:
    def test_submit(self):
        r = requests.post(f"{API}/contact", json={
            "name": "TEST Contact", "email": "test_contact@example.com",
            "phone": "9876543211", "subject": "Hello", "message": "Test msg"}, timeout=20)
        assert r.status_code == 200 and r.json()["ok"]

    def test_admin_list(self, h):
        r = requests.get(f"{API}/admin/contact-messages", headers=h, timeout=20)
        assert r.status_code == 200
        assert any(m["email"] == "test_contact@example.com" for m in r.json())


# ---------------- Admin CRUD generic ----------------
class TestAdminCRUD:
    def test_faq_full_cycle(self, h):
        payload = {"category": "Courses", "question": "TEST question?", "answer": "TEST answer.", "published": True}
        r = requests.post(f"{API}/admin/data/faqs", json=payload, headers=h, timeout=20)
        assert r.status_code == 200
        item = r.json()
        assert item["question"] == "TEST question?" and "id" in item
        iid = item["id"]

        r = requests.put(f"{API}/admin/data/faqs/{iid}", json={"answer": "TEST updated"}, headers=h, timeout=20)
        assert r.status_code == 200 and r.json()["answer"] == "TEST updated"

        lst = requests.get(f"{API}/admin/data/faqs", headers=h).json()
        assert any(x["id"] == iid and x["answer"] == "TEST updated" for x in lst)

        r = requests.delete(f"{API}/admin/data/faqs/{iid}", headers=h, timeout=20)
        assert r.status_code == 200

    def test_course_create_generates_slug(self, h):
        payload = {"name": "TEST Course XYZ", "category": "Testing", "short_description": "d",
                   "duration": "1 Month", "fee": 1000, "discounted_fee": 800,
                   "published": True, "syllabus": []}
        r = requests.post(f"{API}/admin/data/courses", json=payload, headers=h, timeout=20)
        assert r.status_code == 200
        item = r.json()
        assert item["slug"] == "test-course-xyz"
        # public GET
        r = requests.get(f"{API}/courses/test-course-xyz", timeout=20)
        assert r.status_code == 200
        # cleanup
        requests.delete(f"{API}/admin/data/courses/{item['id']}", headers=h)

    def test_unknown_resource(self, h):
        r = requests.get(f"{API}/admin/data/unknown", headers=h, timeout=20)
        assert r.status_code == 404

    def test_unauth(self):
        r = requests.get(f"{API}/admin/data/courses", timeout=20)
        assert r.status_code == 401


# ---------------- Settings ----------------
class TestSettings:
    def test_settings_get_and_update(self, h):
        cur = requests.get(f"{API}/settings", timeout=20).json()
        original_tag = cur.get("tagline", "")
        new_tag = "TEST tagline " + uuid.uuid4().hex[:6]
        r = requests.put(f"{API}/admin/settings", json={**cur, "tagline": new_tag}, headers=h, timeout=20)
        assert r.status_code == 200
        got = requests.get(f"{API}/settings").json()
        assert got["tagline"] == new_tag
        # restore
        requests.put(f"{API}/admin/settings", json={**got, "tagline": original_tag}, headers=h)


# ---------------- Users ----------------
class TestUsers:
    def test_list(self, h):
        r = requests.get(f"{API}/admin/users", headers=h, timeout=20)
        assert r.status_code == 200
        assert any(u["email"] == ADMIN_EMAIL for u in r.json())

    def test_create_duplicate(self, h):
        r = requests.post(f"{API}/admin/users", json={"email": ADMIN_EMAIL, "password": "x", "name": "dup"}, headers=h, timeout=20)
        assert r.status_code == 400

    def test_create_and_delete_user(self, h):
        em = f"test_user_{uuid.uuid4().hex[:6]}@example.com"
        r = requests.post(f"{API}/admin/users", json={"email": em, "password": "Passw0rd!", "name": "TEST", "role": "admin"}, headers=h, timeout=20)
        assert r.status_code == 200
        uid = r.json()["id"]
        r = requests.delete(f"{API}/admin/users/{uid}", headers=h, timeout=20)
        assert r.status_code == 200


# ---------------- Stats ----------------
class TestStats:
    def test_stats(self, h):
        r = requests.get(f"{API}/admin/stats", headers=h, timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_enquiries", "new_enquiries", "contacted", "converted",
                  "total_courses", "active_batches", "total_trainers", "total_placements",
                  "by_status", "by_course", "by_month", "recent"]:
            assert k in d, f"missing key {k}"


# ---------------- Cleanup ----------------
def test_zzz_cleanup_enquiries(token):
    h = {"Authorization": f"Bearer {token}"}
    items = requests.get(f"{API}/admin/enquiries?search=TEST", headers=h).json().get("items", [])
    for i in items:
        requests.delete(f"{API}/admin/enquiries/{i['id']}", headers=h)

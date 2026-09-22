"""Student portal interactive flow tests.

Covers: profile save, documents CRUD, admin grant/revoke reflection in student view,
Grant All, set-password, activity log, admin learning resource creation, security matrix.
"""
import io
import os
import time
import pytest
import requests

def _load_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not set")


BASE = _load_url()
API = f"{BASE}/api"

ADMIN_EMAIL = "admin@cloudwavetechnologies.com"
ADMIN_PASS = "Admin@1234"
STU_ID = "CW-2026-0001"
STU_EMAIL = "student@cloudwavetechnologies.com"
STU_PASS = "Student@1234"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def student_token():
    r = requests.post(f"{API}/student/login", json={"identifier": STU_ID, "password": STU_PASS}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def student_id(student_token):
    r = requests.get(f"{API}/student/me", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    return r.json()["id"]


def sh(tok):  # student header
    return {"Authorization": f"Bearer {tok}"}


def ah(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- LOGIN / SECURITY MATRIX ----------

def test_student_login_wrong_password():
    r = requests.post(f"{API}/student/login", json={"identifier": STU_ID, "password": "WRONG"})
    assert r.status_code == 401


def test_student_login_via_email():
    r = requests.post(f"{API}/student/login", json={"identifier": STU_EMAIL, "password": STU_PASS})
    assert r.status_code == 200
    assert "token" in r.json()


def test_dashboard_requires_token():
    r = requests.get(f"{API}/student/dashboard")
    assert r.status_code == 401


def test_dashboard_forbidden_with_admin_token(admin_token):
    r = requests.get(f"{API}/student/dashboard", headers=ah(admin_token))
    assert r.status_code == 403


def test_locked_resource_403(student_token):
    resources = requests.get(f"{API}/student/resources", headers=sh(student_token)).json()
    locked = [r for r in resources if r["locked"]]
    assert locked, "expected at least one locked resource"
    rid = locked[0]["id"]
    r = requests.get(f"{API}/student/resources/{rid}/access", headers=sh(student_token))
    assert r.status_code == 403


def test_granted_resource_200(student_token):
    resources = requests.get(f"{API}/student/resources", headers=sh(student_token)).json()
    granted = [r for r in resources if not r["locked"]]
    assert granted
    r = requests.get(f"{API}/student/resources/{granted[0]['id']}/access", headers=sh(student_token))
    assert r.status_code == 200
    assert r.json()["id"] == granted[0]["id"]


# ---------- DASHBOARD SHAPE ----------

def test_dashboard_payload(student_token):
    r = requests.get(f"{API}/student/dashboard", headers=sh(student_token))
    assert r.status_code == 200
    d = r.json()
    for k in ("student", "course", "batch", "fee", "access", "progress", "final_quiz", "certificates"):
        assert k in d
    assert d["student"]["student_id"] == STU_ID
    assert "videos" in d["access"] and "notes" in d["access"]


# ---------- PROFILE ----------

def test_profile_update_persists(student_token):
    new_city = f"TEST_City_{int(time.time())}"
    r = requests.put(f"{API}/student/profile", headers=sh(student_token),
                     json={"city": new_city, "state": "TS", "country": "IN"})
    assert r.status_code == 200
    got = requests.get(f"{API}/student/profile", headers=sh(student_token)).json()
    assert got["city"] == new_city
    assert got["state"] == "TS"


# ---------- DOCUMENTS ----------

def test_document_upload_view_delete(student_token):
    files = {"file": ("test.txt", io.BytesIO(b"hello test"), "text/plain")}
    r = requests.post(f"{API}/student/documents?doc_type=Resume", headers=sh(student_token), files=files)
    assert r.status_code == 200, r.text
    doc = r.json()
    doc_id = doc["id"]
    file_id = doc["file_id"]

    # public media should be 403
    r2 = requests.get(f"{API}/media/{file_id}")
    assert r2.status_code == 403

    # owner can view
    r3 = requests.get(f"{API}/student/documents/{doc_id}/file", headers=sh(student_token))
    assert r3.status_code == 200
    assert b"hello test" in r3.content

    # list includes
    lst = requests.get(f"{API}/student/documents", headers=sh(student_token)).json()
    assert any(d["id"] == doc_id for d in lst)

    # delete
    d = requests.delete(f"{API}/student/documents/{doc_id}", headers=sh(student_token))
    assert d.status_code == 200
    lst2 = requests.get(f"{API}/student/documents", headers=sh(student_token)).json()
    assert not any(x["id"] == doc_id for x in lst2)


# ---------- ADMIN GRANT / REVOKE / GRANT ALL ----------

def test_admin_grant_revoke_reflects_in_student(admin_token, student_token, student_id):
    # find a locked resource for the student
    resources = requests.get(f"{API}/student/resources", headers=sh(student_token)).json()
    locked = [r for r in resources if r["locked"]]
    assert locked, "need at least one locked resource"
    rid = locked[0]["id"]

    # grant
    g = requests.post(f"{API}/admin/entitlements/grant", headers=ah(admin_token),
                      json={"student_ids": [student_id], "resource_ids": [rid]})
    assert g.status_code == 200

    # student should now see it unlocked and access 200
    after = requests.get(f"{API}/student/resources", headers=sh(student_token)).json()
    unlocked_now = next(r for r in after if r["id"] == rid)
    assert not unlocked_now["locked"]
    acc = requests.get(f"{API}/student/resources/{rid}/access", headers=sh(student_token))
    assert acc.status_code == 200

    # revoke
    rv = requests.post(f"{API}/admin/entitlements/revoke", headers=ah(admin_token),
                       json={"student_ids": [student_id], "resource_ids": [rid]})
    assert rv.status_code == 200
    acc2 = requests.get(f"{API}/student/resources/{rid}/access", headers=sh(student_token))
    assert acc2.status_code == 403


def test_admin_learning_page(admin_token, student_id):
    r = requests.get(f"{API}/admin/students/{student_id}/learning", headers=ah(admin_token))
    assert r.status_code == 200
    data = r.json()
    assert "student" in data and "resources" in data and "fee" in data
    assert "has_password" in data
    assert data["has_password"] is True


def test_grant_all_reflects(admin_token, student_token, student_id):
    resources = requests.get(f"{API}/student/resources", headers=sh(student_token)).json()
    all_ids = [r["id"] for r in resources]
    r = requests.post(f"{API}/admin/entitlements/grant", headers=ah(admin_token),
                     json={"student_ids": [student_id], "resource_ids": all_ids})
    assert r.status_code == 200
    after = requests.get(f"{API}/student/resources", headers=sh(student_token)).json()
    assert all(not x["locked"] for x in after), "all should be unlocked after grant all"

    # cleanup: revert locked/granted seed state (3 granted, 3 locked). Revoke the 3 that were originally locked.
    # figure by title (seed defs)
    originally_locked_titles = {"Module 2 — Advanced", "Advanced Notes", "Final Course Test"}
    to_revoke = [r["id"] for r in after if r["title"] in originally_locked_titles]
    if to_revoke:
        requests.post(f"{API}/admin/entitlements/revoke", headers=ah(admin_token),
                     json={"student_ids": [student_id], "resource_ids": to_revoke})


# ---------- SET PASSWORD ----------

def test_admin_set_password_then_login_and_restore(admin_token, student_id):
    tmp = "TempPass@9"
    r = requests.post(f"{API}/admin/students/{student_id}/set-password", headers=ah(admin_token),
                      json={"password": tmp})
    assert r.status_code == 200

    l = requests.post(f"{API}/student/login", json={"identifier": STU_ID, "password": tmp})
    assert l.status_code == 200

    # old password should fail now
    l2 = requests.post(f"{API}/student/login", json={"identifier": STU_ID, "password": STU_PASS})
    assert l2.status_code == 401

    # restore
    r2 = requests.post(f"{API}/admin/students/{student_id}/set-password", headers=ah(admin_token),
                       json={"password": STU_PASS})
    assert r2.status_code == 200
    l3 = requests.post(f"{API}/student/login", json={"identifier": STU_ID, "password": STU_PASS})
    assert l3.status_code == 200


def test_admin_set_password_too_short(admin_token, student_id):
    r = requests.post(f"{API}/admin/students/{student_id}/set-password", headers=ah(admin_token),
                      json={"password": "ab"})
    assert r.status_code == 400


# ---------- ACTIVITY LOG ----------

def test_activity_log_captures_events(student_token):
    # trigger a profile update + open a granted resource
    requests.put(f"{API}/student/profile", headers=sh(student_token), json={"city": "TEST_ActivityCity"})
    resources = requests.get(f"{API}/student/resources", headers=sh(student_token)).json()
    granted = [r for r in resources if not r["locked"]]
    if granted:
        requests.get(f"{API}/student/resources/{granted[0]['id']}/access", headers=sh(student_token))
    r = requests.get(f"{API}/student/activity", headers=sh(student_token))
    assert r.status_code == 200
    acts = r.json()
    assert any(a["action"] == "Login" for a in acts)
    assert any(a["action"] == "Profile Updated" for a in acts)
    assert any(a["action"] == "Resource Opened" for a in acts)


# ---------- ADMIN LEARNING STUDIO — resource create ----------

def test_admin_create_learning_resource(admin_token, student_token, student_id):
    # get the student's course_id
    prof = requests.get(f"{API}/student/profile", headers=sh(student_token)).json()
    course_id = prof.get("course_id")
    assert course_id

    payload = {
        "title": f"TEST_Resource_{int(time.time())}",
        "resource_type": "Notes",
        "course_id": course_id,
        "module": "Module Test",
        "content_url": "https://example.com/x",
        "download_allowed": True,
        "active": True,
    }
    r = requests.post(f"{API}/admin/data/learning_resources", headers=ah(admin_token), json=payload)
    assert r.status_code in (200, 201), r.text
    created = r.json()
    rid = created.get("id")
    assert rid

    # student should see it in resources list (locked, because no entitlement)
    after = requests.get(f"{API}/student/resources", headers=sh(student_token)).json()
    match = [x for x in after if x["id"] == rid]
    assert match, "created resource not visible to student"
    assert match[0]["locked"] is True

    # cleanup
    requests.delete(f"{API}/admin/data/learning_resources/{rid}", headers=ah(admin_token))


# ---------- PROGRESS ----------

def test_mark_complete_bumps_progress(student_token):
    before = requests.get(f"{API}/student/dashboard", headers=sh(student_token)).json()["progress"]
    resources = requests.get(f"{API}/student/resources", headers=sh(student_token)).json()
    granted = [r for r in resources if not r["locked"] and not r["completed"]]
    if not granted:
        pytest.skip("no incomplete granted resource")
    rid = granted[0]["id"]
    r = requests.post(f"{API}/student/resources/{rid}/complete", headers=sh(student_token))
    assert r.status_code == 200
    after = requests.get(f"{API}/student/dashboard", headers=sh(student_token)).json()["progress"]
    assert after >= before

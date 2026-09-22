"""End-to-end verification of Final Course Quiz -> Course Certificate -> Internship Certificate.

Idempotent: cleans up all data it creates (quiz attempts, progress rows for locked
resources, certificates it generates, restores entitlements to seed 3-granted/3-locked
state, restores student status = Active).

Also runs the security matrix specific to quiz endpoints.
"""
import os
import time
import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio


def _load_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not set")


BASE = _load_url()
API = f"{BASE}/api"
ADMIN_EMAIL = "admin@cloudwavetechnologies.com"
ADMIN_PASS = "Admin@1234"
STU_ID = "CW-2026-0001"
STU_PASS = "Student@1234"
ORIG_LOCKED_TITLES = {"Module 2 — Advanced", "Advanced Notes", "Final Course Test"}
# quiz answers per seeded quiz
CORRECT_ANSWERS = [1, 1, 0]


def _mongo():
    from pymongo import MongoClient
    env = {}
    with open("/app/backend/.env") as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k] = v.strip().strip('"').strip("'")
    return MongoClient(env["MONGO_URL"])[env["DB_NAME"]]


def ah(t): return {"Authorization": f"Bearer {t}"}


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
    r = requests.get(f"{API}/student/me", headers=ah(student_token))
    return r.json()["id"]


@pytest.fixture(scope="module")
def snapshot(student_id):
    """Snapshot original entitlement state and restore at end."""
    db = _mongo()
    original_ents = list(db.entitlements.find({"student_id": student_id}))
    yield
    # ---- CLEANUP ----
    # 1) delete quiz attempts + student_progress rows for this student (fresh demo)
    db.quiz_attempts.delete_many({"student_id": student_id})
    # keep progress from previous iteration_4 flow? The demo should show progress from 3 granted.
    # Instead of nuking all progress, only delete progress for resources that in seed are LOCKED
    # so demo still shows completions on 3 granted (if any) - but test_mark_complete may have
    # bumped one. Safer: delete only progress created during THIS session, which is progress
    # for originally-locked resources.
    locked_res_ids = [r["id"] for r in db.learning_resources.find(
        {"title": {"$in": list(ORIG_LOCKED_TITLES)}}, {"id": 1})]
    if locked_res_ids:
        db.student_progress.delete_many({"student_id": student_id, "resource_id": {"$in": locked_res_ids}})
    # 2) delete any certificates we created for this student
    db.certificates.delete_many({"student_id": student_id})
    # 3) restore entitlements exactly to snapshot
    db.entitlements.delete_many({"student_id": student_id})
    for e in original_ents:
        e.pop("_id", None)
        db.entitlements.insert_one(e)
    # 4) student status back to Active
    db.students.update_one({"id": student_id}, {"$set": {"status": "Active"}})


# --------------- SECURITY MATRIX FOR QUIZ ---------------

def test_quiz_get_requires_token(student_token):
    # locate a quiz resource id
    resources = requests.get(f"{API}/student/resources", headers=ah(student_token)).json()
    qres = [r for r in resources if r["resource_type"] == "Quiz"]
    assert qres, "expected seed quiz resource"
    rid = qres[0]["id"]
    r = requests.get(f"{API}/student/quiz/{rid}")
    assert r.status_code == 401


def test_quiz_forbidden_when_locked(student_token):
    resources = requests.get(f"{API}/student/resources", headers=ah(student_token)).json()
    qres = [r for r in resources if r["resource_type"] == "Quiz"][0]
    assert qres["locked"] is True, "seed quiz should be locked initially"
    r = requests.get(f"{API}/student/quiz/{qres['id']}", headers=ah(student_token))
    assert r.status_code == 403


def test_quiz_forbidden_with_admin_token(admin_token, student_token):
    resources = requests.get(f"{API}/student/resources", headers=ah(student_token)).json()
    qres = [r for r in resources if r["resource_type"] == "Quiz"][0]
    r = requests.get(f"{API}/student/quiz/{qres['id']}", headers=ah(admin_token))
    assert r.status_code == 403


# --------------- QUIZ -> CERTIFICATE FLOW ---------------

def test_full_quiz_pass_and_certificate_flow(admin_token, student_token, student_id, snapshot):
    # Step 1: Grant All (module 2 + 3 resources + quiz)
    resources = requests.get(f"{API}/student/resources", headers=ah(student_token)).json()
    all_ids = [r["id"] for r in resources]
    quiz_id = next(r["id"] for r in resources if r["resource_type"] == "Quiz")

    g = requests.post(f"{API}/admin/entitlements/grant", headers=ah(admin_token),
                     json={"student_ids": [student_id], "resource_ids": all_ids,
                           "expiry_date": "2099-12-31"})
    assert g.status_code == 200

    # Step 2: Quiz should STILL be 403 because non-quiz resources are not all complete
    r = requests.get(f"{API}/student/quiz/{quiz_id}", headers=ah(student_token))
    assert r.status_code == 403, "quiz must be locked until non-quiz content complete"

    # Step 3: Mark all non-quiz granted resources complete
    resources2 = requests.get(f"{API}/student/resources", headers=ah(student_token)).json()
    non_quiz = [r for r in resources2 if r["resource_type"] != "Quiz" and not r["locked"]]
    for res in non_quiz:
        rr = requests.post(f"{API}/student/resources/{res['id']}/complete", headers=ah(student_token))
        assert rr.status_code == 200

    # Step 4: Quiz GET should now be 200
    q = requests.get(f"{API}/student/quiz/{quiz_id}", headers=ah(student_token))
    assert q.status_code == 200, q.text
    qdata = q.json()
    assert qdata["passing_score"] == 60
    assert qdata["max_attempts"] == 3
    assert len(qdata["questions"]) == 3

    # Step 5: Submit correct answers -> pass
    sub = requests.post(f"{API}/student/quiz/{quiz_id}/submit", headers=ah(student_token),
                       json={"answers": CORRECT_ANSWERS})
    assert sub.status_code == 200, sub.text
    data = sub.json()
    assert data["passed"] is True
    assert data["score"] == 100
    cert_id = data["certificate_id"]
    assert cert_id and cert_id.startswith("CWT-CERT-"), f"bad cert id: {cert_id}"

    # Step 6: dashboard reflects Completed + certificate count >=1
    dash = requests.get(f"{API}/student/dashboard", headers=ah(student_token)).json()
    assert dash["student"]["status"] == "Completed"
    assert dash["certificates"] >= 1

    # Step 7: My certificates list contains it
    mycerts = requests.get(f"{API}/student/certificates", headers=ah(student_token)).json()
    assert any(c["certificate_id"] == cert_id for c in mycerts)

    # Step 8: Public PDF download 200 + PDF header
    pdf = requests.get(f"{API}/certificates/{cert_id}/download")
    assert pdf.status_code == 200
    assert pdf.content[:4] == b"%PDF", "response is not a PDF"
    assert "application/pdf" in pdf.headers.get("content-type", "")

    # Step 9: Re-submit with wrong answers must NOT create a second certificate
    sub2 = requests.post(f"{API}/student/quiz/{quiz_id}/submit", headers=ah(student_token),
                       json={"answers": [0, 0, 1]})
    assert sub2.status_code == 200
    mycerts2 = requests.get(f"{API}/student/certificates", headers=ah(student_token)).json()
    course_certs = [c for c in mycerts2 if c.get("cert_type") == "course"]
    assert len(course_certs) == 1, "should have exactly ONE course certificate even after re-submit"

    # Step 10: Third attempt (used 2 so far), then 4th should be blocked
    requests.post(f"{API}/student/quiz/{quiz_id}/submit", headers=ah(student_token),
                 json={"answers": [0, 0, 0]})
    over = requests.post(f"{API}/student/quiz/{quiz_id}/submit", headers=ah(student_token),
                       json={"answers": [0, 0, 0]})
    assert over.status_code == 400, f"expected max_attempts enforcement, got {over.status_code}"


def _removed_moved_into_flow(admin_token, student_token, student_id):
    return


# --------------- INTERNSHIP CERTIFICATE ---------------

def test_internship_certificate_create_and_download(admin_token, student_token, student_id):
    payload = {
        "student_id_ref": student_id,
        "internship_role": "Software Engineering Intern",
        "department": "Cloud Engineering",
        "technology": "AWS, Docker",
        "start_date": "2026-01-01",
        "end_date": "2026-03-31",
        "duration": "3 Months",
    }
    r = requests.post(f"{API}/admin/certificates/internship", headers=ah(admin_token), json=payload)
    assert r.status_code == 200, r.text
    doc = r.json()
    cid = doc["certificate_id"]
    assert cid.startswith("CWT-INT-")
    assert doc["cert_type"] == "internship"
    assert doc["internship_role"] == payload["internship_role"]

    # Student sees it in their certificates list
    mycerts = requests.get(f"{API}/student/certificates", headers=ah(student_token)).json()
    assert any(c["certificate_id"] == cid for c in mycerts)

    # PDF download
    pdf = requests.get(f"{API}/certificates/{cid}/download")
    assert pdf.status_code == 200
    assert pdf.content[:4] == b"%PDF"


def test_student_cannot_create_internship_certificate(student_token, student_id):
    r = requests.post(f"{API}/admin/certificates/internship", headers=ah(student_token),
                     json={"student_id_ref": student_id, "internship_role": "x"})
    assert r.status_code in (401, 403)


# --------------- ADDITIONAL SECURITY ---------------

def test_student_cannot_grant_entitlements(student_token, student_id):
    r = requests.post(f"{API}/admin/entitlements/grant", headers=ah(student_token),
                     json={"student_ids": [student_id], "resource_ids": []})
    assert r.status_code in (401, 403)


def test_student_cannot_read_admin_students_list(student_token):
    r = requests.get(f"{API}/admin/students", headers=ah(student_token))
    assert r.status_code in (401, 403)


def test_profile_immutable_fields(student_token):
    """Student ID and email must NOT be editable via PUT /student/profile."""
    r = requests.get(f"{API}/student/profile", headers=ah(student_token)).json()
    orig_email = r["email"]
    orig_sid = r["student_id"]
    # try to change them
    requests.put(f"{API}/student/profile", headers=ah(student_token),
                json={"email": "hacker@evil.com", "student_id": "CW-HACK-9999"})
    after = requests.get(f"{API}/student/profile", headers=ah(student_token)).json()
    assert after["email"] == orig_email, "email should be immutable via profile PUT"
    assert after["student_id"] == orig_sid, "student_id should be immutable via profile PUT"

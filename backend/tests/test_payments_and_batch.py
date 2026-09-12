"""CloudWave: payments, students, batch expenses, financials integration tests."""
import os, uuid, pytest, requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for l in f:
            if l.startswith('REACT_APP_BACKEND_URL'):
                BASE_URL = l.split('=', 1)[1].strip()
API = BASE_URL.rstrip('/') + "/api"

ADMIN_EMAIL = "admin@cloudwavetechnologies.com"
ADMIN_PASSWORD = "Admin@1234"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200
    return r.json()["token"]


@pytest.fixture(scope="module")
def h(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Payment providers masking + config ----------------
class TestPaymentProviders:
    def test_provider_list_masks_secrets(self, h):
        r = requests.get(f"{API}/admin/payment-providers", headers=h, timeout=20)
        assert r.status_code == 200
        provs = r.json()
        assert isinstance(provs, list) and len(provs) >= 1
        cp = next((p for p in provs if p["id"] == "cloudpay"), None)
        assert cp is not None, "CloudPay provider missing"
        # secrets must be masked (never raw). If set, string should contain dots
        for f in ("api_key", "secret"):
            val = cp.get(f, "")
            if cp.get(f + "_set"):
                assert "\u2022" in val, f"{f} not masked: {val}"
            else:
                # empty or dots-only, never a plain long value
                assert val == "" or "\u2022" in val

    def test_payment_config_public(self):
        r = requests.get(f"{API}/payment/config", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "provider" in d and "sandbox" in d and "configured" in d

    def test_update_provider_masked_value_ignored(self, h):
        # If UI sends back a masked api_key, backend must NOT overwrite real value.
        r = requests.get(f"{API}/admin/payment-providers", headers=h).json()
        cp = next(p for p in r if p["id"] == "cloudpay")
        before_set = cp.get("api_key_set")
        # attempt to save with the masked value
        r = requests.put(f"{API}/admin/payment-providers/cloudpay",
                         json={"api_key": cp.get("api_key"), "secret": cp.get("secret"), "mode": cp.get("mode", "sandbox")},
                         headers=h, timeout=20)
        assert r.status_code == 200
        got = r.json()
        # api_key_set stays same
        assert got.get("api_key_set") == before_set

    def test_update_provider_toggle_priority(self, h):
        r = requests.put(f"{API}/admin/payment-providers/cloudpay", json={"priority": 42}, headers=h, timeout=20)
        assert r.status_code == 200
        # verify persistence
        provs = requests.get(f"{API}/admin/payment-providers", headers=h).json()
        cp = next(p for p in provs if p["id"] == "cloudpay")
        assert cp.get("priority") == 42
        # restore
        requests.put(f"{API}/admin/payment-providers/cloudpay", json={"priority": 100}, headers=h)


# ---------------- End-to-end sandbox checkout ----------------
class TestSandboxCheckout:
    def test_create_order_returns_checkout_url(self):
        courses = requests.get(f"{API}/courses").json()
        cid = courses[0]["id"]
        payload = {"course_id": cid, "currency": "INR",
                   "name": "TEST Buyer", "email": "test_buyer@example.com", "mobile": "9876511111"}
        r = requests.post(f"{API}/payment/create-order", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["order_ref"].startswith("CWO")
        assert d["sandbox"] is True
        assert d["checkout_url"] and "/payment/checkout?ref=" in d["checkout_url"]
        assert d["amount"] > 0

    def test_full_success_flow_creates_student(self):
        courses = requests.get(f"{API}/courses").json()
        cid = courses[0]["id"]
        email = f"test_success_{uuid.uuid4().hex[:6]}@example.com"
        r = requests.post(f"{API}/payment/create-order",
                          json={"course_id": cid, "currency": "INR",
                                "name": "TEST Success", "email": email, "mobile": "9876522222"}, timeout=30)
        ref = r.json()["order_ref"]

        # Public order fetch (page load)
        r = requests.get(f"{API}/payment/order/{ref}", timeout=20)
        assert r.status_code == 200
        o = r.json()
        assert o["sandbox"] is True and o["status"] == "pending"

        # Verify success
        r = requests.post(f"{API}/payment/verify", json={"order_ref": ref, "sandbox_result": "success"}, timeout=20)
        assert r.status_code == 200
        v = r.json()
        assert v["status"] == "success" and v["student_id"]

        # GET again shows success
        o2 = requests.get(f"{API}/payment/order/{ref}").json()
        assert o2["status"] == "success"

    def test_fail_flow(self):
        courses = requests.get(f"{API}/courses").json()
        cid = courses[0]["id"]
        r = requests.post(f"{API}/payment/create-order",
                          json={"course_id": cid, "currency": "INR",
                                "name": "TEST Fail", "email": f"test_fail_{uuid.uuid4().hex[:6]}@example.com",
                                "mobile": "9876533333"}, timeout=30).json()
        ref = r["order_ref"]
        v = requests.post(f"{API}/payment/verify", json={"order_ref": ref, "sandbox_result": "fail"}, timeout=20).json()
        assert v["status"] == "failed"
        o = requests.get(f"{API}/payment/order/{ref}").json()
        assert o["status"] == "failed"

    def test_missing_ref_404(self):
        r = requests.get(f"{API}/payment/order/NON_EXISTENT_REF", timeout=20)
        assert r.status_code == 404


# ---------------- Students paid_amount ----------------
class TestStudentPaidAmount:
    def test_create_student_with_paid_amount(self, h):
        courses = requests.get(f"{API}/admin/data/courses", headers=h).json()
        batches = requests.get(f"{API}/admin/data/batches", headers=h).json()
        cid = courses[0]["id"]
        bmatch = next((b for b in batches if b.get("course_id") == cid), batches[0])
        payload = {"full_name": "TEST PaidStudent", "email": f"paid_{uuid.uuid4().hex[:6]}@x.com",
                   "mobile": "9876500011", "course_id": cid, "batch_id": bmatch["id"],
                   "status": "Registered", "payment_status": "Paid", "paid_amount": 18500,
                   "joining_date": "2026-01-15"}
        r = requests.post(f"{API}/admin/students", json=payload, headers=h, timeout=20)
        assert r.status_code == 200, r.text
        sid = r.json()["id"]
        # GET to verify persistence
        got = requests.get(f"{API}/admin/students/{sid}", headers=h).json()
        assert got["payment_status"] == "Paid"
        assert float(got["paid_amount"]) == 18500
        # cleanup
        requests.delete(f"{API}/admin/students/{sid}", headers=h)


# ---------------- Batch expenses + financials integration ----------------
class TestBatchExpensesFinancials:
    def test_expense_flow_reflects_in_financials(self, h):
        # find a batch
        batches = requests.get(f"{API}/admin/data/batches", headers=h).json()
        assert batches, "no batches"
        b = batches[0]
        bid = b["id"]
        cid = b["course_id"]
        # baseline financials
        fin0 = requests.get(f"{API}/admin/batches/{bid}/financials", headers=h).json()
        exp0 = fin0["expenses_total"]

        # add a student paid offline exactly 12345
        payload = {"full_name": "TEST FinStudent", "email": f"fin_{uuid.uuid4().hex[:6]}@x.com",
                   "mobile": "9876500055", "course_id": cid, "batch_id": bid,
                   "status": "Active", "payment_status": "Paid", "paid_amount": 12345,
                   "joining_date": "2026-01-15"}
        rs = requests.post(f"{API}/admin/students", json=payload, headers=h, timeout=20)
        assert rs.status_code == 200
        sid = rs.json()["id"]

        # add expense
        exp = {"category": "Trainer Fees", "description": "TEST expense", "amount": 5000,
               "expense_date": "2026-01-20", "batch_id": bid}
        re = requests.post(f"{API}/admin/data/expenses", json=exp, headers=h, timeout=20)
        assert re.status_code == 200
        eid = re.json()["id"]

        fin1 = requests.get(f"{API}/admin/batches/{bid}/financials", headers=h).json()
        assert fin1["expenses_total"] == exp0 + 5000
        # offline should include this student's paid_amount (12345) if not part of online order
        assert fin1["offline"] >= 12345
        # net_profit = total_collection - expenses_total
        assert round(fin1["net_profit"], 2) == round(fin1["total_collection"] - fin1["expenses_total"], 2)
        assert any(e["id"] == eid for e in fin1["expenses"])

        # delete expense
        rd = requests.delete(f"{API}/admin/data/expenses/{eid}", headers=h, timeout=20)
        assert rd.status_code == 200
        fin2 = requests.get(f"{API}/admin/batches/{bid}/financials", headers=h).json()
        assert fin2["expenses_total"] == exp0

        # cleanup student
        requests.delete(f"{API}/admin/students/{sid}", headers=h)

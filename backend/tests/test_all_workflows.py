import io
import pytest


def test_auth_and_registration(client):
    # 1. Successful registration
    reg_payload = {
        "full_name": "Test Officer",
        "organization": "Department of Commerce",
        "department": "Procurement Cell",
        "email": "officer@test.gov.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
    }
    r = client.post("/api/v1/auth/register", json=reg_payload)
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "officer@test.gov.in"

    # 2. Duplicate registration rejected
    r_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert r_dup.status_code == 409

    # 3. Valid login
    r_login = client.post("/api/v1/auth/login", json={"email": "officer@test.gov.in", "password": "Password123!"})
    assert r_login.status_code == 200
    token = r_login.json()["access_token"]
    assert token

    # 4. Invalid password rejected
    r_bad = client.post("/api/v1/auth/login", json={"email": "officer@test.gov.in", "password": "WrongPassword!"})
    assert r_bad.status_code == 401

    # 5. Protected endpoint rejected without token
    r_me_no_auth = client.get("/api/v1/auth/me")
    assert r_me_no_auth.status_code == 401

    # 6. Protected endpoint with token
    headers = {"Authorization": f"Bearer {token}"}
    r_me = client.get("/api/v1/auth/me", headers=headers)
    assert r_me.status_code == 200
    assert r_me.json()["full_name"] == "Test Officer"


def test_cross_user_isolation(client):
    # Create User 1
    r1 = client.post("/api/v1/auth/register", json={
        "full_name": "User One", "organization": "Org One", "email": "user1@test.gov.in",
        "password": "Password123!", "confirm_password": "Password123!"
    })
    token1 = r1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Create User 2
    r2 = client.post("/api/v1/auth/register", json={
        "full_name": "User Two", "organization": "Org Two", "email": "user2@test.gov.in",
        "password": "Password123!", "confirm_password": "Password123!"
    })
    token2 = r2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 1 creates a bid case
    r_bid = client.post("/api/v1/bids", headers=headers1, json={
        "title": "User 1 Sensitive Hardware Tender",
        "reference_number": "GEM/2026/B/9991",
        "procuring_organization": "Org One",
        "department": "Defense Procurement",
        "description": "Sensitive server acquisition.",
        "category": "Enterprise IT",
        "estimated_value": 5000000.0,
    })
    assert r_bid.status_code == 201
    case_id = r_bid.json()["id"]

    # User 1 can see their case
    r_get1 = client.get(f"/api/v1/bids/{case_id}", headers=headers1)
    assert r_get1.status_code == 200

    # User 2 CANNOT access User 1's private case (returns 404 access denied)
    r_get2 = client.get(f"/api/v1/bids/{case_id}", headers=headers2)
    assert r_get2.status_code == 404

    # User 2 CANNOT update User 1's case
    r_patch2 = client.patch(f"/api/v1/bids/{case_id}", headers=headers2, json={"title": "Hacked Title"})
    assert r_patch2.status_code == 404

    # User 2 CANNOT delete User 1's case
    r_del2 = client.delete(f"/api/v1/bids/{case_id}", headers=headers2)
    assert r_del2.status_code == 404


def test_bid_case_crud_and_dashboard(client):
    r_reg = client.post("/api/v1/auth/register", json={
        "full_name": "Procurement Director", "organization": "Railways", "email": "director@railways.gov.in",
        "password": "Password123!", "confirm_password": "Password123!"
    })
    token = r_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Empty dashboard initially
    r_dash = client.get("/api/v1/dashboard/summary", headers=headers)
    assert r_dash.status_code == 200
    assert r_dash.json()["totalCases"] == 0

    # Create Bid
    r_create = client.post("/api/v1/bids", headers=headers, json={
        "title": "High-Speed Signaling Gear",
        "reference_number": "GEM/2026/B/5544",
        "procuring_organization": "Railways",
        "department": "Signaling & Telecom",
        "description": "Supply of automatic block signaling equipment.",
        "category": "Signaling & Power",
        "estimated_value": 25000000.0,
    })
    assert r_create.status_code == 201
    case_id = r_create.json()["id"]

    # Dashboard updates with real metric
    r_dash2 = client.get("/api/v1/dashboard/summary", headers=headers)
    assert r_dash2.json()["totalCases"] == 1

    # Update Bid
    r_upd = client.patch(f"/api/v1/bids/{case_id}", headers=headers, json={"estimated_value": 28000000.0})
    assert r_upd.status_code == 200

    # Read Detail
    r_det = client.get(f"/api/v1/bids/{case_id}", headers=headers)
    assert r_det.status_code == 200
    assert r_det.json()["estimated_value"] == 28000000.0


def test_document_upload_and_analysis_pipeline(client):
    r_reg = client.post("/api/v1/auth/register", json={
        "full_name": "Assurance Lead", "organization": "Telecom", "email": "lead@telecom.gov.in",
        "password": "Password123!", "confirm_password": "Password123!"
    })
    token = r_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Bid Case
    r_bid = client.post("/api/v1/bids", headers=headers, json={
        "title": "Campus Optical Fiber Backbone",
        "reference_number": "GEM/2026/B/7711",
        "procuring_organization": "Telecom Cell",
        "department": "Network Engineering",
        "description": "Fiber rollout with OEM warranty.",
        "category": "Enterprise IT",
        "estimated_value": 15000000.0,
    })
    case_id = r_bid.json()["id"]

    # Upload real text/pdf document
    file_content = (
        b"ABC Technologies Pvt Ltd is an authorized OEM channel partner for Optical Fiber equipment.\n"
        b"GSTIN: 07ABCDE1234F1Z5. PAN: ABCDE1234F.\n"
        b"Annual turnover certified at Rs 12.5 Crore over the last three financial years.\n"
        b"Satisfactory past experience of 5 years across government networks.\n"
    )
    files = [("files", ("OEM_Authorization.pdf", file_content, "application/pdf"))]
    r_upload = client.post(f"/api/v1/bids/{case_id}/documents", headers=headers, files=files)
    assert r_upload.status_code == 201
    docs = r_upload.json()
    assert len(docs) == 1
    doc_id = docs[0]["id"]

    # Verify document download works
    r_down = client.get(f"/api/v1/documents/{doc_id}/download", headers=headers)
    assert r_down.status_code == 200
    assert len(r_down.content) > 0

    # Run AI Analysis
    r_analyze = client.post(f"/api/v1/bids/{case_id}/analyze", headers=headers)
    assert r_analyze.status_code == 200
    analysis = r_analyze.json()
    assert analysis["clauses_analyzed"] > 0
    assert analysis["score"] > 0
    assert len(analysis["findings"]) > 0

    # Verify Compliance Matrix
    r_matrix = client.get(f"/api/v1/compliance?case_id={case_id}", headers=headers)
    assert r_matrix.status_code == 200
    matrix_rows = r_matrix.json()
    assert len(matrix_rows) > 0

    # Verify Risk alerts created
    r_risks = client.get(f"/api/v1/risks?case_id={case_id}", headers=headers)
    assert r_risks.status_code == 200

    # Generate Report (PDF)
    r_rep_pdf = client.post(f"/api/v1/bids/{case_id}/reports", headers=headers, json={"report_type": "full_compliance", "file_format": "pdf"})
    assert r_rep_pdf.status_code == 201
    pdf_report_id = r_rep_pdf.json()["id"]

    # Download Report (PDF)
    r_pdf_download = client.get(f"/api/v1/reports/{pdf_report_id}/download", headers=headers)
    assert r_pdf_download.status_code == 200
    assert r_pdf_download.headers["content-type"] == "application/pdf"
    assert len(r_pdf_download.content) > 100

    # Generate Report (CSV)
    r_rep_csv = client.post(f"/api/v1/bids/{case_id}/reports", headers=headers, json={"report_type": "compliance_matrix", "file_format": "csv"})
    assert r_rep_csv.status_code == 201
    csv_report_id = r_rep_csv.json()["id"]

    r_csv_download = client.get(f"/api/v1/reports/{csv_report_id}/download", headers=headers)
    assert r_csv_download.status_code == 200
    assert "Clause ID" in r_csv_download.text

    # Verify Audit Trail recorded all operations
    r_audit = client.get("/api/v1/audit-logs", headers=headers)
    assert r_audit.status_code == 200
    logs = r_audit.json()
    actions = [l["action"] for l in logs]
    assert any("Created Bid Case" in a for a in actions)
    assert any("Uploaded Tender Documents" in a for a in actions)
    assert any("Compliance Analysis" in a for a in actions)

    # Verify Notifications
    r_notifs = client.get("/api/v1/notifications", headers=headers)
    assert r_notifs.status_code == 200
    assert len(r_notifs.json()) > 0

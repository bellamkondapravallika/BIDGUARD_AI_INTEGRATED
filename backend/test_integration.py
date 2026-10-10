from fastapi.testclient import TestClient
from app.database import engine, Base
from app.main import app

# Ensure tables exist
Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_real_auth_and_bid_lifecycle():
    email = "integration_officer@gem.gov.in"
    password = "SecurePassword123!"
    r_reg = client.post("/api/v1/auth/register", json={
        "full_name": "Integration Officer",
        "organization": "Ministry of Power",
        "department": "Grid Compliance Cell",
        "email": email,
        "password": password,
        "confirm_password": password,
    })
    if r_reg.status_code == 201:
        token = r_reg.json()["access_token"]
    else:
        r_log = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert r_log.status_code == 200
        token = r_log.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # Check real dashboard stats
    r_dash = client.get("/api/v1/dashboard/stats", headers=headers)
    assert r_dash.status_code == 200
    assert "totalCases" in r_dash.json()

    # Create real bid case
    r_case = client.post("/api/v1/bids", headers=headers, json={
        "title": "Smart Grid Energy Storage Systems",
        "department": "Grid Compliance Cell",
        "reference_number": "GEM/2026/B/882190",
        "procuring_organization": "Ministry of Power",
        "category": "Renewable Energy",
        "description": "Compliance assurance for battery energy storage systems.",
        "estimated_value": 45000000.0,
    })
    assert r_case.status_code == 201
    case_id = r_case.json()["id"]

    # Upload document
    pdf_content = (
        b"ABC Technologies Pvt Ltd is an authorized OEM channel partner for Battery Energy Storage Systems.\n"
        b"GSTIN: 07AAAAA0000A1Z5. PAN: AAAAA0000A.\n"
        b"Turnover exceeds Rs 50 Crore.\n"
    )
    files = [("files", ("OEM_Authorization.pdf", pdf_content, "application/pdf"))]
    r_up = client.post(f"/api/v1/bids/{case_id}/documents", headers=headers, files=files)
    assert r_up.status_code == 201

    # Run real analysis
    r_an = client.post(f"/api/v1/bids/{case_id}/analyze", headers=headers)
    assert r_an.status_code == 200
    assert r_an.json()["clauses_analyzed"] > 0

    # Generate report
    r_rep = client.post(f"/api/v1/bids/{case_id}/reports", headers=headers, json={
        "report_type": "full_compliance",
        "file_format": "pdf",
    })
    assert r_rep.status_code == 201


def test_demo_adapter_endpoint():
    r = client.get("/api/v1/demo/inconsistent-bidder")
    assert r.status_code == 200
    assert r.json()["status"] == "MOCK_VERIFIED"

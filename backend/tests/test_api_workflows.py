import io
from PIL import Image, ImageDraw


def _make_sample_certificate_png(text_lines: list[str]) -> bytes:
    img = Image.new("RGB", (1000, 600), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    y = 80
    for line in text_lines:
        draw.text((80, y), line, fill=(10, 20, 60))
        y += 50
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_full_end_to_end_workflows(client):
    # 1. Login as Super Admin
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@certifix.ai", "password": "AdminPass123!"},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register an Organization (starts pending)
    org_reg = client.post(
        "/api/v1/auth/register-organization",
        json={
            "email": "org@acme.edu",
            "full_name": "Acme Registrar",
            "password": "OrgPassword123!",
            "organization_name": "Acme Institute of Technology",
            "contact_email": "registrar@acme.edu",
        },
    )
    assert org_reg.status_code == 201
    org_token = org_reg.json()["access_token"]
    org_id = org_reg.json()["user"]["organization_id"]
    org_headers = {"Authorization": f"Bearer {org_token}"}

    # Unverified org cannot issue certificates
    blocked_issue = client.post(
        "/api/v1/certificates/issue",
        headers=org_headers,
        json={
            "recipient_name": "Jane Doe",
            "title": "Python Bootcamp",
            "issue_date": "2026-10-01",
        },
    )
    assert blocked_issue.status_code == 403

    # 3. Super Admin verifies Organization
    verify_org = client.post(
        f"/api/v1/admin/organizations/{org_id}/verify",
        headers=admin_headers,
        json={"status": "verified"},
    )
    assert verify_org.status_code == 200
    assert verify_org.json()["verification_status"] == "verified"

    # 4. Organization creates a template and issues a certificate
    tpl_res = client.post(
        "/api/v1/templates/",
        headers=org_headers,
        json={"name": "Standard Tech Certificate", "signatory_name": "Dr. A. Kumar"},
    )
    assert tpl_res.status_code == 201
    tpl_id = tpl_res.json()["id"]

    issue_res = client.post(
        "/api/v1/certificates/issue",
        headers=org_headers,
        json={
            "template_id": tpl_id,
            "recipient_name": "Arun Prakas",
            "recipient_email": "arun@example.com",
            "title": "AI Engineering Fellowship",
            "issue_date": "2026-11-01",
        },
    )
    assert issue_res.status_code == 201
    cert_uid = issue_res.json()["certificate_uid"]

    # 5. Public verification & PDF download
    verify_res = client.get(f"/api/v1/verify/{cert_uid}")
    assert verify_res.status_code == 200
    assert verify_res.json()["is_valid"] is True

    pdf_res = client.get(f"/api/v1/certificates/{cert_uid}/download")
    assert pdf_res.status_code == 200
    assert pdf_res.content.startswith(b"%PDF-")

    # 6. Public user registers, uploads certificate for OCR, and submits correction request
    user_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "arun@example.com",
            "full_name": "Arun Prakash",
            "password": "UserPassword123!",
        },
    )
    assert user_reg.status_code == 201
    user_headers = {"Authorization": f"Bearer {user_reg.json()['access_token']}"}

    png_bytes = _make_sample_certificate_png(
        [
            "Acme Institute of Technology",
            "CERTIFICATE OF ACHIEVEMENT",
            "This is to certify that Arun Prakas",
            "successfully completed AI Engineering Fellowship",
            f"Certificate ID: {cert_uid}",
            "Issue Date: 2026-11-01",
        ]
    )
    ocr_res = client.post(
        "/api/v1/ocr/upload",
        headers=user_headers,
        files={"file": ("cert.png", png_bytes, "image/png")},
    )
    assert ocr_res.status_code == 201
    upload_id = ocr_res.json()["id"]

    corr_res = client.post(
        "/api/v1/corrections/",
        headers=user_headers,
        json={
            "organization_id": org_id,
            "uploaded_certificate_id": upload_id,
            "claimed_certificate_uid": cert_uid,
            "requested_changes": {"recipient_name": "Arun Prakash"},
            "reason": "Missing trailing 'h' in surname.",
        },
    )
    assert corr_res.status_code == 201
    corr_id = corr_res.json()["id"]

    # 7. Public user cannot approve their own correction request (RBAC)
    rbac_check = client.post(
        f"/api/v1/corrections/{corr_id}/decide",
        headers=user_headers,
        json={"decision": "approved"},
    )
    assert rbac_check.status_code == 403

    # 8. Organization approves correction -> new official certificate generated
    approve_res = client.post(
        f"/api/v1/corrections/{corr_id}/decide",
        headers=org_headers,
        json={"decision": "approved", "reviewer_notes": "Verified against student records."},
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"
    new_uid = approve_res.json()["corrected_certificate_uid"]
    assert new_uid and new_uid != cert_uid

    # 9. Verify newly re-issued certificate & check Admin stats/audit logs
    verify_new = client.get(f"/api/v1/verify/{new_uid}")
    assert verify_new.status_code == 200
    assert verify_new.json()["is_valid"] is True
    assert verify_new.json()["is_corrected_reissue"] is True

    stats_res = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    assert stats_res.json()["approved_correction_requests"] >= 1

# Security Policy

This project handles medical imaging and may process electronic protected health information. Security depends on both the application controls in this repository and the environment in which it is deployed. Running this code does not, by itself, make an organization HIPAA, GDPR, or ISO 27001 compliant.

## Implemented Controls

- Explicit project/task authorization on protected API, annotation, timer, file, and realtime routes.
- Medical files are stored outside the client web root and streamed only after task authorization.
- Random server-side upload names, extension allowlisting, resource limits, signature checks, executable rejection, and SHA-256 digests.
- Annotation revision and SHA-256 integrity metadata with verification on read.
- JWT algorithm, issuer, audience, purpose, and expiry verification.
- Short-lived, task-scoped tickets for realtime EventSource connections.
- Restricted CORS, rate limits, request-size limits, security headers, request IDs, generic errors, and disabled Express fingerprinting.
- Password hashing with bcrypt and bounded authentication/profile inputs.
- Audit records that exclude request bodies, annotation content, filenames, credentials, and tokens.
- AES-256-GCM protection for Google OAuth tokens when `DATA_ENCRYPTION_KEY` is configured.
- One-time Google OAuth state records, redirect allowlisting, and replay protection.
- Production startup rejection for unsafe JWT, CORS, and integration-encryption settings.
- Docker images run the API and web client as non-root users; Compose keeps MongoDB off host ports and mounts secrets as files.

## Required Production Controls

Before storing real patient data, the operator must also provide:

1. TLS 1.2 or newer at the ingress and TLS for MongoDB connections.
2. Encryption at rest for MongoDB volumes, upload volumes, backups, snapshots, and audit storage.
3. A managed secrets/KMS solution with rotation procedures. Do not commit `.env`, `.env.docker`, OAuth credentials, or database passwords.
4. Centralized, access-controlled, tamper-resistant audit collection and alerting.
5. Tested encrypted backups, restore drills, retention rules, and secure media disposal.
6. Malware scanning or an approved quarantine pipeline for uploads. Signature checks are not antivirus scanning.
7. DICOM de-identification and validation appropriate to the institution. File names and DICOM headers may contain patient identifiers.
8. MFA or enterprise SSO for clinical deployment. The current local account flow does not provide MFA.
9. Automatic session timeout and organization-specific access review/offboarding procedures.
10. Network segmentation, host patching, container/image scanning, dependency monitoring, and incident response procedures.
11. Vendor agreements and data residency review for MongoDB, Google Drive, hosting, observability, and backup providers.
12. A formal privacy/security risk assessment and penetration test before clinical or regulated use.

The current dependency findings and accepted build gate are documented in [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md).

## Secret Generation

Generate local Docker configuration without overwriting an existing file:

```bash
npm run docker:env
```

For non-Docker deployment, copy `server/.env.example` to `server/.env` and generate independent values:

```bash
openssl rand -base64 48
openssl rand -base64 32
```

The first value is suitable for `JWT_SECRET`. The second is a 32-byte `DATA_ENCRYPTION_KEY`. Production secrets should come from a secrets manager rather than local files.

## Reporting A Vulnerability

Do not open a public issue containing patient data, credentials, tokens, exploit details, or production URLs. Contact the repository owner privately with:

- affected version or commit;
- reproduction steps using synthetic data;
- expected impact;
- suggested mitigation, if known.

Rotate potentially exposed credentials immediately and preserve relevant audit records for incident review.

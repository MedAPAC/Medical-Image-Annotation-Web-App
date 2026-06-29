# Security Audit Record

Audit date: 2026-06-29

## Scope

- Express and MongoDB configuration
- JWT authentication and project/task authorization
- DICOM, NIfTI, and image upload/delivery
- Annotation storage and realtime collaboration
- Google Drive OAuth and credential storage
- Browser security policy and client token persistence
- npm production dependency advisories
- Docker and Compose deployment configuration

## Results

The server production dependency audit reports zero known vulnerabilities after compatible lockfile updates.

The client production dependency audit reports 38 advisories, including 17 high-severity findings. Most are inherited from the Create React App build toolchain or optional Node-only dependencies that are absent from the final static NGINX image. Runtime-relevant findings remain in the legacy medical imaging/annotation dependency graph:

- Fabric.js SVG serialization advisories. The application does not currently call its exposed SVG export method, and project labels are authorization-controlled, but the vulnerable library version remains installed.
- Cornerstone WADO loader dependency on an older UUID package. The vulnerable caller-buffer APIs are not used directly by this application.
- VTK.js XML/YAML transitive dependencies used by the imaging stack.

`npm audit fix --force` is not an acceptable remediation: npm proposes breaking upgrades/downgrades of Fabric.js, Cornerstone, and React Scripts that can change annotation and viewer behavior. A dedicated migration with annotation regression fixtures, DICOM/NIfTI viewer tests, and cross-browser validation is required before regulated production use.

## Deployment Gates

- Server audit at `high` must pass.
- Client audit at `critical` must pass while the recorded high-severity migration work remains open.
- Client production build and server syntax suite must pass.
- Container images should be scanned in the target registry and blocked on exploitable critical findings.
- A penetration test and institutional risk acceptance are required before processing real patient data.

This record is a technical snapshot, not a compliance certification.

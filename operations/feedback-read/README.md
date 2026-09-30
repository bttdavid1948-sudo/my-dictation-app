# Exact retained feedback verification

**Current disposition: NOT_NEEDED, not applied.** The [system capability review](../../docs/content-pipeline/registry/batch-01-feedback-system-capability.json)
reuses MAN-0065 authenticated read PASS for the byte-identical feedback path.
Every release still requires actual backend write ACK and exact versioned context.
The ten later documents have **not** been independently read; no read PASS is claimed.
No Owner IAM/WIF action is requested. Keep this optional verifier and inactive template
dormant; future activation requires a new justified access review and authorization.

The remainder documents the historical, superseded proposal, not a current action list.

Prepared, locally tested, **not authorized or production-verified**. No IAM changes,
new credentials, enabled workflow or live read have occurred.

The verifier performs only HTTPS GET of explicitly supplied `owner_feedback`
document IDs in the fixed project/database. It validates the returned document name,
server timestamp and JSON audio report against the complete retained expected context.
Both desktop and mobile records must pass independently for a pair. Other failures
remain parked. It never lists collections, writes data, follows redirects, logs a
credential or saves raw feedback, UID/email/nickname/message. Redacted receipts keep
document-ID hashes, response hashes, timestamps and context-comparison results.

The 10-record private manifest is reconstructed from the two hash-registered runtime
evidence packets, not a new smoke run. Its byte commitment is in access-plan.json.
Do not commit that manifest, a token, raw feedback or a credentials file. The workflow
template reads it from a maintainer-only Actions variable and uploads only the receipt.
No token is supplied as a command argument. Future batches reuse the verifier with a
reviewed manifest commitment; do not broaden IAM automatically.

## Existing access assessment

Work exposes no Firebase/GCP connector; no Google credential environment variable,
ADC/gcloud configuration or firebase-tools login is present. The only dedicated local
provider key is for OpenAI and cannot authorize Firestore. Existing three workflows
are credential-free learner smoke. No existing workload federation is evidenced by
repository configuration. Remote project IAM cannot be inventoried with current access;
do not claim no remote identity exists or attempt to extract browser cookies/tokens.

## Prepared replacement and security boundary

Use keyless direct GitHub OIDC federation and a custom role containing only
`datastore.entities.get`, conditioned to `(default)` and expiring 2026-10-08 UTC.
The provider accepts only the numeric repo/owner/actor IDs, main branch, manual event
and exact verification workflow path specified in access-plan.json. No service account
or key is needed for this proposal. Production acceptance of direct federated tokens
must be tested after authorization; it is not inferred from unit tests.

**IAM limits this to database-level GET, not ten documents or one collection.** A holder
could GET another known document ID in that database. Collection and exact-ID limits
in the verifier are application controls. Owner must approve that precise scope. If
this scope is unacceptable, use a reviewed internal allowlist broker instead; that is
more setup and is not implemented here. Do not substitute Viewer/Admin, use an Owner
refresh token, create a service-account JSON key, or change Firestore Rules.

## Minimum Owner UI setup if this scope is approved

This is security provisioning only. Operations runs and assesses all verification.
Use the existing project `my-dictation-project-4381e` in the Owner's own Google Cloud
Console; do not use Work Google sign-in. No CLI or secret copying is required.

1. **IAM & Admin → Roles → Create role**: title `Man feedback exact GET`, ID
   `manFeedbackExactGet`, stage GA; include **only** `datastore.entities.get`; Create.
2. **IAM & Admin → Workload Identity Federation → Create pool**: ID
   `man-feedback-verify`, enabled. Add OIDC provider `github`, issuer and attribute
   mapping/condition exactly from access-plan.json. Use the default audience. Save.
   If required APIs are disabled, pause rather than approve an unrelated service.
3. On the pool detail page, copy its non-secret resource name/project number. In
   **IAM → Grant access**, use the principal from access-plan.json with that project
   number, select the custom role above, add the exact IAM condition there, and Save.
   Do not modify existing Firebase service-agent bindings. Send Operations only the
   provider resource name (non-secret) and completion confirmation.

Operations will activate the already-prepared workflow and set the non-secret provider
and private synthetic expectation variables (JSON without its final newline; the
workflow restores exactly one final newline), then run the 10 reads and check each
receipt. Those repository-variable writes require a supported maintainer path; current
GitHub connector cannot manage variables. Do not require Owner to run tests. If that
path is unavailable, report a distinct capability boundary before execution.

Rollback: remove the newly scoped IAM binding or disable this dedicated pool, and remove
the verification workflow. No learner data, Auth provider, Rules, existing IAM binding
or release evidence needs rollback. Expiry bounds this first authorization; extension
for later batches requires the applicable access authority.

## Verification and canonical evidence

Unit tests cover wrong document/context, missing timestamps, malformed message, unsafe
target IDs, no-list/no-write transport, redaction and independent pair progression.
These are fixture tests, not production reads. CLI evidence is `LIVE_REST_GET` only after
actual authenticated requests. No GUI dependency is marked superseded until live
receipts meet the established MAN-0065 independent feedback-read requirement.

Primary references:
- https://firebase.google.com/docs/firestore/use-rest-api
- https://cloud.google.com/firestore/docs/security/iam
- https://cloud.google.com/firestore/docs/manage-databases#configure_per-database_access_permissions
- https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines
- https://github.com/google-github-actions/auth/tree/7c6bc770dae815cd3e89ee6cdf493a5fab2cc093

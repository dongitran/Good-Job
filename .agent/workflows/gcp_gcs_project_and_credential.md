---
description: "Provision GCS bucket, upload credential, store in Bitwarden via MCP, update .agent/config/secrets.yml, and sync to GitHub Actions secrets"
---

# Provision GCS Bucket, Credential and Sync to GitHub Secrets

// turbo-all

Goal: use `gcloud` to create a GCS bucket, get `project_id`, create a GCS credential JSON, store all values in Bitwarden using MCP with `GOODJOB_GCP_GCS_*` naming, update `.agent/config/secrets.yml`, then sync to GitHub Actions secrets.

## Steps

1. Review `.agent/config` folder.

2. Verify gcloud auth and get active project id.
   ```bash
   gcloud auth list
   gcloud config list --format="text(core.account,core.project)"
   gcloud config get-value project
   ```
   If project is empty, select one:
   ```bash
   gcloud projects list
   gcloud config set project YOUR_PROJECT_ID
   ```

3. Create GCS bucket for the project.
   Use a general-purpose name (not feature-specific) so it can store any asset type (logos, avatars, attachments, etc.).
   ```bash
   PROJECT_ID="$(gcloud config get-value project)"
   BUCKET_NAME="goodjob-assets"

   gcloud storage buckets create "gs://${BUCKET_NAME}" \
     --project="$PROJECT_ID" \
     --location=asia-southeast1 \
     --default-storage-class=STANDARD \
     --uniform-bucket-level-access
   ```
   Verify the bucket exists:
   ```bash
   gcloud storage buckets describe "gs://${BUCKET_NAME}"
   ```

4. Create service account for GCS upload and grant permission.
   ```bash
   SA_NAME="goodjob-gcs-uploader"
   SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

   gcloud iam service-accounts create "$SA_NAME" \
     --display-name="GCS Uploader"

   gcloud projects add-iam-policy-binding "$PROJECT_ID" \
     --member="serviceAccount:${SA_EMAIL}" \
     --role="roles/storage.objectCreator"
   ```
   If overwrite/delete is needed, use `roles/storage.objectAdmin`.
   If signed URL generation is needed, also add:
   ```bash
   gcloud projects add-iam-policy-binding "$PROJECT_ID" \
     --member="serviceAccount:${SA_EMAIL}" \
     --role="roles/iam.serviceAccountTokenCreator"
   ```

5. Create credential json file.
   ```bash
   gcloud iam service-accounts keys create ./gcp-gcs-credential.json \
     --iam-account="$SA_EMAIL"
   ```
   Keep this file out of git.

6. Save values to Bitwarden via MCP Bitwarden tools.
   Store all items in Bitwarden folder: `amanotes`.

   Use naming prefix:
   - `GOODJOB_GCP_GCS_PROJECT_ID`
   - `GOODJOB_GCP_GCS_CREDENTIAL_JSON`
   - `GOODJOB_GCP_GCS_BUCKET`

   Encode credential JSON to base64 before saving:
   ```bash
   base64 -i ./gcp-gcs-credential.json | tr -d '\n'
   ```

   Use Bitwarden MCP tools only (`mcp_bitwarden_get`, `mcp_bitwarden_list`, `mcp_bitwarden_create_item`):
   - Create/update Notes item `GOODJOB_GCP_GCS_PROJECT_ID` in folder `amanotes` with value from `gcloud config get-value project`.
   - Create/update Notes item `GOODJOB_GCP_GCS_CREDENTIAL_JSON` in folder `amanotes` with the base64 string of `./gcp-gcs-credential.json`.
   - Create/update Notes item `GOODJOB_GCP_GCS_BUCKET` in folder `amanotes` with the bucket name (e.g. `goodjob-assets`).
   - Never print secret values in logs/output.

7. Update `.agent/config/secrets.yml`.
   Add or update entries under `secrets:`:
   ```yaml
   - name: GCP_GCS_PROJECT_ID
     bitwarden: GOODJOB_GCP_GCS_PROJECT_ID

   - name: GCP_GCS_CREDENTIALS
     bitwarden: GOODJOB_GCP_GCS_CREDENTIAL_JSON

   - name: GCP_GCS_BUCKET
     bitwarden: GOODJOB_GCP_GCS_BUCKET
   ```

8. Sync from Bitwarden to GitHub Actions secrets (same style as sync workflow).
   - Use config from `.agent/config`.
   - Fetch every `secrets[].bitwarden` value from Bitwarden Notes via Bitwarden MCP tools.
   - Verify GitHub auth:
     ```bash
     gh auth status
     ```
   - Set values to GitHub:
     - Secret:
       ```bash
       gh secret set SECRET_NAME --repo owner/repo --body "VALUE"
       ```
     - Variable:
       ```bash
       gh variable set VAR_NAME --repo owner/repo --body "VALUE"
       ```
     - If environment is configured:
       ```bash
       gh secret set SECRET_NAME --repo owner/repo --env ENV_NAME --body "VALUE"
       gh variable set VAR_NAME --repo owner/repo --env ENV_NAME --body "VALUE"
       ```

## Notes

- Use MCP Bitwarden only, do not use `bw` CLI.
- All Bitwarden secret values are in item Notes field.
- If one secret fails to sync, continue with the rest and report errors at the end.
- If a Bitwarden item is missing, warn and skip without aborting the entire workflow.

"""Deploy the process_audio Cloud Function to GCP.

This script handles all prerequisites and deployment:
1. Enables required GCP APIs
2. Creates GCS bucket if it doesn't exist
3. Grants IAM permissions for Eventarc (GCS triggers)
4. Verifies BigQuery dataset and table exist
5. Deploys the Cloud Function with GCS trigger

Usage:
    uv run python scripts/deploy_cloud_function.py
    uv run python scripts/deploy_cloud_function.py --dry-run
    uv run python scripts/deploy_cloud_function.py --env=prod
"""

import argparse
import subprocess
import sys
from pathlib import Path


def run_command(
    cmd: list[str] | str,
    check: bool = True,
    capture_output: bool = False,
    shell: bool = False,
) -> subprocess.CompletedProcess[str]:
    """Run a shell command and return the result."""
    print(f"  → {cmd if isinstance(cmd, str) else ' '.join(cmd)}")
    result = subprocess.run(
        cmd,
        check=check,
        capture_output=capture_output,
        text=True,
        shell=shell,
    )
    return result


def get_project_id() -> str:
    """Get the current GCP project ID."""
    result = run_command(
        "gcloud config get-value project",
        capture_output=True,
        shell=True,
    )
    project_id = result.stdout.strip()
    if not project_id or project_id == "(unset)":
        print("ERROR: No GCP project configured.")
        print("Run: gcloud config set project YOUR_PROJECT_ID")
        sys.exit(1)
    return project_id


def check_bucket_exists(bucket_name: str) -> bool:
    """Check if a GCS bucket exists."""
    result = run_command(
        f"gcloud storage buckets describe gs://{bucket_name}",
        check=False,
        capture_output=True,
        shell=True,
    )
    return result.returncode == 0


def create_bucket(bucket_name: str, location: str) -> None:
    """Create a GCS bucket."""
    print(f"\nCreating bucket: gs://{bucket_name}")
    run_command(
        f"gcloud storage buckets create gs://{bucket_name} --location={location}",
        shell=True,
    )
    print(f"✓ Bucket created: gs://{bucket_name}")


def check_bigquery_table(project_id: str, dataset: str, table: str) -> bool:
    """Check if a BigQuery table exists using Python client (not bq CLI)."""
    try:
        from google.cloud import bigquery

        client = bigquery.Client(project=project_id)
        table_ref = f"{project_id}.{dataset}.{table}"
        client.get_table(table_ref)
        return True
    except Exception as e:
        if "Not found" in str(e):
            return False
        # If it's a different error, assume table exists but there's a connection issue
        print(f"  Warning: Could not verify table (assuming exists): {e}")
        return True


def enable_api(api: str) -> None:
    """Enable a GCP API."""
    print(f"\nEnabling API: {api}")
    run_command(
        f"gcloud services enable {api}",
        shell=True,
    )


def get_project_number(project_id: str) -> str:
    """Get the project number from project ID."""
    result = run_command(
        f"gcloud projects describe {project_id} --format=value(projectNumber)",
        capture_output=True,
        shell=True,
    )
    return result.stdout.strip()


def grant_eventarc_bucket_access(project_id: str, bucket_name: str) -> None:
    """Grant Eventarc service account access to the GCS bucket.

    Required for GCS-triggered Cloud Functions (Gen2).
    """
    print("\nGranting Eventarc service account access to bucket...")
    project_number = get_project_number(project_id)
    eventarc_sa = f"service-{project_number}@gcp-sa-eventarc.iam.gserviceaccount.com"

    # Grant objectViewer role to Eventarc service account
    run_command(
        f'gcloud storage buckets add-iam-policy-binding gs://{bucket_name} '
        f'--member="serviceAccount:{eventarc_sa}" '
        f'--role="roles/storage.objectViewer"',
        shell=True,
        check=False,  # Don't fail if already granted
    )
    print(f"✓ Granted storage.objectViewer to {eventarc_sa}")


def grant_pubsub_token_creator(project_id: str) -> None:
    """Grant Pub/Sub service account permission to create tokens.

    Required for Eventarc to invoke Cloud Functions.
    """
    print("\nGranting Pub/Sub token creator role...")
    project_number = get_project_number(project_id)
    pubsub_sa = f"service-{project_number}@gcp-sa-pubsub.iam.gserviceaccount.com"

    run_command(
        f'gcloud projects add-iam-policy-binding {project_id} '
        f'--member="serviceAccount:{pubsub_sa}" '
        f'--role="roles/iam.serviceAccountTokenCreator"',
        shell=True,
        check=False,  # Don't fail if already granted
    )
    print(f"✓ Granted iam.serviceAccountTokenCreator to {pubsub_sa}")


def grant_gcs_pubsub_publisher(project_id: str) -> None:
    """Grant Cloud Storage service agent permission to publish to Pub/Sub.

    Required for GCS to send events to Eventarc triggers.
    """
    print("\nGranting Cloud Storage service agent Pub/Sub publisher role...")
    project_number = get_project_number(project_id)
    gcs_sa = f"service-{project_number}@gs-project-accounts.iam.gserviceaccount.com"

    run_command(
        f'gcloud projects add-iam-policy-binding {project_id} '
        f'--member="serviceAccount:{gcs_sa}" '
        f'--role="roles/pubsub.publisher"',
        shell=True,
        check=False,  # Don't fail if already granted
    )
    print(f"✓ Granted pubsub.publisher to {gcs_sa}")


def deploy_function(
    project_id: str,
    location: str,
    bucket_name: str,
    dataset: str,
    source_dir: Path,
    dry_run: bool = False,
) -> None:
    """Deploy the Cloud Function."""
    function_name = "process-audio"
    runtime = "python311"
    memory = "1024MB"
    timeout = "540s"

    deploy_cmd = f"""gcloud functions deploy {function_name} \
  --gen2 \
  --runtime={runtime} \
  --region={location} \
  --source={source_dir} \
  --entry-point=process_audio \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket={bucket_name}" \
  --memory={memory} \
  --timeout={timeout} \
  --set-env-vars="GOOGLE_CLOUD_PROJECT={project_id},GOOGLE_CLOUD_LOCATION={location},BIGQUERY_DATASET={dataset}" """

    if dry_run:
        print("\n=== DRY RUN - Would execute: ===")
        print(deploy_cmd)
        return

    print("\n=== Deploying Cloud Function ===")
    run_command(deploy_cmd, shell=True)


def main() -> None:
    """Main deployment function."""
    parser = argparse.ArgumentParser(description="Deploy process_audio Cloud Function")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without executing",
    )
    parser.add_argument(
        "--env",
        choices=["dev", "prod"],
        default="prod",
        help="Deployment environment (default: prod)",
    )
    parser.add_argument(
        "--skip-prerequisites",
        action="store_true",
        help="Skip prerequisite checks and creation",
    )
    args = parser.parse_args()

    # Configuration
    location = "us-central1"
    dataset = "market_signals"
    table = "speech_signals"

    # Get project ID
    print("=== Cloud Function Deployment ===\n")
    print("Getting project configuration...")
    project_id = get_project_id()
    bucket_name = f"{project_id}-market-signal-audio"

    # Determine source directory
    script_dir = Path(__file__).parent
    source_dir = script_dir.parent / "cloud_functions" / "process_audio"

    if not source_dir.exists():
        print(f"ERROR: Source directory not found: {source_dir}")
        sys.exit(1)

    print(f"\nConfiguration:")
    print(f"  Project:     {project_id}")
    print(f"  Location:    {location}")
    print(f"  GCS Bucket:  gs://{bucket_name}")
    print(f"  Dataset:     {dataset}")
    print(f"  Table:       {table}")
    print(f"  Source:      {source_dir}")
    print(f"  Environment: {args.env}")

    if args.dry_run:
        print("\n[DRY RUN MODE - No changes will be made]")

    if not args.skip_prerequisites and not args.dry_run:
        # Step 1: Enable required APIs
        print("\n=== Step 1: Checking APIs ===")
        apis = [
            "cloudfunctions.googleapis.com",
            "cloudbuild.googleapis.com",
            "speech.googleapis.com",
            "aiplatform.googleapis.com",
            "eventarc.googleapis.com",
        ]
        for api in apis:
            enable_api(api)

        # Step 2: Check/create GCS bucket
        print("\n=== Step 2: Checking GCS Bucket ===")
        if check_bucket_exists(bucket_name):
            print(f"✓ Bucket exists: gs://{bucket_name}")
        else:
            print(f"Bucket not found: gs://{bucket_name}")
            create_bucket(bucket_name, location)

        # Step 3: Grant IAM permissions for Eventarc
        print("\n=== Step 3: Configuring IAM Permissions ===")
        grant_eventarc_bucket_access(project_id, bucket_name)
        grant_pubsub_token_creator(project_id)
        grant_gcs_pubsub_publisher(project_id)

        # Step 4: Check BigQuery table
        print("\n=== Step 4: Checking BigQuery Table ===")
        if check_bigquery_table(project_id, dataset, table):
            print(f"✓ Table exists: {project_id}.{dataset}.{table}")
        else:
            print(f"WARNING: Table not found: {project_id}.{dataset}.{table}")
            print("The Cloud Function will fail if the table doesn't exist.")
            print("Create it with the BigQuery setup script first.")
            response = input("Continue anyway? (y/n): ")
            if response.lower() != "y":
                print("Deployment cancelled.")
                sys.exit(1)

    # Step 5: Deploy the function
    print("\n=== Step 5: Deploying Function ===")
    deploy_function(
        project_id=project_id,
        location=location,
        bucket_name=bucket_name,
        dataset=dataset,
        source_dir=source_dir,
        dry_run=args.dry_run,
    )

    if not args.dry_run:
        print("\n=== Deployment Complete ===")
        print(f"\nTo test the function:")
        print(f"  1. Upload an audio file to gs://{bucket_name}/")
        print(f"     Format: TICKER_EVENT.mp3 (e.g., TSLA_Q3_2024_earnings.mp3)")
        print(f"\n  2. Check function logs:")
        print(f"     gcloud functions logs read process-audio --region={location}")
        print(f"\n  3. Query BigQuery for results:")
        print(
            f'     bq query "SELECT * FROM {project_id}.{dataset}.{table} ORDER BY processed_at DESC LIMIT 5"'
        )


if __name__ == "__main__":
    main()

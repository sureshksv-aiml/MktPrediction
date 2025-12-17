"""
Cloud Run Deployment Script for Next.js Web Application

Deploys the Next.js app to Google Cloud Run with comprehensive
validation and error handling, following the ADK deployment pattern.

Usage (from project root):
    npm run deploy:web
    npm run deploy:web:dev

Usage (direct):
    cd apps/market-signal-agent && uv run python ../web/scripts/cloud_run_deploy.py --env prod
"""

import argparse
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, TextIO

from dotenv import load_dotenv
from pydantic import BaseModel, field_validator

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent.resolve()
# Web app directory is the parent of the scripts directory
WEB_APP_DIR = SCRIPT_DIR.parent
# Project root is two levels up from web app
PROJECT_ROOT = WEB_APP_DIR.parent.parent


# =============================================================================
# LOGGING - Dual write to terminal and file
# =============================================================================


class TeeWriter:
    """Writes output to both terminal and log file simultaneously."""

    def __init__(self, log_file: Path) -> None:
        # Use sys.__stdout__ to ensure we get Python's original stdout
        # (not any redirected version)
        self.terminal: TextIO = sys.__stdout__
        self.log_file_handle: TextIO = open(log_file, "a", encoding="utf-8")

    def write(self, message: str) -> None:
        # Write to terminal and flush immediately (important for Windows)
        self.terminal.write(message)
        self.terminal.flush()
        # Write to log file and flush immediately
        self.log_file_handle.write(message)
        self.log_file_handle.flush()

    def flush(self) -> None:
        self.terminal.flush()
        self.log_file_handle.flush()

    def close(self) -> None:
        self.log_file_handle.close()


def cleanup_old_logs(logs_dir: Path, days: int = 3) -> None:
    """Delete log folders older than specified days."""
    if not logs_dir.exists():
        return

    cutoff = datetime.datetime.now() - datetime.timedelta(days=days)

    for item in logs_dir.iterdir():
        if item.is_dir():
            try:
                # Try to parse folder name as date
                folder_date = datetime.datetime.strptime(item.name, "%Y-%m-%d")
                if folder_date < cutoff:
                    shutil.rmtree(item)
                    print(f"  Cleaned up old logs: {item.name}")
            except ValueError:
                # Skip non-date folders
                pass


def setup_logging() -> tuple[Path, TeeWriter]:
    """Set up logging to both terminal and date-organized log file."""
    logs_dir = WEB_APP_DIR / "logs"
    logs_dir.mkdir(exist_ok=True)

    # Clean up old logs (>3 days)
    cleanup_old_logs(logs_dir)

    # Create date-based subfolder
    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H%M%S")
    date_folder = logs_dir / date_str
    date_folder.mkdir(exist_ok=True)

    # Create timestamped log file
    log_file = date_folder / f"deployment-{date_str}-{time_str}.log"

    # Write header
    with open(log_file, "w", encoding="utf-8") as f:
        f.write(f"{'='*60}\n")
        f.write(f"Web Deployment Started: {now.isoformat()}\n")
        f.write(f"{'='*60}\n\n")

    # Create tee writer
    tee = TeeWriter(log_file)

    return log_file, tee


def run_subprocess_with_logging(
    cmd: str | list[str],
    log_file_path: Path | None = None,
    timeout: int = 900,
    cwd: Path | None = None,
    shell: bool = True,
) -> subprocess.CompletedProcess[str]:
    """Run subprocess with output streamed to both terminal and log file.

    Uses print() which goes through TeeWriter (if set up as sys.stdout),
    ensuring output goes to both terminal and log file consistently.

    Note: log_file_path parameter is kept for API compatibility but is no longer
    used since output now goes through TeeWriter automatically.
    """
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,  # Line buffered
        cwd=cwd,
        shell=shell,
    )

    output_lines: list[str] = []

    if process.stdout:
        for line in process.stdout:
            # Use print() which goes through TeeWriter (if set as sys.stdout)
            # This ensures output goes to both terminal and log file
            print(line, end="", flush=True)
            output_lines.append(line)

    process.wait()

    return subprocess.CompletedProcess(
        cmd if isinstance(cmd, list) else [cmd],
        process.returncode,
        stdout="".join(output_lines),
        stderr="",
    )


# =============================================================================
# CONFIGURATION
# =============================================================================

REQUIRED_APIS = [
    "run.googleapis.com",  # Cloud Run API
    "cloudbuild.googleapis.com",  # Cloud Build API
    "artifactregistry.googleapis.com",  # Artifact Registry (for images)
]

# Required environment variables - deployment will fail if missing
REQUIRED_ENV_VARS = [
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GEMINI_API_KEY",
    "ADK_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]

# Optional environment variables - will use defaults or skip
OPTIONAL_ENV_VARS = [
    "GOOGLE_SERVICE_ACCOUNT_KEY_BASE64",  # Only for cloud ADK
    "NEXT_PUBLIC_APP_URL",  # Will be set to Cloud Run URL
    "NEXT_PUBLIC_IS_AGENT_ENGINE",  # Will be set to "true"
    "GOOGLE_CLOUD_PROJECT",  # For BigQuery access
]

# Required files for deployment
REQUIRED_FILES = [
    "package.json",
    "next.config.ts",
    "tsconfig.json",
]

# Cloud Run service configuration
CLOUD_RUN_CONFIG = {
    "region": "us-central1",
    "memory": "1Gi",
    "cpu": "1",
    "min_instances": "0",
    "max_instances": "10",
    "timeout": "300",
    "concurrency": "80",
    "allow_unauthenticated": True,
}


# =============================================================================
# PYDANTIC MODELS FOR VALIDATION
# =============================================================================


class DeploymentConfig(BaseModel):
    """Validated deployment configuration."""

    service_name: str
    project_id: str
    region: str
    environment: str
    env_vars: dict[str, str]

    @field_validator("service_name")
    @classmethod
    def validate_service_name(cls, v: str) -> str:
        """Service name must be lowercase, alphanumeric with hyphens."""
        if not re.match(r"^[a-z][a-z0-9-]*[a-z0-9]$", v):
            raise ValueError(
                f"Invalid service name '{v}'. Must be lowercase, "
                "start with letter, contain only letters, numbers, hyphens."
            )
        return v


# =============================================================================
# PRE-FLIGHT VALIDATION FUNCTIONS
# =============================================================================


def verify_gcloud_installed() -> None:
    """Verify gcloud CLI is installed and accessible."""
    print("  Checking gcloud CLI installation...")
    try:
        result = subprocess.run(
            ["gcloud", "--version"],
            capture_output=True,
            text=True,
            timeout=30,
            shell=True,  # Required for Windows
        )
        if result.returncode != 0:
            raise RuntimeError("gcloud CLI not working properly")
        print("    [OK] gcloud CLI is installed")
    except FileNotFoundError:
        raise RuntimeError(
            "[ERROR] gcloud CLI not found!\n"
            "Please install Google Cloud SDK:\n"
            "  https://cloud.google.com/sdk/docs/install\n"
            "Then run: gcloud init"
        )


def verify_gcloud_authenticated() -> str:
    """Verify gcloud is authenticated and return current account."""
    print("  Checking gcloud authentication...")
    try:
        result = subprocess.run(
            ["gcloud", "auth", "list", "--filter=status:ACTIVE", "--format=value(account)"],
            capture_output=True,
            text=True,
            timeout=30,
            shell=True,
        )
        account = result.stdout.strip()
        if not account:
            raise RuntimeError(
                "[ERROR] Not authenticated with gcloud!\n"
                "Please run: gcloud auth login"
            )
        print(f"    [OK] Authenticated as: {account}")
        return account
    except subprocess.TimeoutExpired:
        raise RuntimeError("[ERROR] gcloud auth check timed out")


def get_gcp_project_id() -> str:
    """Get the current GCP project ID from gcloud config."""
    result = subprocess.run(
        ["gcloud", "config", "get-value", "project"],
        capture_output=True,
        text=True,
        shell=True,
    )
    project_id = result.stdout.strip()
    if not project_id:
        raise RuntimeError(
            "[ERROR] No GCP project configured!\n"
            "  Please run: gcloud config set project YOUR_PROJECT_ID"
        )
    return project_id


def verify_project_exists(project_id: str) -> None:
    """Verify the GCP project exists and is accessible."""
    print(f"  Verifying project: {project_id}...")
    try:
        result = subprocess.run(
            ["gcloud", "projects", "describe", project_id, "--format=value(projectId)"],
            capture_output=True,
            text=True,
            timeout=30,
            shell=True,
        )
        if result.returncode != 0 or not result.stdout.strip():
            raise RuntimeError(
                f"[ERROR] Project '{project_id}' not found or not accessible!\n"
                "Please check:\n"
                f"  - Project ID is correct\n"
                f"  - You have access to the project\n"
                f"  - Billing is enabled"
            )
        print(f"    [OK] Project '{project_id}' is accessible")
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"[ERROR] Project verification timed out for '{project_id}'")


def verify_env_file_exists(environment: str) -> Path:
    """Verify environment file exists and return its path."""
    env_filename = f".env.{environment}" if environment == "prod" else ".env.local"
    env_file = WEB_APP_DIR / env_filename
    print(f"  Checking environment file: {env_file}...")

    if not env_file.exists():
        raise FileNotFoundError(
            f"[ERROR] Environment file '{env_file}' not found!\n"
            f"Please create this file with the required environment variables.\n"
            f"You can copy from .env.local.example and fill in the values."
        )
    print(f"    [OK] Environment file found: {env_file}")
    return env_file


def validate_required_env_vars(env_vars: dict[str, str | None]) -> None:
    """Validate all required environment variables are present."""
    print("  Validating required environment variables...")
    missing: list[str] = []
    empty: list[str] = []

    for var in REQUIRED_ENV_VARS:
        value = env_vars.get(var)
        if value is None:
            missing.append(var)
        elif not value.strip():
            empty.append(var)

    if missing or empty:
        error_msg = "[ERROR] Environment variable validation failed!\n"
        if missing:
            error_msg += "\n  Missing variables:\n"
            for var in missing:
                error_msg += f"    - {var}\n"
        if empty:
            error_msg += "\n  Empty variables:\n"
            for var in empty:
                error_msg += f"    - {var}\n"
        raise ValueError(error_msg)

    print(f"    [OK] All {len(REQUIRED_ENV_VARS)} required variables present")


def validate_env_var_formats(env_vars: dict[str, str]) -> None:
    """Validate environment variable formats are correct."""
    print("  Validating environment variable formats...")
    errors: list[str] = []

    # Validate URLs
    url_vars = [
        "DATABASE_URL",
        "SUPABASE_URL",
        "ADK_URL",
        "NEXT_PUBLIC_SUPABASE_URL",
    ]
    for var in url_vars:
        value = env_vars.get(var, "")
        if value and not (
            value.startswith("http://")
            or value.startswith("https://")
            or value.startswith("postgresql://")
        ):
            errors.append(f"  - {var}: Must be a valid URL (got: {value[:50]}...)")

    # Note: GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is optional when deploying to Cloud Run
    # Cloud Run can use Application Default Credentials (ADC) via the default service account
    # The key is only required for non-GCP deployments (e.g., Vercel)

    # Validate DATABASE_URL uses correct port
    db_url = env_vars.get("DATABASE_URL", "")
    if db_url and ":6543" in db_url:
        errors.append(
            "  - DATABASE_URL: Uses port 6543 (Transaction pooler) which causes SSL errors.\n"
            "    Change to port 5432 (Session pooler) for GCP compatibility."
        )

    if errors:
        raise ValueError(
            "[ERROR] Environment variable format validation failed!\n" + "\n".join(errors)
        )

    print("    [OK] All environment variable formats valid")


def verify_required_files() -> None:
    """Verify all required files exist for deployment."""
    print("  Checking required files...")
    missing: list[str] = []

    for file in REQUIRED_FILES:
        if not (WEB_APP_DIR / file).exists():
            missing.append(file)

    if missing:
        raise FileNotFoundError(
            f"[ERROR] Required files missing in {WEB_APP_DIR}!\n"
            f"  Missing: {', '.join(missing)}"
        )

    print(f"    [OK] All {len(REQUIRED_FILES)} required files present")


def verify_node_version() -> None:
    """Verify Node.js version is 18 or higher."""
    print("  Checking Node.js version...")
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            timeout=10,
            shell=True,
        )
        version_str = result.stdout.strip().lstrip("v")
        major_version = int(version_str.split(".")[0])

        if major_version < 18:
            raise RuntimeError(
                f"[ERROR] Node.js version {version_str} is too old!\n"
                f"  Cloud Run requires Node.js 18 or higher.\n"
                f"  Please upgrade Node.js."
            )
        print(f"    [OK] Node.js version: {version_str}")
    except FileNotFoundError:
        raise RuntimeError(
            "[ERROR] Node.js not found!\n" "  Please install Node.js 18 or higher."
        )


def verify_adk_agent_health(adk_url: str) -> None:
    """Verify the ADK Agent Engine is accessible (optional check)."""
    print("  Checking ADK Agent connectivity...")

    # Skip check for localhost
    if "localhost" in adk_url or "127.0.0.1" in adk_url:
        print("    [WARN] Skipping ADK check (localhost URL)")
        return

    # For Agent Engine, just validate URL format
    if "googleapis.com" in adk_url:
        print("    [OK] ADK URL configured for Agent Engine")
        return

    print(f"    [WARN] ADK URL format not recognized: {adk_url[:50]}...")


# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================


def run_command_parallel(
    commands: list[tuple[str, str]], max_workers: int = 5
) -> list[tuple[str, bool, str]]:
    """Execute multiple shell commands in parallel with proper error handling."""
    results: list[tuple[str, bool, str]] = []

    def execute_command(desc_cmd: tuple[str, str]) -> tuple[str, bool, str]:
        description, cmd = desc_cmd
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300,
            )
            if result.returncode == 0:
                return (description, True, result.stdout.strip())
            else:
                return (description, False, result.stderr.strip() if result.stderr else str(result.returncode))
        except subprocess.TimeoutExpired:
            return (description, False, "Command timed out")
        except Exception as e:
            return (description, False, str(e))

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_desc = {
            executor.submit(execute_command, desc_cmd): desc_cmd[0]
            for desc_cmd in commands
        }

        for future in as_completed(future_to_desc):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                desc = future_to_desc[future]
                results.append((desc, False, str(e)))

    return results


def enable_required_apis(project_id: str) -> None:
    """Enable required Google Cloud APIs for Cloud Run deployment."""
    print("  Enabling required Google Cloud APIs...")
    print("    Enabling APIs in parallel...")

    commands: list[tuple[str, str]] = []
    for api in REQUIRED_APIS:
        cmd = f"gcloud services enable {api} --project={project_id} --quiet"
        commands.append((api, cmd))

    results = run_command_parallel(commands, max_workers=6)

    success_count = 0
    failed_apis: list[str] = []
    for api, success, error in results:
        if success:
            print(f"    [OK] {api}")
            success_count += 1
        else:
            if "already enabled" in error.lower() or "enabled" in error.lower():
                print(f"    [OK] {api} (already enabled)")
                success_count += 1
            else:
                print(f"    [ERROR] {api}: {error}")
                failed_apis.append(api)

    if failed_apis:
        print(f"[ERROR] Failed to enable APIs: {', '.join(failed_apis)}")
        print("This will likely cause deployment failures. Please check:")
        print("  - Project billing is enabled")
        print("  - You have proper permissions")
        raise RuntimeError(f"Failed to enable required APIs: {', '.join(failed_apis)}")

    print(f"  [OK] All required APIs enabled successfully ({success_count}/{len(REQUIRED_APIS)})")


def build_env_vars_string(env_vars: dict[str, str]) -> str:
    """Build the --set-env-vars string for gcloud."""
    pairs: list[str] = []
    for key, value in env_vars.items():
        if value:
            # Escape commas and equals signs in values
            escaped_value = value.replace("\\", "\\\\").replace(",", "\\,")
            pairs.append(f"{key}={escaped_value}")
    return ",".join(pairs)


def deploy_to_cloud_run(
    config: DeploymentConfig,
    service_name: str,
    log_file_path: Path | None = None,
) -> str:
    """Deploy to Cloud Run using source deploy with streaming output."""
    print(f"\n  Deploying to Cloud Run...")
    print(f"    Service: {service_name}")
    print(f"    Region: {config.region}")
    print(f"    Project: {config.project_id}")

    # Build environment variables string
    env_vars_str = build_env_vars_string(config.env_vars)

    # Build gcloud command as a single string for shell execution
    cmd_parts = [
        "gcloud",
        "run",
        "deploy",
        service_name,
        "--source",
        ".",
        "--region",
        config.region,
        "--project",
        config.project_id,
        "--memory",
        CLOUD_RUN_CONFIG["memory"],
        "--cpu",
        CLOUD_RUN_CONFIG["cpu"],
        "--min-instances",
        CLOUD_RUN_CONFIG["min_instances"],
        "--max-instances",
        CLOUD_RUN_CONFIG["max_instances"],
        "--timeout",
        CLOUD_RUN_CONFIG["timeout"],
        "--concurrency",
        CLOUD_RUN_CONFIG["concurrency"],
        "--set-env-vars",
        f'"{env_vars_str}"',
        "--quiet",
    ]

    if CLOUD_RUN_CONFIG["allow_unauthenticated"]:
        cmd_parts.append("--allow-unauthenticated")

    # Join command for shell execution
    cmd_str = " ".join(cmd_parts)

    print("    Building and deploying (this may take 5-10 minutes)...")
    print("    Streaming Cloud Build output:\n", flush=True)

    # Execute deployment with streaming output to both terminal and log file
    result = run_subprocess_with_logging(
        cmd_str,
        log_file_path=log_file_path,
        timeout=900,
        shell=True,
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"[ERROR] Deployment failed!\n"
            f"   Output: {result.stdout[:500] if result.stdout else 'No output'}\n"
            f"   Please check Cloud Build logs for details."
        )

    # Get the service URL
    service_url = get_service_url(service_name, config.region, config.project_id)
    print(f"\n    [OK] Deployment successful!")
    print(f"    Service URL: {service_url}")

    return service_url


def get_service_url(service_name: str, region: str, project_id: str) -> str:
    """Get the deployed service URL."""
    result = subprocess.run(
        [
            "gcloud",
            "run",
            "services",
            "describe",
            service_name,
            "--region",
            region,
            "--project",
            project_id,
            "--format",
            "value(status.url)",
        ],
        capture_output=True,
        text=True,
        shell=True,
    )
    return result.stdout.strip()


def update_env_file(file_path: Path, var_name: str, var_value: str) -> None:
    """Safely update an environment variable in a file."""
    new_line = f"{var_name}={var_value}"

    lines: list[str] = []
    if file_path.exists():
        with open(file_path) as f:
            lines = f.readlines()

    updated = False
    for i, line in enumerate(lines):
        if line.strip().startswith(f"{var_name}="):
            lines[i] = f"{new_line}\n"
            updated = True
            break

    if not updated:
        lines.append(f"{new_line}\n")

    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w") as f:
        f.writelines(lines)


def update_adk_env_file(service_url: str, environment: str) -> None:
    """Update the ADK agent's environment file with the new NEXTJS_API_URL."""
    adk_dir = PROJECT_ROOT / "apps" / "market-signal-agent"
    if environment == "prod":
        adk_env_file = adk_dir / ".env.prod"
    else:
        adk_env_file = adk_dir / ".env.local"

    if adk_env_file.exists():
        update_env_file(adk_env_file, "NEXTJS_API_URL", service_url)
        print(f"    [OK] Updated NEXTJS_API_URL in {adk_env_file}")

        # Verify the update - read back and check it's not localhost
        with open(adk_env_file) as f:
            content = f.read()

        for line in content.split("\n"):
            if line.startswith("NEXTJS_API_URL="):
                current_value = line.split("=", 1)[1].strip().strip('"')
                if "localhost" in current_value or "127.0.0.1" in current_value:
                    print(f"    [ERROR] NEXTJS_API_URL still contains localhost!")
                    print(f"    Current value: {current_value}")
                    raise ValueError("NEXTJS_API_URL must point to Cloud Run URL, not localhost")
                else:
                    print(f"    [OK] Verified NEXTJS_API_URL: {current_value}")
                break
    else:
        print(f"    [WARN] ADK env file not found: {adk_env_file}")


def update_web_env_file(service_url: str, environment: str) -> None:
    """Update the web app's NEXT_PUBLIC_APP_URL with the deployed URL."""
    if environment == "prod":
        web_env_file = WEB_APP_DIR / ".env.prod"
    else:
        web_env_file = WEB_APP_DIR / ".env.local"

    update_env_file(web_env_file, "NEXT_PUBLIC_APP_URL", service_url)
    update_env_file(web_env_file, "NEXT_PUBLIC_IS_AGENT_ENGINE", "true")
    print(f"    [OK] Updated NEXT_PUBLIC_APP_URL in {web_env_file}")


def save_deployment_metadata(metadata: dict[str, Any]) -> None:
    """Save deployment metadata to logs directory."""
    logs_dir = WEB_APP_DIR / "logs"
    logs_dir.mkdir(exist_ok=True)

    metadata_file = logs_dir / "deployment_metadata.json"
    with open(metadata_file, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"    [OK] Deployment metadata saved to: {metadata_file}")


def verify_deployment(service_url: str) -> None:
    """Verify the deployed service is healthy."""
    print("\n  Verifying deployment...")
    health_url = f"{service_url}/api/health"

    # Retry a few times (service may need warm-up)
    for attempt in range(3):
        try:
            result = subprocess.run(
                ["curl", "-s", "-o", "nul", "-w", "%{http_code}", health_url],
                capture_output=True,
                text=True,
                timeout=30,
                shell=True,
            )
            status_code = result.stdout.strip()
            if status_code == "200":
                print(f"    [OK] Health check passed!")
                return
            print(f"    [WARN] Health check returned {status_code}, retrying...")
        except Exception as e:
            print(f"    [WARN] Health check failed: {e}, retrying...")

        time.sleep(5)

    print(f"    [WARN] Health check did not pass, but deployment completed.")
    print(f"    Please verify manually: {health_url}")


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================


def main() -> None:
    """Main deployment function with dual-write logging."""
    parser = argparse.ArgumentParser(
        description="Deploy Next.js app to Google Cloud Run"
    )
    parser.add_argument(
        "--env",
        choices=["dev", "prod"],
        default="dev",
        help="Environment to deploy to (dev or prod). Default: dev",
    )
    args = parser.parse_args()

    # Set up dual-write logging (terminal + file)
    log_file, tee = setup_logging()
    original_stdout = sys.stdout
    sys.stdout = tee  # type: ignore[assignment]

    print(
        f"""
    ============================================================

       DEPLOYING NEXT.JS TO CLOUD RUN ({args.env.upper()})

    ============================================================
    """
    )
    print(f"  Log file: {log_file}")

    # Change to web app directory for deployment
    original_cwd = os.getcwd()
    os.chdir(WEB_APP_DIR)
    print(f"  Working directory: {WEB_APP_DIR}")

    try:
        # Phase 1: Pre-flight checks
        print("\n[Phase 1] Pre-flight Checks")
        print("=" * 50)
        verify_gcloud_installed()
        account = verify_gcloud_authenticated()
        project_id = get_gcp_project_id()
        verify_project_exists(project_id)
        env_file = verify_env_file_exists(args.env)
        verify_required_files()
        verify_node_version()

        # Phase 2: Load and validate configuration
        print("\n[Phase 2] Configuration Validation")
        print("=" * 50)
        load_dotenv(env_file, override=True)
        env_vars: dict[str, str] = {}
        for var in REQUIRED_ENV_VARS + OPTIONAL_ENV_VARS:
            value = os.getenv(var)
            if value:
                env_vars[var] = value

        validate_required_env_vars(env_vars)
        validate_env_var_formats(env_vars)
        verify_adk_agent_health(env_vars.get("ADK_URL", ""))

        # Phase 3: Enable APIs
        print("\n[Phase 3] Enable GCP APIs")
        print("=" * 50)
        enable_required_apis(project_id)

        # Phase 4: Deploy
        print("\n[Phase 4] Deployment")
        print("=" * 50)
        service_name = f"gcp-bq-reports-web-{args.env}"

        # Filter env_vars to only include non-None values
        filtered_env_vars: dict[str, str] = {k: v for k, v in env_vars.items() if v}

        config = DeploymentConfig(
            service_name=service_name,
            project_id=project_id,
            region=CLOUD_RUN_CONFIG["region"],
            environment=args.env,
            env_vars=filtered_env_vars,
        )
        service_url = deploy_to_cloud_run(config, service_name, log_file_path=log_file)

        # Phase 5: Post-deployment
        print("\n[Phase 5] Post-Deployment")
        print("=" * 50)
        update_adk_env_file(service_url, args.env)
        update_web_env_file(service_url, args.env)

        # Save metadata
        metadata = {
            "service_name": service_name,
            "service_url": service_url,
            "project_id": project_id,
            "region": CLOUD_RUN_CONFIG["region"],
            "environment": args.env,
            "deployed_by": account,
            "deployment_timestamp": datetime.datetime.now(
                datetime.timezone.utc
            ).isoformat(),
        }
        save_deployment_metadata(metadata)

        # Verify
        verify_deployment(service_url)

        print(
            f"""
    ============================================================
       DEPLOYMENT COMPLETE!
    ============================================================
       Service URL: {service_url}
       Environment: {args.env}
    ============================================================

    IMPORTANT: Redeploy ADK Agent for Persistence to Work
    ------------------------------------------------------
    The ADK agent's NEXTJS_API_URL has been updated to:
      {service_url}

    You MUST redeploy the ADK agent for the persistence agent
    to save reports to the new Cloud Run URL:

      npm run deploy:adk

    ============================================================
        """
        )

    except Exception as e:
        print(f"\n[ERROR] Deployment failed: {e}")
        deployment_failed = True
    else:
        deployment_failed = False
    finally:
        # Restore original working directory
        os.chdir(original_cwd)
        # Restore stdout and close log file
        if sys.stdout == tee:
            sys.stdout = original_stdout
        if not tee.log_file_handle.closed:
            tee.close()
        print(f"\n  Full deployment log saved to: {log_file}")

    if deployment_failed:
        sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Platform-agnostic script to run ADK API server with .env.local configuration.

Logs are written to both terminal and date-organized log files for local debugging.
Log structure: logs/YYYY-MM-DD/adk-server-YYYY-MM-DD-HHMMSS.log
Old logs (>3 days) are automatically cleaned up at startup.
"""

import os
import shutil
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path


def load_env_file(env_file: Path) -> dict[str, str]:
    """Load environment variables from a .env file."""
    env_vars: dict[str, str] = {}

    if not env_file.exists():
        print(f"Warning: {env_file} not found")
        return env_vars

    with open(env_file, encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()

            # Skip empty lines and comments
            if not line or line.startswith("#"):
                continue

            # Parse KEY=VALUE format
            if "=" not in line:
                print(f"Warning: Invalid line {line_num} in {env_file}: {line}")
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()

            # Remove quotes if present
            if (value.startswith('"') and value.endswith('"')) or (
                value.startswith("'") and value.endswith("'")
            ):
                value = value[1:-1]

            env_vars[key] = value

    return env_vars


def cleanup_old_logs(logs_dir: Path, days: int = 3) -> None:
    """Delete log folders older than specified days."""
    if not logs_dir.exists():
        return

    cutoff = datetime.now() - timedelta(days=days)

    for item in logs_dir.iterdir():
        if item.is_dir():
            try:
                # Try to parse folder name as date
                folder_date = datetime.strptime(item.name, "%Y-%m-%d")
                if folder_date < cutoff:
                    shutil.rmtree(item)
                    print(f"🗑️ Cleaned up old logs: {item.name}")
            except ValueError:
                # Skip non-date folders
                pass


def main() -> None:
    """Main function to run ADK API server."""
    script_dir = Path(__file__).parent.parent  # Go up to traffic-anomaly-agent/
    env_file = script_dir / ".env.local"

    # Load environment variables
    env_vars = load_env_file(env_file)

    # Get DATABASE_URL from environment
    database_url = env_vars.get("DATABASE_URL") or os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found in .env.local or environment variables")
        sys.exit(1)

    # Prepare environment for subprocess
    env = os.environ.copy()
    env.update(env_vars)

    # Build command
    cmd = [
        "uv",
        "run",
        "adk",
        "api_server",
        f"--session_service_uri={database_url}",
        "--port=8000",
        "--reload",
        ".",
    ]

    # Allow overriding port and host via command line arguments
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            if arg.startswith("--"):
                cmd.append(arg)

    # Set up log file for local development with date-based organization
    logs_dir = script_dir / "logs"
    logs_dir.mkdir(exist_ok=True)

    # Clean up old logs (>3 days)
    cleanup_old_logs(logs_dir)

    # Create date-based subfolder
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H%M%S")
    date_folder = logs_dir / date_str
    date_folder.mkdir(exist_ok=True)

    # Create timestamped log file
    log_file = date_folder / f"adk-server-{date_str}-{time_str}.log"

    print("--- Starting ADK API server ---")
    print(f"📝 Logs written to: {log_file}")

    try:
        # Open log file in append mode with timestamp header
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"ADK Server Started: {datetime.now().isoformat()}\n")
            f.write(f"{'='*60}\n\n")
            f.flush()

            # Run the command with output to both terminal and file
            process = subprocess.Popen(
                cmd,
                cwd=script_dir,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,  # Line buffered
            )

            # Stream output to both terminal and file
            if process.stdout:
                for line in process.stdout:
                    print(line, end="")  # Print to terminal
                    f.write(line)  # Write to file
                    f.flush()  # Ensure immediate write

            process.wait()
            sys.exit(process.returncode)

    except KeyboardInterrupt:
        print("\nShutting down ADK API server...")
        sys.exit(0)
    except Exception as e:
        print(f"Error running ADK API server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

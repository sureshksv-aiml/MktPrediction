"""
ADK Web server with file logging

Features:
- Outputs logs to terminal AND file simultaneously
- Creates dated folders: logs/YYYY-MM-DD/
- Creates timestamped log files: YYYY-MM-DD_HH-mm-ss.log
- Auto-cleans logs older than 3 days on startup

Usage: uv run python scripts/adk_web_with_logging.py
"""

import os
import shutil
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
LOGS_DIR = PROJECT_ROOT / "logs"  # logs in apps/market-signal-agent/logs
MAX_AGE_DAYS = 3


def get_date_string() -> str:
    """Get current date string in YYYY-MM-DD format."""
    return datetime.now().strftime("%Y-%m-%d")


def get_timestamp_string() -> str:
    """Get current timestamp string in YYYY-MM-DD_HH-mm-ss format."""
    return datetime.now().strftime("%Y-%m-%d_%H-%M-%S")


def create_log_file() -> Path:
    """Create the log directory structure and return the log file path."""
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H%M%S")

    date_folder = LOGS_DIR / date_str

    # Create logs directory if it doesn't exist
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    # Create date folder if it doesn't exist
    date_folder.mkdir(parents=True, exist_ok=True)

    # Match run_adk_api.py naming: adk-web-YYYY-MM-DD-HHMMSS.log
    log_file_name = f"adk-web-{date_str}-{time_str}.log"
    log_file_path = date_folder / log_file_name

    return log_file_path


def cleanup_old_logs() -> None:
    """Clean up log folders older than MAX_AGE_DAYS."""
    if not LOGS_DIR.exists():
        return

    now = datetime.now()
    max_age = timedelta(days=MAX_AGE_DAYS)

    for entry in LOGS_DIR.iterdir():
        if not entry.is_dir():
            continue

        # Parse folder name as date (YYYY-MM-DD)
        try:
            folder_date = datetime.strptime(entry.name, "%Y-%m-%d")
        except ValueError:
            continue  # Skip if not a valid date folder

        age = now - folder_date

        if age > max_age:
            print(f"Cleaning up old logs: {entry.name}")
            shutil.rmtree(entry)


def format_log_line(data: str) -> str:
    """Format log line with timestamp."""
    timestamp = datetime.now().isoformat()
    return f"[{timestamp}] {data}"


def main() -> int:
    """Main function."""
    print("Starting ADK Web server with file logging...\n")

    # Clean up old logs first
    cleanup_old_logs()

    # Create log file
    log_file_path = create_log_file()
    print(f"Log file: {log_file_path}\n")

    # Write startup header
    header = f"""
================================================================================
  ADK Web Server Log
  Started: {datetime.now().isoformat()}
  Log file: {log_file_path}
================================================================================

"""

    with open(log_file_path, "a", encoding="utf-8") as log_file:
        log_file.write(header)
        print(header)

        # Build command
        cmd = ["uv", "run", "adk", "web"]

        # Start the process
        process = subprocess.Popen(
            cmd,
            cwd=PROJECT_ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,  # Line buffered
        )

        try:
            # Read output line by line
            if process.stdout:
                for line in process.stdout:
                    # Write to terminal
                    sys.stdout.write(line)
                    sys.stdout.flush()

                    # Write to log file
                    log_file.write(format_log_line(line))
                    log_file.flush()

            # Wait for process to complete
            return_code = process.wait()

            exit_msg = f"\n[{datetime.now().isoformat()}] Process exited with code {return_code}\n"
            print(exit_msg)
            log_file.write(exit_msg)

            return return_code

        except KeyboardInterrupt:
            shutdown_msg = (
                f"\n[{datetime.now().isoformat()}] Received interrupt, shutting down...\n"
            )
            print(shutdown_msg)
            log_file.write(shutdown_msg)
            process.terminate()
            process.wait()
            return 0


if __name__ == "__main__":
    sys.exit(main())

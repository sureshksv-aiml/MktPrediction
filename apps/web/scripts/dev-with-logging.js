/**
 * Development server with file logging
 *
 * Features:
 * - Outputs logs to terminal AND file simultaneously
 * - Creates dated folders: logs/YYYY-MM-DD/
 * - Creates timestamped log files: YYYY-MM-DD_HH-mm-ss.log
 * - Auto-cleans logs older than 3 days on startup
 *
 * Usage: npm run dev:log
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const LOGS_DIR = path.join(__dirname, "..", "logs");
const MAX_AGE_DAYS = 3;

/**
 * Get current date string in YYYY-MM-DD format
 */
function getDateString() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Get current timestamp string in YYYY-MM-DD_HH-mm-ss format
 */
function getTimestampString() {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `${date}_${time}`;
}

/**
 * Create the log directory structure and return the log file path
 */
function createLogFile() {
  const dateFolder = path.join(LOGS_DIR, getDateString());

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }

  // Create date folder if it doesn't exist
  if (!fs.existsSync(dateFolder)) {
    fs.mkdirSync(dateFolder, { recursive: true });
  }

  const logFileName = `${getTimestampString()}.log`;
  const logFilePath = path.join(dateFolder, logFileName);

  return logFilePath;
}

/**
 * Clean up log folders older than MAX_AGE_DAYS
 */
function cleanupOldLogs() {
  if (!fs.existsSync(LOGS_DIR)) {
    return;
  }

  const now = new Date();
  const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  const entries = fs.readdirSync(LOGS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // Parse folder name as date (YYYY-MM-DD)
    const folderDate = new Date(entry.name);
    if (isNaN(folderDate.getTime())) continue; // Skip if not a valid date folder

    const age = now.getTime() - folderDate.getTime();

    if (age > maxAgeMs) {
      const folderPath = path.join(LOGS_DIR, entry.name);
      console.log(`🗑️  Cleaning up old logs: ${entry.name}`);
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
  }
}

/**
 * Format log line with timestamp
 */
function formatLogLine(data) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${data}`;
}

/**
 * Main function
 */
function main() {
  console.log("🚀 Starting Next.js dev server with file logging...\n");

  // Clean up old logs first
  cleanupOldLogs();

  // Create log file
  const logFilePath = createLogFile();
  console.log(`📁 Log file: ${logFilePath}\n`);

  // Create write stream for log file
  const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

  // Write startup header
  const header = `
================================================================================
  Next.js Development Server Log
  Started: ${new Date().toISOString()}
  Log file: ${logFilePath}
================================================================================

`;
  logStream.write(header);
  console.log(header);

  // Spawn Next.js dev server
  const isWindows = process.platform === "win32";
  const npmCmd = isWindows ? "npm.cmd" : "npm";

  const child = spawn(npmCmd, ["run", "dev"], {
    cwd: path.join(__dirname, ".."),
    stdio: ["inherit", "pipe", "pipe"],
    shell: isWindows,
  });

  // Handle stdout
  child.stdout.on("data", (data) => {
    const text = data.toString();
    process.stdout.write(text);
    logStream.write(formatLogLine(text));
  });

  // Handle stderr
  child.stderr.on("data", (data) => {
    const text = data.toString();
    process.stderr.write(text);
    logStream.write(formatLogLine(`[STDERR] ${text}`));
  });

  // Handle process exit
  child.on("close", (code) => {
    const exitMsg = `\n[${new Date().toISOString()}] Process exited with code ${code}\n`;
    console.log(exitMsg);
    logStream.write(exitMsg);
    logStream.end();
    process.exit(code);
  });

  // Handle errors
  child.on("error", (err) => {
    const errorMsg = `\n[${new Date().toISOString()}] Error: ${err.message}\n`;
    console.error(errorMsg);
    logStream.write(errorMsg);
    logStream.end();
    process.exit(1);
  });

  // Handle SIGINT (Ctrl+C)
  process.on("SIGINT", () => {
    const shutdownMsg = `\n[${new Date().toISOString()}] Received SIGINT, shutting down...\n`;
    console.log(shutdownMsg);
    logStream.write(shutdownMsg);
    child.kill("SIGINT");
  });

  // Handle SIGTERM
  process.on("SIGTERM", () => {
    const shutdownMsg = `\n[${new Date().toISOString()}] Received SIGTERM, shutting down...\n`;
    console.log(shutdownMsg);
    logStream.write(shutdownMsg);
    child.kill("SIGTERM");
  });
}

main();

/**
 * BigQuery client for server-side queries
 * Uses service account authentication via base64-encoded key
 */

import { BigQuery } from "@google-cloud/bigquery";

let bigqueryClient: BigQuery | null = null;

/**
 * Get or create BigQuery client instance
 * Uses GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 for authentication
 */
export function getBigQueryClient(): BigQuery {
  if (bigqueryClient) {
    return bigqueryClient;
  }

  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;

  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT environment variable is required");
  }

  // If we have a service account key, use it
  if (keyBase64 && keyBase64 !== "UPDATE_ME" && keyBase64.length > 0) {
    try {
      const keyJson = Buffer.from(keyBase64, "base64").toString("utf-8");
      const credentials = JSON.parse(keyJson);

      bigqueryClient = new BigQuery({
        projectId,
        credentials,
      });
    } catch (error) {
      console.error("Failed to parse service account key:", error);
      // Fall back to application default credentials
      bigqueryClient = new BigQuery({ projectId });
    }
  } else {
    // Use application default credentials (for local development)
    bigqueryClient = new BigQuery({ projectId });
  }

  return bigqueryClient;
}

/**
 * Get BigQuery project and dataset from environment
 */
export function getBigQueryConfig(): { project: string; dataset: string } {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const dataset = process.env.BIGQUERY_DATASET || "market_signals";

  if (!project) {
    throw new Error("GOOGLE_CLOUD_PROJECT environment variable is required");
  }

  return { project, dataset };
}

/**
 * GET /api/volatility/debug
 * Debug endpoint to check BigQuery tables and schemas
 */

import { NextResponse } from "next/server";
import { getBigQueryClient, getBigQueryConfig } from "@/lib/bigquery/client";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const client = getBigQueryClient();
  const { project, dataset } = getBigQueryConfig();

  const results: Record<string, unknown> = {
    project,
    dataset,
    tables: [],
    schemas: {},
  };

  try {
    // List all tables in the dataset
    const listQuery = `
      SELECT table_name, table_type
      FROM \`${project}.${dataset}.INFORMATION_SCHEMA.TABLES\`
      ORDER BY table_name
    `;
    const [tables] = await client.query({ query: listQuery });
    results.tables = tables;

    // Get schema for each table
    const schemas: Record<string, unknown[]> = {};
    for (const table of tables as Array<{ table_name: string }>) {
      try {
        const schemaQuery = `
          SELECT column_name, data_type
          FROM \`${project}.${dataset}.INFORMATION_SCHEMA.COLUMNS\`
          WHERE table_name = '${table.table_name}'
          ORDER BY ordinal_position
        `;
        const [columns] = await client.query({ query: schemaQuery });
        schemas[table.table_name] = columns;
      } catch (err) {
        schemas[table.table_name] = [{ error: String(err) }];
      }
    }
    results.schemas = schemas;

    return NextResponse.json(results);
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

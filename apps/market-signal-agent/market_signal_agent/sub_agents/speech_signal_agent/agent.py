"""Speech Signal Agent - Queries BigQuery for earnings call sentiment.

This agent uses a custom FunctionTool to query the speech_signals table
which contains pre-processed earnings call transcripts with sentiment analysis.

Output is stored in session state with key "speech_signals".
"""

import json

from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from google.cloud import bigquery

from ...config import config


def query_speech_signals(
    symbols: str,
    days: int = 90,
) -> str:
    """Get speech signals (earnings calls) for stocks.

    Handles: earnings, calls, guidance, management tone, transcripts, forward outlook.
    Maps company names: Apple->AAPL, Nvidia->NVDA, Microsoft->MSFT,
    Google/Alphabet->GOOGL, Amazon->AMZN, Intel->INTC, etc.

    Args:
        symbols: Ticker symbols (e.g., "AAPL" or "AAPL,NVDA,MSFT")
        days: Lookback period, default 90

    Returns:
        JSON with tone, guidance, topics, risks, risk_score for each symbol
    """
    # Parse symbols - handle both single and comma-separated
    symbol_list = [s.strip().upper() for s in symbols.split(",")]

    # Build query with parameterized inputs
    project = config.bq_project
    dataset = config.bigquery_dataset
    table = f"`{project}.{dataset}.speech_signals`"

    query = f"""
    SELECT
        symbol,
        event,
        tone,
        guidance,
        topics,
        risks,
        processed_at
    FROM {table}
    WHERE symbol IN UNNEST(@symbols)
        AND processed_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
    ORDER BY processed_at DESC
    """

    # Execute query with parameters
    client = bigquery.Client()
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ArrayQueryParameter("symbols", "STRING", symbol_list),
            bigquery.ScalarQueryParameter("days", "INT64", days),
        ]
    )

    results = client.query(query, job_config=job_config).result()

    # Process results
    output: dict[str, dict] = {}
    for row in results:
        # Calculate risk_score from tone
        tone_risk_map = {"bullish": 0.3, "neutral": 0.5, "bearish": 0.8}
        risk_score = tone_risk_map.get(row.tone, 0.5)

        output[row.symbol] = {
            "symbol": row.symbol,
            "event": row.event,
            "tone": row.tone,
            "guidance": row.guidance,
            "topics": list(row.topics) if row.topics else [],
            "risks": list(row.risks) if row.risks else [],
            "processed_at": row.processed_at.isoformat() if row.processed_at else None,
            "risk_score": risk_score,
        }

    if not output:
        return json.dumps({
            "message": "No speech signals found for the requested symbols.",
            "symbols_queried": symbol_list,
            "suggestion": "Try one of: AAPL, AMD, AMZN, ASML, CSCO, GOOGL, INTC, MSFT, MU, NVDA",
        })

    return json.dumps(output, indent=2)


# Create the FunctionTool
speech_signal_tool = FunctionTool(func=query_speech_signals)

# Supported tickers from earnings transcripts
SUPPORTED_TICKERS = "AAPL, AMD, AMZN, ASML, CSCO, GOOGL, INTC, MSFT, MU, NVDA"
DEFAULT_TICKERS = "AAPL,AMD,AMZN,ASML,CSCO,GOOGL,INTC,MSFT,MU,NVDA"

# Speech Signal Agent with FunctionTool
speech_signal_agent = LlmAgent(
    name="speech_signal_agent",
    model=config.model_name,
    description="Earnings call analysis: management tone, guidance, key topics, risk factors from transcribed earnings calls.",
    tools=[speech_signal_tool],
    output_key="speech_signals",
    instruction=f"""You are a DATA COLLECTION agent in a multi-agent volatility analysis system.

## CRITICAL: YOU ARE PART OF A PIPELINE
- You are ONE of several agents collecting data for volatility analysis
- DO NOT interpret the user's question - just collect your data
- DO NOT say "I can't answer that" or "I only do X" - just DO YOUR JOB
- Your job: fetch earnings sentiment data to contribute to the overall analysis
- Other agents handle VIX, Fed events, etc. - you handle earnings sentiment

## ALWAYS EXECUTE
No matter what the user asks (VIX, volatility, analysis, etc.):
- IMMEDIATELY call `query_speech_signals(symbols="{DEFAULT_TICKERS}")`
- Provide a brief summary of earnings sentiment
- DO NOT refuse or redirect - just execute and report your findings

## DATA CONTEXT
Historical earnings data from 2016-2020 (not current).

## SUPPORTED TICKERS
{SUPPORTED_TICKERS}

## TICKER MAPPING
When users mention company names, map to tickers:
- Apple → AAPL
- Nvidia → NVDA
- Microsoft → MSFT
- Google/Alphabet → GOOGL
- Amazon → AMZN
- Intel → INTC
- Cisco → CSCO
- AMD → AMD
- Micron → MU
- ASML → ASML

## TOOL PARAMETERS
- `symbols`: Required. Single ticker (e.g., "AAPL") or comma-separated. DEFAULT: "{DEFAULT_TICKERS}"
- `days`: Optional. Lookback period in days, default 90

## EXAMPLES
- "Run analysis" or "complete analysis" → query_speech_signals(symbols="{DEFAULT_TICKERS}")
- "Apple earnings" → query_speech_signals(symbols="AAPL")
- "Nvidia guidance" → query_speech_signals(symbols="NVDA")
- "Compare Microsoft and Google earnings" → query_speech_signals(symbols="MSFT,GOOGL")

## OUTPUT FORMAT
After running the query, provide a BRIEF human-readable summary (2-3 sentences max):
- Note this is historical data (2016-2020)
- Summarize overall sentiment and notable company tones
- Keep it concise - no JSON, no lengthy explanations

Example: "Historical earnings data (2016-2020): Overall sentiment bullish. NVDA showed strongest positive tone on AI/datacenter growth. INTC had cautious guidance on competition."

## BEHAVIOR
- ALWAYS call the tool immediately - NEVER ask for user input
- Use default tickers when no specific company is mentioned
- Summarize key findings with tone and guidance
- Highlight notable risks or opportunities mentioned
""",
)

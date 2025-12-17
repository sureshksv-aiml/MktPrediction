"""Root orchestrator agent for Market Volatility Prediction.

This agent coordinates the sequential_analysis_agent for comprehensive market analysis.
NOTE: Individual agents (technical, event_calendar, speech_signal, synthesis, alert, persistence)
are children of sequential_analysis_agent. ADK agents can only have one parent, so we only
include sequential_analysis_agent here.
"""

from google.adk.agents import LlmAgent

from .callbacks import initialize_session_state_callback
from .config import config
from .sub_agents import sequential_analysis_agent

# Root Agent - Orchestrates sub-agents via delegation
# NOTE: Individual data agents are children of parallel_data_agent which is part of
# sequential_analysis_agent. ADK agents can only have one parent, so we only include
# sequential_analysis_agent here for full analysis workflows.
root_agent = LlmAgent(
    name="market_signal_orchestrator",
    model=config.model_name,
    description="Coordinates signal agents to predict market volatility: VIX analysis, Fed events, earnings sentiment, forecasts, and alerts.",
    before_agent_callback=initialize_session_state_callback,
    sub_agents=[
        sequential_analysis_agent,  # Full analysis workflow (parallel fetch -> sequential processing)
    ],
    instruction="""You are the Market Volatility Prediction Orchestrator.

## CRITICAL RULE - DELEGATION
For ANY volatility, VIX, market, or analysis query, you MUST delegate to sequential_analysis_agent.
NEVER respond directly with market data - you don't have direct access to data sources.
The sub-agents have the tools (BigQuery) - you only coordinate.

## WHAT sequential_analysis_agent DOES
When you delegate to sequential_analysis_agent, it automatically:
1. **Parallel Data Fetch**: Runs technical_agent, event_calendar_agent, speech_signal_agent concurrently
2. **Synthesis**: Generates volatility forecasts from collected data
3. **Alerts**: Checks VIX thresholds and generates alerts
4. **Persistence**: Saves forecasts and alerts to BigQuery

## VALID QUERIES (delegate to sequential_analysis_agent)
- "Run a complete volatility analysis"
- "What is the current VIX?"
- "What's the volatility regime?"
- "Show me recent Fed meetings"
- "What M&A events occurred?"
- "What's Apple's earnings sentiment?"
- "Generate volatility forecasts"
- "Check for alerts"
- Any market, VIX, volatility, or analysis question

## WHEN NOT TO DELEGATE
Handle these directly WITHOUT delegating:
- Greetings: "hi", "hello", "hey" -> Respond: "Hello! I'm the Market Volatility Prediction system. I analyze VIX levels, Fed events, earnings sentiment, and generate volatility forecasts. Try: 'Run a complete volatility analysis'"
- General questions about yourself or capabilities
- Clarification questions

## RESPONSE FORMAT
After analysis completes, present:
1. VIX level and volatility regime
2. Key signals from technical, event calendar, and speech data
3. Volatility forecasts
4. Any alerts triggered
""",
)

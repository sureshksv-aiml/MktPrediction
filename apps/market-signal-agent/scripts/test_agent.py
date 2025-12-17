"""Test Market Signal Agent."""

import asyncio
import os
from pathlib import Path

# Load environment variables BEFORE importing the agent
from dotenv import load_dotenv

# Load .env.local from parent directory
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

from google.adk.runners import InMemoryRunner
from google.genai import types

from market_signal_agent.agent import root_agent


async def test_root_agent() -> None:
    """Run test queries against the root agent."""
    runner = InMemoryRunner(agent=root_agent)

    # Test 1: Simple greeting (should not cause placeholder errors)
    print("=" * 60)
    print("Test 1: Simple greeting")
    print("=" * 60)

    # Create a session first
    user_id = "test_user"
    session = await runner.session_service.create_session(
        app_name=runner.app_name,
        user_id=user_id,
    )

    new_message = types.Content(
        role="user",
        parts=[types.Part(text="hi")]
    )

    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=new_message,
    ):
        if hasattr(event, "content") and event.content:
            print(event.content)

    # Test 2: Check session state was initialized
    print("\n" + "=" * 60)
    print("Test 2: Session State Check")
    print("=" * 60)

    # Get updated session
    session = await runner.session_service.get_session(
        app_name=runner.app_name,
        user_id=user_id,
        session_id=session.id,
    )

    if session:
        # Check if callback initialized the state
        technical_signals = session.state.get("technical_signals", "Not set")
        event_calendar = session.state.get("event_calendar", "Not set")
        speech_signals = session.state.get("speech_signals", "Not set")
        volatility_forecasts = session.state.get("volatility_forecasts", "Not set")
        alerts = session.state.get("alerts", "Not set")

        print(f"technical_signals: {technical_signals}")
        print(f"event_calendar: {event_calendar}")
        print(f"speech_signals: {speech_signals}")
        print(f"volatility_forecasts: {volatility_forecasts}")
        print(f"alerts: {alerts}")
    else:
        print("No session available")

    print("\n" + "=" * 60)
    print("Test 3: Full Volatility Analysis (SequentialAgent)")
    print("=" * 60)

    # Create a new session for the full analysis
    session2 = await runner.session_service.create_session(
        app_name=runner.app_name,
        user_id=user_id,
    )

    analysis_message = types.Content(
        role="user",
        parts=[types.Part(text="Run a complete volatility analysis")]
    )

    # The sequential_analysis_agent should run all agents automatically
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session2.id,
        new_message=analysis_message,
    ):
        if hasattr(event, "content") and event.content:
            print(event.content)

    # Check final session state after workflow
    print("\n" + "=" * 60)
    print("Final Session State Check")
    print("=" * 60)

    session2 = await runner.session_service.get_session(
        app_name=runner.app_name,
        user_id=user_id,
        session_id=session2.id,
    )

    if session2:
        for key in ["technical_signals", "event_calendar", "speech_signals", "volatility_forecasts", "alerts"]:
            value = session2.state.get(key, "Not set")
            status = value.get("status", "unknown") if isinstance(value, dict) else "N/A"
            print(f"{key}: status={status}")

    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_root_agent())

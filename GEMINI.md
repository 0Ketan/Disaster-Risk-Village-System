# API Resilience & Graceful Degradation Rules

Whenever implementing external API calls in this full-stack application, you must adhere to strict resilience and graceful degradation patterns.

## External API Requirements

1. **Timeouts**: Every external API call must have an explicit timeout (e.g., 8 seconds).
2. **Retries**: Implement exactly one retry on initial failure before giving up.
3. **Graceful Fallback**: If the API fails completely after the retry, catch the exception and fall back to hardcoded mock data or cached data. NEVER allow an API failure to crash the UI or the backend process.
4. **Data Provenance**: Attach a flag (e.g., `_source: "live" | "fallback"`) to the returned data payload so the client knows the data's origin.
5. **UI Indicators**: The frontend must visually indicate when fallback data is being used by inspecting the provenance flag and displaying a warning badge (e.g., "⚠ Using cached data").

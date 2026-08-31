# Project: VillageShield - Weather Service Resilience & Error Diagnostics

## Architecture
- **Backend**: FastAPI app (`backend/app.py`, `backend/main.py`), Modular Routers (`backend/api/endpoints.py`, `backend/api/sync.py`, `backend/api/health.py`).
- **Services & Engines**:
  - `backend/services/weather_service.py`: Live weather data fetching (`fetch_live_weather(villages)`, `fetch_live_weather_with_metadata(villages)`), explicit error checks (429 rate limits, 401/403 auth errors, 5xx server errors, timeouts, JSON errors), diagnostic status/body logging.
  - `backend/engines/risk_engine.py`: Baseline risk calculation and dynamic risk recalculation (`calculate_risk_score(village, live_precipitation)`).
  - `backend/engines/dynamic_risk_engine.py`: In-memory dynamic state caching, provenance tracking, fallback handling.
- **Frontend**: React 18 + Vite 5 SPA (`frontend/src/App.jsx`), Tailwind CSS, Leaflet (`MapView.jsx`), Lucide icons, Axios API clients (`src/api/client.js`, `src/api/villages.js`), non-blocking toast notifications.
- **Testing**: `pytest` for backend units, resilience, and integration tests; node/vite scripts for frontend.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Open-Meteo Live Weather Fetching | `backend/services/weather_service.py` provides `fetch_live_weather(villages)` with 3-second timeout and graceful 0.0/annual fallback | M1 | ORIGINAL_REQUEST 2026-08-30T01:57:30Z R1 |
| F2 | Dynamic Risk Score Recalculation | `backend/engines/risk_engine.py` modifies `calculate_risk_score` to accept live precipitation, compute dynamic risk `base + (precip * 2.0)` capped at 100, and update risk level/priority | M1 | ORIGINAL_REQUEST 2026-08-30T01:57:30Z R2 |
| F3 | Backend `/api/refresh` Endpoint | `backend/app.py` / `sync.py` exposes `POST /api/refresh` and `GET /api/refresh`, recalculates dynamic risk, updates `LAST_UPDATED_TIME` & state, returns `VillageListResponse` | M2 | ORIGINAL_REQUEST 2026-08-30T01:57:30Z R3 |
| F4 | Boot CSV Integrity & Fallback Guardrails | Retain static CSV loading on boot without network calls; handle external API outages with HTTP 200 fallback data | M2 | ORIGINAL_REQUEST 2026-08-30T01:57:30Z R5 |
| F5 | Frontend State & Refresh Button Wiring | React frontend with `isRefreshing` state, `lastUpdated` timestamp, "Refresh Data" button with spinner in Navbar and Dashboard | M3 | ORIGINAL_REQUEST 2026-08-30T01:57:30Z R4 |
| F6 | Frontend Toast Notification on Error | Catch refresh errors and display toast `"Weather API unavailable. Showing cached data."` without crashing | M3 | ORIGINAL_REQUEST 2026-08-30T01:57:30Z R4, AC |
| F7 | Leaflet Map & Red Zone List Re-render | Dynamic re-rendering of Leaflet map markers, sidebar list, and dashboard tables with updated Red Zone data on refresh | M3 | ORIGINAL_REQUEST 2026-08-30T01:57:30Z R4 |
| F8 | E2E Test Suite (Tiers 1-4) & Adversarial Hardening | Comprehensive test suite covering all features, boundary cases, combinations, real-world scenarios, and adversarial tests | M-E2E & M4 | ORIGINAL_REQUEST 2026-08-30T01:57:30Z AC |
| F9 | Weather API Diagnostic Error Logging | `backend/services/weather_service.py` logs exact HTTP status code and response body on 429, 401/403, 5xx errors, timeouts, and JSON errors via Python logger | M5 | ORIGINAL_REQUEST 2026-08-30T03:41:50Z R1 |
| F10 | Fallback Source Provenance & Data Contract | Return `"fallback_cache"` provenance source tag on failure without crashing, correctly distinguishing live 0.0mm from outage fallback | M5 | ORIGINAL_REQUEST 2026-08-30T03:41:50Z R2 |
| F11 | Partial Failure Status in `/api/refresh` | `/api/refresh` returns `_source: "fallback_cache"`, `status: "partial_failure"`, and fallback data on weather API outages | M6 | ORIGINAL_REQUEST 2026-08-30T03:41:50Z R3 |
| F12 | UI Error Surfacing & Non-blocking Toast | React frontend captures fallback/partial failure and displays non-blocking toast warning without crashing dashboard/map | M7 | ORIGINAL_REQUEST 2026-08-30T03:41:50Z R3, AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Weather Service & Risk Engine (MVP) | MVP weather fetch & dynamic scoring | none | DONE |
| M2 | Backend API Refresh & Guardrails (MVP) | MVP `/api/refresh` and boot CSV loading | M1 | DONE |
| M3 | Frontend Refresh Wiring (MVP) | MVP UI refresh button & map update | M2 | DONE |
| M4 | Final Integration & E2E Pass (MVP) | MVP test suite pass & hardening | M-E2E, M3 | DONE |
| M5 | Weather Service Error Diagnostics & Fallback Provenance | Implement explicit status/body logging (429, 401/403, 5xx, timeouts, JSON), `fetch_live_weather_with_metadata()` in `weather_service.py` | M1-M4 | IN_PROGRESS |
| M6 | Backend Dynamic Risk Fallback & Refresh Contract | Integrate metadata provenance into `dynamic_risk_engine.py` & `/api/refresh`, create `tests/test_weather_resilience.py` | M5 | PLANNED |
| M7 | Full Verification, Review, Adversarial Testing & Audit | Run all backend tests, frontend tests & build, review, challenge, and forensic audit | M6 | PLANNED |

## Interface Contracts
### Weather Service ↔ Risk Engine / API
- `fetch_live_weather_with_metadata(villages: List[Dict[str, Any]]) -> Dict[str, Any]`:
  - Returns dict with keys `weather_map` (Dict[int, float]), `source` ("OpenMeteo" | "fallback_cache"), `status` ("success" | "partial" | "fallback"), `village_sources` (Dict[int, str]).
- `fetch_live_weather(villages: List[Dict[str, Any]]) -> Dict[int, float]`:
  - Backward-compatible wrapper returning `fetch_live_weather_with_metadata(villages)["weather_map"]`.
- `fetch_live_weather_for_village(lat: float, lon: float, fallback_precip: float = 0.0) -> Dict[str, Any]`:
  - Returns dict with `live_rainfall_mm`, `rainfall_source` ("OpenMeteo" | "fallback_cache"), `status` ("success" | "fallback"), `timestamp`.

### Backend API ↔ Frontend Contract
- `POST /api/refresh` & `GET /api/refresh`:
  - Success Response (HTTP 200):
    `{ "villages": [...], "total_villages": 18, "critical_count": 4, "last_updated": "...", "_source": "live_refresh", "sync_source": "dynamic", "status": "success" }`
  - Fallback / Outage Response (HTTP 200):
    `{ "villages": [...], "total_villages": 18, "critical_count": 4, "last_updated": "...", "_source": "fallback_cache", "sync_source": "fallback", "status": "partial_failure", "weather_status": "unavailable", "warning": "Weather API unavailable. Using cached data." }`
    with each village containing `"rainfall_source": "fallback_cache"`.

## Code Layout
- `backend/services/weather_service.py`: Open-Meteo / OpenWeatherMap error handling, logging status/body, fallback metadata.
- `backend/engines/dynamic_risk_engine.py`: Dynamic state caching and fallback tagging.
- `backend/api/sync.py`: Refresh and sync endpoints returning fallback indicators on outage.
- `frontend/src/api/villages.js`: Frontend API client catching fallback responses.
- `frontend/src/App.jsx`: Toast notification rendering.
- `tests/test_weather_resilience.py`: Unit and integration tests for API errors, logging, timeouts, and fallback responses.


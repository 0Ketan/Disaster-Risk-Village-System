"""
Base resilience layer for external API interactions adhering to GEMINI.md rules:
1. Explicit 8-second timeout
2. Exactly 1 retry on initial failure before falling back (2 attempts total)
3. Graceful fallback: catch all exceptions and return mock/cached data
4. Data Provenance: attach _source: 'live' | 'fallback'
5. Process Isolation: external API failure NEVER crashes the backend or UI
"""

import time
import asyncio
import logging
from typing import Callable, Dict, Any, Tuple, Optional
import httpx

logger = logging.getLogger("villageshield.clients.base")
logging.basicConfig(level=logging.INFO)

DEFAULT_TIMEOUT = 8.0
DEFAULT_RETRIES = 1


async def resilient_fetch(
    url: str,
    fallback_generator: Callable[[], Dict[str, Any]],
    timeout: float = DEFAULT_TIMEOUT,
    retries: int = DEFAULT_RETRIES,
    headers: Optional[Dict[str, str]] = None,
    params: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, Any], str, float]:
    """
    Asynchronously executes an HTTP GET request with strict resilience guarantees.
    Returns: (data_dict, source_tag, latency_ms)
    """
    req_headers = {"User-Agent": "VillageShield-DisasterRiskSystem/1.0"}
    if headers:
        req_headers.update(headers)

    start_time = time.perf_counter()
    total_attempts = 1 + retries

    for attempt in range(total_attempts):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(url, headers=req_headers, params=params)
                if response.status_code == 200:
                    latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
                    data = response.json()
                    if isinstance(data, dict):
                        data["_source"] = "live"
                    return data, "live", latency_ms
                else:
                    logger.warning(
                        f"HTTP {response.status_code} on attempt {attempt + 1}/{total_attempts} for {url}"
                    )
        except Exception as exc:
            logger.warning(
                f"Attempt {attempt + 1}/{total_attempts} failed for {url}: {type(exc).__name__} - {exc}"
            )
            if attempt < total_attempts - 1:
                await asyncio.sleep(0.3)
                continue

    latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
    try:
        fallback_data = fallback_generator()
    except Exception as e:
        logger.error(f"Fallback generator error: {e}")
        fallback_data = {"error": str(e)}

    if isinstance(fallback_data, dict):
        fallback_data["_source"] = "fallback"

    return fallback_data, "fallback", latency_ms


def resilient_fetch_sync(
    url: str,
    fallback_generator: Callable[[], Dict[str, Any]],
    timeout: float = DEFAULT_TIMEOUT,
    retries: int = DEFAULT_RETRIES,
    headers: Optional[Dict[str, str]] = None,
    params: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, Any], str, float]:
    """
    Synchronous version of resilient_fetch using httpx.Client.
    """
    req_headers = {"User-Agent": "VillageShield-DisasterRiskSystem/1.0"}
    if headers:
        req_headers.update(headers)

    start_time = time.perf_counter()
    total_attempts = 1 + retries

    for attempt in range(total_attempts):
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.get(url, headers=req_headers, params=params)
                if response.status_code == 200:
                    latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
                    data = response.json()
                    if isinstance(data, dict):
                        data["_source"] = "live"
                    return data, "live", latency_ms
                else:
                    logger.warning(
                        f"Sync HTTP {response.status_code} on attempt {attempt + 1}/{total_attempts} for {url}"
                    )
        except Exception as exc:
            logger.warning(
                f"Sync attempt {attempt + 1}/{total_attempts} failed for {url}: {type(exc).__name__} - {exc}"
            )
            if attempt < total_attempts - 1:
                time.sleep(0.3)
                continue

    latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
    try:
        fallback_data = fallback_generator()
    except Exception as e:
        logger.error(f"Fallback generator error: {e}")
        fallback_data = {"error": str(e)}

    if isinstance(fallback_data, dict):
        fallback_data["_source"] = "fallback"

    return fallback_data, "fallback", latency_ms

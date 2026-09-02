import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def load_data(file_path: str) -> List[Dict[str, Any]]:
    """Loads JSON data from the specified path."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON from {file_path}: {e}")
        return []

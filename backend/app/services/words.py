import os
import random
from pathlib import Path

WORDS: list[str] = []


def load_words():
    global WORDS
    # Check env var first, then /app/words.txt (Docker), then relative path (local dev)
    words_file = os.environ.get("WORDS_FILE")
    if words_file:
        words_path = Path(words_file)
    elif Path("/app/words.txt").exists():
        words_path = Path("/app/words.txt")
    else:
        words_path = Path(__file__).parent.parent.parent.parent / "words.txt"

    with open(words_path) as f:
        WORDS = [line.strip().lower() for line in f if line.strip()]


def generate_word_id() -> list[str]:
    if not WORDS:
        load_words()

    return [random.choice(WORDS) for _ in range(3)]


def words_to_slug(words: list[str]) -> str:
    return "-".join(words)


def parse_words_param(words_param: str) -> list[str] | None:
    words_param = words_param.lower().replace("-", "")

    if len(words_param) != 15:
        return None

    return [words_param[0:5], words_param[5:10], words_param[10:15]]

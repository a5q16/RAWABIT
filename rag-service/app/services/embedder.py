"""
Rawabit RAG Microservice — Embedder Service
=============================================
Singleton wrapper around SentenceTransformer('intfloat/multilingual-e5-small').

The E5 model family requires specific prefix conventions:
  - "passage: " — prepended to documents/chunks before encoding.
  - "query: "   — prepended to user queries before encoding.

This module exposes a single `Embedder` class that:
  1. Downloads / loads the model ONCE (via `warm()`).
  2. Provides `encode_passages()` and `encode_query()` with correct prefixes.
  3. Returns plain Python lists (ready for pgvector insertion).
"""

from __future__ import annotations

import logging
import time
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass

logger = logging.getLogger("rawabit.embedder")

class Embedder:
    """Thread-safe, single-instance embedding service."""

    _instance: Embedder | None = None
    _model = None
    _ready: bool = False

    def __new__(cls) -> Embedder:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def warm(self, model_name: str = "intfloat/multilingual-e5-small") -> None:
        """
        Download (if needed) and load the embedding model into memory.
        Call this exactly ONCE during the application lifespan startup.
        """
        if self._ready:
            logger.info("Embedder already warm — skipping reload.")
            return

        from sentence_transformers import SentenceTransformer

        logger.info("Loading embedding model '%s' ...", model_name)
        t0 = time.perf_counter()

        self._model = SentenceTransformer(model_name)

        elapsed = time.perf_counter() - t0
        logger.info(
            "Embedding model loaded in %.2fs  (dim=%d).",
            elapsed,
            self._model.get_sentence_embedding_dimension(),
        )
        self._ready = True

    @property
    def is_ready(self) -> bool:
        return self._ready

    @property
    def dimension(self) -> int:
        """Return the output vector dimensionality (384 for e5-small)."""
        if self._model is None:
            raise RuntimeError("Embedder has not been warmed up yet.")
        return self._model.get_sentence_embedding_dimension()

    def encode_passages(self, texts: list[str]) -> list[list[float]]:
        """
        Encode document chunks for storage.
        Applies the "passage: " prefix required by the E5 model family.

        Returns a list of float-lists (one per input text), ready for
        pgvector insertion.
        """
        if not self._ready or self._model is None:
            raise RuntimeError("Embedder has not been warmed up yet.")

        prefixed = [f"passage: {t}" for t in texts]
        embeddings = self._model.encode(
            prefixed,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.tolist()

    def encode_query(self, text: str) -> list[float]:
        """
        Encode a single user query for similarity search.
        Applies the "query: " prefix required by the E5 model family.

        Returns a single float-list (one vector).
        """
        if not self._ready or self._model is None:
            raise RuntimeError("Embedder has not been warmed up yet.")

        prefixed = f"query: {text}"
        embedding = self._model.encode(
            prefixed,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embedding.tolist()

embedder = Embedder()

"""Structured logging setup."""

from __future__ import annotations

import logging
import sys


def setup_logging(level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("vaic")
    if logger.handlers:
        return logger
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logger.level)
    fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(fmt)
    logger.addHandler(handler)
    return logger


def get_logger(name: str | None = None) -> logging.Logger:
    base = logging.getLogger("vaic")
    return base.getChild(name) if name else base

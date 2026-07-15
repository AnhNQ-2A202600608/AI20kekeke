"""Structured logging setup."""

from __future__ import annotations

import logging
import re
import sys


class SecretRedactingFilter(logging.Filter):
    """Filter that replaces sensitive API keys or tokens with [REDACTED]."""

    _PATTERNS = [
        re.compile(r"(sk-[a-zA-Z0-9_-]{20,})"),
        re.compile(r"(Bearer\s+[a-zA-Z0-9_\-\.\~]{10,})", re.IGNORECASE),
        re.compile(
            r"(api[-_]key|secret|token|password)(?:\s*[:=]\s*)(?:\"|')?([a-zA-Z0-9_\-\.]{8,})(?:\"|')?",
            re.IGNORECASE,
        ),
    ]

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.redact(record.msg)
        if record.args:
            new_args = []
            for arg in record.args:
                if isinstance(arg, str):
                    new_args.append(self.redact(arg))
                else:
                    new_args.append(arg)
            record.args = tuple(new_args)
        return True

    def redact(self, text: str) -> str:
        for pattern in self._PATTERNS:
            if pattern.groups == 1:
                text = pattern.sub("[REDACTED]", text)
            else:
                # Group 1 matches key prefix, group 2 matches key value
                text = pattern.sub(r"\1: [REDACTED]", text)
        return text


def setup_logging(level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("vaic")
    if logger.handlers:
        return logger
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logger.level)

    # Attach secret filter
    handler.addFilter(SecretRedactingFilter())

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

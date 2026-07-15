# Optional Make wrappers. The Python CLI is the cross-platform source of truth.

.PHONY: help bootstrap install dev dev-backend dev-frontend docker-up docker-down lint format typecheck test test-backend smoke eval validate clean package

help:
	@python scripts/project_tasks.py --help

bootstrap install dev dev-backend dev-frontend docker-up docker-down lint format typecheck test test-backend smoke eval validate clean package:
	@python scripts/project_tasks.py $@

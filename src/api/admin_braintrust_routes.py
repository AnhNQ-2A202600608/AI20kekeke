from fastapi import APIRouter, Depends, Query

from src.api.adaptive_routes import AuthenticatedUser, require_role
from src.services.braintrust_dashboard import (
    BraintrustAgentsDashboard,
    BraintrustDashboardSummary,
    BraintrustErrorsDashboard,
    BraintrustExecutiveDashboard,
    BraintrustReviewQueueDashboard,
    BraintrustScoresDashboard,
    BraintrustUsageDashboard,
    get_braintrust_dashboard_summary,
)

router = APIRouter(prefix="/admin/braintrust", tags=["Admin Braintrust"])


@router.get("/summary", response_model=BraintrustDashboardSummary)
def braintrust_summary(
    limit: int = Query(default=200, ge=1, le=500),
    range: str = Query(default="24h", pattern=r"^\d+[hd]$"),
    _: AuthenticatedUser = Depends(require_role(["admin", "btc"])),
) -> BraintrustDashboardSummary:
    return get_braintrust_dashboard_summary(limit=limit, range_value=range)


@router.get("/overview", response_model=BraintrustExecutiveDashboard)
def braintrust_overview(
    limit: int = Query(default=200, ge=1, le=500),
    range: str = Query(default="24h", pattern=r"^\d+[hd]$"),
    _: AuthenticatedUser = Depends(require_role(["admin", "btc"])),
) -> BraintrustExecutiveDashboard:
    return get_braintrust_dashboard_summary(limit=limit, range_value=range).executive


@router.get("/agents", response_model=BraintrustAgentsDashboard)
def braintrust_agents(
    limit: int = Query(default=200, ge=1, le=500),
    range: str = Query(default="24h", pattern=r"^\d+[hd]$"),
    _: AuthenticatedUser = Depends(require_role(["admin", "btc"])),
) -> BraintrustAgentsDashboard:
    return get_braintrust_dashboard_summary(limit=limit, range_value=range).agents


@router.get("/scores", response_model=BraintrustScoresDashboard)
def braintrust_scores(
    limit: int = Query(default=200, ge=1, le=500),
    range: str = Query(default="7d", pattern=r"^\d+[hd]$"),
    _: AuthenticatedUser = Depends(require_role(["admin", "btc"])),
) -> BraintrustScoresDashboard:
    return get_braintrust_dashboard_summary(limit=limit, range_value=range).scores


@router.get("/errors", response_model=BraintrustErrorsDashboard)
def braintrust_errors(
    limit: int = Query(default=200, ge=1, le=500),
    range: str = Query(default="24h", pattern=r"^\d+[hd]$"),
    _: AuthenticatedUser = Depends(require_role(["admin", "btc"])),
) -> BraintrustErrorsDashboard:
    return get_braintrust_dashboard_summary(limit=limit, range_value=range).incidents


@router.get("/usage", response_model=BraintrustUsageDashboard)
def braintrust_usage(
    limit: int = Query(default=200, ge=1, le=500),
    range: str = Query(default="24h", pattern=r"^\d+[hd]$"),
    _: AuthenticatedUser = Depends(require_role(["admin", "btc"])),
) -> BraintrustUsageDashboard:
    return get_braintrust_dashboard_summary(limit=limit, range_value=range).usage


@router.get("/review-queue", response_model=BraintrustReviewQueueDashboard)
def braintrust_review_queue(
    limit: int = Query(default=200, ge=1, le=500),
    range: str = Query(default="7d", pattern=r"^\d+[hd]$"),
    _: AuthenticatedUser = Depends(require_role(["admin", "btc"])),
) -> BraintrustReviewQueueDashboard:
    return get_braintrust_dashboard_summary(limit=limit, range_value=range).review_queue


@router.post("/refresh", response_model=BraintrustDashboardSummary)
def braintrust_refresh(
    limit: int = Query(default=200, ge=1, le=500),
    range: str = Query(default="24h", pattern=r"^\d+[hd]$"),
    _: AuthenticatedUser = Depends(require_role(["admin", "btc"])),
) -> BraintrustDashboardSummary:
    return get_braintrust_dashboard_summary(limit=limit, range_value=range, force_refresh=True)

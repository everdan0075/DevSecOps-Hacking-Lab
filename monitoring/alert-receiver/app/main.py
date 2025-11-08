"""
Simple Alertmanager webhook receiver for DevSecOps Hacking Lab.

Stores incoming webhook payloads in memory and exposes them via HTTP.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel


app = FastAPI(title="DevSecOps Alert Receiver", version="1.0.0")


class AlertStore:
    """In-memory storage of received alerts."""

    def __init__(self) -> None:
        self._alerts: List[Dict[str, Any]] = []

    def add(self, payload: Dict[str, Any]) -> None:
        self._alerts.append(
            {
                "received_at": datetime.utcnow().isoformat(),
                "payload": payload,
            }
        )

    def all(self) -> List[Dict[str, Any]]:
        return list(self._alerts)

    def clear(self) -> None:
        self._alerts.clear()


store = AlertStore()


class HealthResponse(BaseModel):
    status: str
    stored_alerts: int


class AlertsResponse(BaseModel):
    count: int
    alerts: List[Dict[str, Any]]


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Basic health check."""
    return HealthResponse(status="healthy", stored_alerts=len(store.all()))


@app.post("/alerts")
async def receive_alert(request: Request) -> JSONResponse:
    """Webhook endpoint for Alertmanager."""
    payload = await request.json()
    store.add(payload)
    return JSONResponse({"status": "received"})


@app.get("/alerts", response_model=AlertsResponse)
async def list_alerts() -> AlertsResponse:
    """Return all stored alerts."""
    return AlertsResponse(alerts=store.all(), count=len(store.all()))


@app.delete("/alerts")
async def clear_alerts() -> JSONResponse:
    """Clear stored alerts (useful for tests)."""
    store.clear()
    return JSONResponse({"status": "cleared"})


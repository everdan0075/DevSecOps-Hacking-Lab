"""
TIME BREACH Mission Validation Endpoints

Validates player actions during historical breach recreation missions
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import re

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/time-breach", tags=["time-breach"])


class ExploitValidation(BaseModel):
    """CVE-2017-5638 exploit validation"""
    payload: str
    command: Optional[str] = "whoami"


class ValidationResponse(BaseModel):
    """Validation result"""
    exploited: bool
    output: Optional[str] = None
    technique: Optional[str] = None
    points: int = 0
    message: str


@router.post("/equifax/exploit", response_model=ValidationResponse)
async def validate_struts_exploit(validation: ExploitValidation):
    """
    Validate Apache Struts CVE-2017-5638 OGNL injection payload

    Checks if the payload contains correct OGNL expression structure
    Awards points for T1190 (Exploit Public-Facing Application)
    """
    payload = validation.payload.lower()

    # Check for key OGNL components
    required_patterns = [
        r'#_memberaccess',
        r'ognl',
        r'#cmd',
        r'processbuilder',
    ]

    matches = sum(1 for pattern in required_patterns if re.search(pattern, payload))

    if matches >= 3:
        # Valid exploit payload
        return ValidationResponse(
            exploited=True,
            output="root" if validation.command == "whoami" else "command_output",
            technique="T1190",
            points=150,
            message="CVE-2017-5638 successfully exploited! Remote code execution achieved."
        )
    elif matches >= 1:
        # Partial payload
        return ValidationResponse(
            exploited=False,
            technique="T1190",
            points=25,
            message="Payload structure detected but incomplete. Review OGNL injection syntax."
        )
    else:
        # Invalid payload
        return ValidationResponse(
            exploited=False,
            points=0,
            message="Invalid OGNL payload. Study the Apache Struts vulnerability documentation."
        )


@router.post("/equifax/upload-shell", response_model=ValidationResponse)
async def validate_webshell_upload(request: Request):
    """
    Validate webshell upload for persistence
    Awards points for T1505 (Server Software Component)
    """
    # Simulate checking for JSP webshell upload
    body = await request.body()

    # Check for JSP webshell patterns
    jsp_patterns = [
        b'Runtime.getRuntime().exec',
        b'ProcessBuilder',
        b'<%@',
        b'request.getParameter'
    ]

    matches = sum(1 for pattern in jsp_patterns if pattern in body)

    if matches >= 2:
        return ValidationResponse(
            exploited=True,
            output="/var/www/html/acis/assets/temp/shell.jsp",
            technique="T1505",
            points=100,
            message="Webshell successfully uploaded! Persistence established."
        )
    else:
        return ValidationResponse(
            exploited=False,
            points=0,
            message="Invalid webshell. Include command execution functionality."
        )


@router.post("/equifax/network-scan", response_model=ValidationResponse)
async def validate_network_scan():
    """
    Validate internal network discovery
    Awards points for T1018 (Remote System Discovery)
    """
    # Simulate successful network scan
    return ValidationResponse(
        exploited=True,
        output="Discovered: 10.10.50.0/24 (Database Segment)",
        technique="T1018",
        points=125,
        message="Internal network enumerated. Database servers discovered at 10.10.50.20-22."
    )


@router.post("/equifax/exfiltrate", response_model=ValidationResponse)
async def validate_data_exfiltration():
    """
    Validate data exfiltration simulation
    Awards points for T1005 (Data from Local System) + T1041 (Exfiltration Over C2)
    """
    # Simulate successful exfiltration
    return ValidationResponse(
        exploited=True,
        output="147,000,000 records staged for exfiltration",
        technique="T1005",
        points=200,
        message="Consumer data successfully exfiltrated. Mission objective complete."
    )


@router.post("/equifax/defender/patch", response_model=ValidationResponse)
async def validate_defender_patch():
    """
    Validate defender applying security patch
    Prevents breach if done before March 10, 2017
    """
    # Simulate successful patching
    return ValidationResponse(
        exploited=True,
        output="Struts upgraded to 2.3.32",
        technique=None,
        points=200,
        message="ACIS portal patched successfully. CVE-2017-5638 vulnerability eliminated. Breach prevented!"
    )


@router.get("/missions")
async def list_missions():
    """List available TIME BREACH missions"""
    return {
        "missions": [
            {
                "id": "equifax-2017",
                "title": "The Equifax Catastrophe",
                "difficulty": "intermediate",
                "estimatedDuration": 35,
                "cve": "CVE-2017-5638",
                "available": True
            },
            {
                "id": "capital-one-2019",
                "title": "Capital One Cloud Breach",
                "difficulty": "advanced",
                "estimatedDuration": 40,
                "cve": "SSRF + AWS Metadata",
                "available": False
            },
            {
                "id": "log4shell-2021",
                "title": "Log4Shell Zero-Day",
                "difficulty": "expert",
                "estimatedDuration": 45,
                "cve": "CVE-2021-44228",
                "available": False
            }
        ]
    }


@router.get("/equifax/stats")
async def get_equifax_stats():
    """Get mission statistics"""
    return {
        "missionId": "equifax-2017",
        "totalPlays": 0,
        "completionRate": 0.0,
        "averageTime": 0,
        "fastestTime": 0,
        "mostUsedRole": "attacker",
        "endingDistribution": {
            "success": 0,
            "detected": 0,
            "prevented": 0,
            "partial": 0
        }
    }

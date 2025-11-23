"""
WAF Signature Database - Attack Pattern Detection

This module contains signature-based attack detection patterns for the WAF.
Signatures are organized by attack category and severity.
"""
import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class AttackCategory(str, Enum):
    """Attack category classification"""
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    COMMAND_INJECTION = "command_injection"
    PATH_TRAVERSAL = "path_traversal"
    XXE = "xxe"
    SSRF = "ssrf"
    LDAP_INJECTION = "ldap_injection"
    XPATH_INJECTION = "xpath_injection"
    TEMPLATE_INJECTION = "template_injection"
    LOG_INJECTION = "log_injection"


class Severity(str, Enum):
    """Attack severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Signature:
    """WAF signature definition"""
    pattern: str  # Regex pattern
    category: AttackCategory
    severity: Severity
    description: str
    compiled_pattern: Optional[re.Pattern] = None

    def __post_init__(self):
        """Compile regex pattern for performance"""
        try:
            self.compiled_pattern = re.compile(self.pattern, re.IGNORECASE)
        except re.error:
            self.compiled_pattern = None


# ============================================================================
# SQL Injection Signatures
# ============================================================================

SQL_INJECTION_SIGNATURES = [
    Signature(
        pattern=r"(\bunion\b.+\bselect\b|\bselect\b.+\bfrom\b)",
        category=AttackCategory.SQL_INJECTION,
        severity=Severity.CRITICAL,
        description="SQL UNION/SELECT injection attempt"
    ),
    Signature(
        pattern=r"(\bor\b\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+|\band\b\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+)",
        category=AttackCategory.SQL_INJECTION,
        severity=Severity.HIGH,
        description="SQL boolean-based injection (1=1, 1=2)"
    ),
    Signature(
        pattern=r"('|\")(\s*)(or|and)(\s*)(\d+)(\s*)(=|<|>)(\s*)(\d+)",
        category=AttackCategory.SQL_INJECTION,
        severity=Severity.HIGH,
        description="SQL tautology injection"
    ),
    Signature(
        pattern=r"(--|#|\/\*|\*\/)",
        category=AttackCategory.SQL_INJECTION,
        severity=Severity.MEDIUM,
        description="SQL comment injection"
    ),
    Signature(
        pattern=r"\b(drop|delete|insert|update|alter|create|truncate)\b.+\b(table|database|index)\b",
        category=AttackCategory.SQL_INJECTION,
        severity=Severity.CRITICAL,
        description="SQL DDL/DML injection attempt"
    ),
    Signature(
        pattern=r"\bexec(ute)?\s*\(|\bsp_executesql\b",
        category=AttackCategory.SQL_INJECTION,
        severity=Severity.CRITICAL,
        description="SQL stored procedure execution"
    ),
    Signature(
        pattern=r"(xp_cmdshell|xp_regread|xp_regwrite)",
        category=AttackCategory.SQL_INJECTION,
        severity=Severity.CRITICAL,
        description="MSSQL extended stored procedure abuse"
    ),
    Signature(
        pattern=r"(sleep\(|benchmark\(|waitfor\s+delay)",
        category=AttackCategory.SQL_INJECTION,
        severity=Severity.HIGH,
        description="SQL time-based blind injection"
    ),
]

# ============================================================================
# Cross-Site Scripting (XSS) Signatures
# ============================================================================

XSS_SIGNATURES = [
    Signature(
        pattern=r"<script[^>]*>.*?</script>",
        category=AttackCategory.XSS,
        severity=Severity.HIGH,
        description="Reflected XSS via script tag"
    ),
    Signature(
        pattern=r"javascript:\s*",
        category=AttackCategory.XSS,
        severity=Severity.HIGH,
        description="JavaScript protocol handler XSS"
    ),
    Signature(
        pattern=r"on(load|error|click|mouseover|focus|blur)\s*=",
        category=AttackCategory.XSS,
        severity=Severity.HIGH,
        description="Event handler XSS"
    ),
    Signature(
        pattern=r"<iframe[^>]*src\s*=",
        category=AttackCategory.XSS,
        severity=Severity.MEDIUM,
        description="Iframe injection"
    ),
    Signature(
        pattern=r"<(img|svg|object|embed)[^>]*(onerror|onload)\s*=",
        category=AttackCategory.XSS,
        severity=Severity.HIGH,
        description="Image/SVG-based XSS"
    ),
    Signature(
        pattern=r"eval\s*\(|setTimeout\s*\(|setInterval\s*\(",
        category=AttackCategory.XSS,
        severity=Severity.MEDIUM,
        description="JavaScript code injection"
    ),
    Signature(
        pattern=r"document\.(cookie|write|domain|location)",
        category=AttackCategory.XSS,
        severity=Severity.MEDIUM,
        description="DOM manipulation attempt"
    ),
]

# ============================================================================
# Command Injection Signatures
# ============================================================================

COMMAND_INJECTION_SIGNATURES = [
    Signature(
        pattern=r"[;&|`$]\s*(ls|cat|nc|wget|curl|bash|sh|cmd|powershell)",
        category=AttackCategory.COMMAND_INJECTION,
        severity=Severity.CRITICAL,
        description="Shell command injection"
    ),
    Signature(
        pattern=r"\$\(.*\)|\`.*\`",
        category=AttackCategory.COMMAND_INJECTION,
        severity=Severity.CRITICAL,
        description="Command substitution injection"
    ),
    Signature(
        pattern=r"(nc|netcat)\s+-.*\s+\d{1,5}",
        category=AttackCategory.COMMAND_INJECTION,
        severity=Severity.CRITICAL,
        description="Netcat reverse shell attempt"
    ),
    Signature(
        pattern=r"/bin/(bash|sh|zsh|csh|ksh|fish)",
        category=AttackCategory.COMMAND_INJECTION,
        severity=Severity.HIGH,
        description="Shell invocation attempt"
    ),
]

# ============================================================================
# Path Traversal Signatures
# ============================================================================

PATH_TRAVERSAL_SIGNATURES = [
    Signature(
        pattern=r"\.\./|\.\.\\",
        category=AttackCategory.PATH_TRAVERSAL,
        severity=Severity.HIGH,
        description="Directory traversal attempt"
    ),
    Signature(
        pattern=r"(\/etc\/passwd|\/etc\/shadow|\/windows\/system32)",
        category=AttackCategory.PATH_TRAVERSAL,
        severity=Severity.CRITICAL,
        description="System file access attempt"
    ),
    Signature(
        pattern=r"%2e%2e[/\\]",
        category=AttackCategory.PATH_TRAVERSAL,
        severity=Severity.HIGH,
        description="URL-encoded path traversal"
    ),
]

# ============================================================================
# XXE (XML External Entity) Signatures
# ============================================================================

XXE_SIGNATURES = [
    Signature(
        pattern=r"<!DOCTYPE[^>]*\[.*<!ENTITY",
        category=AttackCategory.XXE,
        severity=Severity.CRITICAL,
        description="XXE entity declaration"
    ),
    Signature(
        pattern=r"<!ENTITY[^>]*SYSTEM",
        category=AttackCategory.XXE,
        severity=Severity.CRITICAL,
        description="XXE external entity reference"
    ),
]

# ============================================================================
# SSRF (Server-Side Request Forgery) Signatures
# ============================================================================

SSRF_SIGNATURES = [
    Signature(
        pattern=r"(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|169\.254\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)",
        category=AttackCategory.SSRF,
        severity=Severity.HIGH,
        description="Internal network SSRF attempt"
    ),
    Signature(
        pattern=r"file:///|dict://|gopher://|ftp://",
        category=AttackCategory.SSRF,
        severity=Severity.CRITICAL,
        description="Protocol-based SSRF"
    ),
]

# ============================================================================
# LDAP Injection Signatures
# ============================================================================

LDAP_INJECTION_SIGNATURES = [
    Signature(
        pattern=r"(\*|\)|\(|\||&)",
        category=AttackCategory.LDAP_INJECTION,
        severity=Severity.MEDIUM,
        description="LDAP filter injection"
    ),
]

# ============================================================================
# Template Injection Signatures
# ============================================================================

TEMPLATE_INJECTION_SIGNATURES = [
    Signature(
        pattern=r"\{\{.*\}\}|\{%.*%\}|\${.*}",
        category=AttackCategory.TEMPLATE_INJECTION,
        severity=Severity.HIGH,
        description="Server-side template injection"
    ),
]

# ============================================================================
# Signature Database
# ============================================================================

class SignatureDatabase:
    """WAF signature database manager"""

    def __init__(self):
        """Initialize signature database"""
        self.signatures: List[Signature] = []
        self._load_default_signatures()

    def _load_default_signatures(self):
        """Load all default signatures"""
        all_signatures = (
            SQL_INJECTION_SIGNATURES +
            XSS_SIGNATURES +
            COMMAND_INJECTION_SIGNATURES +
            PATH_TRAVERSAL_SIGNATURES +
            XXE_SIGNATURES +
            SSRF_SIGNATURES +
            LDAP_INJECTION_SIGNATURES +
            TEMPLATE_INJECTION_SIGNATURES
        )

        for sig in all_signatures:
            if sig.compiled_pattern:
                self.signatures.append(sig)

    def scan(self, text: str) -> List[Tuple[Signature, re.Match]]:
        """
        Scan text against all signatures

        Args:
            text: Text to scan

        Returns:
            List of (signature, match) tuples
        """
        matches = []

        for signature in self.signatures:
            if signature.compiled_pattern:
                match = signature.compiled_pattern.search(text)
                if match:
                    matches.append((signature, match))

        return matches

    def scan_detailed(self, text: str) -> Dict[str, any]:
        """
        Detailed scan with categorized results

        Args:
            text: Text to scan

        Returns:
            Dictionary with scan results
        """
        matches = self.scan(text)

        if not matches:
            return {
                "threat_detected": False,
                "matches": [],
                "highest_severity": None,
                "categories": []
            }

        # Sort by severity
        severity_order = {
            Severity.CRITICAL: 4,
            Severity.HIGH: 3,
            Severity.MEDIUM: 2,
            Severity.LOW: 1
        }

        sorted_matches = sorted(
            matches,
            key=lambda x: severity_order[x[0].severity],
            reverse=True
        )

        return {
            "threat_detected": True,
            "matches": [
                {
                    "category": sig.category.value,
                    "severity": sig.severity.value,
                    "description": sig.description,
                    "matched_text": match.group(0)[:100]  # Truncate for safety
                }
                for sig, match in sorted_matches
            ],
            "highest_severity": sorted_matches[0][0].severity.value,
            "categories": list(set(sig.category.value for sig, _ in sorted_matches))
        }

    def add_custom_signature(self, signature: Signature):
        """Add custom signature to database"""
        if signature.compiled_pattern:
            self.signatures.append(signature)

    def get_stats(self) -> Dict[str, int]:
        """Get signature database statistics"""
        stats = {
            "total": len(self.signatures)
        }

        for category in AttackCategory:
            stats[category.value] = sum(
                1 for sig in self.signatures
                if sig.category == category
            )

        return stats


# Global signature database instance
signature_db = SignatureDatabase()

# Phase 2.6B: Frontend Enhancement - WAF, IDS & Gateway Observability

**Status**: 🚧 IN PROGRESS
**Date**: 2025-11-24
**Dependencies**: Phase 2.6 (SIEM Dashboard & Honeypot Attacks)
**Goal**: Close critical gaps in frontend coverage (75% → 95%+)

## Gap Analysis Summary

**Current Coverage**: 75% (after Phase 2.6)
**Target Coverage**: 95%+

### Critical Gaps (Must Fix)
1. ❌ **WAF Signatures** - 28 signatures not visible
2. ❌ **Per-Endpoint Rate Limits** - Endpoint-specific limits not shown
3. ❌ **IDS Integration** - 15+ IDS metrics missing

### Medium Priority Gaps
4. ❌ **User-Agent Filtering** - Blocked agents not visible
5. ❌ **Gateway Health Metrics** - Active connections, JWT validation rates
6. ❌ **Incident Reports** - Download functionality missing
7. ⚠️ **Correlation Statistics** - Service exists but not displayed

## Implementation Plan

### Commit 1: WAF Analytics Dashboard
**Goal**: Expose all 28 WAF signatures and per-endpoint rate limits

**Files to Create**:
1. `frontend/src/pages/WafAnalytics.tsx` - Main WAF dashboard page
2. `frontend/src/components/waf/WafSignatureBreakdown.tsx` - Signature categories display
3. `frontend/src/components/waf/WafBlockedPatterns.tsx` - Top blocked patterns
4. `frontend/src/components/waf/UserAgentFiltering.tsx` - Blocked User-Agents
5. `frontend/src/components/waf/EndpointRateLimits.tsx` - Per-endpoint limits table
6. `frontend/src/services/wafService.ts` - WAF metrics service

**Files to Modify**:
- `frontend/src/App.tsx` - Add /waf route
- `frontend/src/components/Layout.tsx` - Add WAF nav link
- `frontend/src/services/index.ts` - Export wafService

**Features**:
- WAF Signature Categories (8 categories):
  - SQL Injection (8 signatures)
  - XSS (7 signatures)
  - Command Injection (4 signatures)
  - Path Traversal (3 signatures)
  - XXE (2 signatures)
  - SSRF (2 signatures)
  - LDAP Injection (1 signature)
  - Template Injection (1 signature)
- Per-Endpoint Rate Limits table:
  - /auth/login: 10 req/min (burst: 3)
  - /auth/mfa/verify: 15 req/min (burst: 5)
  - /auth/token/refresh: 20 req/min (burst: 5)
  - /api/users/profile: 30 req/min (burst: 10)
  - /api/users/settings: 20 req/min (burst: 5)
  - Honeypots: 5 req/min (burst: 2)
- User-Agent Blocking:
  - Blocked scanners (nikto, nmap, sqlmap, burp, etc.)
  - Blocked scrapers (scrapy, bare curl/wget)
  - Whitelisted good bots (googlebot, bingbot, etc.)
- Top Blocked Patterns (last 24h)
- Attack Category Distribution (pie chart)

**Metrics Queries**:
```typescript
gateway_waf_blocks_total{reason}
gateway_waf_suspicious_patterns{pattern, client_ip}
gateway_rate_limit_blocks_total{client_ip}
```

**Estimated Effort**: 3-4 hours

---

### Commit 2: IDS Integration & Gateway Health
**Goal**: Add IDS visibility and gateway health metrics

**Files to Create**:
1. `frontend/src/components/monitoring/IdsSection.tsx` - IDS metrics section
2. `frontend/src/components/monitoring/GatewayHealthPanel.tsx` - Gateway health
3. `frontend/src/components/monitoring/JwtValidationStats.tsx` - JWT stats
4. `frontend/src/services/idsService.ts` - IDS metrics service (with Linux check)

**Files to Modify**:
- `frontend/src/pages/Monitoring.tsx` - Add IDS section and gateway health
- `frontend/src/services/index.ts` - Export idsService

**Features**:

**IDS Section**:
- Platform detection (Linux vs Windows)
- Linux: Show 15 IDS metrics
  - `ids_alerts_total{category, severity}`
  - `ids_sql_injection_total`
  - `ids_xss_total`
  - `ids_brute_force_total`
  - `ids_scanner_detection_total`
  - `ids_honeypot_access_total`
  - `ids_gateway_bypass_total`
  - `ids_idor_attempts_total`
  - `ids_command_injection_total`
  - `ids_path_traversal_total`
  - `ids_active_attackers` (gauge)
  - `ids_alerts_last_minute` (gauge)
  - `ids_events_processed_total`
  - `ids_incident_reports_sent_total`
  - `ids_log_parse_errors_total`
- Windows: Show "IDS Unavailable" notice with explanation
- IDS-WAF correlation status

**Gateway Health Panel**:
- Active connections gauge
- JWT validation stats:
  - Total validations
  - Success rate
  - Failure reasons (expired, invalid, missing)
- Backend service health:
  - login-api status
  - user-service status
  - Response times
- Rate limit token status (per-endpoint remaining tokens)

**Estimated Effort**: 2-3 hours

---

### Commit 3: Incident Management & Correlation Stats
**Goal**: Enhanced incident visibility and correlation statistics

**Files to Create**:
1. `frontend/src/components/incidents/IncidentReportViewer.tsx` - View/download reports
2. `frontend/src/components/incidents/ActiveBansPanel.tsx` - IP ban management
3. `frontend/src/components/incidents/RunbookCatalog.tsx` - Runbook details
4. `frontend/src/components/siem/CorrelationStatsPanel.tsx` - Correlation engine stats

**Files to Modify**:
- `frontend/src/pages/Monitoring.tsx` - Add incident management section
- `frontend/src/pages/Siem.tsx` - Add correlation stats panel
- `frontend/src/services/incidentService.ts` - Add report download methods

**Features**:

**Incident Report Viewer**:
- List recent incident reports
- Download as JSON or Markdown
- Filter by date/severity/type
- Search functionality

**Active Bans Panel**:
- Table of currently banned IPs
- Expiry time countdown
- Ban reason and severity
- Manual unban button (already exists, but add to list view)
- Ban history (last 24h)

**Runbook Catalog**:
- List 9 loaded runbooks:
  1. Brute force response
  2. MFA bypass response
  3. IDOR exploitation response
  4. SQL injection response
  5. Gateway bypass response
  6. Rate limit evasion response
  7. Command injection response
  8. Path traversal response
  9. Honeypot interaction response
- Show for each:
  - Trigger conditions
  - Priority level
  - Actions taken (notify, ban_ip, report, remediate)
  - Execution count
  - Success rate

**Correlation Stats Panel** (add to SIEM dashboard):
- Total events in correlation window
- Total patterns detected
- Average correlation time
- Top correlated attack types
- Pattern type distribution
- Confidence score distribution

**Metrics**:
```typescript
/api/incidents - List incidents with reports
/api/stats - Runbook execution stats
/api/correlation/statistics - Correlation engine metrics
Redis: banned_ip:* keys - Active bans
```

**Estimated Effort**: 2-3 hours

---

## Commit Breakdown

### Commit 1: WAF Analytics Dashboard
**Priority**: 🔴 Critical
**Impact**: High - Exposes 28 hidden signatures, per-endpoint limits
**Lines**: ~800-1000
**Files**: 7 new + 3 modified

### Commit 2: IDS Integration & Gateway Health
**Priority**: 🔴 Critical
**Impact**: High - Adds IDS visibility, gateway health monitoring
**Lines**: ~600-800
**Files**: 4 new + 2 modified

### Commit 3: Incident Management & Correlation
**Priority**: 🟡 Medium
**Impact**: Medium - Enhanced incident visibility, better operations
**Lines**: ~500-700
**Files**: 4 new + 3 modified

---

## Testing Strategy

### Manual Testing Checklist

**WAF Analytics**:
- [ ] Verify signature categories display correctly
- [ ] Test per-endpoint rate limit table
- [ ] Trigger attacks and see patterns increment
- [ ] Check User-Agent filtering display
- [ ] Test attack category pie chart

**IDS Integration**:
- [ ] Test on Linux (IDS available)
- [ ] Test on Windows (graceful degradation)
- [ ] Verify IDS metrics display
- [ ] Check correlation status indicator
- [ ] Test alert filtering

**Gateway Health**:
- [ ] Verify active connections gauge
- [ ] Check JWT validation stats
- [ ] Test backend service health indicators
- [ ] Verify rate limit token display

**Incident Management**:
- [ ] Download incident report (JSON)
- [ ] Download incident report (Markdown)
- [ ] View active IP bans
- [ ] Test manual unban
- [ ] View runbook catalog
- [ ] Check correlation stats panel

### Integration Testing

```bash
# Generate test data
cd attacks/brute-force
python brute_force.py --target http://localhost:8000/auth/login

# Trigger WAF blocks
curl http://localhost:8080/api/users?id=1' OR '1'='1
curl http://localhost:8080/api/users?id=<script>alert(1)</script>

# Check metrics
curl http://localhost:8080/metrics | grep waf
curl http://localhost:8080/metrics | grep honeypot
curl http://localhost:9200/metrics | grep ids  # Linux only

# Verify frontend displays
open http://localhost:5173/waf
open http://localhost:5173/monitoring  # Check IDS section
open http://localhost:5173/siem  # Check correlation stats
```

---

## Success Criteria

✅ **Phase 2.6B Complete When**:
1. WAF Analytics page shows all 28 signatures
2. Per-endpoint rate limits visible
3. User-Agent filtering visible
4. IDS metrics display on Linux (graceful message on Windows)
5. Gateway health panel shows active connections, JWT stats
6. Incident reports downloadable
7. Active IP bans viewable
8. Runbook catalog accessible
9. Correlation stats in SIEM dashboard
10. Coverage increased from 75% to 95%+

---

## Timeline Estimate

**Total Time**: 7-10 hours

- Commit 1 (WAF): 3-4 hours
- Commit 2 (IDS/Gateway): 2-3 hours
- Commit 3 (Incidents): 2-3 hours

**With breaks**: 1-2 days of focused work

---

## Risk Assessment

**Low Risk**:
- All features are additive (no breaking changes)
- Existing functionality unchanged
- Can be deployed incrementally

**Potential Issues**:
1. IDS metrics unavailable on Windows (expected, handled with graceful message)
2. Prometheus queries may timeout under load (add loading states)
3. Large ban lists may slow UI (add pagination)

---

## Post-Implementation

### Documentation Updates
- Update PHASE_2.6_FRONTEND_INTEGRATION.md with 2.6B additions
- Create PHASE_2.6B_WAF_IDS_ENHANCEMENTS.md
- Update README.md with new pages

### Performance Review
- Measure page load times
- Check auto-refresh impact
- Optimize Prometheus queries if needed

### User Feedback
- Gather feedback on WAF signature visibility
- Check if per-endpoint limits are clear
- Validate IDS section usefulness

---

## Next Steps (Phase 3.0)

After Phase 2.6B completion, consider:
1. Machine Learning threat prediction
2. Geo-IP visualization
3. Attack path graphing
4. Automated response tuning
5. Export/reporting functionality
6. WebSocket real-time updates (replace polling)

---

**Ready to Start**: Commit 1 - WAF Analytics Dashboard

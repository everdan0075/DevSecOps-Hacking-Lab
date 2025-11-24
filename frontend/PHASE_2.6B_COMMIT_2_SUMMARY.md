# Phase 2.6B Commit 2: IDS Integration & Gateway Health Monitoring

## Overview
This commit adds IDS (Intrusion Detection System) integration and Gateway Health monitoring components to the DevSecOps Hacking Lab frontend, completing Phase 2.6B Commit 2.

## Components Created

### Services Layer

#### 1. IDS Service (`src/services/idsService.ts`)
- **Platform Detection**: Automatically detects Windows vs Linux
  - Linux: Fetches real IDS alerts from Suricata via backend API
  - Windows: Returns mock data with clear warning (Suricata is Linux-only)
- **Methods**:
  - `getRecentAlerts(limit)`: Fetch recent alerts (default: 50)
  - `getAlertsByCategory(category)`: Filter by attack category
  - `getAlertsBySeverity(severity)`: Filter by severity level
  - `getAlertStatistics()`: Get aggregate statistics
  - `getSeverityColor(severity)`: UI helper for color coding
  - `isAvailable()`: Check if IDS is available on current platform
- **Mock Data**: 5 realistic sample alerts for Windows users

#### 2. Gateway Service (`src/services/gatewayService.ts`)
- **Methods**:
  - `getHealth()`: Get current gateway health status
  - `getJwtValidationStats(hoursAgo)`: Get JWT validation metrics (default: 24h)
  - `getStatusColor(status)`: UI helper for status colors
  - `getCircuitBreakerColor(state)`: UI helper for circuit breaker state
  - `formatUptime(seconds)`: Convert seconds to human-readable format (e.g., "2d 4h 15m")
  - `formatPercentage(value)`: Format decimal as percentage
- **Fallback**: Returns mock data if backend is unavailable

### UI Components

#### 3. IDS Alerts Panel (`src/components/ids/IdsAlertsPanel.tsx`)
- **Features**:
  - Platform indicator: "🐧 Live IDS Alerts" (Linux) or "💻 Mock IDS Alerts" (Windows)
  - Scrollable alert list with expandable rows
  - Severity filter dropdown (All, Critical, High, Medium, Low)
  - Color-coded severity badges
  - Relative time display ("2m ago", "5h ago")
  - Expandable details: full signature, ports, payload
  - Auto-refresh every 10 seconds
- **Layout**: Full-width table with columns:
  - Timestamp (relative)
  - Source IP → Destination IP
  - Signature (truncated, expandable)
  - Category
  - Severity badge
  - Protocol
  - Expand button

#### 4. Gateway Health Panel (`src/components/gateway/GatewayHealthPanel.tsx`)
- **Features**:
  - Status badge (Healthy/Degraded/Down) with color coding
  - Uptime display (human-readable: "2d 4h 15m")
  - 2x2 metrics grid:
    - Total Requests
    - Error Rate (% with color threshold: <5% green, 5-10% yellow, >10% red)
    - Avg Response Time (ms with color: <200ms green, >200ms yellow)
    - Connection Pool Utilization (% with color: <60% green, 60-80% yellow, >80% red)
  - Connection pool visualization:
    - Horizontal stacked bar chart (Active/Idle/Max)
    - Color-coded: Active (green), Idle (blue), Max (gray)
  - Circuit breaker status:
    - State indicator (Closed/Half-Open/Open)
    - Failure count
    - Last failure timestamp
  - Auto-refresh every 5 seconds
- **Layout**: Card with header, uptime banner, 2x2 grid, pool chart, circuit breaker status

#### 5. JWT Validation Stats (`src/components/gateway/JwtValidationStats.tsx`)
- **Features**:
  - Radial success rate gauge (donut chart style)
  - Color-coded gauge: >95% green, 85-95% yellow, <85% red
  - Total validations counter
  - Success/Failure counts in separate cards
  - Failure reasons breakdown:
    - Expired Token (yellow bar)
    - Invalid Signature (red bar)
    - Malformed Token (orange bar)
    - Revoked Token (purple bar)
    - Other Errors (gray bar)
  - Horizontal bar charts for each failure reason
  - Average validation time metric (color: <5ms green, 5-10ms yellow, >10ms red)
  - Auto-refresh every 15 seconds
- **Layout**: Card with gauge at top, success/fail cards, failure breakdown table, avg time

### Page Integration

#### 6. Monitoring Page Update (`src/pages/Monitoring.tsx`)
- Added new section "Gateway & Network Security" within the metrics tab
- Layout:
  ```
  [Existing Metrics Grid]
  [Existing Metrics Chart]

  Gateway & Network Security Section:
    [Gateway Health Panel] [JWT Validation Stats]
    [IDS Alerts Panel (full-width)]
  ```
- Section appears between existing metrics and other tabs

### Type Definitions

#### 7. Type Updates (`src/types/api.ts`)
Added new types:
- `IdsAlert`: Individual IDS alert structure
- `IdsStatistics`: Aggregate IDS statistics
- `GatewayHealth`: Gateway health metrics
- `JwtValidationStats`: JWT validation metrics

#### 8. Service Exports (`src/services/index.ts`)
Added exports:
- `export { default as idsService } from './idsService'`
- `export { default as gatewayService } from './gatewayService'`

## Backend API Endpoints

These components consume the following endpoints (provided by monitoring service on port 5002):

### IDS Endpoints
- `GET /api/ids/alerts?limit=50` - Recent alerts
- `GET /api/ids/alerts?category=<category>` - Filter by category
- `GET /api/ids/alerts?severity=<severity>` - Filter by severity
- `GET /api/ids/statistics` - Aggregate statistics

### Gateway Endpoints
- `GET /api/gateway/health` - Current health status
- `GET /api/jwt/validation-stats?hours=24` - JWT validation metrics

## Design System Compliance

All components follow the existing design system:
- **Colors**: `cyber-primary`, `cyber-surface`, `cyber-border`, `cyber-bg`
- **Severity Colors**:
  - Critical: `text-red-500 bg-red-500/10 border-red-500/30`
  - High: `text-orange-500 bg-orange-500/10 border-orange-500/30`
  - Medium: `text-yellow-500 bg-yellow-500/10 border-yellow-500/30`
  - Low: `text-green-500 bg-green-500/10 border-green-500/30`
- **Loading States**: Uses existing `LoadingSkeleton` component
- **Icons**: Lucide React icons (Shield, Activity, AlertTriangle, CheckCircle, XCircle, Wifi, WifiOff, Server)
- **Animations**: Smooth transitions with Tailwind CSS

## Key Implementation Details

### Platform Detection (IDS Service)
```typescript
private isLinux = !navigator.platform.toLowerCase().includes('win');
```
- Automatically detects platform using `navigator.platform`
- Shows appropriate UI indicator
- Returns mock data on Windows with console warning

### Auto-Refresh Patterns
All components use React's `useEffect` hook for auto-refresh:
```typescript
useEffect(() => {
  const interval = setInterval(fetchData, INTERVAL_MS)
  return () => clearInterval(interval)
}, [dependencies])
```
- IDS Alerts: 10 seconds
- Gateway Health: 5 seconds
- JWT Validation: 15 seconds

### Error Handling
All components handle:
1. Network errors (backend unreachable)
2. API errors (invalid responses)
3. Fallback to mock data when appropriate
4. User-friendly error messages

### Performance Optimizations
- Virtual scrolling ready (max height with overflow-y-auto)
- Relative time formatting (avoids constant re-renders)
- Conditional rendering based on tab selection
- Lazy loading of data only when tab is active

## Testing Checklist

- [x] Services export correctly
- [x] Components import without errors
- [x] TypeScript compilation passes
- [x] Build succeeds without warnings
- [x] Platform detection works on Windows
- [x] Mock data displays correctly
- [x] All auto-refresh intervals configured
- [x] Color coding follows design system
- [x] Loading states display properly
- [x] Error states handled gracefully

## File Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── ids/
│   │   │   └── IdsAlertsPanel.tsx          (NEW)
│   │   ├── gateway/
│   │   │   ├── GatewayHealthPanel.tsx      (NEW)
│   │   │   └── JwtValidationStats.tsx      (NEW)
│   ├── services/
│   │   ├── idsService.ts                   (NEW)
│   │   ├── gatewayService.ts               (NEW)
│   │   └── index.ts                        (UPDATED)
│   ├── pages/
│   │   └── Monitoring.tsx                  (UPDATED)
│   └── types/
│       └── api.ts                          (UPDATED)
```

## Known Limitations

1. **IDS on Windows**: Suricata is Linux-only, so Windows users see mock data
   - Clearly indicated in UI with platform emoji
   - Mock data represents realistic alert structure

2. **Backend Dependency**: All features require monitoring service (port 5002) to be running
   - Graceful fallback to mock data if unavailable
   - Error messages guide users to start services

3. **Auto-Refresh Intervals**: Fixed intervals may cause unnecessary requests
   - Future enhancement: WebSocket-based real-time updates

4. **Connection Pool Visualization**: Simple stacked bar chart
   - Future enhancement: Historical trend graph

## Future Enhancements

1. **IDS Alerts**:
   - Add alert severity distribution chart
   - Implement alert acknowledgement/dismissal
   - Add alert export functionality (CSV/JSON)
   - Real-time WebSocket updates

2. **Gateway Health**:
   - Add historical uptime graph (last 7 days)
   - Implement health trend indicators
   - Add manual circuit breaker reset
   - Connection pool heat map

3. **JWT Validation**:
   - Add validation rate trend graph
   - Implement failure reason drill-down
   - Add alert threshold configuration
   - Token type breakdown (access vs refresh)

## Success Criteria

All success criteria from the requirements have been met:

- [x] idsService.ts with Windows/Linux detection and mock data fallback
- [x] gatewayService.ts with health and JWT stats methods
- [x] IdsAlertsPanel.tsx with filtering, expanding, and platform indicator
- [x] GatewayHealthPanel.tsx with status, metrics grid, connection pool visualization
- [x] JwtValidationStats.tsx with success rate gauge and failure breakdown
- [x] Monitoring.tsx updated with new "Gateway & Network Security" section
- [x] Services exported in index.ts
- [x] All components use proper TypeScript types
- [x] All components have auto-refresh
- [x] Build passes without errors

## Deployment Notes

No special deployment steps required. The components will automatically:
- Detect platform (Windows/Linux)
- Connect to backend monitoring service
- Fall back to mock data if backend unavailable
- Display appropriate user messaging

To test locally:
```bash
# Start monitoring service (required for live data)
docker-compose up -d incident-bot

# Start frontend dev server
cd frontend
npm run dev
```

## Git Commit Message

```
feat(frontend): add IDS integration and gateway health monitoring (Phase 2.6B Commit 2)

- Create IDS service with Linux/Windows platform detection
- Create gateway service for health and JWT validation metrics
- Add IdsAlertsPanel with filtering and expandable alerts
- Add GatewayHealthPanel with status, metrics, and connection pool viz
- Add JwtValidationStats with success rate gauge and failure breakdown
- Update Monitoring page with Gateway & Network Security section
- Add auto-refresh for all components (5-15s intervals)
- Include mock data fallback for offline/Windows scenarios
```

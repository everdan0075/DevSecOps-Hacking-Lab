# Frontend Refactoring Roadmap

**Project:** DevSecOps Hacking Lab Frontend
**Status:** 🔵 Phase 3 In Progress (Phases 1 & 2 Complete)
**Total Estimated Effort:** 3 weeks (15 working days)
**Start Date:** 2025-12-16
**Current Progress:** ~67% (2 of 3 major phases complete)

## 📈 Phase Completion Status

- ✅ **Phase 1: Critical Blockers** - COMPLETE (6/6 tasks)
  - All TypeScript errors fixed
  - BattleArena polling replaced with event-driven architecture
  - All battle components memoized
  - Mission JSONs lazy loaded
  - Security vulnerabilities resolved
  - TypeScript validation added to CI

- ✅ **Phase 2: Performance & Bundle Optimization** - COMPLETE (5/5 tasks)
  - Recharts code splitting (313KB savings)
  - Documentation lazy loading (81KB savings)
  - Monaco Editor lazy loading
  - Heavy components memoized
  - Timer memory leaks fixed

- 🔵 **Phase 3: Architecture Improvements** - IN PROGRESS (0/5 tasks)
  - Refactor AttackExecutionPanel
  - Migrate to React Query
  - Add Error Boundaries
  - Environment Configuration
  - Refactor battleEngine to Hooks (optional)

- ⏳ **Phase 4: Testing & Validation** - PENDING (0/5 tasks)

---

## Overview

This roadmap addresses critical technical debt in the frontend codebase. The project is **functional but has serious architectural and performance issues** that will compound with each new feature.

### Key Metrics (Current State)

- **Bundle Size:** 6MB total (charts: 313KB, animations: 113KB)
- **TypeScript Errors:** 29 compilation errors
- **Components:** 69 total, 0 memoized
- **Performance:** setInterval(100ms) causing 10 re-renders/sec
- **Test Coverage:** 0%
- **Dependencies:** React 19.2.0 (bleeding edge)

### Success Criteria

- ✅ Zero TypeScript compilation errors
- ✅ Bundle size < 3MB (50% reduction)
- ✅ No polling intervals < 500ms
- ✅ 80%+ critical flows covered by tests
- ✅ Lighthouse Performance Score > 90

---

## 🚨 PHASE 1: CRITICAL BLOCKERS

**Duration:** 3 days (Week 1)
**Goal:** Fix build-breaking issues and critical performance problems
**Status:** ✅ COMPLETED

### Task 1.1: Fix TypeScript Build Errors (29 errors)

**Priority:** CRITICAL ⚠️
**Effort:** 4-6 hours
**Assignee:** TBD

**Problem:**
```bash
npm run build → 29 TypeScript errors
# Build succeeds only because Vite ignores TS errors in production
```

**Files to Fix:**

1. **`tsconfig.app.json`**
   ```json
   {
     "compilerOptions": {
       "types": ["vite/client", "@types/node"]  // ADD THIS
     }
   }
   ```

2. **`frontend/src/services/battleEngine.ts`** (7 errors)
   - Fix: `NodeJS.Timeout` → use `number` or add `@types/node`
   - Lines: 41, 42, 43

3. **`frontend/src/pages/BattleArena.tsx`** (13 errors)
   - Remove unused variables: `attack`, `defense`, `phase`, `finalScore`, `attackId`, `defenseId`, `isRunning`
   - Fix line 58: `setBattleWinner` type mismatch (add `"draw"` to type union)

4. **`frontend/src/pages/TimeBreach.tsx`** (3 errors)
   - Fix mission data type mismatches (TS2352)
   - Fix unused `TimelinePhase` import
   - Fix unused `handleMissionComplete` function

5. **`frontend/src/services/battleEngine.ts`** (6 more errors)
   - Lines 396-399: Fix `number | undefined` → ensure defaults
   - Lines 495-497: Fix `.length` on wrong type (should be `.bans.length`)

**Acceptance Criteria:**
```bash
npm run build         # ✅ Zero TypeScript errors
tsc --noEmit          # ✅ Zero TypeScript errors
```

**Subtasks:**
- [ ] Update `tsconfig.app.json` with `@types/node`
- [ ] Fix all errors in `battleEngine.ts`
- [ ] Fix all errors in `BattleArena.tsx`
- [ ] Fix all errors in `TimeBreach.tsx`
- [ ] Add `"typecheck": "tsc --noEmit"` to `package.json` scripts
- [ ] Run `npm run typecheck` and verify zero errors
- [ ] Commit: `fix(typescript): resolve all 29 compilation errors`

---

### Task 1.2: Fix BattleArena Polling Performance

**Priority:** CRITICAL 🔥
**Effort:** 1 day
**Assignee:** TBD

**Problem:**
```typescript
// BattleArena.tsx:67-72
setInterval(() => {
  setBattleState({ ...state })  // 10 re-renders per second!
}, 100)
```

**Impact:**
- 80% CPU on React reconciliation
- Jank scrolling
- Battery drain on mobile

**Solution: Event-Driven Architecture**

**Step 1: Update battleEngine.ts**

Add proper event emitter:
```typescript
class BattleEngine {
  private eventListeners: Map<string, Function[]> = new Map()

  emit(event: string, ...args: any[]) {
    this.eventListeners.get(event)?.forEach(fn => fn(...args))
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      this.eventListeners.set(event, listeners.filter(fn => fn !== callback))
    }
  }

  // Call emit() whenever state changes:
  private updateState() {
    // ... state update logic
    this.emit('stateChanged', this.state)
  }
}
```

**Step 2: Update BattleArena.tsx**

Replace polling with event subscription:
```typescript
useEffect(() => {
  const handleStateChange = (newState: BattleState) => {
    setBattleState({ ...newState })
  }

  battleEngine.on('stateChanged', handleStateChange)

  return () => {
    battleEngine.off('stateChanged', handleStateChange)
    battleEngine.stopBattle()
  }
}, [])
```

**Acceptance Criteria:**
- [ ] No `setInterval` < 500ms in BattleArena
- [ ] State updates only when battle events occur
- [ ] Chrome DevTools Performance: <20% CPU on React reconciliation
- [ ] Smooth 60fps scrolling during battle

**Subtasks:**
- [ ] Add event emitter methods to `battleEngine.ts`
- [ ] Replace all `this.state = ...` with `this.updateState()` calls
- [ ] Remove `setInterval` from `BattleArena.tsx`
- [ ] Subscribe to `stateChanged` event
- [ ] Test: Launch attack → verify UI updates
- [ ] Test: Stop battle → verify cleanup (no memory leaks)
- [ ] Commit: `perf(battle): replace polling with event-driven updates`

---

### Task 1.3: Add React.memo to Battle Components

**Priority:** HIGH 🔥
**Effort:** 4 hours
**Assignee:** TBD

**Problem:** All battle components re-render unnecessarily.

**Files to Update:**

```
frontend/src/components/battle/
├── AttackArrow.tsx         → export default memo(AttackArrow)
├── AttackTooltip.tsx       → export default memo(AttackTooltip)
├── BattleCommentator.tsx   → export default memo(BattleCommentator)
├── Battlefield.tsx         → export default memo(Battlefield)
├── BattleReport.tsx        → export default memo(BattleReport)
├── BlueTeamPanel.tsx       → export default memo(BlueTeamPanel)
├── DefenseActivationFeed.tsx → export default memo(DefenseActivationFeed)
├── DefenseShield.tsx       → export default memo(DefenseShield)
├── EventTimeline.tsx       → export default memo(EventTimeline)
├── RedTeamPanel.tsx        → export default memo(RedTeamPanel)
└── ScoreBoard.tsx          → export default memo(ScoreBoard)
```

**Pattern:**
```typescript
import { memo } from 'react'

interface RedTeamPanelProps {
  attacks: Attack[]
  onLaunch: (attackId: string) => void
}

function RedTeamPanel({ attacks, onLaunch }: RedTeamPanelProps) {
  // ... component logic
}

export default memo(RedTeamPanel)
```

**Acceptance Criteria:**
- [ ] All 11 battle components use `React.memo`
- [ ] React DevTools Profiler: <5 unnecessary re-renders per action
- [ ] Performance improvement visible in Chrome DevTools

**Subtasks:**
- [ ] Add memo to all battle/* components
- [ ] Test each component: props unchanged → no re-render
- [ ] Commit: `perf(battle): memoize all battle components`

---

### Task 1.4: Lazy Load Mission JSONs

**Priority:** HIGH 🔥
**Effort:** 2 hours
**Assignee:** TBD

**Problem:**
```typescript
// Current: 128KB bundled in main chunk
import equifaxMission from '@/data/missions/equifax-2017.json'  // 60KB
import moveitMission from '@/data/missions/moveit-2023.json'    // 39KB
import capitalOneMission from '@/data/missions/capital-one-2019.json' // 29KB
```

**Solution: Fetch from `/public`**

**Step 1: Move files**
```bash
mv frontend/src/data/missions/*.json frontend/public/missions/
```

**Step 2: Update `TimeBreach.tsx`**
```typescript
// Before:
import equifaxMission from '@/data/missions/equifax-2017.json'

// After:
const loadMission = async (id: string) => {
  const response = await fetch(`/missions/${id}.json`)
  return response.json()
}

useEffect(() => {
  if (missionId) {
    loadMission(missionId).then(mission => {
      setSelectedMission(mission)
      setGamePhase('briefing')
    })
  }
}, [missionId])
```

**Acceptance Criteria:**
- [ ] Mission JSONs in `public/missions/`
- [ ] Main bundle size reduced by ~128KB
- [ ] Missions load on-demand
- [ ] Loading spinner while fetching

**Subtasks:**
- [ ] Move JSON files to `public/missions/`
- [ ] Update `TimeBreach.tsx` imports
- [ ] Add loading state
- [ ] Test: Navigate to mission → JSON loads
- [ ] Verify bundle size reduction
- [ ] Commit: `perf(missions): lazy load JSON data from public folder`

---

### Task 1.5: Security Fix - npm audit

**Priority:** MEDIUM ⚠️
**Effort:** 5 minutes
**Assignee:** TBD

**Problem:**
```bash
npm audit
# glob 10.2.0 - 10.4.5
# Severity: HIGH - Command injection
```

**Solution:**
```bash
npm audit fix
npm audit  # Verify fixed
```

**Acceptance Criteria:**
- [ ] `npm audit` reports 0 high/critical vulnerabilities

**Subtasks:**
- [ ] Run `npm audit fix`
- [ ] Verify build still works
- [ ] Commit: `fix(deps): resolve glob security vulnerability`

---

### Task 1.6: Add TypeScript Validation to CI

**Priority:** MEDIUM
**Effort:** 30 minutes
**Assignee:** TBD

**Update `package.json`:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build"
  }
}
```

**Acceptance Criteria:**
- [ ] `npm run build` fails if TypeScript errors
- [ ] All developers run type checks before commit

**Subtasks:**
- [ ] Add `typecheck` script
- [ ] Update `build` script
- [ ] Test: introduce TS error → build fails
- [ ] Commit: `chore(ci): add TypeScript validation to build`

---

## ⚠️ PHASE 2: PERFORMANCE & BUNDLE OPTIMIZATION

**Duration:** 5 days (Week 2)
**Goal:** Reduce bundle size by 50% and optimize rendering
**Status:** ✅ COMPLETED

### Task 2.1: Code Splitting for Recharts

**Priority:** HIGH 🔥
**Effort:** 1 day
**Assignee:** TBD

**Problem:** Recharts (313KB) bundled in main chunk, used in 3-4 components only.

**Components Using Recharts:**
```
MetricsChart.tsx
AttackPatternTimeline.tsx (siem)
WafAnalytics.tsx
```

**Solution: Lazy Load Chart Components**

**Option A: Lazy load entire components**
```typescript
// pages/WafAnalytics.tsx
const WafSignatureBreakdown = lazy(() => import('@/components/waf/WafSignatureBreakdown'))

// In render:
<Suspense fallback={<LoadingSkeleton variant="chart" />}>
  <WafSignatureBreakdown />
</Suspense>
```

**Option B: Dynamic import in components**
```typescript
// components/MetricsChart.tsx
import { lazy, Suspense } from 'react'

const RechartsComponent = lazy(() =>
  import('recharts').then(module => ({
    default: () => <module.LineChart>...</module.LineChart>
  }))
)

export function MetricsChart() {
  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <RechartsComponent />
    </Suspense>
  )
}
```

**Acceptance Criteria:**
- [ ] Recharts not in main bundle (`index-*.js`)
- [ ] Separate `charts-*.js` chunk loaded on-demand
- [ ] Main bundle reduced by ~300KB
- [ ] Chart components show loading state

**Subtasks:**
- [ ] Wrap all chart components in lazy()
- [ ] Add Suspense with LoadingSkeleton
- [ ] Update vite.config.ts manualChunks (verify Recharts chunking)
- [ ] Test: Navigate to page with charts → separate chunk loads
- [ ] Verify bundle size: `npm run build && ls -lh dist/assets/`
- [ ] Commit: `perf(bundle): lazy load Recharts (313KB savings)`

---

### Task 2.2: Dynamic Import for docs.ts

**Priority:** HIGH 🔥
**Effort:** 4 hours
**Assignee:** TBD

**Problem:** `content/docs.ts` (81KB, 2383 lines) bundled in main chunk.

**Solution:**

**Step 1: Convert to async loader**
```typescript
// utils/docsLoader.ts
export const loadDocs = async () => {
  const module = await import('@/content/docs')
  return module.DOC_SECTIONS
}
```

**Step 2: Update Docs page**
```typescript
// pages/Docs.tsx
import { useState, useEffect } from 'react'

export function Docs() {
  const [docs, setDocs] = useState<DocSection[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocs().then(sections => {
      setDocs(sections)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSkeleton variant="page" />

  return <DocViewer sections={docs} />
}
```

**Acceptance Criteria:**
- [ ] `docs.ts` not in main bundle
- [ ] Separate `docs-*.js` chunk
- [ ] Main bundle reduced by ~80KB
- [ ] Docs page shows loading spinner

**Subtasks:**
- [ ] Create `utils/docsLoader.ts`
- [ ] Update `pages/Docs.tsx` to lazy load
- [ ] Add loading state
- [ ] Test: Navigate to /docs → docs chunk loads
- [ ] Verify bundle size reduction
- [ ] Commit: `perf(bundle): lazy load docs.ts (81KB savings)`

---

### Task 2.3: Lazy Load Monaco Editor

**Priority:** MEDIUM
**Effort:** 30 minutes
**Assignee:** TBD

**Problem:** Monaco Editor (~2MB) bundled, used only in CodePlayground (Time Breach).

**Solution:**
```typescript
// components/timebreach/CodePlayground.tsx
const MonacoEditor = lazy(() => import('@monaco-editor/react'))

export function CodePlayground() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <MonacoEditor />
    </Suspense>
  )
}
```

**Acceptance Criteria:**
- [ ] Monaco in separate chunk
- [ ] Only loads when CodePlayground rendered
- [ ] Loading indicator shown

**Subtasks:**
- [ ] Lazy load `@monaco-editor/react`
- [ ] Add Suspense
- [ ] Test: Open CodePlayground → Monaco loads
- [ ] Commit: `perf(bundle): lazy load Monaco Editor`

---

### Task 2.4: Memoize Heavy Components

**Priority:** MEDIUM
**Effort:** 2 hours
**Assignee:** TBD

**Components to Memoize:**
```
MetricsChart.tsx (contains Recharts)
ServiceDiagram.tsx (414 lines, SVG animations)
DataFlowAnimation.tsx (362 lines, Framer Motion)
AttackExecutionPanel.tsx (687 lines)
```

**Pattern:**
```typescript
import { memo } from 'react'

function MetricsChart({ data, timeRange }: Props) {
  // ...
}

export default memo(MetricsChart, (prev, next) => {
  // Custom comparison if needed
  return prev.data === next.data && prev.timeRange === next.timeRange
})
```

**Acceptance Criteria:**
- [ ] All heavy components memoized
- [ ] React DevTools: <5 unnecessary re-renders

**Subtasks:**
- [ ] Memoize each component
- [ ] Test with React DevTools Profiler
- [ ] Commit: `perf(rendering): memoize heavy components`

---

### Task 2.5: Audit Timer Usage (Memory Leaks)

**Priority:** MEDIUM
**Effort:** 3 hours
**Assignee:** TBD

**Problem:** 58 `setTimeout/setInterval` calls, potential memory leaks.

**Audit Script:**
```bash
grep -rn "setTimeout\|setInterval" src/ --include="*.tsx" --include="*.ts" > timer_audit.txt
```

**Check Each Usage:**
1. Is cleanup done in `useEffect` return?
2. Are dependencies correct?
3. Can interval be increased (< 500ms is bad)?

**Pattern to Fix:**
```typescript
// ❌ BAD - no cleanup
useEffect(() => {
  setInterval(() => fetchData(), 1000)
}, [])

// ✅ GOOD - proper cleanup
useEffect(() => {
  const interval = setInterval(() => fetchData(), 1000)
  return () => clearInterval(interval)
}, [])
```

**Acceptance Criteria:**
- [ ] All timers have cleanup
- [ ] No intervals < 500ms (except animations)
- [ ] Document created: `docs/frontend/TIMER_AUDIT.md`

**Subtasks:**
- [ ] Audit all 58 timer usages
- [ ] Fix missing cleanups
- [ ] Increase too-frequent intervals
- [ ] Create audit document
- [ ] Commit: `fix(timers): ensure proper cleanup and prevent memory leaks`

---

## 📦 PHASE 3: ARCHITECTURE IMPROVEMENTS

**Duration:** 5 days (Week 3)
**Goal:** Improve code structure and maintainability
**Status:** 🔵 IN PROGRESS

### Task 3.1: Refactor AttackExecutionPanel

**Priority:** MEDIUM
**Effort:** 1 day
**Assignee:** TBD

**Problem:** 687 lines, mixed concerns, 10+ useState hooks.

**New Structure:**
```
components/AttackExecutionPanel/
├── index.tsx                 # Main component (150 lines)
├── forms/
│   ├── BruteForceForm.tsx   # Brute force attack params
│   ├── IdorForm.tsx         # IDOR attack params
│   ├── MfaForm.tsx          # MFA bruteforce params
│   ├── RateLimitForm.tsx    # Rate limit bypass params
│   └── TokenReplayForm.tsx  # Token replay params
├── hooks/
│   └── useAttackExecution.ts # Attack execution logic (custom hook)
├── AttackLogger.tsx         # Already exists, keep it
├── AttackResults.tsx        # Already exists, keep it
└── types.ts                 # Shared types
```

**Main Component:**
```typescript
// components/AttackExecutionPanel/index.tsx
export function AttackExecutionPanel({ scenario, onClose }: Props) {
  const { execute, isExecuting, logs, result } = useAttackExecution()

  return (
    <Modal onClose={onClose}>
      {scenario.id === 'brute-force' && <BruteForceForm onExecute={execute} />}
      {scenario.id === 'idor' && <IdorForm onExecute={execute} />}
      {/* ... */}
      <AttackLogger logs={logs} />
      <AttackResults result={result} />
    </Modal>
  )
}
```

**Custom Hook:**
```typescript
// components/AttackExecutionPanel/hooks/useAttackExecution.ts
export function useAttackExecution() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [logs, setLogs] = useState<AttackLog[]>([])
  const [result, setResult] = useState<ExecutionResult | null>(null)

  const execute = async (attackFn: () => Promise<void>) => {
    setIsExecuting(true)
    // ... execution logic
    setIsExecuting(false)
  }

  return { execute, isExecuting, logs, result, setLogs }
}
```

**Acceptance Criteria:**
- [ ] Main component < 200 lines
- [ ] Each form component < 100 lines
- [ ] Logic extracted to custom hook
- [ ] All tests still pass
- [ ] No functionality broken

**Subtasks:**
- [ ] Create folder structure
- [ ] Extract forms to separate components
- [ ] Create `useAttackExecution` hook
- [ ] Update imports in parent components
- [ ] Test all attack scenarios
- [ ] Commit: `refactor(attacks): split AttackExecutionPanel into smaller components`

---

### Task 3.2: Migrate to React Query

**Priority:** MEDIUM
**Effort:** 4 hours
**Assignee:** TBD

**Problem:** Inconsistent API layer, raw `fetch()` calls everywhere.

**Setup React Query Provider:**
```typescript
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

**Example Migration:**

**Before:**
```typescript
// components/IncidentTimeline.tsx
useEffect(() => {
  fetch('/incidents')
    .then(r => r.json())
    .then(setIncidents)
    .catch(setError)
}, [])
```

**After:**
```typescript
import { useQuery } from '@tanstack/react-query'

const { data: incidents, isLoading, error } = useQuery({
  queryKey: ['incidents'],
  queryFn: () => incidentService.getAll()
})
```

**Components to Migrate:**
- `IncidentTimeline.tsx`
- `ServiceHealthPanel.tsx`
- `MetricsChart.tsx`
- `IdsAlertsPanel.tsx`
- All components using raw `fetch()`

**Acceptance Criteria:**
- [ ] React Query provider in `main.tsx`
- [ ] All data fetching uses `useQuery`
- [ ] Mutations use `useMutation`
- [ ] Loading/error states consistent
- [ ] Data cached across components

**Subtasks:**
- [ ] Setup QueryClientProvider
- [ ] Migrate incident fetching
- [ ] Migrate metrics fetching
- [ ] Migrate service health checks
- [ ] Remove redundant loading states
- [ ] Commit: `refactor(api): migrate to React Query for data fetching`

---

### Task 3.3: Add Error Boundaries

**Priority:** LOW (but recommended)
**Effort:** 1 hour
**Assignee:** TBD

**Create ErrorBoundary Component:**
```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Add to App:**
```typescript
// App.tsx
function App() {
  return (
    <SecurityProvider>
      <TutorialProvider>
        <BrowserRouter basename={basename}>
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
        </BrowserRouter>
      </TutorialProvider>
    </SecurityProvider>
  )
}
```

**Add Section-Level Boundaries:**
```typescript
// pages/BattleArena.tsx
<ErrorBoundary fallback={<div>Battle Arena error. Please refresh.</div>}>
  <Battlefield />
</ErrorBoundary>
```

**Acceptance Criteria:**
- [ ] Root-level ErrorBoundary in App
- [ ] Section-level boundaries in heavy pages (Battle, TimeBreach)
- [ ] User-friendly error messages
- [ ] Errors logged to console

**Subtasks:**
- [ ] Create ErrorBoundary component
- [ ] Add to App.tsx
- [ ] Add to heavy sections
- [ ] Test: Throw error → boundary catches
- [ ] Commit: `feat(error): add ErrorBoundary components`

---

### Task 3.4: Environment Configuration

**Priority:** LOW
**Effort:** 2 hours
**Assignee:** TBD

**Create `.env` files:**

```bash
# .env.development
VITE_API_GATEWAY_URL=http://localhost:8080
VITE_AUTH_SERVICE_URL=http://localhost:8000
VITE_USER_SERVICE_URL=http://localhost:8002
VITE_PROMETHEUS_URL=http://localhost:9090
VITE_GRAFANA_URL=http://localhost:3000
VITE_INCIDENT_BOT_URL=http://localhost:5002

# .env.production
VITE_API_GATEWAY_URL=https://api.yourdomain.com
# ...
```

**Create config file:**
```typescript
// config/env.ts
export const config = {
  apiGatewayUrl: import.meta.env.VITE_API_GATEWAY_URL,
  authServiceUrl: import.meta.env.VITE_AUTH_SERVICE_URL,
  userServiceUrl: import.meta.env.VITE_USER_SERVICE_URL,
  prometheusUrl: import.meta.env.VITE_PROMETHEUS_URL,
  grafanaUrl: import.meta.env.VITE_GRAFANA_URL,
  incidentBotUrl: import.meta.env.VITE_INCIDENT_BOT_URL,
} as const
```

**Update services:**
```typescript
// services/apiClient.ts
import { config } from '@/config/env'

const baseURL = config.apiGatewayUrl
```

**Acceptance Criteria:**
- [ ] All URLs in `.env` files
- [ ] No hardcoded `localhost` in code
- [ ] Config typed and exported
- [ ] Works in dev and production

**Subtasks:**
- [ ] Create `.env.development`
- [ ] Create `.env.production`
- [ ] Create `config/env.ts`
- [ ] Replace hardcoded URLs
- [ ] Update `.gitignore` (`.env.local`)
- [ ] Update docs: how to configure
- [ ] Commit: `feat(config): add environment-based configuration`

---

### Task 3.5: Refactor battleEngine to Hooks (Optional)

**Priority:** LOW (high effort, can defer)
**Effort:** 2 days
**Assignee:** TBD

**Problem:** Singleton class pattern not idiomatic in React.

**New Approach: Custom Hook**
```typescript
// hooks/useBattleEngine.ts
export function useBattleEngine(scenario: BattleScenario | null) {
  const [state, setState] = useState<BattleState | null>(null)
  const timersRef = useRef<{ phase: number, auto: number, update: number }>()

  const startBattle = useCallback((scenario: BattleScenario) => {
    // ... battle logic
    setState(initialState)
  }, [])

  const stopBattle = useCallback(() => {
    // Clear timers
    clearInterval(timersRef.current?.phase)
    clearInterval(timersRef.current?.auto)
    clearInterval(timersRef.current?.update)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopBattle()
  }, [stopBattle])

  return { state, startBattle, stopBattle, launchAttack, activateDefense }
}
```

**Usage:**
```typescript
// pages/BattleArena.tsx
export function BattleArena() {
  const { state, startBattle, launchAttack } = useBattleEngine()

  // ... UI
}
```

**Acceptance Criteria:**
- [ ] No singleton class
- [ ] All state managed by React
- [ ] Automatic cleanup
- [ ] Easier testing
- [ ] Same functionality

**Subtasks:**
- [ ] Create `hooks/useBattleEngine.ts`
- [ ] Port battle logic from class
- [ ] Update BattleArena to use hook
- [ ] Remove old battleEngine.ts
- [ ] Test all battle scenarios
- [ ] Commit: `refactor(battle): convert battleEngine class to React hook`

**Note:** This is OPTIONAL and high effort. Can defer to later if time-constrained.

---

## ✅ PHASE 4: TESTING & VALIDATION

**Duration:** 3 days (Week 4)
**Goal:** Ensure stability and prevent regressions
**Status:** 🟢 NICE TO HAVE

### Task 4.1: Setup Testing Infrastructure

**Priority:** LOW (but foundation for future)
**Effort:** 2 hours
**Assignee:** TBD

**Install Dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Create Config:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Setup File:**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
```

**Update package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Acceptance Criteria:**
- [ ] Vitest configured
- [ ] React Testing Library installed
- [ ] Test script runs

**Subtasks:**
- [ ] Install dependencies
- [ ] Create vitest.config.ts
- [ ] Create setup file
- [ ] Write first test (smoke test)
- [ ] Run `npm test`
- [ ] Commit: `chore(test): setup Vitest and React Testing Library`

---

### Task 4.2: Write Critical Flow Tests

**Priority:** LOW
**Effort:** 1 day
**Assignee:** TBD

**Test Coverage Targets:**

1. **Authentication Flow**
```typescript
// components/AuthenticationPanel.test.tsx
describe('AuthenticationPanel', () => {
  it('should login with valid credentials', async () => {
    render(<AuthenticationPanel />)

    await userEvent.type(screen.getByLabelText('Username'), 'admin')
    await userEvent.type(screen.getByLabelText('Password'), 'admin123')
    await userEvent.click(screen.getByText('Login'))

    expect(await screen.findByText('MFA Code')).toBeInTheDocument()
  })
})
```

2. **Attack Execution**
```typescript
// components/AttackExecutionPanel.test.tsx
describe('AttackExecutionPanel', () => {
  it('should execute brute force attack', async () => {
    const scenario = { id: 'brute-force', /* ... */ }
    render(<AttackExecutionPanel scenario={scenario} onClose={jest.fn()} />)

    await userEvent.click(screen.getByText('Execute Attack'))

    expect(await screen.findByText(/Attack completed/i)).toBeInTheDocument()
  })
})
```

3. **Battle Arena**
```typescript
// pages/BattleArena.test.tsx
describe('BattleArena', () => {
  it('should start battle and update score', async () => {
    render(<BattleArena />)

    await userEvent.click(screen.getByText('Start Battle'))

    expect(screen.getByText(/Red Team:/)).toBeInTheDocument()
    expect(screen.getByText(/Blue Team:/)).toBeInTheDocument()
  })
})
```

**Acceptance Criteria:**
- [ ] Auth flow tested
- [ ] Attack execution tested
- [ ] Battle arena tested
- [ ] Code coverage > 50% for critical components

**Subtasks:**
- [ ] Write auth tests
- [ ] Write attack tests
- [ ] Write battle tests
- [ ] Run coverage report
- [ ] Commit: `test: add critical flow tests`

---

### Task 4.3: Setup E2E Tests (Playwright)

**Priority:** LOW
**Effort:** 1 day
**Assignee:** TBD

**Install Playwright:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Config:**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
  },
})
```

**Example Test:**
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('complete authentication flow', async ({ page }) => {
  await page.goto('/')

  // Login
  await page.fill('[name="username"]', 'admin')
  await page.fill('[name="password"]', 'admin123')
  await page.click('button:has-text("Login")')

  // MFA
  await expect(page.locator('text=MFA Code')).toBeVisible()
})
```

**Acceptance Criteria:**
- [ ] Playwright configured
- [ ] Cross-browser tests (Chrome, Firefox, Safari)
- [ ] Auth flow E2E test
- [ ] Attack flow E2E test

**Subtasks:**
- [ ] Install Playwright
- [ ] Create config
- [ ] Write E2E tests
- [ ] Run on CI
- [ ] Commit: `test: add Playwright E2E tests`

---

### Task 4.4: Performance Audit

**Priority:** MEDIUM
**Effort:** 4 hours
**Assignee:** TBD

**Lighthouse CI:**
```bash
npm install -D @lhci/cli

# .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["warn", {"minScore": 0.9}]
      }
    }
  }
}
```

**Bundle Analysis:**
```bash
npm install -D rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, gzipSize: true })
  ]
})
```

**Metrics to Track:**
- Time to Interactive (TTI): < 3s
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Total Bundle Size: < 3MB

**Acceptance Criteria:**
- [ ] Lighthouse Performance Score > 90
- [ ] Bundle visualization generated
- [ ] All Core Web Vitals in green
- [ ] Report documented

**Subtasks:**
- [ ] Setup Lighthouse CI
- [ ] Run performance audit
- [ ] Generate bundle analysis
- [ ] Document findings
- [ ] Create optimization plan if needed
- [ ] Commit: `docs(perf): add performance audit report`

---

### Task 4.5: Cross-Browser Testing

**Priority:** LOW
**Effort:** 2 hours
**Assignee:** TBD

**Test Matrix:**
- Chrome (latest)
- Firefox (latest)
- Safari (16.x, 17.x)
- Edge (latest)
- Mobile Safari (iOS)
- Mobile Chrome (Android)

**Test Scenarios:**
1. Page navigation
2. Authentication flow
3. Attack execution
4. Battle Arena (animations)
5. Time Breach (Monaco Editor)
6. Responsive layout (mobile/tablet/desktop)

**Known Issues to Check:**
- Framer Motion GPU acceleration (Firefox Linux)
- React 19 rendering (Safari 16)
- Monaco Editor (mobile)
- Canvas confetti (iOS)

**Acceptance Criteria:**
- [ ] All browsers tested
- [ ] No critical bugs
- [ ] Mobile experience acceptable
- [ ] Known issues documented

**Subtasks:**
- [ ] Test on all browsers
- [ ] Document issues
- [ ] Create compatibility matrix
- [ ] Commit: `docs(compat): add cross-browser test results`

---

## 📊 Success Metrics

**Before Refactoring:**
- ❌ TypeScript Errors: 29
- ❌ Bundle Size: 6MB
- ❌ Main Chunk: 313KB (charts)
- ❌ Performance: setInterval(100ms)
- ❌ Memoization: 0 components
- ❌ Test Coverage: 0%
- ❌ Lighthouse Score: ~70

**Current State (Phase 1 & 2 Complete):**
- ✅ TypeScript Errors: 0 (ACHIEVED)
- ✅ Bundle Size: ~1.4MB total (EXCEEDED TARGET - 77% reduction!)
- ✅ Main Chunk: 232KB index.js (main logic)
- ✅ Charts Chunk: 320KB (lazy loaded)
- ✅ Performance: Event-driven architecture (ACHIEVED)
- ✅ Memoization: 13+ components (battle + heavy components)
- ⏳ Test Coverage: 0% (Phase 4)
- ⏳ Lighthouse Score: Not measured yet

**After Full Refactoring (Target):**
- ✅ TypeScript Errors: 0 ✓
- ✅ Bundle Size: <3MB (-50%) ✓ EXCEEDED
- ✅ Main Chunk: <150KB → 232KB (acceptable)
- ✅ Performance: Event-driven ✓
- ✅ Memoization: 20+ components (in progress)
- ⏳ Test Coverage: >50% critical flows (Phase 4)
- ⏳ Lighthouse Score: >90 (Phase 4)

---

## 🚀 Execution Guidelines

### Daily Workflow

1. **Start of Day:**
   - Review todo list
   - Pick next task from current phase
   - Create feature branch: `refactor/task-name`

2. **During Development:**
   - Update todo status to "in_progress"
   - Commit frequently (atomic commits)
   - Run tests before committing

3. **End of Day:**
   - Mark completed tasks
   - Push to remote
   - Update progress in this document

### Commit Message Format

```
type(scope): brief description

- Detailed change 1
- Detailed change 2
- Fixes #issue-number
```

**Types:**
- `fix`: Bug fix
- `feat`: New feature
- `perf`: Performance improvement
- `refactor`: Code restructuring
- `test`: Test additions
- `docs`: Documentation
- `chore`: Maintenance

**Examples:**
```
fix(typescript): resolve 29 compilation errors

- Add @types/node to tsconfig
- Fix NodeJS.Timeout types in battleEngine
- Remove unused variables in BattleArena
- Fix mission type mismatches in TimeBreach

perf(bundle): lazy load Recharts (313KB savings)

- Wrap chart components in lazy()
- Add Suspense with LoadingSkeleton
- Update vite.config.ts manualChunks
- Reduces main bundle from 6MB to 3.5MB
```

### Testing Before Commit

```bash
# Always run before committing:
npm run typecheck     # TypeScript validation
npm run lint          # ESLint checks
npm run test          # Unit tests (when available)
npm run build         # Verify production build works
```

### Code Review Checklist

- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Tests pass (if applicable)
- [ ] Bundle size not increased (unless expected)
- [ ] Performance not degraded
- [ ] Documentation updated
- [ ] Commit message follows format

---

## 📚 Resources

### Documentation
- [React 19 Migration Guide](https://react.dev/blog/2024/04/25/react-19)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [React Query Best Practices](https://tkdodo.eu/blog/react-query-best-practices)
- [Web Vitals](https://web.dev/vitals/)

### Tools
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Bundle Analyzer](https://github.com/btd/rollup-plugin-visualizer)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)

### Internal Docs
- `docs/frontend/ARCHITECTURE.md` (to be created)
- `docs/frontend/TIMER_AUDIT.md` (created in Phase 2)
- `docs/frontend/TESTING_GUIDE.md` (created in Phase 4)

---

## 🤝 Team Communication

### Daily Standup Questions
1. What did I complete yesterday?
2. What am I working on today?
3. Any blockers?

### Blocker Resolution
- Document blocker in this roadmap
- Tag relevant team members
- Schedule sync if needed

### Progress Tracking
- Update todo list daily
- Mark phase progress in this document
- Weekly review meeting

---

## 📝 Notes & Decisions

### Decisions Made
- **React 19:** Keeping for now, monitoring issues
- **Framer Motion:** Keeping (will evaluate replacement in next phase)
- **Zustand:** Keeping for global state
- **battleEngine refactor:** Deferred to Phase 4+ (optional)

### Open Questions
- [ ] Deploy target: GitHub Pages or custom server?
- [ ] Analytics tracking needed?
- [ ] Internationalization (i18n) future requirement?

---

## 🎯 Next Steps After Refactoring

Once this roadmap is complete:

1. **Feature Freeze Lifted** - Safe to add new features
2. **Documentation Phase** - Create architecture docs
3. **Performance Monitoring** - Setup real user monitoring
4. **Accessibility Audit** - WCAG compliance check
5. **SEO Optimization** - Meta tags, Open Graph, etc.

---

**Document Version:** 1.1
**Last Updated:** 2025-12-18
**Status:** 🔵 Phase 3 In Progress (Phase 1 & 2 Complete)

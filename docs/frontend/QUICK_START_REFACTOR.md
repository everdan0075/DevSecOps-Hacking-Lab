# Quick Start - Frontend Refactoring

**Start Date:** TBD
**Target:** 3 weeks (15 working days)
**Goal:** Fix critical issues, reduce bundle size 50%, improve performance

---

## ⚡ Week 1: CRITICAL BLOCKERS (3 days)

### Day 1: TypeScript Fixes (4-6h)

```bash
# 1. Add @types/node to tsconfig
# Edit: frontend/tsconfig.app.json
{
  "compilerOptions": {
    "types": ["vite/client", "@types/node"]  // ADD THIS LINE
  }
}

# 2. Fix all 29 errors
# Files to fix:
- frontend/src/services/battleEngine.ts (NodeJS.Timeout types)
- frontend/src/pages/BattleArena.tsx (unused variables, type mismatch)
- frontend/src/pages/TimeBreach.tsx (mission type mismatches)

# 3. Verify
npm run build  # Should show 0 TypeScript errors
```

**Expected Result:** ✅ Build passes with zero TypeScript errors

---

### Day 2: Performance Fix (6-8h)

```bash
# 1. Refactor battleEngine to emit events
# Edit: frontend/src/services/battleEngine.ts
# Add event emitter methods (emit, on, off)
# Call emit('stateChanged', state) on every state update

# 2. Update BattleArena to subscribe to events
# Edit: frontend/src/pages/BattleArena.tsx
# Remove setInterval(100ms)
# Add: battleEngine.on('stateChanged', handleStateChange)

# 3. Test
# - Start battle
# - Verify UI updates on events (not polling)
# - Check Chrome DevTools Performance (< 20% CPU)
```

**Expected Result:** ✅ No more setInterval < 500ms, smooth 60fps

---

### Day 3: React.memo & Bundle Optimization (4-6h)

```bash
# 1. Add React.memo to all battle components
cd frontend/src/components/battle
# Edit each file, add: export default memo(ComponentName)

# 2. Lazy load mission JSONs
mv frontend/src/data/missions/*.json frontend/public/missions/
# Edit: frontend/src/pages/TimeBreach.tsx
# Replace imports with: fetch('/missions/mission-id.json')

# 3. Security fix
npm audit fix

# 4. Add typecheck script
# Edit: package.json
"scripts": {
  "typecheck": "tsc --noEmit",
  "build": "npm run typecheck && vite build"
}

# 5. Verify
npm run build
ls -lh dist/assets/*.js  # Check bundle sizes
```

**Expected Result:**
- ✅ Main bundle reduced by ~130KB
- ✅ Build validates TypeScript
- ✅ Zero security vulnerabilities

---

## 🎯 Week 2: BUNDLE OPTIMIZATION (5 days)

### Tasks:
1. **Recharts code splitting** (1 day)
   - Lazy load chart components
   - Target: -313KB from main bundle

2. **docs.ts dynamic import** (4h)
   - Move to lazy load
   - Target: -81KB from main bundle

3. **Monaco Editor lazy load** (30min)
   - Only load for CodePlayground
   - Target: -2MB from initial load

4. **Memoize heavy components** (2h)
   - MetricsChart, ServiceDiagram, DataFlowAnimation
   - Target: Fewer re-renders

5. **Timer audit** (3h)
   - Fix all 58 setTimeout/setInterval usages
   - Ensure cleanup in useEffect

**Expected Result:** Bundle size < 3MB (50% reduction)

---

## 📦 Week 3: ARCHITECTURE (5 days)

### Tasks:
1. **Refactor AttackExecutionPanel** (1 day)
   - Split 687 lines into smaller components
   - Extract custom hook

2. **Migrate to React Query** (4h)
   - Setup QueryClientProvider
   - Replace all fetch() calls

3. **Add ErrorBoundary** (1h)
   - Root level + section level
   - User-friendly error messages

4. **Environment config** (2h)
   - Create .env files
   - Remove hardcoded URLs

5. **Optional: battleEngine hooks refactor** (2 days)
   - Convert class to custom hook
   - Can defer if time-constrained

**Expected Result:** Maintainable codebase, no more class singletons

---

## ✅ Week 4: TESTING (3 days)

### Tasks:
1. **Setup Vitest** (2h)
2. **Write critical tests** (1 day)
   - Auth flow, attack execution, battle
3. **Setup Playwright E2E** (1 day)
4. **Performance audit** (4h)
   - Lighthouse CI, bundle analysis
5. **Cross-browser testing** (2h)

**Expected Result:** 50%+ test coverage, Lighthouse Score > 90

---

## 📋 Daily Checklist

### Before Starting Work:
- [ ] Pull latest from main
- [ ] Review current phase in roadmap
- [ ] Update todo list status to "in_progress"
- [ ] Create feature branch: `refactor/task-name`

### During Work:
- [ ] Commit frequently (atomic commits)
- [ ] Follow commit message format: `type(scope): description`
- [ ] Update progress in todo list

### Before Committing:
```bash
npm run typecheck   # Must pass
npm run lint        # Must pass
npm run build       # Must succeed
git add .
git commit -m "type(scope): description"
```

### After Completing Task:
- [ ] Mark todo as "completed"
- [ ] Push to remote
- [ ] Update REFACTORING_ROADMAP.md with notes
- [ ] Move to next task

---

## 🔧 Essential Commands

```bash
# TypeScript validation
npm run typecheck

# Build and check bundle sizes
npm run build
ls -lh dist/assets/*.js

# Security audit
npm audit
npm audit fix

# Development server
npm run dev

# Linting
npm run lint
npm run lint -- --fix

# Testing (Phase 4)
npm test
npm run test:coverage

# Performance analysis
npm run build -- --mode analyze  # If visualizer plugin added
```

---

## 🚨 Red Flags - Stop and Ask for Help

- TypeScript errors still present after Day 1
- Build time > 30 seconds
- Bundle size increases unexpectedly
- Performance degrades (check Chrome DevTools)
- Tests start failing (Phase 4)
- Memory leaks detected

---

## 📊 Progress Tracking

### Week 1 Progress:
- [ ] Day 1: TypeScript fixes
- [ ] Day 2: Performance fix
- [ ] Day 3: React.memo + bundle optimization

### Week 2 Progress:
- [ ] Day 4: Recharts code splitting
- [ ] Day 5: docs.ts + Monaco lazy load
- [ ] Day 6: Heavy components memoization
- [ ] Day 7: Timer audit
- [ ] Day 8: Buffer/catch-up day

### Week 3 Progress:
- [ ] Day 9: AttackExecutionPanel refactor
- [ ] Day 10: React Query migration
- [ ] Day 11: ErrorBoundary + env config
- [ ] Day 12-13: Optional battleEngine refactor or catch-up

### Week 4 Progress:
- [ ] Day 14: Testing setup + critical tests
- [ ] Day 15: E2E tests + performance audit

---

## 🎯 Success Criteria

At the end of 3 weeks:

- ✅ **Zero TypeScript errors** (npm run build succeeds)
- ✅ **Bundle size < 3MB** (50% reduction from 6MB)
- ✅ **Main chunk < 150KB** (down from 313KB)
- ✅ **No polling < 500ms** (BattleArena event-driven)
- ✅ **20+ components memoized** (battle + heavy components)
- ✅ **50%+ test coverage** (critical flows)
- ✅ **Lighthouse Score > 90** (performance)
- ✅ **Zero high/critical security vulnerabilities**

---

## 📚 Reference Documents

- **Full Roadmap:** `docs/frontend/REFACTORING_ROADMAP.md` (detailed task breakdown)
- **Frontend Review:** (previous conversation) (critical issues analysis)
- **Project Docs:** `CLAUDE.md` (project guidelines)

---

## 💡 Tips

1. **Start with Phase 1** - Don't skip to "fun" tasks, blockers first
2. **Test frequently** - Run build after every major change
3. **Commit often** - Small atomic commits are easier to review/revert
4. **Ask questions early** - Don't struggle for hours, ask for help
5. **Take breaks** - Refactoring is mentally demanding
6. **Celebrate wins** - Mark tasks completed, see progress

---

**Ready to start? Begin with Phase 1, Task 1.1 (TypeScript Fixes)**

Run:
```bash
npm run build  # See the 29 errors
code frontend/tsconfig.app.json  # Start fixing
```

Good luck! 🚀

# Frontend Refactoring - Priority Matrix

**Visual guide for task prioritization**

---

## 🔥 CRITICAL - DO FIRST (Cannot skip)

| Task | Impact | Effort | Risk if Skipped | Deadline |
|------|--------|--------|-----------------|----------|
| Fix TypeScript errors (29) | 🔴 HIGH | 4-6h | Build breaks in CI/CD | Week 1 Day 1 |
| Fix BattleArena polling (100ms) | 🔴 HIGH | 1 day | UX degradation, battery drain | Week 1 Day 2 |
| npm audit fix | 🟡 MEDIUM | 5 min | Security vulnerability | Week 1 Day 3 |
| Add React.memo (battle) | 🔴 HIGH | 4h | Performance degradation | Week 1 Day 3 |

**Total Week 1 Effort:** 3 days
**Must Complete Before:** Adding any new features

---

## ⚠️ HIGH PRIORITY - DO SECOND (Performance impact)

| Task | Impact | Effort | Bundle Savings | Deadline |
|------|--------|--------|----------------|----------|
| Lazy load Recharts | 🔴 HIGH | 1 day | -313KB | Week 2 |
| Lazy load mission JSONs | 🟡 MEDIUM | 2h | -128KB | Week 1 Day 3 |
| Dynamic import docs.ts | 🟡 MEDIUM | 4h | -81KB | Week 2 |
| Lazy load Monaco Editor | 🟡 MEDIUM | 30min | -2MB (conditional) | Week 2 |
| Memoize heavy components | 🟡 MEDIUM | 2h | Better rendering | Week 2 |
| Timer audit (58 occurrences) | 🟠 MEDIUM | 3h | Prevent memory leaks | Week 2 |

**Total Week 2 Effort:** 5 days
**Expected Outcome:** Bundle size < 3MB (50% reduction)

---

## 🟡 MEDIUM PRIORITY - DO THIRD (Architecture)

| Task | Impact | Effort | Maintainability | Deadline |
|------|--------|--------|-----------------|----------|
| Refactor AttackExecutionPanel | 🟡 MEDIUM | 1 day | Easier to maintain | Week 3 |
| Migrate to React Query | 🟡 MEDIUM | 4h | Consistent API layer | Week 3 |
| Add ErrorBoundary | 🟢 LOW | 1h | Better UX on errors | Week 3 |
| Environment config (.env) | 🟢 LOW | 2h | Deployment flexibility | Week 3 |
| Refactor battleEngine class | 🟠 MEDIUM | 2 days | React-idiomatic (OPTIONAL) | Week 3 or defer |

**Total Week 3 Effort:** 5 days (or 3 if skip battleEngine refactor)
**Expected Outcome:** Maintainable, scalable codebase

---

## 🟢 LOW PRIORITY - DO FOURTH (Nice to have)

| Task | Impact | Effort | Benefit | Deadline |
|------|--------|--------|---------|----------|
| Setup Vitest | 🟢 LOW | 2h | Test infrastructure | Week 4 |
| Write critical tests | 🟡 MEDIUM | 1 day | Prevent regressions | Week 4 |
| Setup Playwright E2E | 🟢 LOW | 1 day | Cross-browser validation | Week 4 |
| Performance audit | 🟡 MEDIUM | 4h | Baseline metrics | Week 4 |
| Cross-browser testing | 🟢 LOW | 2h | Compatibility check | Week 4 |

**Total Week 4 Effort:** 3 days
**Expected Outcome:** Test coverage > 50%, Lighthouse > 90

---

## 📊 Impact vs Effort Matrix

```
HIGH IMPACT                      🔴 TypeScript fixes
    │                            🔴 BattleArena polling
    │                            🔴 React.memo battle
    │                   🔴 Recharts lazy load
    │
    │          🟡 docs.ts lazy      🟡 Monaco lazy
    │          🟡 Mission JSONs     🟡 Heavy components memo
    │          🟡 React Query       🟡 Timer audit
    │
    │ 🟢 ErrorBoundary  🟢 Env config
    │ 🟢 Tests          🟢 E2E
LOW IMPACT
    └───────────────────────────────────────────────────►
       LOW EFFORT              MEDIUM               HIGH EFFORT
                                                    🟠 battleEngine refactor
```

**Legend:**
- 🔴 Do immediately (blockers)
- 🟡 Do soon (high ROI)
- 🟢 Do when ready (nice to have)
- 🟠 Optional (can defer)

---

## 🎯 Recommended Execution Order

### Phase 1: Blockers (MUST DO)
1. ✅ Fix TypeScript errors → **Unblocks CI/CD**
2. ✅ Fix BattleArena polling → **Unblocks UX**
3. ✅ Add React.memo (battle) → **Unblocks performance**
4. ✅ Lazy load mission JSONs → **Quick win**
5. ✅ npm audit fix → **Security**

**Why this order?**
- TypeScript first: Everything else depends on type safety
- Performance second: Users feel the difference immediately
- Quick wins included: Build momentum

---

### Phase 2: Performance (HIGH ROI)
1. ✅ Recharts code splitting → **Biggest bundle reduction**
2. ✅ docs.ts dynamic import → **Second biggest**
3. ✅ Monaco lazy load → **Conditional load**
4. ✅ Memoize heavy components → **Rendering performance**
5. ✅ Timer audit → **Memory leak prevention**

**Why this order?**
- Start with biggest wins (Recharts -313KB)
- Bundle size improvements compound
- Timer audit last (most time-consuming)

---

### Phase 3: Architecture (FOUNDATION)
1. ✅ Refactor AttackExecutionPanel → **Most complex component**
2. ✅ Migrate to React Query → **API consistency**
3. ✅ Add ErrorBoundary → **Quick win**
4. ✅ Env config → **Quick win**
5. ⚠️ battleEngine refactor → **OPTIONAL** (high effort, can defer)

**Why this order?**
- AttackExecutionPanel first: Sets pattern for other refactors
- React Query early: Other components can follow pattern
- Quick wins (ErrorBoundary, env) for morale
- battleEngine last: Can defer if time-constrained

---

### Phase 4: Testing (SAFETY NET)
1. ✅ Setup Vitest → **Foundation**
2. ✅ Critical flow tests → **Auth, attacks, battle**
3. ✅ Playwright E2E → **Cross-browser**
4. ✅ Performance audit → **Lighthouse**
5. ✅ Cross-browser manual test → **Final check**

**Why this order?**
- Setup first: Enables all other tests
- Unit tests before E2E: Faster feedback loop
- Performance audit near end: Measure all improvements

---

## 🚫 What NOT to Do

| Anti-Pattern | Why It's Bad | Better Approach |
|--------------|--------------|-----------------|
| Skip TypeScript fixes | Build will break in production | Fix immediately (Day 1) |
| Add new features before refactor | Technical debt compounds | Feature freeze during refactor |
| Refactor everything at once | High risk of breaking changes | Incremental, phase by phase |
| Skip testing phase | Regressions will occur | At least critical flow tests |
| Over-engineer solutions | Wastes time, adds complexity | Keep it simple (KISS principle) |
| Work without branches | Hard to rollback | Use feature branches |
| Commit large changes | Hard to review/debug | Atomic commits |

---

## 📈 Progress Tracking Milestones

### Milestone 1: Unblocked (End of Week 1)
- ✅ TypeScript errors: 29 → 0
- ✅ Build passes with `tsc --noEmit`
- ✅ BattleArena: No more setInterval(100ms)
- ✅ Security: 0 high/critical vulnerabilities

**Celebration:** 🎉 Build is stable, can continue confidently

---

### Milestone 2: Performant (End of Week 2)
- ✅ Bundle size: 6MB → <3MB
- ✅ Main chunk: 313KB → <150KB
- ✅ Recharts: Lazy loaded
- ✅ Mission JSONs: On-demand
- ✅ Components: 20+ memoized

**Celebration:** 🎉 App loads 2x faster

---

### Milestone 3: Maintainable (End of Week 3)
- ✅ AttackExecutionPanel: 687 lines → <200 lines main + sub-components
- ✅ API calls: All using React Query
- ✅ Error handling: ErrorBoundary in place
- ✅ Config: Environment-based
- ✅ (Optional) battleEngine: Converted to hooks

**Celebration:** 🎉 New developers can onboard easily

---

### Milestone 4: Tested (End of Week 4)
- ✅ Tests: >50% coverage (critical flows)
- ✅ E2E: Auth + attacks + battle scenarios
- ✅ Performance: Lighthouse score >90
- ✅ Compatibility: Chrome, Firefox, Safari tested

**Celebration:** 🎉 Production-ready, feature freeze lifted

---

## 🎯 Decision Framework

**When in doubt, ask yourself:**

1. **Does this block other work?** → Do first (CRITICAL)
2. **Will users notice immediately?** → High priority
3. **Is it a quick win (<2h)?** → Do it now (momentum)
4. **Can it wait until next sprint?** → Defer (LOW priority)
5. **Is it optional/nice-to-have?** → Defer or skip

**Example:**
- TypeScript errors? → Blocks CI/CD → **CRITICAL**
- Recharts lazy load? → Users feel slow load → **HIGH**
- ErrorBoundary? → Quick win, better UX → **Do now**
- battleEngine refactor? → High effort, optional → **Defer**

---

## 📞 Escalation Path

**If stuck for > 2 hours:**

1. **Google/StackOverflow** → 30 min
2. **Check docs/examples** → 30 min
3. **Ask for help** → Don't waste more time

**Common blockers:**
- TypeScript errors unclear → Ask
- Build fails unexpectedly → Ask
- Performance not improving → Ask
- Tests won't pass → Ask

---

## 🏆 Success Definition

**At the end of 3 weeks, you should be able to say:**

✅ "I can add new features without fear of breaking things"
✅ "The app loads fast on slow connections"
✅ "New developers can understand the codebase in < 3 days"
✅ "Tests catch regressions before production"
✅ "The build pipeline is reliable"

**If you can't say all of above:**
- Identify what's missing
- Extend timeline or reduce scope
- Don't skip critical items

---

**Ready to execute? Start with Week 1, Day 1: TypeScript Fixes**

Next file to open: `frontend/tsconfig.app.json`

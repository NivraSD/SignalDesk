# Tactical Orchestration: Split Approach

**Problem:** Generating all 4 phases × 4 pillars in one call causes timeouts (120+ seconds)

**Solution:** Split into 2 parallel functions

---

## New Architecture

### `niv-blueprint-tactical-phases-1-2`
- Generates Phase 1 (Awareness) + Phase 2 (Consideration)
- All 4 pillars for each phase
- Target: 30-40 seconds
- max_tokens: 4000

### `niv-blueprint-tactical-phases-3-4`
- Generates Phase 3 (Conversion) + Phase 4 (Advocacy)
- All 4 pillars for each phase
- Target: 30-40 seconds
- max_tokens: 4000

### Orchestrator calls them in parallel:
```typescript
const [phases12, phases34] = await Promise.all([
  callTacticalPhases12(influenceStrategies, patternGuidance, research),
  callTacticalPhases34(influenceStrategies, patternGuidance, research)
])

const fullOrchestration = {
  orchestrationStrategy: {
    ...phases12.orchestrationStrategy,
    ...phases34.orchestrationStrategy
  }
}
```

**Total time: ~40 seconds** (parallel) instead of 120+ (sequential)

---

## Benefits
1. Avoids timeouts (each function under 45s)
2. Parallel execution (faster overall)
3. Can retry individual phases if needed
4. Smaller token windows (more focused generation)

---

## Implementation Status
- ✅ Design complete
- ⏳ Need to build both functions
- ⏳ Need to update orchestrator to call in parallel

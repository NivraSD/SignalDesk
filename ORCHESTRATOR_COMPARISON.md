# Orchestrator Comparison

## intelligence-orchestrator-v2 (WORKING - 102s)
From logs.md timestamp 1759340390534000 to 1759340590545000

**Flow:**
1. Discovery (mcp-discovery) - ~48s
2. Monitor Stage 1 - ~78s
3. Relevance (monitor-stage-2-relevance with top_k: 25) - ~73s
4. Enrichment (monitoring-stage-2-enrichment) - included in total
5. Synthesis (mcp-executive-synthesis) - ~30s
6. Opportunity Detection - ~71s
**Total: 102s (without opportunities)**

## real-time-intelligence-orchestrator-v2 (FAILING - 200s timeout)
From logs.md timestamp 1759342096214000 to 1759342296222000

**Flow:**
1. Discovery (mcp-discovery) - completed at 1759342140105000 = 44s
2. Monitor Stage 1 - completed at 1759342215249000 = 119s (SLOWER!)
3. Relevance (monitor-stage-2-relevance with top_k: 25) - completed at 1759342292345000 = 77s
4. Enrichment started at 1759342292345000, TIMEOUT at 1759342296222000 = 4s
**Total: 200s before timeout**

## Key Differences

### Discovery
- intelligence-orchestrator-v2: ~48s
- real-time-v2: ~44s
- **Winner: real-time (4s faster)**

### Monitor Stage 1
- intelligence-orchestrator-v2: ~78s
- real-time-v2: ~119s
- **Winner: intelligence (41s faster!) ← THIS IS THE PROBLEM**

### Relevance
- intelligence-orchestrator-v2: ~73s
- real-time-v2: ~77s
- **Winner: intelligence (4s faster)**

## WHY IS MONITOR-STAGE-1 SLOWER IN REAL-TIME?

Both call it identically:
```typescript
await fetch('monitor-stage-1', {
  body: {
    organization_name: org_name,
    profile: profile
  }
})
```

**Possible causes:**
1. Different profile data structure/size?
2. Network latency/timing?
3. RSS feed performance variation?
4. Rate limiting hitting real-time calls harder?
5. monitor-stage-1 was recently modified?

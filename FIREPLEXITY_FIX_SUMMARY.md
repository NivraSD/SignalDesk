# Fireplexity Fix - Hybrid Approach

## **What Was Wrong**

AI query generation used hardcoded examples from trading/energy companies:
- "commodity market developments"
- "war crimes energy"
- "supply chain partnerships"

For KARV (PR firm), it substituted "Public Relations" but kept the wrong structure:
- "Public Relations companies news" ← Too generic
- "war crimes Public Relations" ← Nonsensical

Result: Generic tech news (Nvidia, Meta) instead of PR industry news.

---

## **The Fix: Hybrid Approach**

### 1. **Industry-Aware AI Prompt** (15-20 queries)

The AI now generates queries SPECIFIC to the industry:

**For Public Relations:**
```
"PR agency acquisition"
"communications firm expansion"
"corporate communications trends"
"reputation management news"
"media relations developments"
"PR ethics violation"
"FTC advertising investigation"
"lobbying disclosure"
"PR agency merger"
"communications firm acquisition"
```

**For Trading:**
```
"commodity market developments"
"trading company expansion"
"commodity trading violation"
"sanctions investigation"
"trading company acquisition"
```

**For Technology:**
```
"tech company acquisition"
"software partnership"
"cloud computing trends"
"antitrust investigation tech"
"data privacy violation"
```

### 2. **Competitor-Specific Queries** (Always Added - 20 queries)

For each of the 10 competitors, add:
```
"Edelman announced"
"Edelman (acquisition OR partnership)"
"Weber Shandwick announced"
"Weber Shandwick (acquisition OR partnership)"
"FleishmanHillard announced"
"FleishmanHillard (acquisition OR partnership)"
...
```

### 3. **Total Query Strategy**

**35-40 total queries:**
- 15-20 industry-specific queries (PR agency news, reputation management, etc.)
- 20 competitor-specific queries (Edelman, Weber Shandwick, etc.)

---

## **Why This Works**

✅ **Broad PR industry coverage** - Finds general PR news, trends, acquisitions
✅ **Specific competitor tracking** - Finds Edelman/Weber Shandwick announcements
✅ **Industry-specific crises** - PR ethics violations, FTC investigations
✅ **Industry-specific opportunities** - Communications firm expansions, agency mergers

---

## **Expected Results for KARV**

You should now see articles about:
- **PR agency acquisitions** (WPP buys Acme Communications, etc.)
- **Communications firm expansions** (Edelman opens new office, etc.)
- **Reputation management trends** (Crisis communications best practices, etc.)
- **Specific competitor moves** (Weber Shandwick wins Toyota account, etc.)
- **PR industry regulations** (FTC advertising guidelines, lobbying disclosure, etc.)

Instead of:
- ❌ Nvidia AI partnerships
- ❌ Meta antitrust decisions
- ❌ Generic tech company news

---

## **How to Verify**

1. Run monitoring for KARV
2. Check the logs for generated queries - should see PR-specific terms
3. Check articles found - should be from PRWeek, Holmes Report, PR Newswire
4. Check entities extracted - should see Edelman, Weber Shandwick, FleishmanHillard
5. Check synthesis - should have competitor intelligence section populated

---

## **If Still Not Working**

Check these potential issues:

1. **Domain restriction too narrow** - Line 962 limits to top 15 domains. If these don't include PRWeek/Holmes Report/PRovoke, we won't find PR news.

2. **Relevance filter too aggressive** - Line 97-155 in monitor-stage-2-relevance filters articles. May be filtering out PR industry news.

3. **AI not adapting to industry** - Check logs for actual queries generated. If still seeing "commodity markets", the AI isn't adapting properly.

4. **Sources missing from company_profile** - Lines 898-926 check for approved domains. If KARV profile doesn't have PR-specific sources, we default to open web only.

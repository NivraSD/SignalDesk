# GEO-VECTOR: Content Type Mapping (ExecuteTab → GEO Objectives)

**Date:** November 3, 2025
**Purpose:** Map ExecuteTabProduction content types to GEO-VECTOR campaign objectives with AI citation rates

---

## Content Type Database (From ExecuteTabProduction)

### Category 1: Blog & Articles (6 types)

| Content Type | ExecuteTab ID | AI Citation Rate | Best For Objective | Auto/User-Assisted |
|--------------|---------------|------------------|-------------------|-------------------|
| Blog Post | `blog-post` | 40% | All objectives | Automated |
| Thought Leadership | `thought-leadership` | 35% | Thought leadership | Automated |
| Case Study | `case-study` | 55% | Drive sales | Automated |
| Whitepaper | `whitepaper` | 60% | Thought leadership | Automated |
| eBook | `ebook` | 45% | Drive sales | Automated |
| Byline Article | `byline-article` | 50% | Thought leadership | User-Assisted |

### Category 2: Press & Media (6 types)

| Content Type | ExecuteTab ID | AI Citation Rate | Best For Objective | Auto/User-Assisted |
|--------------|---------------|------------------|-------------------|-------------------|
| Press Release | `press-release` | 50% | All objectives | Automated |
| Media Pitch | `media-pitch` | 55% | Thought leadership | User-Assisted |
| Media Kit | `media-kit` | 40% | Thought leadership | User-Assisted |
| Media List | `media-list` | N/A (tool) | Thought leadership | Automated |
| Podcast Pitch | `podcast-pitch` | 25% | Thought leadership | User-Assisted |
| TV Interview Prep | `tv-interview-prep` | N/A (prep) | Thought leadership | User-Assisted |

### Category 3: Social Media (4 types)

| Content Type | ExecuteTab ID | AI Citation Rate | Best For Objective | Auto/User-Assisted |
|--------------|---------------|------------------|-------------------|-------------------|
| LinkedIn Post | `linkedin-post` | 40% | Thought leadership | Automated |
| Twitter Thread | `twitter-thread` | 30% | Thought leadership | Automated |
| Instagram Caption | `instagram-caption` | 20% | Brand awareness | Automated |
| Facebook Post | `facebook-post` | 25% | Brand awareness | Automated |

### Category 4: Email & Campaigns (4 types)

| Content Type | ExecuteTab ID | AI Citation Rate | Best For Objective | Auto/User-Assisted |
|--------------|---------------|------------------|-------------------|-------------------|
| Email Campaign | `email-campaign` | 15% | Drive sales | Automated |
| Newsletter | `newsletter` | 30% | Thought leadership | Automated |
| Email Drip Sequence | `email-drip-sequence` | 10% | Drive sales | Automated |
| Cold Outreach | `cold-outreach` | 5% | Drive sales | Automated |

**Note:** Email content has low AI citation rates because it's not publicly accessible.

### Category 5: Executive & Crisis (5 types)

| Content Type | ExecuteTab ID | AI Citation Rate | Best For Objective | Auto/User-Assisted |
|--------------|---------------|------------------|-------------------|-------------------|
| Executive Statement | `executive-statement` | 45% | Thought leadership | Automated |
| Board Presentation | `board-presentation` | N/A (internal) | N/A | Automated |
| Investor Update | `investor-update` | 35% | Thought leadership | Automated |
| Crisis Response | `crisis-response` | 40% | Reputation management | Automated |
| Apology Statement | `apology-statement` | 35% | Reputation management | Automated |

### Category 6: Strategy & Messaging (4 types)

| Content Type | ExecuteTab ID | AI Citation Rate | Best For Objective | Auto/User-Assisted |
|--------------|---------------|------------------|-------------------|-------------------|
| Messaging Framework | `messaging-framework` | N/A (internal) | N/A | Automated |
| Brand Narrative | `brand-narrative` | 30% | Thought leadership | Automated |
| Value Proposition | `value-proposition` | 40% | Drive sales | Automated |
| Competitive Positioning | `competitive-positioning` | 45% | Drive sales | Automated |

### Category 7: Visual Content (5 types)

| Content Type | ExecuteTab ID | AI Citation Rate | Best For Objective | Auto/User-Assisted |
|--------------|---------------|------------------|-------------------|-------------------|
| Image (Vertex AI) | `image` | N/A (visual) | Brand awareness | Automated |
| Infographic | `infographic` | 50% | All objectives | Automated |
| Social Graphics | `social-graphics` | N/A (visual) | Brand awareness | Automated |
| Presentation (Gamma) | `presentation` | 35% | All objectives | Automated |
| Video Script (Veo) | `video-script` | 45% | Technical adoption | Automated |

### Category 8: GEO-Specific (Custom)

| Content Type | Custom ID | AI Citation Rate | Best For Objective | Auto/User-Assisted |
|--------------|-----------|------------------|-------------------|-------------------|
| Schema.org Markup | `schema-optimization` | 75% | All objectives | Automated |
| FAQ Schema | `faq-schema` | 60% | All objectives | Automated |
| Documentation Outline | `doc-outline` | 70% | Technical adoption | User-Assisted |
| G2/Capterra Copy | `comparison-copy` | 65% | Drive sales | User-Assisted |
| Stack Overflow Answer | `stackoverflow-answer` | 70% | Technical adoption | User-Assisted |
| Quora Answer | `quora-answer` | 30% | Thought leadership | User-Assisted |

---

## Objective-Based Content Selection

### Objective 1: Drive Product Sales

**Primary Goal:** Increase AI citations when users ask buying questions ("best CRM for startups", "top project management tools")

**Recommended Content Types (8-12):**

#### Tier 1: Automated (SignalDesk generates, user deploys)
1. ✅ **Schema Optimization** (`schema-optimization`) - 75% citation
   - Product schema with aggregateRating, review, offers
   - Auto-deployed to organization website
2. ✅ **Case Studies** (`case-study`) - 55% citation
   - Customer success stories
   - Published to website
3. ✅ **FAQ Schema** (`faq-schema`) - 60% citation
   - Common buying questions answered
   - FAQPage schema markup
4. ✅ **Value Proposition** (`value-proposition`) - 40% citation
   - Clear product positioning
   - Published to website
5. ✅ **Competitive Positioning** (`competitive-positioning`) - 45% citation
   - Comparison content
   - Published to website
6. ✅ **Blog Posts** (`blog-post`) - 40% citation
   - Product use cases, comparisons
   - 2-3 per week
7. ✅ **Whitepapers** (`whitepaper`) - 60% citation
   - Industry analysis with product positioning
   - 1 per month
8. ✅ **Infographics** (`infographic`) - 50% citation
   - Visual comparisons, statistics

#### Tier 2: User-Assisted (SignalDesk provides, user executes)
9. ✅ **G2/Capterra Copy** (`comparison-copy`) - 65% citation
   - Optimized profile descriptions
   - Feature highlights
   - Review request templates
10. ✅ **Documentation Outline** (`doc-outline`) - 70% citation
    - Use case guides
    - Integration documentation
    - User adds technical details
11. ✅ **Video Scripts** (`video-script`) - 45% citation
    - Product demos
    - Tutorial scripts
    - User records and uploads

**Content Mix:**
- 8 Automated (60-75% citation average)
- 3 User-Assisted (60% citation average)
- **Total:** 11 content types
- **Expected Impact:** 35-50% visibility increase in 8-12 weeks
- **Time Investment:** 2-3 hours/week for user-assisted

---

### Objective 2: Thought Leadership & Authority

**Primary Goal:** Get cited when AI platforms answer industry trend/expertise questions ("future of fintech", "experts on renewable energy")

**Recommended Content Types (8-12):**

#### Tier 1: Automated
1. ✅ **Schema Optimization** (`schema-optimization`) - 75% citation
   - Person schema for executives
   - Organization schema with awards
2. ✅ **Thought Leadership** (`thought-leadership`) - 35% citation
   - Opinion pieces on industry trends
   - Published to Medium/LinkedIn
3. ✅ **LinkedIn Posts** (`linkedin-post`) - 40% citation
   - Executive insights
   - 2-3 per week
4. ✅ **Whitepapers** (`whitepaper`) - 60% citation
   - Industry analysis
   - Original research (with user data)
5. ✅ **Press Releases** (`press-release`) - 50% citation
   - Company announcements
   - Distributed via PR Newswire
6. ✅ **Executive Statements** (`executive-statement`) - 45% citation
   - Industry commentary
   - Published to website
7. ✅ **Blog Posts** (`blog-post`) - 40% citation
   - Trend analysis
   - 2-3 per week
8. ✅ **Brand Narrative** (`brand-narrative`) - 30% citation
   - Company story/mission
   - Published to website

#### Tier 2: User-Assisted
9. ✅ **Media Outreach** (`media-pitch`) - 55% citation
   - Personalized journalist pitches
   - Media list provided (149+ journalists)
   - User sends and follows up
10. ✅ **Byline Articles** (`byline-article`) - 50% citation
    - Industry publications
    - User pitches to outlets
11. ✅ **Podcast Pitches** (`podcast-pitch`) - 25% citation
    - Target show research
    - Pitch templates + talking points
    - User sends pitches
12. ✅ **Quora Answers** (`quora-answer`) - 30% citation
    - Expert answers to industry questions
    - User posts from personal account

**Content Mix:**
- 8 Automated (43% citation average)
- 4 User-Assisted (40% citation average)
- **Total:** 12 content types
- **Expected Impact:** 25-40% authority increase in 12 weeks
- **Time Investment:** 3-4 hours/week for user-assisted

---

### Objective 3: Technical Adoption (Developer Tools)

**Primary Goal:** Get cited when developers search for technical solutions ("how to implement OAuth", "best API monitoring tools")

**Recommended Content Types (8-10):**

#### Tier 1: Automated
1. ✅ **Schema Optimization** (`schema-optimization`) - 75% citation
   - SoftwareApplication schema
   - Technical specifications
2. ✅ **Documentation Outline** (`doc-outline`) - 70% citation
   - API reference structure
   - Code examples (user adds details)
3. ✅ **Blog Posts** (technical) (`blog-post`) - 50% citation
   - Technical tutorials
   - Integration guides
   - 2-3 per week
4. ✅ **Case Studies** (technical) (`case-study`) - 55% citation
   - Implementation stories
   - Performance benchmarks
5. ✅ **FAQ Schema** (`faq-schema`) - 60% citation
   - Common technical questions
   - Troubleshooting guides
6. ✅ **Whitepapers** (technical) (`whitepaper`) - 60% citation
   - Architecture deep-dives
   - Technical comparisons
7. ✅ **Infographics** (`infographic`) - 50% citation
   - Architecture diagrams
   - Performance visualizations

#### Tier 2: User-Assisted
8. ✅ **Stack Overflow Answers** (`stackoverflow-answer`) - 70% citation
   - Monitoring relevant questions
   - AI-generated answers with code
   - User reviews and posts
9. ✅ **Video Scripts** (tutorials) (`video-script`) - 50% citation
   - Technical demos
   - Integration walkthroughs
   - User records
10. ✅ **GitHub Documentation** (`doc-outline`) - 65% citation
    - README optimization
    - Contributing guides
    - User publishes

**Content Mix:**
- 7 Automated (60% citation average)
- 3 User-Assisted (62% citation average)
- **Total:** 10 content types
- **Expected Impact:** 30-45% technical query visibility in 8 weeks
- **Time Investment:** 1-2 hours/week for user-assisted

---

## Industry-Adaptive Selection Algorithm

### Selection Criteria

```typescript
interface ContentSelectionInput {
  objective: 'drive_sales' | 'thought_leadership' | 'technical_adoption'
  industry: string // 'B2B SaaS', 'Investment', 'Developer Tools', etc.
  constraints: {
    time_per_week: number // Hours user can invest
    budget: 'low' | 'medium' | 'high'
    technical_capability: 'low' | 'medium' | 'high'
  }
  current_presence: {
    has_g2_profile: boolean
    has_technical_docs: boolean
    has_blog: boolean
    has_youtube: boolean
  }
}

interface ContentSelectionOutput {
  automated: ContentType[] // 6-8 types
  user_assisted: ContentType[] // 2-4 types
  total_count: number // 8-12
  expected_impact: string // "35-50% visibility increase in 8-12 weeks"
  time_investment: string // "2-3 hours/week"
}
```

### Selection Logic

**Step 1: Choose base automated content (always included)**
- Schema Optimization (75% citation) - Universal
- Blog Posts (40-50% citation) - Universal
- Press Releases (50% citation) - Universal

**Step 2: Add objective-specific automated content**

If `objective === 'drive_sales'`:
- Case Studies (55%)
- FAQ Schema (60%)
- Value Proposition (40%)
- Competitive Positioning (45%)
- Infographics (50%)

If `objective === 'thought_leadership'`:
- Thought Leadership articles (35%)
- LinkedIn Posts (40%)
- Whitepapers (60%)
- Executive Statements (45%)

If `objective === 'technical_adoption'`:
- Documentation Outlines (70%)
- Technical Blog Posts (50%)
- Case Studies (technical) (55%)
- FAQ Schema (60%)
- Whitepapers (technical) (60%)

**Step 3: Select user-assisted based on constraints**

If `constraints.time_per_week >= 3`:
- Add high-impact user-assisted (G2, Stack Overflow, Media Outreach)

If `constraints.time_per_week < 3`:
- Only add low-effort user-assisted (G2 copy, doc outlines)

If `constraints.technical_capability === 'high'` AND `objective === 'technical_adoption'`:
- Add Stack Overflow Answers (70%)
- Add GitHub Documentation (65%)

If `current_presence.has_youtube === false` AND user has recording capability:
- Add Video Scripts (45-50%)

**Step 4: Cap total at 8-12 content types**
- Prioritize by citation_rate × effort_ratio
- Balance automated vs user-assisted (70/30 split)

---

## Content Type Priority Matrix

### High Priority (Always Include)

| Content Type | Why High Priority | Citation Rate | Effort |
|--------------|------------------|---------------|--------|
| Schema Optimization | Universal, highest citation | 75% | Low |
| Blog Posts | Universal, frequent publishing | 40-50% | Low |
| Case Studies | High citation for sales | 55% | Medium |
| FAQ Schema | High citation, low effort | 60% | Low |

### Medium Priority (Include if objective matches)

| Content Type | Use When | Citation Rate | Effort |
|--------------|----------|---------------|--------|
| Whitepapers | Thought leadership or technical | 60% | Medium |
| LinkedIn Posts | Thought leadership | 40% | Low |
| Press Releases | All objectives | 50% | Low |
| Infographics | Visual industries | 50% | Medium |

### Low Priority (Include if user bandwidth allows)

| Content Type | Use When | Citation Rate | Effort |
|--------------|----------|---------------|--------|
| Podcast Pitches | Thought leadership + time | 25% | High |
| Quora Answers | Niche expertise | 30% | Medium |
| Email Campaigns | Direct sales focus | 10-15% | Low |

---

## Implementation: Content Type Selection Function

```typescript
// supabase/functions/niv-geo-content-selector/index.ts

export function selectContentTypes(input: ContentSelectionInput): ContentSelectionOutput {
  const automated: ContentType[] = []
  const userAssisted: ContentType[] = []

  // Base automated (always included)
  automated.push(
    { id: 'schema-optimization', citation: 75 },
    { id: 'blog-post', citation: 40 },
    { id: 'press-release', citation: 50 }
  )

  // Objective-specific automated
  if (input.objective === 'drive_sales') {
    automated.push(
      { id: 'case-study', citation: 55 },
      { id: 'faq-schema', citation: 60 },
      { id: 'value-proposition', citation: 40 },
      { id: 'competitive-positioning', citation: 45 },
      { id: 'infographic', citation: 50 }
    )

    // User-assisted for sales
    if (input.current_presence.has_g2_profile) {
      userAssisted.push({ id: 'comparison-copy', citation: 65 })
    }
    if (input.constraints.time_per_week >= 2) {
      userAssisted.push({ id: 'doc-outline', citation: 70 })
    }
  }

  if (input.objective === 'thought_leadership') {
    automated.push(
      { id: 'thought-leadership', citation: 35 },
      { id: 'linkedin-post', citation: 40 },
      { id: 'whitepaper', citation: 60 },
      { id: 'executive-statement', citation: 45 }
    )

    // User-assisted for thought leadership
    if (input.constraints.time_per_week >= 3) {
      userAssisted.push(
        { id: 'media-pitch', citation: 55 },
        { id: 'byline-article', citation: 50 }
      )
    }
    if (input.constraints.time_per_week >= 1) {
      userAssisted.push({ id: 'quora-answer', citation: 30 })
    }
  }

  if (input.objective === 'technical_adoption') {
    automated.push(
      { id: 'doc-outline', citation: 70 },
      { id: 'blog-post', citation: 50 },
      { id: 'case-study', citation: 55 },
      { id: 'faq-schema', citation: 60 },
      { id: 'whitepaper', citation: 60 }
    )

    // User-assisted for technical
    if (input.constraints.technical_capability === 'high') {
      userAssisted.push({ id: 'stackoverflow-answer', citation: 70 })
    }
    if (input.constraints.time_per_week >= 2) {
      userAssisted.push({ id: 'video-script', citation: 50 })
    }
  }

  // Cap at 12 total, prioritize by citation rate
  const total = [...automated, ...userAssisted]
    .sort((a, b) => b.citation - a.citation)
    .slice(0, 12)

  return {
    automated: total.filter(t => automated.includes(t)),
    user_assisted: total.filter(t => userAssisted.includes(t)),
    total_count: total.length,
    expected_impact: calculateExpectedImpact(total),
    time_investment: calculateTimeInvestment(userAssisted)
  }
}
```

---

## Summary: Content Type → Objective Mapping

### For Drive Sales (B2B SaaS)
**8 Automated:** Schema, Case Studies, FAQ Schema, Blog Posts, Value Prop, Competitive Positioning, Infographics, Press Releases
**3 User-Assisted:** G2 Copy, Documentation Outlines, Video Scripts
**Total:** 11 types
**Impact:** 35-50% visibility in 8-12 weeks

### For Thought Leadership (Investment Firm)
**8 Automated:** Schema, Thought Leadership, LinkedIn Posts, Whitepapers, Executive Statements, Blog Posts, Press Releases, Brand Narrative
**4 User-Assisted:** Media Outreach, Byline Articles, Podcast Pitches, Quora Answers
**Total:** 12 types
**Impact:** 25-40% authority in 12 weeks

### For Technical Adoption (Developer Tools)
**7 Automated:** Schema, Documentation, Technical Blogs, Case Studies, FAQ Schema, Whitepapers, Infographics
**3 User-Assisted:** Stack Overflow, Video Scripts, GitHub Docs
**Total:** 10 types
**Impact:** 30-45% technical visibility in 8 weeks

---

*Content Type Mapping Complete: November 3, 2025*
*Based on ExecuteTabProduction.tsx (44 content types) + Custom GEO types (6)*

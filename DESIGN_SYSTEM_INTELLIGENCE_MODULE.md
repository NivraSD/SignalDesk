# Intelligence Module Design System

## Overview
This document outlines the comprehensive redesign of the Intelligence Synthesis Display component, implementing a strategic, user-centered design approach with proper information architecture, responsive layouts, and typographic hierarchy.

## Design Principles

### 1. Content-First Architecture
- Layout adapts to content, not the reverse
- No fixed-width constraints that cause overflow
- Flexible grids that respond to actual content density

### 2. Information Hierarchy
- 6-level typographic scale for clear content structure
- Visual weight correlates with importance
- Proper parent-child relationships in content nesting

### 3. Readability & Scannability
- Optimal line length and spacing for comprehension
- Strategic use of whitespace to chunk information
- Consistent visual patterns for predictable navigation

### 4. Responsive by Default
- Mobile-first progressive enhancement
- Breakpoints determined by content needs, not devices
- Fluid typography and spacing scales

---

## Typography System

### 6-Level Hierarchy

#### Level 1: Section Headers (11px uppercase)
**Usage:** Primary section dividers (Executive Summary, Competitive Analysis)
```tsx
<Typography.SectionHeader icon={Eye}>Executive Summary</Typography.SectionHeader>
```
**Properties:**
- Size: 11px
- Weight: font-light (300)
- Transform: uppercase
- Tracking: 0.08em (wider for readability at small sizes)
- Color: var(--mauve)
- Line Height: tight
- Icon: 3.5px with flex-shrink-0

**Rationale:** Uppercase headers at smaller sizes create clear visual breaks without overwhelming the content. Wide tracking compensates for reduced legibility at small sizes.

---

#### Level 2: Subsection Headers (11px uppercase)
**Usage:** Card headers, grouped content labels (Dominant Players, Success Patterns)
```tsx
<Typography.SubsectionHeader color="var(--mauve-light)">
  Success Patterns
</Typography.SubsectionHeader>
```
**Properties:**
- Size: 11px
- Weight: font-light (300)
- Transform: uppercase
- Tracking: 0.06em (slightly tighter than Level 1)
- Color: Customizable (default var(--mauve))
- Line Height: tight
- Margin Bottom: 2.5 (10px)

**Rationale:** Differentiated from Level 1 by slightly reduced tracking and flexible color, allowing for semantic color coding while maintaining hierarchy.

---

#### Level 3: Card Titles (14px normal case)
**Usage:** Individual item headlines, player names, finding titles
```tsx
<Typography.CardTitle>{finding.title}</Typography.CardTitle>
```
**Properties:**
- Size: 14px
- Weight: font-light (300)
- Transform: none (normal case)
- Color: var(--pearl)
- Line Height: snug (1.375)
- Margin Bottom: 1.5 (6px)

**Rationale:** Normal case at readable size provides clear content hierarchy. Pearl color distinguishes titles from body text without excessive contrast.

---

#### Level 4: Primary Body (15px)
**Usage:** Main content, executive summaries, key insights
```tsx
<Typography.BodyPrimary className="whitespace-pre-wrap">
  {data.executive_summary}
</Typography.BodyPrimary>
```
**Properties:**
- Size: 15px (optimal for sustained reading)
- Weight: font-light (300)
- Color: text-gray-200
- Line Height: relaxed (1.625)

**Rationale:** 15px is the sweet spot for readability in light weight fonts. Relaxed line height (1.625) ensures comfortable reading without excessive vertical space.

---

#### Level 5: Secondary Body (14px)
**Usage:** Supporting content, list items, descriptions
```tsx
<Typography.BodySecondary>{player.visibility}</Typography.BodySecondary>
```
**Properties:**
- Size: 14px
- Weight: font-light (300)
- Color: text-gray-300
- Line Height: relaxed (1.625)

**Rationale:** One step down from primary body for subordinate information. Gray-300 provides subtle visual de-emphasis.

---

#### Level 6: Caption/Meta (12px)
**Usage:** Metadata, timestamps, auxiliary information
```tsx
<Typography.Caption>Analysis Date: {date}</Typography.Caption>
```
**Properties:**
- Size: 12px
- Weight: font-light (300)
- Color: text-gray-400
- Line Height: relaxed (1.625)

**Rationale:** Smallest size in system, reserved for non-critical metadata. Gray-400 clearly distinguishes from content hierarchy.

---

## Spacing System

### 4px Base Scale
All spacing follows a consistent 4px base unit, creating visual rhythm and predictability.

**Scale:**
- 0.5 = 2px (rare, icon adjustments)
- 1 = 4px
- 1.5 = 6px
- 2 = 8px
- 2.5 = 10px
- 3 = 12px
- 3.5 = 14px
- 4 = 16px
- 5 = 20px

### Application

#### Section-Level Spacing
```tsx
<div className="space-y-5">  // 20px between sections
  <Section>...</Section>
</div>
```

#### Card Padding
```tsx
<Card.Container className="p-4">  // 16px internal padding
```

#### Section Internal Padding
```tsx
<Section className="p-5">  // 20px for comfortable boundaries
```

#### List Item Spacing
```tsx
<ul className="space-y-2">  // 8px between list items
  <li>...</li>
</ul>
```

#### Gap in Flex/Grid
```tsx
<div className="gap-2.5">  // 10px for icon-text pairs
<div className="gap-3">    // 12px for card-level gaps
<div className="gap-4">    // 16px for grid gaps
```

**Rationale:** Consistent spacing creates visual rhythm. Larger spacing at higher hierarchy levels (sections > cards > list items) reinforces information structure.

---

## Grid System

### Adaptive Grid (Content-First)

**Component:**
```tsx
<Grid.Adaptive minWidth="300px">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</Grid.Adaptive>
```

**CSS Implementation:**
```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr))
```

**Behavior:**
- **Mobile (< 300px width):** Single column
- **Tablet (600px - 900px):** 2 columns
- **Desktop (> 900px):** 3 columns
- **Ultra-wide (> 1200px):** 3-4 columns

**Rationale:** CSS Grid's `auto-fit` with `minmax(min(100%, 300px), 1fr)` creates a truly responsive layout that adapts to content needs. The `min(100%, 300px)` ensures cards never shrink below 300px unless the viewport is smaller, preventing text overflow.

**Use Cases:**
- Stakeholder Dynamics (varying text lengths)
- Media Landscape (different content densities)
- Risk Monitoring (inconsistent list lengths)

---

### Responsive Grid (Structured)

**Component:**
```tsx
<Grid.Responsive>
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</Grid.Responsive>
```

**CSS Implementation:**
```css
grid-cols-1 lg:grid-cols-2 xl:grid-cols-3
```

**Breakpoints:**
- **Mobile:** 1 column (default)
- **Large (1024px+):** 2 columns
- **Extra Large (1280px+):** 3 columns

**Rationale:** Predictable breakpoint-based grid for structured content where visual consistency matters more than perfect content fit.

**Use Cases:**
- PR Action Items (time-based categories need visual alignment)
- Narratives & Insights (balanced visual weight)
- PR Implications (parallel content structure)

---

## Card Component System

### Variants

#### Default
```tsx
<Card.Container variant="default">
```
- Background: rgba(184, 160, 200, 0.05) - subtle mauve tint
- Border: var(--border) - minimal gray
- **Use:** Standard information cards

#### Accent
```tsx
<Card.Container variant="accent">
```
- Background: rgba(184, 160, 200, 0.08) - stronger mauve tint
- Border: var(--mauve) - visible mauve border
- **Use:** Emphasized content, key insights

#### Critical
```tsx
<Card.Container variant="critical">
```
- Background: rgba(255, 68, 68, 0.05) - red tint
- Border: #ff4444 - red border
- **Use:** Threats, immediate actions, critical alerts

#### Warning
```tsx
<Card.Container variant="warning">
```
- Background: rgba(255, 165, 0, 0.05) - orange tint
- Border: #ffa500 - orange border
- **Use:** Crisis signals, moderate-risk items

### Card Anatomy

```tsx
<Card.Container variant="accent">
  <Typography.SubsectionHeader color="var(--mauve)">
    Header Text
  </Typography.SubsectionHeader>
  <Typography.BodySecondary>
    Content text that can wrap to multiple lines without overflow.
  </Typography.BodySecondary>
</Card.Container>
```

**Key Features:**
1. **Flexible Height:** Cards grow with content
2. **Consistent Padding:** 16px (p-4) on all cards
3. **Border Radius:** 8px (rounded-lg) for refinement
4. **No Fixed Width:** Relies on grid container

---

## List Item Patterns

### With Icon
```tsx
<Card.ListItem icon={AlertTriangle} iconColor="#ff4444">
  List item text that can wrap naturally
</Card.ListItem>
```

**Structure:**
- Icon: 3.5px (w-3.5 h-3.5)
- Icon Position: mt-0.5 (2px down for optical alignment)
- Gap: 2.5 (10px between icon and text)
- Text: Typography.BodySecondary with flex-1

### Without Icon (Bullet)
```tsx
<li className="flex items-start gap-2">
  <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
  <Typography.BodySecondary className="flex-1">{text}</Typography.BodySecondary>
</li>
```

**Rationale:**
- `items-start` ensures icon/bullet stays at top with multi-line text
- `mt-0.5` optically centers icon with first line of text
- `flex-shrink-0` prevents icon from collapsing
- `flex-1` allows text to fill available space and wrap

---

## Color System

### Semantic Colors

**Primary Palette (Mauve Monochrome):**
- `--mauve`: #b8a0c8 (primary accent)
- `--mauve-light`: #cebcda (lighter accent)
- `--mauve-dark`: #9d84ad (darker accent)

**Content Colors:**
- `--pearl`: #ffffff (high-emphasis text)
- `text-gray-200`: Primary body text
- `text-gray-300`: Secondary body text
- `text-gray-400`: Captions and metadata

**Alert Colors:**
- `#ff4444`: Critical (threats, immediate actions)
- `#ffa500`: Warning (crisis signals)

**Borders:**
- `--border`: rgba(255, 255, 255, 0.08) - subtle division
- `--border-accent`: rgba(184, 160, 200, 0.4) - emphasized division

### Color Application Strategy

1. **Headers:** Always use mauve variants for consistency
2. **Body Text:** Gray scale for readability (200-400)
3. **Accent Content:** Pearl (#ffffff) for high-emphasis items
4. **Critical Items:** Red (#ff4444) sparingly for urgency
5. **Backgrounds:** Ultra-low opacity (5-8%) to maintain sophistication

---

## Responsive Behavior

### Breakpoint Strategy

**Mobile First (< 640px):**
- All grids collapse to single column
- Flex containers wrap with gap-3
- Section padding reduces to p-4
- Typography remains consistent (readability priority)

**Tablet (640px - 1024px):**
- Adaptive grids show 2 columns
- Responsive grids remain single column
- Metadata flexes to two lines if needed

**Desktop (1024px+):**
- Adaptive grids show 2-3 columns
- Responsive grids show 2 columns (lg:)
- Full layout breathing room

**Ultra-wide (1280px+):**
- Responsive grids show 3 columns (xl:)
- Maximum information density
- Optimal scannability

### Wrapping Strategy

**Headers with Metadata:**
```tsx
<div className="flex flex-wrap items-center justify-between gap-2 mb-4">
  <Typography.SectionHeader icon={Megaphone} className="mb-0">
    PR Action Items
  </Typography.SectionHeader>
  <Typography.Caption>Time-Based Priorities</Typography.Caption>
</div>
```
- `flex-wrap` allows metadata to drop to second line on narrow screens
- `gap-2` maintains 8px spacing in all configurations

**Tag Groups:**
```tsx
<div className="flex flex-wrap gap-x-4 gap-y-1">
  <Typography.Caption>Impact: High</Typography.Caption>
  <Typography.Caption>Timeline: This Week</Typography.Caption>
</div>
```
- `gap-x-4` (16px) separates tags horizontally
- `gap-y-1` (4px) minimizes vertical space when wrapping

---

## Accessibility Considerations

### Semantic HTML
- Proper heading hierarchy (h2 → h3 → h4)
- Lists use `<ul>` and `<li>` elements
- Sections wrapped in semantic containers

### Visual Hierarchy
- Sufficient color contrast ratios
- Multiple visual cues beyond color (size, weight, spacing)
- Icon + text combinations for reinforced meaning

### Focus Management
- Interactive elements (expandable cards) have proper cursor states
- Hover states provide feedback
- Transitions are performant and not distracting

### Readability
- Font weight (300) paired with 15px size for optimal legibility
- Line height (1.625) ensures comfortable reading
- No text smaller than 11px (WCAG AA minimum)

---

## Implementation Patterns

### Empty States
```tsx
if (!synthesis?.synthesis) {
  return (
    <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
      <Eye className="w-12 h-12 text-gray-600 mx-auto mb-3" />
      <Typography.SubsectionHeader className="text-gray-400 mb-2">
        No Intelligence Available
      </Typography.SubsectionHeader>
      <Typography.Caption>Run the pipeline to generate market intelligence</Typography.Caption>
    </div>
  );
}
```

### Loading States
```tsx
if (loading) {
  return (
    <div className="bg-gray-900 rounded-xl p-8 animate-pulse">
      <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-800 rounded w-full"></div>
        <div className="h-4 bg-gray-800 rounded w-5/6"></div>
      </div>
    </div>
  );
}
```

### Conditional Rendering
```tsx
{data.competitive_moves.immediate_threats?.length > 0 && (
  <Card.Container variant="critical">
    <Typography.SubsectionHeader color="#ff4444">
      Immediate Threats
    </Typography.SubsectionHeader>
    <ul className="space-y-2">
      {data.competitive_moves.immediate_threats.map((threat, i) => (
        <Card.ListItem key={i} icon={AlertTriangle} iconColor="#ff4444">
          {threat}
        </Card.ListItem>
      ))}
    </ul>
  </Card.Container>
)}
```

**Pattern:**
1. Check for data existence
2. Verify array length if applicable
3. Render semantic container
4. Use appropriate typography and card variants
5. Map data with proper keys

---

## Design Rationale Summary

### Problem: Text Overflow
**Solution:** Adaptive grid with `minmax(min(100%, 300px), 1fr)` ensures cards never get squeezed below readable width.

### Problem: Poor Information Hierarchy
**Solution:** 6-level typography system with clear size, weight, and color differentiation creates scannable content structure.

### Problem: No Responsive Strategy
**Solution:** Content-first approach with adaptive and responsive grid systems that break naturally at content-appropriate widths.

### Problem: Cards Don't Scale
**Solution:** Flexible-height cards with proper `flex-1` and `min-w-0` classes allow text to wrap gracefully.

### Problem: Density Issues
**Solution:** Consistent 4px spacing scale applied systematically (space-y-2, space-y-3, gap-2.5, gap-4) creates visual rhythm without cramping.

---

## Maintenance & Extension

### Adding New Card Types
1. Add variant to `Card.Container` variants object
2. Define background and border colors
3. Document use case in this file

### Adjusting Typography
1. Modify Typography component properties
2. Test across all viewport sizes
3. Verify contrast ratios meet WCAG AA
4. Update documentation

### Grid Modifications
1. Adaptive grid: Adjust `minWidth` parameter
2. Responsive grid: Modify breakpoint classes
3. Test with real content of varying lengths

### Color Changes
1. Update CSS variables in globals.css
2. Verify all semantic uses still make sense
3. Check contrast ratios
4. Update color documentation

---

## File Structure

```
src/components/IntelligenceSynthesisDisplay.tsx
├── Design System Components (lines 18-129)
│   ├── Typography (6 levels)
│   ├── Card (Container + ListItem)
│   ├── Grid (Adaptive + Responsive)
│   └── Section (Container)
├── Main Component (lines 131-836)
│   ├── Loading State
│   ├── Empty State
│   ├── GEO Format Handler (key_findings, competitive_analysis)
│   ├── PR Format Handler (executive_summary, competitive_moves)
│   └── Legacy Format Handler (top_developments)
└── Export
```

---

## Testing Checklist

### Visual Testing
- [ ] View at 320px width (smallest mobile)
- [ ] View at 768px width (tablet)
- [ ] View at 1024px width (desktop)
- [ ] View at 1440px+ width (ultra-wide)

### Content Testing
- [ ] Short text (1-2 words) doesn't create awkward spacing
- [ ] Long text (20+ words) wraps properly without overflow
- [ ] Empty arrays/null values don't break layout
- [ ] All card variants render correctly

### Interaction Testing
- [ ] Expandable cards toggle smoothly
- [ ] Hover states provide clear feedback
- [ ] Click targets are appropriately sized
- [ ] Keyboard navigation works correctly

### Performance Testing
- [ ] No layout shift during loading
- [ ] Smooth transitions (< 300ms)
- [ ] No unnecessary re-renders
- [ ] Images/icons load efficiently

---

## Version History

**v2.0 - 2025-11-17**
- Complete redesign with design system approach
- 6-level typography hierarchy
- Adaptive and responsive grid systems
- Reusable card component patterns
- 4px spacing scale
- Content-first responsive strategy
- Comprehensive documentation

**v1.0 - Previous**
- Initial implementation
- Fixed 3-column grids
- Mixed typography sizes
- Inconsistent spacing

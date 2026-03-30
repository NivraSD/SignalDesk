# Nivria Content Design System

## Typography Hierarchy

### Headers (Subtle Labels)
- **Section Title (H2)**: `text-xs font-light uppercase tracking-wide` + `color: var(--mauve)`
- **Subsection (H3)**: `text-[10px] font-light uppercase tracking-wide` + `color: var(--mauve)`
- **Card Title (H4)**: `text-sm font-light` + `color: var(--mauve)`

### Body Text (Content is King)
- **Primary**: `text-base font-light text-gray-200`
- **Secondary**: `text-sm font-light text-gray-200`
- **Caption**: `text-xs font-light text-gray-400`

### Weights
- Never use `font-bold` or `font-semibold`
- Use `font-light` (300) for everything
- Use size differentiation for hierarchy, not weight

## Color Palette

### Primary (Mauve Variations)
- Main accent: `var(--mauve)` (#b8a0c8)
- Light variant: `var(--mauve-light)` (#cebcda)
- Dark variant: `var(--mauve-dark)` (#9d84ad)

### Semantic (Use Sparingly)
- **Critical alerts only**: Red (#ff4444)
- **Success/positive**: Mauve-light
- **Warning**: Orange (only for true warnings)
- **Info**: Mauve

### Backgrounds
- Card: `bg-gray-900` or `rgba(42, 42, 42, 0.5)`
- Highlight: `rgba(184, 160, 200, 0.1)`
- Border: `var(--border)` or `rgba(255, 255, 255, 0.08)`

## Spacing

### Padding
- Large cards: `p-4`
- Medium cards: `p-3`
- Small elements: `p-2`

### Margins
- Section gaps: `space-y-4`
- Element gaps: `gap-2` or `gap-3`
- Bottom margins: `mb-2` or `mb-3` (not mb-6!)

## Components

### Priority Indicators
- Use mauve shades, not rainbow colors
- Critical: red-400 (exception)
- High: mauve (#b8a0c8)
- Medium: mauve-light (#cebcda)
- Low: mauve-dark (#9d84ad)

### Icons
- Size: `w-3 h-3` (default for headers) or `w-4 h-4` (interactive elements)
- Never `w-5 h-5` or larger
- Color: `var(--mauve)` or inherit

### Borders
- Default: `border border-gray-800`
- Accent: `border` with `var(--border-accent)`
- Never `border-2` or bright colored borders

## Examples

### Good ✓
```tsx
<h2 className="text-xs font-light uppercase tracking-wide" style={{ color: 'var(--mauve)' }}>
  <Icon className="w-3 h-3" />
  Section Title
</h2>
<p className="text-base font-light text-gray-200">
  Important content that users need to read...
</p>
```

### Bad ✗
```tsx
<h2 className="text-xl font-bold text-purple-400">
  <Icon className="w-6 h-6" />
  SECTION TITLE
</h2>
<p className="text-xs text-gray-500">
  tiny content nobody can read
</p>
```

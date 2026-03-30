# SignalDesk V3: Infinite Canvas UI Architecture
## The Workspace Where Everything Lives Together

### Core Concept: Infinite Canvas + Tab Focus System

**Vision:** A boundless workspace where users can arrange, resize, and keep multiple components open while using tabs to bring primary focus to specific modules.

---

## 🎨 UI ARCHITECTURE

### The Layout Structure

```typescript
interface InfiniteCanvasUI {
  // Fixed Header with Tab Navigation
  header: {
    logo: "SignalDesk",
    tabs: [
      "Intelligence",  // 🧠
      "Opportunities", // 🎯
      "Plan",         // 📋
      "Execute",      // 🚀
      "MemoryVault"   // 💾
    ],
    userMenu: "Profile/Settings/Logout",
    searchBar: "Universal search"
  },
  
  // Infinite Scrollable Canvas
  canvas: {
    type: "infinite-scroll",
    components: "Multiple open simultaneously",
    interaction: "Drag, resize, minimize, close",
    grid: "Optional snap-to-grid",
    zoom: "10% - 200% scale"
  },
  
  // Floating Elements
  floating: {
    niv: "AI Assistant overlay",
    notifications: "Alert badges",
    quickActions: "Floating action buttons"
  }
}
```

---

## 📑 TAB SYSTEM BEHAVIOR

### Tab Click Actions

```typescript
interface TabBehavior {
  onClick: {
    action: "bringToFocus",
    behavior: {
      // When user clicks a tab:
      1: "Check if component exists on canvas",
      2: "If exists: Scroll to it and highlight",
      3: "If not: Create new instance at center",
      4: "Make it the 'primary' component (larger size)",
      5: "Dim other components slightly (optional)"
    }
  },
  
  doubleClick: {
    action: "maximize",
    behavior: "Full-screen focus mode"
  },
  
  rightClick: {
    menu: [
      "Open in new window",
      "Duplicate",
      "Close all except this",
      "Reset position"
    ]
  }
}
```

### Tab-to-Component Mapping

```typescript
const TAB_MODULES = {
  intelligence: {
    component: "IntelligencePipeline",
    defaultSize: { width: 800, height: 600 },
    icon: "🧠",
    features: [
      "7-stage pipeline view",
      "Real-time progress",
      "Results dashboard",
      "Competitive analysis"
    ]
  },
  
  opportunities: {
    component: "OpportunityCenter",
    defaultSize: { width: 700, height: 500 },
    icon: "🎯",
    features: [
      "Opportunity cards",
      "Scoring system",
      "Time windows",
      "One-click execute"
    ]
  },
  
  plan: {
    component: "StrategicPlanning",
    defaultSize: { width: 750, height: 550 },
    icon: "📋",
    features: [
      "Campaign planning",
      "Timeline view",
      "Resource allocation",
      "Goal tracking"
    ]
  },
  
  execute: {
    component: "ExecutionHub",
    defaultSize: { width: 900, height: 650 },
    icon: "🚀",
    features: [
      "Content generation",
      "Media lists",
      "Visual creation",
      "Export system"
    ]
  },
  
  memoryVault: {
    component: "MemoryVault",
    defaultSize: { width: 650, height: 500 },
    icon: "💾",
    features: [
      "Pattern library",
      "Success metrics",
      "Asset storage",
      "Learning insights"
    ]
  }
}
```

---

## 🖼️ INFINITE CANVAS MECHANICS

### Component Management

```typescript
interface CanvasComponent {
  id: string,
  type: TabType,
  position: { x: number, y: number },
  size: { width: number, height: number },
  zIndex: number,
  state: 'normal' | 'focused' | 'minimized' | 'maximized',
  opacity: number, // For dimming non-focused
  locked: boolean, // Prevent accidental moves
  data: any // Component-specific data
}

class InfiniteCanvas {
  components: Map<string, CanvasComponent> = new Map();
  
  // Add component to canvas
  addComponent(type: TabType, options?: Partial<CanvasComponent>) {
    const id = `${type}-${Date.now()}`;
    const component = {
      id,
      type,
      position: this.findEmptySpace(),
      size: TAB_MODULES[type].defaultSize,
      zIndex: this.getTopZIndex() + 1,
      state: 'normal',
      opacity: 1,
      locked: false,
      ...options
    };
    
    this.components.set(id, component);
    return component;
  }
  
  // Bring component to focus
  focusComponent(id: string) {
    // Reset all components
    this.components.forEach(comp => {
      comp.state = 'normal';
      comp.opacity = 0.7; // Dim others
      comp.zIndex = comp.zIndex; // Keep relative order
    });
    
    // Focus target component
    const target = this.components.get(id);
    if (target) {
      target.state = 'focused';
      target.opacity = 1;
      target.zIndex = this.getTopZIndex() + 1;
      this.scrollToComponent(target);
    }
  }
  
  // Smart positioning
  findEmptySpace(): { x: number, y: number } {
    // Algorithm to find empty space on canvas
    // Avoids overlapping existing components
    return this.spiralSearch(window.innerWidth / 2, 300);
  }
}
```

---

## 🎯 USER INTERACTIONS

### Drag & Drop System

```typescript
interface DragSystem {
  // Draggable header for each component
  dragHandle: {
    location: "Component header",
    cursor: "move",
    feedback: "Shadow follows cursor"
  },
  
  // Resize handles
  resizeHandles: {
    positions: ["n", "e", "s", "w", "ne", "se", "sw", "nw"],
    minSize: { width: 400, height: 300 },
    maxSize: { width: 1600, height: 1200 },
    aspectRatio: "free" // or 'locked'
  },
  
  // Snap behavior
  snapping: {
    grid: 20, // pixels
    guides: true, // Show alignment guides
    magnetic: true // Snap to other components
  }
}
```

### Component States

```typescript
interface ComponentStates {
  normal: {
    opacity: 1,
    shadow: "small",
    interactive: true
  },
  
  focused: {
    opacity: 1,
    shadow: "large",
    border: "2px solid primary",
    interactive: true
  },
  
  dimmed: {
    opacity: 0.6,
    shadow: "none",
    interactive: true // Still clickable
  },
  
  minimized: {
    display: "titleBarOnly",
    width: 200,
    height: 40,
    restorable: true
  },
  
  maximized: {
    position: "fixed",
    fullscreen: true,
    zIndex: 9999,
    overlay: true
  }
}
```

---

## 🔧 IMPLEMENTATION DETAILS

### React Component Structure

```tsx
// components/InfiniteCanvas/InfiniteCanvas.tsx
export function InfiniteCanvas() {
  const [components, setComponents] = useState<Map<string, CanvasComponent>>(new Map());
  const [activeTab, setActiveTab] = useState<TabType>('intelligence');
  const [canvasScale, setCanvasScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Handle tab clicks
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    
    // Find or create component
    const existing = Array.from(components.values())
      .find(c => c.type === tab && c.state !== 'minimized');
    
    if (existing) {
      focusComponent(existing.id);
    } else {
      const newComponent = addComponent(tab);
      focusComponent(newComponent.id);
    }
  };
  
  return (
    <div className="infinite-canvas-container">
      {/* Fixed Header */}
      <Header 
        tabs={['intelligence', 'opportunities', 'plan', 'execute', 'memoryVault']}
        activeTab={activeTab}
        onTabClick={handleTabClick}
      />
      
      {/* Infinite Canvas */}
      <div 
        ref={canvasRef}
        className="infinite-canvas"
        style={{ transform: `scale(${canvasScale})` }}
      >
        {Array.from(components.values()).map(component => (
          <DraggableComponent
            key={component.id}
            component={component}
            onDrag={handleDrag}
            onResize={handleResize}
            onClose={handleClose}
            onMinimize={handleMinimize}
            onFocus={() => focusComponent(component.id)}
          >
            {renderComponent(component.type)}
          </DraggableComponent>
        ))}
      </div>
      
      {/* Floating Niv Assistant */}
      <NivOverlay 
        contextAware={true}
        currentComponents={components}
        activeTab={activeTab}
      />
    </div>
  );
}
```

### Component Wrapper

```tsx
// components/InfiniteCanvas/DraggableComponent.tsx
export function DraggableComponent({ 
  component, 
  children, 
  onDrag, 
  onResize, 
  onClose,
  onMinimize,
  onFocus 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  return (
    <div 
      className={`canvas-component ${component.state}`}
      style={{
        position: 'absolute',
        left: component.position.x,
        top: component.position.y,
        width: component.size.width,
        height: component.size.height,
        zIndex: component.zIndex,
        opacity: component.opacity
      }}
      onClick={onFocus}
    >
      {/* Component Header */}
      <div 
        className="component-header"
        onMouseDown={startDrag}
      >
        <span className="component-icon">
          {TAB_MODULES[component.type].icon}
        </span>
        <span className="component-title">
          {TAB_MODULES[component.type].component}
        </span>
        <div className="component-controls">
          <button onClick={onMinimize}>_</button>
          <button onClick={toggleMaximize}>□</button>
          <button onClick={onClose}>×</button>
        </div>
      </div>
      
      {/* Component Content */}
      <div className="component-content">
        {component.state !== 'minimized' && children}
      </div>
      
      {/* Resize Handles */}
      {!component.locked && component.state === 'focused' && (
        <ResizeHandles onResize={onResize} />
      )}
    </div>
  );
}
```

---

## 🎨 VISUAL DESIGN

### Theme Variables

```css
:root {
  /* Canvas */
  --canvas-bg: #0a0a0a;
  --canvas-grid: rgba(255, 255, 255, 0.03);
  
  /* Components */
  --component-bg: #1a1a1a;
  --component-border: #2a2a2a;
  --component-header: #252525;
  --component-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  --component-shadow-focused: 0 8px 40px rgba(99, 102, 241, 0.3);
  
  /* Tabs */
  --tab-inactive: #4a4a4a;
  --tab-active: #6366f1;
  --tab-hover: #5558e3;
  
  /* Accent Colors by Module */
  --intelligence-color: #8b5cf6;
  --opportunities-color: #f59e0b;
  --plan-color: #10b981;
  --execute-color: #ef4444;
  --memory-color: #3b82f6;
}
```

### Component Styling

```css
.canvas-component {
  background: var(--component-bg);
  border: 1px solid var(--component-border);
  border-radius: 8px;
  box-shadow: var(--component-shadow);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.canvas-component.focused {
  box-shadow: var(--component-shadow-focused);
  border-color: var(--tab-active);
}

.canvas-component.dimmed {
  opacity: 0.6;
  filter: brightness(0.8);
}

.component-header {
  background: var(--component-header);
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
  cursor: move;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Infinite canvas with dot grid */
.infinite-canvas {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: auto;
  background-color: var(--canvas-bg);
  background-image: radial-gradient(circle, var(--canvas-grid) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

---

## 🚀 INTERACTION FLOWS

### Typical User Journey

```typescript
userJourney = {
  1: "User clicks 'Intelligence' tab",
  2: "Intelligence module opens center-screen (or focuses if open)",
  3: "Pipeline runs, user watches progress",
  4: "User clicks 'Opportunities' without closing Intelligence",
  5: "Opportunities opens to the right of Intelligence",
  6: "User drags Opportunities below Intelligence",
  7: "Clicks opportunity → Opens 'Execute' module",
  8: "Three modules now visible on canvas",
  9: "User can see flow: Intelligence → Opportunities → Execute",
  10: "Saves workspace layout for next session"
}
```

### Multi-Component Workflows

```typescript
workflows = {
  campaignCreation: {
    components: ["intelligence", "opportunities", "plan", "execute"],
    layout: "2x2 grid",
    dataFlow: "Intelligence feeds → Opportunities → Plan → Execute"
  },
  
  crisisResponse: {
    components: ["intelligence", "execute", "memoryVault"],
    layout: "Horizontal strip",
    dataFlow: "Monitor → Generate → Learn"
  },
  
  weeklyPlanning: {
    components: ["opportunities", "plan", "memoryVault"],
    layout: "Triangle formation",
    dataFlow: "Review → Plan → Reference"
  }
}
```

---

## 💾 PERSISTENCE

### Save Workspace Layout

```typescript
interface WorkspaceState {
  components: CanvasComponent[],
  canvasScale: number,
  scrollPosition: { x: number, y: number },
  activeTab: TabType,
  savedAt: Date
}

// Save to localStorage/Supabase
function saveWorkspace() {
  const state: WorkspaceState = {
    components: Array.from(components.values()),
    canvasScale,
    scrollPosition: {
      x: window.scrollX,
      y: window.scrollY
    },
    activeTab,
    savedAt: new Date()
  };
  
  localStorage.setItem('workspace', JSON.stringify(state));
  // Also save to Supabase for cross-device sync
}

// Restore on load
function restoreWorkspace() {
  const saved = localStorage.getItem('workspace');
  if (saved) {
    const state = JSON.parse(saved);
    // Restore all component positions and states
  }
}
```

---

## 🎮 KEYBOARD SHORTCUTS

```typescript
const SHORTCUTS = {
  'Cmd+1': 'Focus Intelligence tab',
  'Cmd+2': 'Focus Opportunities tab',
  'Cmd+3': 'Focus Plan tab',
  'Cmd+4': 'Focus Execute tab',
  'Cmd+5': 'Focus MemoryVault tab',
  'Cmd+N': 'New component of active type',
  'Cmd+W': 'Close focused component',
  'Cmd+M': 'Minimize focused component',
  'Cmd+Shift+M': 'Maximize focused component',
  'Space': 'Pan canvas (hold)',
  'Cmd +/-': 'Zoom in/out',
  'Cmd+0': 'Reset zoom',
  'Cmd+S': 'Save workspace layout',
  'Esc': 'Exit maximize mode'
};
```

---

## 📱 RESPONSIVE BEHAVIOR

### Screen Size Adaptations

```typescript
const RESPONSIVE_BREAKPOINTS = {
  mobile: {
    maxWidth: 768,
    behavior: "Single component view with bottom tab bar",
    canvas: "Disabled - use tab switching only"
  },
  
  tablet: {
    maxWidth: 1024,
    behavior: "Limited canvas - max 2 components",
    defaultLayout: "Split screen"
  },
  
  desktop: {
    minWidth: 1025,
    behavior: "Full infinite canvas",
    defaultLayout: "User preference"
  },
  
  ultrawide: {
    minWidth: 2560,
    behavior: "Enhanced canvas with preset zones",
    defaultLayout: "Optimal 5-component layout"
  }
}
```

---

## 🔄 NIV INTEGRATION

### Context-Aware Assistant

```typescript
interface NivOverlay {
  position: 'bottom-right' | 'floating',
  awareness: {
    visibleComponents: CanvasComponent[],
    activeComponent: string,
    userActions: Action[],
    dataContext: any
  },
  
  suggestions: {
    // Based on what's visible
    "You have 3 opportunities expiring" → "Focus Opportunities tab",
    "Intelligence complete" → "Check new opportunities",
    "Campaign ready" → "Review in Execute module"
  },
  
  commands: {
    "Show me opportunities": () => focusTab('opportunities'),
    "Run intelligence": () => startPipeline(),
    "Create campaign": () => openExecute(),
    "What should I do next?": () => analyzeWorkspace()
  }
}
```

---

## 🎯 BENEFITS

1. **Never Lose Context** - Keep multiple modules open
2. **Visual Workflows** - See data flow between components
3. **Personalized Workspace** - Arrange to your preference
4. **Quick Focus** - Tabs bring instant attention
5. **Comparison View** - Compare opportunities side-by-side
6. **Progress Monitoring** - Watch pipeline while working
7. **Efficient Multitasking** - Multiple workflows simultaneously

This infinite canvas approach gives users complete control over their workspace while maintaining the focused simplicity of a tab system!
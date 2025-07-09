# Mobile Parametric Pattern Editor - Interface Mockups

## Primary Interface Layout (Portrait Mode)

### Main Screen - Pattern Creation View
```
┌─────────────────────────────────────────────────────────────┐
│  [☰] Pattern Editor                              [⚙️] [💾] │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                        │ │
│ │                                                        │ │
│ │              Live Pattern Preview                      │ │
│ │                                                        │ │
│ │                     [Zoom: 100%]                       │ │
│ │                                                        │ │
│ │                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Parameters] [Style] [Effects] [Transform] [Export]    │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                        │ │
│ │ Scale         [━━━━━━━●━━━━━━━]  1.2x                   │ │
│ │                                                        │ │
│ │ Rotation      [━━━━━━━━━━━━━━━] 45°  [🔄]               │ │
│ │                                                        │ │
│ │ Complexity    [━━━━━━━━━━━━━━━] 7/10                    │ │
│ │                                                        │ │
│ │ [More Parameters ▼]                                    │ │
│ │                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Advanced Parameter Panel - Expanded View
```
┌─────────────────────────────────────────────────────────────┐
│  [◀] Advanced Parameters                         [Reset] │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Pattern Properties                                      │ │
│ │                                                        │ │
│ │ Base Scale    [━━━━━━━●━━━━━━━]  1.2x    [Fine ±]       │ │
│ │                                                        │ │
│ │ Rotation      [━━━━━━━━━━━━━━━] 45°     [🔄] [Lock]     │ │
│ │                                                        │ │
│ │ Spacing       [━━━━━━━━━━━━━━━] 8px     [Grid]          │ │
│ │                                                        │ │
│ │ Offset X/Y    [━━━━━━━━━━━━━━━] 0px     [Center]        │ │
│ │                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Mathematical Controls                                   │ │
│ │                                                        │ │
│ │ Frequency     [━━━━━━━━━━━━━━━] 2.5Hz   [Sine]          │ │
│ │                                                        │ │
│ │ Amplitude     [━━━━━━━━━━━━━━━] 0.8     [Clamp]         │ │
│ │                                                        │ │
│ │ Phase         [━━━━━━━━━━━━━━━] 0.0°    [Sync]          │ │
│ │                                                        │ │
│ │ Noise         [━━━━━━━━━━━━━━━] 0.1     [Perlin]        │ │
│ │                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                            │
│ [Apply] [Preview] [Cancel] [Save Preset]                   │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Parameter Control Interfaces

### 2D Parameter Touch Pad
```
┌─────────────────────────────────────────────────────────────┐
│  Position Control                                          │
├─────────────────────────────────────────────────────────────┤
│                        Y: 0.75                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ │                                                     │ │ │
│ │ │                                                     │ │ │
│ │ │                        ●                            │ │ │
│ │ │                                                     │ │ │
│ │ │                                                     │ │ │
│ │ │                                                     │ │ │
│ │ │                                                     │ │ │
│ │ │                                                     │ │ │
│ │ │                                                     │ │ │
│ │ │                                                     │ │ │
│ │ │                                                     │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │
│                       X: 0.25                              │
│                                                            │
│ [Reset] [Lock X] [Lock Y] [Snap to Grid]                   │
└─────────────────────────────────────────────────────────────┘
```

### Radial Parameter Wheel
```
┌─────────────────────────────────────────────────────────────┐
│  Rotation Control                                          │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│                    ┌─────────────┐                         │
│                   ╱               ╲                        │
│                  ╱        45°      ╲                       │
│                 ╱         ●         ╲                      │
│                │                     │                     │
│                │                     │                     │
│                │                     │                     │
│                 ╲                   ╱                      │
│                  ╲                 ╱                       │
│                   ╲_______________╱                        │
│                    └─────────────┘                         │
│                                                            │
│ [0°] [45°] [90°] [135°] [180°] [225°] [270°] [315°]        │
│                                                            │
│ [Reset] [Snap 15°] [Continuous] [Reverse]                  │
└─────────────────────────────────────────────────────────────┘
```

## Color and Style Controls

### Color Parameter Interface
```
┌─────────────────────────────────────────────────────────────┐
│  Color Control                                             │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│ Primary Color    [████████████████████████████████████████] │
│                                                            │
│ Secondary Color  [████████████████████████████████████████] │
│                                                            │
│ Accent Color     [████████████████████████████████████████] │
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                        │ │
│ │                  Color Wheel                           │ │
│ │                                                        │ │
│ │                     [●]                                │ │
│ │                                                        │ │
│ │                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                            │
│ Hue           [━━━━━━━━●━━━━━━━] 180°                       │
│ Saturation    [━━━━━━━━━●━━━━━] 75%                        │
│ Brightness    [━━━━━━━━━━●━━━━] 80%                        │
│ Alpha         [━━━━━━━━━━━●━━━] 90%                        │
│                                                            │
│ [Eyedropper] [Palette] [Gradient] [Harmonies]             │
└─────────────────────────────────────────────────────────────┘
```

## Landscape Mode Layout

### Landscape View - Enhanced Parameter Access
```
┌─────────────────────────────────────────────────────────────┐
│ [☰] Pattern Editor                [⚙️] [💾] [🔄] [Export]   │
├─────────────────────────────────────────────────────────────┤
│                                  │                         │
│ ┌─────────────────────────────────┐ │ ┌─────────────────────┐ │
│ │                                │ │ │ Parameters          │ │
│ │                                │ │ │                     │ │
│ │      Pattern Preview           │ │ │ Scale               │ │
│ │                                │ │ │ [━━━━━━━●━━━━━] 1.2x │ │
│ │                                │ │ │                     │ │
│ │                                │ │ │ Rotation            │ │
│ │                                │ │ │ [━━━━━━━━━━━━━] 45°  │ │
│ │                                │ │ │                     │ │
│ │                                │ │ │ Complexity          │ │
│ │                                │ │ │ [━━━━━━━━━━━━━] 7/10 │ │
│ │                                │ │ │                     │ │
│ │                                │ │ │ [Advanced ▼]        │ │
│ │                                │ │ │                     │ │
│ │                                │ │ │ [Style] [Effects]   │ │
│ │                                │ │ │                     │ │
│ │ [Zoom: 100%]                   │ │ │ [Transform] [Export] │ │
│ │                                │ │ │                     │ │
│ └─────────────────────────────────┘ │ └─────────────────────┘ │
│                                    │                         │
└─────────────────────────────────────────────────────────────┘
```

## Gesture Interaction Patterns

### Multi-Touch Gestures
```
┌─────────────────────────────────────────────────────────────┐
│  Gesture Guide                                             │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Single Touch: Select/Drag                               │ │
│ │ ○ → ○ → ○                                              │ │
│ │                                                        │ │
│ │ Pinch: Scale Pattern                                    │ │
│ │ ○     ○  →  ○○                                         │ │
│ │                                                        │ │
│ │ Rotate: Two-finger rotation                            │ │
│ │ ○  ○  →  ○ ○                                          │ │
│ │     ↻      ↻                                           │ │
│ │                                                        │ │
│ │ Three-finger tap: Undo                                 │ │
│ │ ○ ○ ○                                                  │ │
│ │                                                        │ │
│ │ Four-finger tap: Reset                                 │ │
│ │ ○ ○ ○ ○                                                │ │
│ │                                                        │ │
│ │ Double-tap: Zoom to fit                                │ │
│ │ ○○                                                     │ │
│ │                                                        │ │
│ │ Long-press: Context menu                               │ │
│ │ ○ (hold)                                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Parameter Gesture Shortcuts
```
┌─────────────────────────────────────────────────────────────┐
│  Parameter Shortcuts                                       │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│ Scale Parameter:                                           │
│ • Two-finger pinch on preview → Scale pattern             │
│ • Double-tap slider → Reset to default                    │
│ • Long-press slider → Show presets                        │
│                                                            │
│ Rotation Parameter:                                        │
│ • Two-finger rotate on preview → Rotate pattern           │
│ • Tap rotation wheel → Snap to nearest 15°                │
│ • Swipe wheel → Continuous rotation                       │
│                                                            │
│ Color Parameter:                                           │
│ • Tap color swatch → Open color picker                    │
│ • Long-press color → Eyedropper mode                      │
│ • Swipe color → Cycle through palette                     │
│                                                            │
│ Complex Parameters:                                        │
│ • Swipe up on panel → Expand all parameters               │
│ • Swipe down on panel → Collapse to essentials           │
│ • Two-finger scroll → Fast parameter navigation           │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization Visual Indicators

### Performance Mode Indicators
```
┌─────────────────────────────────────────────────────────────┐
│  Performance Status                                        │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│ Current Performance: [████████████████████████████████] 60fps │
│                                                            │
│ Battery Status: [████████████████░░░░░░░░░░░░░░] 67%       │
│                                                            │
│ Thermal Status: [████████████████░░░░░░░░░░░░░░] Normal    │
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Performance Settings                                    │ │
│ │                                                        │ │
│ │ Quality  [━━━━━━━━━━━━━━━] High                          │ │
│ │                                                        │ │
│ │ FPS      [━━━━━━━━━━━━━━━] 60fps                         │ │
│ │                                                        │ │
│ │ Battery  [━━━━━━━━━━━━━━━] Balanced                      │ │
│ │                                                        │ │
│ │ □ Auto-adjust for battery                              │ │
│ │ □ Reduce quality when hot                              │ │
│ │ □ Pause rendering when backgrounded                    │ │
│ │                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Accessibility Features

### Accessibility Controls
```
┌─────────────────────────────────────────────────────────────┐
│  Accessibility Options                                     │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│ Visual Accessibility:                                      │
│ • Text Size       [━━━━━━━━━━━━━━━] Large                   │
│ • Contrast        [━━━━━━━━━━━━━━━] High                    │
│ • Motion          [━━━━━━━━━━━━━━━] Reduced                 │
│                                                            │
│ Motor Accessibility:                                       │
│ • Touch Sensitivity [━━━━━━━━━━━━━━━] High                  │
│ • Gesture Timeout   [━━━━━━━━━━━━━━━] 3 seconds            │
│ • Voice Control     [●] Enabled                           │
│                                                            │
│ Cognitive Accessibility:                                   │
│ • Simplified Interface [●] Enabled                        │
│ • Guided Tutorial    [●] Show on startup                  │
│ • Parameter Hints    [●] Always show                      │
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Voice Commands                                          │ │
│ │                                                        │ │
│ │ "Increase scale"     → Scale +10%                       │ │
│ │ "Rotate 90 degrees"  → Rotation to 90°                 │ │
│ │ "Reset pattern"      → Reset all parameters            │ │
│ │ "Save pattern"       → Save current pattern            │ │
│ │ "Show colors"        → Open color picker               │ │
│ │                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Export and Sharing Interface

### Export Options
```
┌─────────────────────────────────────────────────────────────┐
│  Export Pattern                                            │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                        │ │
│ │               Export Preview                           │ │
│ │                                                        │ │
│ │                1024 x 1024                             │ │
│ │                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                            │
│ Format:     [PNG ▼] [SVG] [PDF] [JSON]                    │
│                                                            │
│ Size:       [━━━━━━━━━━━━━━━] 1024px                       │
│                                                            │
│ DPI:        [━━━━━━━━━━━━━━━] 300 DPI                      │
│                                                            │
│ Background: [████████████████████████████████████████] Transparent │
│                                                            │
│ Quality:    [━━━━━━━━━━━━━━━] High                         │
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Batch Export                                            │ │
│ │                                                        │ │
│ │ □ Multiple sizes (1x, 2x, 3x)                          │ │
│ │ □ Multiple formats (PNG, SVG, PDF)                     │ │
│ │ □ Parameter variations                                  │ │
│ │                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                            │
│ [Preview] [Export] [Share] [Save Project]                  │
└─────────────────────────────────────────────────────────────┘
```

These mockups provide a comprehensive visual representation of the mobile-first parametric pattern editor interface, showing how the design principles translate into actual user interface elements and interactions. The layouts emphasize touch-friendly controls, efficient use of screen space, and intuitive navigation patterns that make complex parametric design accessible on mobile devices.
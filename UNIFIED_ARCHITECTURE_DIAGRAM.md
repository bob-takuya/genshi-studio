# Unified Editing Architecture - Visual Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GENSHI STUDIO - UNIFIED EDITING                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         USER INTERFACE LAYER                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │   Draw   │  │Parametric│  │   Code   │  │  Growth  │            │   │
│  │  │   Tools  │  │  Tools   │  │  Editor  │  │ Controls │            │   │
│  │  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘            │   │
│  └────────┼──────────────┼──────────────┼──────────────┼───────────────┘   │
│           │              │              │              │                     │
│  ┌────────▼──────────────▼──────────────▼──────────────▼───────────────┐   │
│  │                      MODE ADAPTER LAYER                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │   Draw   │  │Parametric│  │   Code   │  │  Growth  │            │   │
│  │  │ Adapter  │  │ Adapter  │  │ Adapter  │  │ Adapter  │            │   │
│  │  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘            │   │
│  │        │              │              │              │                 │   │
│  │        └──────────────┴──────────────┴──────────────┘                │   │
│  │                              │                                        │   │
│  │                    ┌─────────▼─────────┐                            │   │
│  │                    │  Adapter Registry │                            │   │
│  │                    └─────────┬─────────┘                            │   │
│  └──────────────────────────────┼───────────────────────────────────────┘   │
│                                 │                                            │
│  ┌──────────────────────────────▼───────────────────────────────────────┐   │
│  │                    UNIFIED SYNC ENGINE                               │   │
│  │  ┌───────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────┐   │   │
│  │  │  Event    │  │   Conflict   │  │  Priority   │  │  Change  │   │   │
│  │  │   Bus     │  │   Resolver   │  │   Queue     │  │  Stream  │   │   │
│  │  └─────┬─────┘  └──────┬───────┘  └──────┬──────┘  └─────┬────┘   │   │
│  │        │                │                  │                │        │   │
│  │        └────────────────┴──────────────────┴────────────────┘       │   │
│  │                                 │                                    │   │
│  └─────────────────────────────────┼────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────▼────────────────────────────────────┐   │
│  │                      UNIFIED ENTITY STORE                            │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │         Map<string, CanvasEntity>                           │     │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │     │   │
│  │  │  │   Entity    │  │   Entity    │  │   Entity    │  ...  │     │   │
│  │  │  │  id: "e1"   │  │  id: "e2"   │  │  id: "e3"   │       │     │   │
│  │  │  │  geometry   │  │  geometry   │  │  geometry   │       │     │   │
│  │  │  │  modeData   │  │  modeData   │  │  modeData   │       │     │   │
│  │  │  │  - draw     │  │  - draw     │  │  - draw     │       │     │   │
│  │  │  │  - param    │  │  - param    │  │  - param    │       │     │   │
│  │  │  │  - code     │  │  - code     │  │  - code     │       │     │   │
│  │  │  │  - growth   │  │  - growth   │  │  - growth   │       │     │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘       │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  ┌───────────────┐  ┌────────────────┐  ┌──────────────────┐      │   │
│  │  │ Spatial Index │  │ Version History │  │ Change Journal   │      │   │
│  │  └───────────────┘  └────────────────┘  └──────────────────┘      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────▼────────────────────────────────────┐   │
│  │                   UNIFIED RENDERING PIPELINE                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │  Draw    │  │Parametric│  │  Code    │  │  Growth  │           │   │
│  │  │ Renderer │  │ Renderer │  │ Renderer │  │ Renderer │           │   │
│  │  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘           │   │
│  │        │              │              │              │                │   │
│  │        └──────────────┴──────────────┴──────────────┘               │   │
│  │                              │                                       │   │
│  │                    ┌─────────▼─────────┐                           │   │
│  │                    │ Layer Compositor  │                           │   │
│  │                    └─────────┬─────────┘                           │   │
│  │                              │                                       │   │
│  │                    ┌─────────▼─────────┐                           │   │
│  │                    │  WebGL Context    │                           │   │
│  │                    └───────────────────┘                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Action in Draw Mode
         │
         ▼
┌─────────────────┐
│  Draw Adapter   │
│                 │
│ • Capture stroke│
│ • Create update │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Unified Sync    │────▶│ Conflict Check   │
│    Engine       │     └──────────────────┘
└────────┬────────┘              │
         │                       ▼
         │              ┌──────────────────┐
         │              │ Apply to Store   │
         │              └────────┬─────────┘
         ▼                       │
┌─────────────────┐              │
│  Entity Store   │◀─────────────┘
│                 │
│ • Update entity │
│ • Version++     │
│ • Set dirty     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Change Stream   │
│                 │
│ • Emit change   │
│ • Notify modes  │
└────────┬────────┘
         │
    ┌────┴────┬──────┬──────┐
    ▼         ▼      ▼      ▼
┌────────┐ ┌─────┐ ┌────┐ ┌──────┐
│Param   │ │Code │ │Grow│ │Render│
│Adapter │ │Adapt│ │Adpt│ │Engine│
└────────┘ └─────┘ └────┘ └──────┘
    │         │      │       │
    ▼         ▼      ▼       ▼
 Extract   Generate  Infer  Update
 Patterns   Code    Rules   Canvas
```

## Mode Adapter Translation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BIDIRECTIONAL TRANSLATION                     │
│                                                                  │
│  Draw Mode          Parametric Mode        Code Mode            │
│  ─────────          ───────────────        ─────────            │
│                                                                  │
│  Strokes ◀─────────▶ Parameters ◀────────▶ Functions           │
│     │                     │                    │                 │
│     │    Pattern          │    Code           │                 │
│     │    Recognition      │    Generation     │                 │
│     │                     │                    │                 │
│     └─────────────────────┴────────────────────┘                │
│                           │                                      │
│                    Unified Geometry                              │
│                    ───────────────                              │
│                    • Primitives                                  │
│                    • Transforms                                  │
│                    • Styles                                      │
│                           │                                      │
│                           ▼                                      │
│                    Growth Mode                                   │
│                    ───────────                                   │
│                    Rules & Evolution                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Entity Structure

```
CanvasEntity {
  id: "entity_123",
  type: "composite",
  version: 42,
  
  geometry: {
    primitives: [
      { type: "path", points: [...], style: {...} },
      { type: "bezier", control: [...], style: {...} }
    ],
    boundingBox: { x: 0, y: 0, w: 100, h: 100 },
    spatialHash: "abc123"
  },
  
  modeData: {
    draw: {
      strokes: [...],
      brushSettings: {...},
      pressure: [...]
    },
    parametric: {
      patternType: "islamic_star",
      parameters: Map { n: 8, radius: 50 },
      constraints: [...]
    },
    code: {
      source: "genshi.star(8, 50)",
      ast: {...},
      dependencies: ["geometry"]
    },
    growth: {
      algorithm: "l-system",
      rules: [...],
      generation: 5
    }
  },
  
  metadata: {
    created: 1234567890,
    modified: 1234567900,
    createdBy: "draw",
    tags: ["star", "geometric"],
    locked: Set { "parametric" }
  }
}
```

## Performance Optimizations

```
┌─────────────────────────────────────────────────────┐
│              PERFORMANCE ARCHITECTURE                │
│                                                      │
│  ┌──────────────┐     ┌──────────────┐             │
│  │  LRU Cache   │     │ Web Workers  │             │
│  │              │     │              │             │
│  │ • Translations│     │ • Heavy comp │             │
│  │ • Renderings │     │ • Translations│             │
│  │ • Patterns   │     │ • Code exec  │             │
│  └──────┬───────┘     └──────┬───────┘             │
│         │                     │                      │
│  ┌──────▼─────────────────────▼──────┐              │
│  │      MAIN THREAD                  │              │
│  │                                   │              │
│  │  ┌─────────┐    ┌─────────┐     │              │
│  │  │ Batching│    │Throttle │     │              │
│  │  │  16ms   │    │ Updates │     │              │
│  │  └─────────┘    └─────────┘     │              │
│  │                                   │              │
│  │  ┌─────────────────────────┐     │              │
│  │  │  Differential Updates   │     │              │
│  │  │  • Only changed fields  │     │              │
│  │  │  • Smart dirty tracking │     │              │
│  │  └─────────────────────────┘     │              │
│  └───────────────────────────────────┘              │
│                                                      │
│  ┌───────────────────────────────────┐              │
│  │        GPU ACCELERATION           │              │
│  │  • Shared WebGL context           │              │
│  │  • Instanced rendering            │              │
│  │  • Texture atlases                │              │
│  └───────────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

## Key Benefits

1. **Single Source of Truth**: No data duplication or synchronization issues
2. **Real-time Updates**: Changes propagate instantly across all modes
3. **Conflict Resolution**: Intelligent handling of concurrent edits
4. **Performance**: Shared resources and optimized rendering
5. **Extensibility**: Easy to add new modes or features
6. **Collaboration Ready**: Foundation for multi-user editing

---
*ARCHITECT_003 - Visual Architecture Documentation*
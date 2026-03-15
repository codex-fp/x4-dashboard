# Hull & Shield Combined Overhang Widget

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the two separate flat SVG bars with a single combined widget: a shields bar that physically overhangs a recessed hull bar, sandwiched between two label rows (SHIELDS on top, HULL on bottom), all rendered as one inline SVG.

**Architecture:** `ShipShieldsWidget` becomes the combined widget rendering both bars + both label rows inside one component. `ShipHullWidget` is gutted to return `null` — no dashboard config changes needed. Both bars live in a single `viewBox="0 0 400 34"` SVG so their shapes are physically connected. The shields polygon has a bottom-right lip/flange that overhangs the hull bar. Each bar has its own `<clipPath>` for the fill. CSS adds two wrapper classes for the label rows.

**Tech Stack:** React 18 (TSX), inline SVG, `React.useId()`, `clipPathUnits="objectBoundingBox"`, CSS custom properties, `@keyframes` for hull-critical pulse.

---

## Context & Constraints

- Working directory: `C:\Users\fpiec\WebstormProjects\x4-dashboard`
- Components: `client/src/components/ShipStatus.tsx`
- Styles: `client/src/index.css` (monolithic — never split)
- Validate: `cd client && npx tsc --noEmit`
- Widgets render at `scale: 2.5` zoom — design at base size
- Props interface `{ ship: ShipStatusType }` must be preserved on both exports
- `hullClass()`, `ShipCargoWidget`, `ShipStatusWidget` must remain intact
- No default exports, no new files
- `TargetInfo.tsx` uses `.clean-health-row` — do NOT touch it

---

## Visual Spec

```
SHIELDS ──────────────────────────────── 71%    ← top label row
╔══════════════════════════════════════╗
║ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║  ← shields bar (height 20, full width 400)
║ ████████████████████░░░░░░░░░░░░░░░ ╔╝  ← bottom-right lip overhangs hull
╚════════════════════════════╗        ║
   ║ ██████░░░░░░░░░░░░░░░░░ ║        ║  ← hull bar (height 12, inset, recessed under shields)
   ╚════════════════════════╝
HULL ──────────────────────────────── 22%      ← bottom label row
```

### SVG coordinate spec (`viewBox="0 0 400 34"`)

**Shields polygon** — wider, taller, overhanging lip on bottom-right:
```
Points: 0,0  400,0  400,22  392,22  386,26  0,22
         ^top-left  ^top-right  ^bottom-right overhang lip  ^bottom-left
```
- Spans full width (0→400), height 0→22
- The `392,22  386,26` segment creates a 4px downward lip on the bottom-right corner
- This lip hangs over the hull bar (which starts at y=22)
- Fill: `var(--c-cyan)`, clipped to shields pct%
- Frame: `rgba(0,229,255,0.25)` stroke, `rgba(0,229,255,0.04)` fill

**Hull polygon** — narrower, shorter, recessed under shields:
```
Points: 8,22  386,22  394,26  394,34  8,34
         ^top-left (inset 8px)  ^top-right angled up to meet shields lip  ^bottom-right  ^bottom-left
```
- Starts at x=8 (inset from shields left edge), ends at x=394
- Top-right corner `394,26` aligns exactly with the shields lip point `386,26`
- This makes the hull bar's top-right corner tuck under the shields overhang
- Fill: hull colour (green/orange/red), clipped to hull pct%
- Frame: tonal stroke/fill matching hull colour

### clipPath for each bar
- Shields: `clipPathUnits="objectBoundingBox"`, `<rect width={shieldsPct/100} height="1"/>`
  - **Important:** objectBoundingBox is relative to the polygon's bounding box, not the whole SVG. For the shields polygon bounding box is x:0→400, y:0→26 (includes the lip). Width fraction is shields pct / 100.
- Hull: same approach, hull pct / 100

### Label rows
```
Top:    [SHIELDS label left]  [shields pct% value right]
Bottom: [HULL label left]     [hull pct% value right]
```
Both rows use existing `.svg-bar-label` and `.svg-bar-value` colour classes.
New wrapper class `.health-bar-top-row` and `.health-bar-bot-row` for margin/padding.

---

## Task 1: Add CSS for label row wrappers

**Files:**
- Modify: `client/src/index.css`

**Step 1: Locate insertion point**

Find `.svg-bar-row` in `client/src/index.css` (around line 1718). The existing `.svg-bar-*` block handles the old two-widget layout. We are keeping those classes but adding two new layout classes for the combined widget's label rows.

**Step 2: Add after the existing `.svg-bar-*` block (after `@keyframes hullSvgPulse`):**

```css
/* ── Combined health bar label rows ────────────────────────────── */

.health-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.health-bar-top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.health-bar-bot-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 4px;
}

.health-bar-svg {
  display: block;
  width: 100%;
  overflow: visible;
}
```

**Step 3: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Rewrite ShipShieldsWidget as combined widget, gut ShipHullWidget

**Files:**
- Modify: `client/src/components/ShipStatus.tsx`

**Step 1: Read the current file**

File is at `client/src/components/ShipStatus.tsx`. Currently has two separate SVG widgets.

**Step 2: Replace the entire `ShipShieldsWidget` function** with:

```tsx
export function ShipShieldsWidget({ ship }: Props) {
  const shieldsPct = Math.max(0, Math.min(100, ship.shields))
  const hullPct    = Math.max(0, Math.min(100, ship.hull))
  const tone       = hullClass(hullPct)
  const shieldsClipId = React.useId()
  const hullClipId    = React.useId()

  const hullFill =
    tone === 'low' ? 'var(--c-red)' :
    tone === 'med' ? 'var(--c-orange)' :
    'var(--c-green)'
  const hullStroke =
    tone === 'low' ? 'rgba(255,23,68,0.3)' :
    tone === 'med' ? 'rgba(255,109,0,0.3)' :
    'rgba(0,230,118,0.3)'
  const hullFrameFill =
    tone === 'low' ? 'rgba(255,23,68,0.04)' :
    tone === 'med' ? 'rgba(255,109,0,0.04)' :
    'rgba(0,230,118,0.04)'

  // Shields polygon — full width, bottom-right lip overhangs hull
  const shieldsPoints = '0,0 400,0 400,22 392,22 386,26 0,22'
  // Hull polygon — recessed, top-right tucked under shields lip
  const hullPoints    = '8,22 386,22 394,26 394,34 8,34'

  return (
    <div className="health-bar-wrap">
      {/* Top label row: SHIELDS */}
      <div className="health-bar-top-row">
        <span className="svg-bar-label">Shields</span>
        <span className="svg-bar-value shields-val">{shieldsPct.toFixed(0)}%</span>
      </div>

      {/* Combined SVG — both bars in one coordinate space */}
      <svg
        className="health-bar-svg"
        viewBox="0 0 400 34"
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={shieldsClipId} clipPathUnits="objectBoundingBox">
            <rect x="0" y="0" width={shieldsPct / 100} height="1" />
          </clipPath>
          <clipPath id={hullClipId} clipPathUnits="objectBoundingBox">
            <rect x="0" y="0" width={hullPct / 100} height="1" />
          </clipPath>
        </defs>

        {/* ── Shields bar ── */}
        {/* Frame */}
        <polygon
          points={shieldsPoints}
          fill="rgba(0,229,255,0.04)"
          stroke="rgba(0,229,255,0.25)"
          strokeWidth="1"
        />
        {/* Fill */}
        <polygon
          points={shieldsPoints}
          fill="var(--c-cyan)"
          stroke="none"
          clipPath={`url(#${shieldsClipId})`}
        />

        {/* ── Hull bar ── */}
        {/* Frame */}
        <polygon
          points={hullPoints}
          fill={hullFrameFill}
          stroke={hullStroke}
          strokeWidth="1"
        />
        {/* Fill */}
        <polygon
          points={hullPoints}
          fill={hullFill}
          stroke="none"
          clipPath={`url(#${hullClipId})`}
          className={tone === 'low' ? 'hull-svg-low' : undefined}
        />
      </svg>

      {/* Bottom label row: HULL */}
      <div className="health-bar-bot-row">
        <span className="svg-bar-label">Hull</span>
        <span className={`svg-bar-value hull-val ${tone}`}>{hullPct.toFixed(0)}%</span>
      </div>
    </div>
  )
}
```

**Step 3: Replace the entire `ShipHullWidget` function** with:

```tsx
export function ShipHullWidget(_props: Props) {
  return null
}
```

**Step 4: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

**Step 5: Commit**

```bash
git add client/src/components/ShipStatus.tsx client/src/index.css
git commit -m "feat: combined shields/hull overhang widget with shared SVG coordinate space"
```

---

## Task 3: Visual polish — SVG height and label spacing at 2.5× zoom

**Files:**
- Modify: `client/src/index.css` (height of `.health-bar-svg` only)
- Modify: `client/src/components/ShipStatus.tsx` (viewBox + polygon points only if shapes need adjustment)

**Step 1: Check the rendered result**

Open `http://localhost:3000`. The bottom strip should show:
- `SHIELDS` label top-left, shields pct% top-right
- Shields bar: wide, full-width, cyan
- Hull bar: recessed underneath, inset left, angled top-right corner tucked under shields lip
- `HULL` label bottom-left, hull pct% bottom-right

**Step 2: Set the SVG height in CSS**

The viewBox is `0 0 400 34`. At `scale: 2.5` zoom the SVG will try to expand to fill available height if no CSS height is set. Add to `.health-bar-svg`:

The SVG should render at about 20px CSS height (50px at 2.5×). Set:

```css
.health-bar-svg {
  display: block;
  width: 100%;
  height: 20px;
  overflow: visible;
}
```

**Step 3: Verify the overhang reads clearly**

The shields bar bottom-right lip (`386,26`) should visibly overlap the hull bar top-right corner (`394,26`). At 20px CSS height with viewBox height 34, each viewBox unit = 20/34 ≈ 0.59px CSS. The 4px lip in viewBox coords = ~2.4px CSS — very subtle at base size, but at 2.5× zoom = 6px, which should be visible.

If the overhang is too subtle, increase the lip depth from 4 to 6: change `386,26` → `384,28` in shieldsPoints and `394,26` → `394,28` in hullPoints.

**Step 4: Commit if any adjustments**

```bash
git add client/src/index.css client/src/components/ShipStatus.tsx
git commit -m "chore: set combined health bar SVG height for 2.5x zoom"
```

---

## Completion Checklist

- [ ] `ShipShieldsWidget` renders the full combined widget (both bars, both label rows) in one SVG
- [ ] `ShipHullWidget` returns `null`
- [ ] Shields bar: full-width polygon with bottom-right overhang lip
- [ ] Hull bar: inset polygon, top-right corner tucked under shields lip, same y-coordinates where they meet
- [ ] Shields fill: cyan, clipped to shields pct%
- [ ] Hull fill: green/orange/red per threshold, clipped to hull pct%, pulse animation at <30%
- [ ] Top label row: `SHIELDS` left, shields pct% right
- [ ] Bottom label row: `HULL` left, hull pct% right
- [ ] `React.useId()` for both clipPath IDs, `clipPathUnits="objectBoundingBox"`
- [ ] `hullClass()`, `ShipCargoWidget`, `ShipStatusWidget` intact
- [ ] No TypeScript errors
- [ ] No new files, no default exports

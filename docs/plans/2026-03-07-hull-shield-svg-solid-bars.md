# Hull & Shield SVG Solid Bar Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the parallelogram cell bars with two distinct inline SVG solid-fill bars — Shields uses a wide aerodynamic hexagonal silhouette, Hull uses a taller armour-plate shape with a diagonal cut and stepped left edge.

**Architecture:** Each widget renders an inline SVG with a fixed `viewBox`. A `<clipPath>` containing a `<rect>` whose width tracks `pct%` masks a solid-colour fill polygon, so the fill shrinks/grows reactively as health changes. A second identical polygon is always drawn as the dim frame. No new files — all changes in `ShipStatus.tsx` and `index.css`. The parallelogram cell CSS from the previous iteration is removed.

**Tech Stack:** React (TSX), inline SVG, CSS `@keyframes` for hull-critical pulse, CSS custom properties for colours.

---

## Context & Constraints

- Working directory: `C:\Users\fpiec\WebstormProjects\x4-dashboard`
- Components: `client/src/components/ShipStatus.tsx`
- Styles: `client/src/index.css` (monolithic — do not split)
- Validate with: `cd client && npx tsc --noEmit`
- Widgets render at `scale: 2.5` zoom in the dashboard — design at base size
- Props interface `{ ship: ShipStatusType }` must be preserved on both widgets
- `TargetShieldsWidget` / `TargetHullWidget` in `TargetInfo.tsx` use `.clean-health-row` — do NOT touch
- No default exports, no new files
- Remove the `.para-bar-*` and `.para-cell` CSS from the previous iteration (it's dead code now)

---

## Visual Spec

### Shields bar — aerodynamic hexagon
```
viewBox="0 0 400 28"

Points (the full outline polygon):
  8,0  →  392,0  →  400,14  →  392,28  →  8,28  →  0,14  →  close

Appearance:
- Wide low hexagon, pointed on both left and right ends
- Height 28 base units (= 70px at 2.5×)
- Frame: stroke rgba(0,229,255,0.25), strokeWidth=1, fill rgba(0,229,255,0.04)
- Fill: solid var(--c-cyan), clipped to pct% width
- clipPath rect: x=0, y=0, width="${pct}%", height="100%"
```

### Hull bar — armour plate
```
viewBox="0 0 400 24"

Points (the full outline polygon):
  0,0  →  390,0  →  400,12  →  400,24  →  12,24  →  0,12  →  close

Appearance:
- Rectangle with diagonal cut on top-right corner, stepped/angled lower-left
- Slightly shorter than shields (24 vs 28), giving them different proportions
- Frame: stroke with hull colour at 0.25 opacity, fill hull colour at 0.04 opacity
- Fill: solid hull colour (green/orange/red), clipped to pct% width
- clipPath rect: x=0, y=0, width="${pct}%", height="100%"
```

### Colour logic
| State | Condition | Fill colour |
|-------|-----------|-------------|
| Shields | always | `var(--c-cyan)` |
| Hull high | pct >= 60 | `var(--c-green)` |
| Hull med | 30 <= pct < 60 | `var(--c-orange)` |
| Hull low | pct < 30 | `var(--c-red)` |

Hull low (<30%): fill polygon gets class `hull-svg-low` which has a CSS `opacity` pulse animation (1.0 → 0.7 → 1.0, 1.2s ease-in-out infinite). Applied via `className` on the fill `<polygon>` element.

---

## Task 1: Remove dead parallelogram CSS, add SVG bar CSS

**Files:**
- Modify: `client/src/index.css`

**Step 1: Read the para-bar section**

Open `client/src/index.css` and find the parallelogram CSS block (search for `/* ── Parallelogram cell health bar`). It spans from `.para-bar-row` through `@keyframes paraFlicker`.

**Step 2: Delete the entire parallelogram block**

Remove everything from the `/* ── Parallelogram cell health bar ─` comment through and including the `@keyframes paraFlicker { ... }` closing brace. This is approximately 70 lines.

**Step 3: Insert new SVG bar CSS in its place**

In the same location (after `.clean-health-tick:last-child`, before `.ship-status-aside`), insert:

```css
/* ── SVG solid bar widgets ─────────────────────────────────────── */

.svg-bar-row {
  padding: 4px 0;
}

.svg-bar-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
}

.svg-bar-label {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--c-text-dim);
}

.svg-bar-value {
  font-family: var(--font-ui);
  font-size: 18px;
  line-height: 1;
  font-weight: 700;
}

.svg-bar-value.shields-val { color: var(--c-cyan); text-shadow: var(--glow-cyan); }
.svg-bar-value.hull-val    { color: var(--c-green); }
.svg-bar-value.hull-val.med { color: var(--c-orange); }
.svg-bar-value.hull-val.low { color: var(--c-red); text-shadow: var(--glow-red); }

.svg-bar-svg {
  display: block;
  width: 100%;
  overflow: visible;
}

.hull-svg-low {
  animation: hullSvgPulse 1.2s ease-in-out infinite;
}

@keyframes hullSvgPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}
```

**Step 4: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Rewrite ShipShieldsWidget with SVG hexagon bar

**Files:**
- Modify: `client/src/components/ShipStatus.tsx`

**Step 1: Read the current file**

The file is at `client/src/components/ShipStatus.tsx`. It currently has the parallelogram cell implementation with `CELL_COUNT`, `CELLS`, and `.para-bar-*` class names.

**Step 2: Remove parallelogram constants**

Remove these lines near the top:
```ts
const CELL_COUNT = 30
const CELLS = Array.from({ length: CELL_COUNT })
```

**Step 3: Replace ShipShieldsWidget entirely**

Replace the full `ShipShieldsWidget` function with:

```tsx
export function ShipShieldsWidget({ ship }: Props) {
  const pct = Math.max(0, Math.min(100, ship.shields))
  const clipId = 'shields-clip'
  // Hexagon points: pointed left and right ends
  const points = '8,0 392,0 400,14 392,28 8,28 0,14'
  return (
    <div className="svg-bar-row">
      <div className="svg-bar-head">
        <span className="svg-bar-label">Shields</span>
        <span className="svg-bar-value shields-val">{pct.toFixed(0)}%</span>
      </div>
      <svg className="svg-bar-svg" viewBox="0 0 400 28" preserveAspectRatio="none">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={`${pct}%`} height="100%" />
          </clipPath>
        </defs>
        {/* Frame — always full width */}
        <polygon
          points={points}
          fill="rgba(0,229,255,0.04)"
          stroke="rgba(0,229,255,0.25)"
          strokeWidth="1"
        />
        {/* Fill — clipped to pct% */}
        <polygon
          points={points}
          fill="var(--c-cyan)"
          stroke="none"
          clipPath={`url(#${clipId})`}
        />
      </svg>
    </div>
  )
}
```

**Step 4: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Rewrite ShipHullWidget with SVG armour-plate bar

**Files:**
- Modify: `client/src/components/ShipStatus.tsx`

**Step 1: Replace ShipHullWidget entirely**

Replace the full `ShipHullWidget` function with:

```tsx
export function ShipHullWidget({ ship }: Props) {
  const pct = Math.max(0, Math.min(100, ship.hull))
  const tone = hullClass(pct)
  const clipId = 'hull-clip'
  // Armour plate: diagonal top-right cut, angled lower-left corner
  const points = '0,0 390,0 400,12 400,24 12,24 0,12'
  const fillColour =
    tone === 'low' ? 'var(--c-red)' :
    tone === 'med' ? 'var(--c-orange)' :
    'var(--c-green)'
  const strokeColour =
    tone === 'low' ? 'rgba(255,23,68,0.3)' :
    tone === 'med' ? 'rgba(255,109,0,0.3)' :
    'rgba(0,230,118,0.3)'
  const frameFill =
    tone === 'low' ? 'rgba(255,23,68,0.04)' :
    tone === 'med' ? 'rgba(255,109,0,0.04)' :
    'rgba(0,230,118,0.04)'
  return (
    <div className="svg-bar-row">
      <div className="svg-bar-head">
        <span className="svg-bar-label">Hull</span>
        <span className={`svg-bar-value hull-val ${tone}`}>{pct.toFixed(0)}%</span>
      </div>
      <svg className="svg-bar-svg" viewBox="0 0 400 24" preserveAspectRatio="none">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={`${pct}%`} height="100%" />
          </clipPath>
        </defs>
        {/* Frame — always full width */}
        <polygon
          points={points}
          fill={frameFill}
          stroke={strokeColour}
          strokeWidth="1"
        />
        {/* Fill — clipped to pct% */}
        <polygon
          points={points}
          fill={fillColour}
          stroke="none"
          clipPath={`url(#${clipId})`}
          className={tone === 'low' ? 'hull-svg-low' : undefined}
        />
      </svg>
    </div>
  )
}
```

**Step 2: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit both widget changes together**

```bash
git add client/src/components/ShipStatus.tsx client/src/index.css
git commit -m "feat: replace parallelogram cells with distinct SVG solid-fill bars for hull/shields"
```

---

## Task 4: Visual polish pass

**Files:**
- Modify: `client/src/index.css` (minor tweaks only if needed)
- Modify: `client/src/components/ShipStatus.tsx` (SVG point coordinates only if shapes need adjustment)

**Step 1: Open the app and inspect at 2.5× zoom**

Navigate to `http://localhost:3000` (Flight dashboard). Look at the bottom two bars and check:

1. **Shields shape** — does the hexagon feel wide and aerodynamic? The left/right points should be visible and sharp. If the pointed ends are too subtle, increase the inset from `8` to `12` in the points string: `'12,0 388,0 400,14 388,28 12,28 0,14'`

2. **Hull shape** — does the armour plate feel distinct from the shields bar? The diagonal top-right cut and angled lower-left should read clearly. If the lower-left step looks too subtle at 2.5×, increase the corner offset from `12` to `16`: `'0,0 390,0 400,12 400,24 16,24 0,12'`

3. **Fill edge** — does the right edge of the fill look clean as it transitions from filled to empty? With `preserveAspectRatio="none"` and a clipPath rect, the right edge of the fill will be a vertical line regardless of shape. This is intentional — the fill "drains" horizontally.

4. **Height difference** — Shields (viewBox height 28) should look noticeably taller than Hull (viewBox height 24) at 2.5×. If the difference isn't apparent, widen the gap: change Hull to `viewBox="0 0 400 20"` and adjust its polygon y-coordinates accordingly (`0,0 390,0 400,10 400,20 12,20 0,10`).

**Step 2: Commit any adjustments**

```bash
git add client/src/components/ShipStatus.tsx client/src/index.css
git commit -m "chore: polish SVG bar shapes and proportions"
```

---

## Completion Checklist

- [ ] Parallelogram CSS (`.para-bar-*`, `.para-cell`, `@keyframes paraFlicker`) fully removed
- [ ] New `.svg-bar-*` CSS present, `@keyframes hullSvgPulse` present
- [ ] `ShipShieldsWidget`: hexagonal SVG bar, cyan fill, no segments
- [ ] `ShipHullWidget`: armour-plate SVG bar, colour tracks hull threshold, pulse at <30%
- [ ] The two bars have visually distinct shapes (different viewBox heights + different polygon silhouettes)
- [ ] `CELL_COUNT` / `CELLS` constants removed
- [ ] `hullClass()`, `ShipCargoWidget`, `ShipStatusWidget` still intact
- [ ] `TargetInfo.tsx` `.clean-health-row` widgets visually unchanged
- [ ] No TypeScript errors (`cd client && npx tsc --noEmit`)
- [ ] No default exports, no new files

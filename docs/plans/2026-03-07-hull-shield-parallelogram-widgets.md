# Hull & Shield Parallelogram Widget Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat segmented progress bars in `ShipShieldsWidget` and `ShipHullWidget` with a row of CSS `clip-path` parallelogram cells that glow when filled and dim when empty, producing a sharp military-HUD look.

**Architecture:** Pure CSS + React — no SVG, no canvas. Each bar is ~30 individual `<div>` cells rendered with `clip-path: polygon(...)` to produce angled parallelogram shapes. Filled cells have color + glow, empty cells are dark outlines. State thresholds (hull med/low) change cell colour. The label (SHIELDS / HULL) and percentage value sit above the bar row. CSS lives in `client/src/index.css`.

**Tech Stack:** React functional components (TypeScript), CSS custom properties, `clip-path`, CSS `@keyframes` for flicker on critical hull.

---

## Context & Constraints

- Components live in `client/src/components/ShipStatus.tsx`
- Styles live in `client/src/index.css` (monolithic — do not split)
- No tests exist; validate with `cd client && npx tsc --noEmit`
- Dev server: `npm run dev:mock` (port 3000)
- The widgets are rendered at `scale: 2.5` zoom via dashboard config — design at base size, it scales up automatically
- Existing class names used by these widgets: `.clean-health-row`, `.clean-health-head`, `.clean-health-label`, `.clean-health-value`, `.clean-health-track`, `.clean-health-grid`, `.clean-health-tick`, `.status-bar-fill`
- The same `ShipShieldsWidget` / `ShipHullWidget` props interface (`{ ship: ShipStatusType }`) must be preserved — Dashboard renders them by widget ID, no prop changes needed
- `TargetShieldsWidget` / `TargetHullWidget` in `TargetInfo.tsx` use the same `.clean-health-row` CSS — do NOT touch those or break them; add new class names that don't collide

---

## Visual Spec

```
┌─────────────────────────────────────────────────────┐
│ SHIELDS                                        47%   │
│ ▰▰▰▰▰▰▰▰▰▰▰▰▰▰░░░░░░░░░░░░░░                        │
└─────────────────────────────────────────────────────┘
```

- **Cell count:** 30 cells per bar
- **Cell shape:** `clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)`  
  → left edge vertical, right edge angled inward at bottom (parallelogram leaning right)
- **Cell gap:** 3px between cells (use `gap` on a flex container)
- **Cell height:** 18px
- **Filled cell — Shields:** `background: var(--c-cyan)` + `box-shadow: 0 0 6px var(--c-cyan), 0 0 12px hsl(191deg 100% 50% / 40%)`
- **Filled cell — Hull (high ≥60%):** `background: var(--c-green)` + green glow
- **Filled cell — Hull (med 30–59%):** `background: var(--c-orange)` + orange glow
- **Filled cell — Hull (low <30%):** `background: var(--c-red)` + red glow + flicker animation on lit cells
- **Empty cell:** `background: rgba(255,255,255,0.04)` + `border: 1px solid rgba(255,255,255,0.10)`
- **Label row:** flex row, label left (`SHIELDS` / `HULL`), percentage value right, same font/size as current
- **Wrapper:** remove the old `.clean-health-row` border/background — new design is self-contained with the cells

---

## Task 1: Add CSS for parallelogram cell bar

**Files:**
- Modify: `client/src/index.css`

**Step 1: Find the insertion point**

In `client/src/index.css`, locate the `.clean-health-stack` block (around line 1630). The new CSS will be appended after the existing `.clean-health-*` rules, before `.ship-side-card`.

**Step 2: Add the new CSS classes**

Insert the following after the last `.clean-health-tick:last-child` rule (around line 1698) and before `.ship-status-aside`:

```css
/* ── Parallelogram cell health bar ─────────────────────────────── */

.para-bar-row {
  padding: 6px 0;
}

.para-bar-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.para-bar-label {
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--c-text-dim);
}

.para-bar-value {
  font-family: var(--font-ui);
  font-size: 18px;
  line-height: 1;
  font-weight: 700;
}

.para-bar-value.shields-val { color: var(--c-cyan); text-shadow: var(--glow-cyan); }
.para-bar-value.hull-val    { color: var(--c-green); }
.para-bar-value.hull-val.med { color: var(--c-orange); }
.para-bar-value.hull-val.low { color: var(--c-red); text-shadow: var(--glow-red); }

.para-bar-cells {
  display: flex;
  gap: 3px;
  height: 18px;
}

.para-cell {
  flex: 1;
  clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
}

/* Filled variants */
.para-cell.filled.shields {
  background: var(--c-cyan);
  box-shadow: 0 0 6px var(--c-cyan), 0 0 12px hsl(191deg 100% 50% / 40%);
}
.para-cell.filled.hull-high {
  background: var(--c-green);
  box-shadow: 0 0 6px var(--c-green), 0 0 12px hsl(151deg 100% 45% / 40%);
}
.para-cell.filled.hull-med {
  background: var(--c-orange);
  box-shadow: 0 0 6px var(--c-orange), 0 0 12px hsl(26deg 100% 50% / 40%);
}
.para-cell.filled.hull-low {
  background: var(--c-red);
  box-shadow: 0 0 8px var(--c-red), 0 0 16px hsl(349deg 100% 55% / 50%);
  animation: paraFlicker 0.5s ease-in-out infinite;
}

/* Empty variant */
.para-cell.empty {
  background: rgba(255, 255, 255, 0.04);
  outline: 1px solid rgba(255, 255, 255, 0.10);
  outline-offset: -1px;
}

@keyframes paraFlicker {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.55; }
}
```

**Step 3: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors (CSS change doesn't affect TypeScript).

---

## Task 2: Rewrite ShipShieldsWidget and ShipHullWidget

**Files:**
- Modify: `client/src/components/ShipStatus.tsx`

**Step 1: Read the current file**

The file is at `client/src/components/ShipStatus.tsx`. Current `ShipShieldsWidget` and `ShipHullWidget` use `.clean-health-row` with a `.clean-health-track` fill bar.

**Step 2: Replace the constant and helper at the top**

Remove:
```ts
const TRACK_TICKS = Array.from({ length: 20 })
```

Add:
```ts
const CELL_COUNT = 30
const CELLS = Array.from({ length: CELL_COUNT })
```

**Step 3: Replace ShipShieldsWidget**

Replace the entire `ShipShieldsWidget` function with:

```tsx
export function ShipShieldsWidget({ ship }: Props) {
  const pct = Math.max(0, Math.min(100, ship.shields))
  const filledCount = Math.round((pct / 100) * CELL_COUNT)
  return (
    <div className="para-bar-row">
      <div className="para-bar-head">
        <span className="para-bar-label">Shields</span>
        <span className="para-bar-value shields-val">{pct.toFixed(0)}%</span>
      </div>
      <div className="para-bar-cells">
        {CELLS.map((_, i) => (
          <div
            key={i}
            className={`para-cell ${i < filledCount ? 'filled shields' : 'empty'}`}
          />
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Replace ShipHullWidget**

Replace the entire `ShipHullWidget` function with:

```tsx
export function ShipHullWidget({ ship }: Props) {
  const pct = Math.max(0, Math.min(100, ship.hull))
  const filledCount = Math.round((pct / 100) * CELL_COUNT)
  const tone = hullClass(pct)
  const filledClass = tone === 'low' ? 'hull-low' : tone === 'med' ? 'hull-med' : 'hull-high'
  return (
    <div className="para-bar-row">
      <div className="para-bar-head">
        <span className="para-bar-label">Hull</span>
        <span className={`para-bar-value hull-val ${tone}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="para-bar-cells">
        {CELLS.map((_, i) => (
          <div
            key={i}
            className={`para-cell ${i < filledCount ? `filled ${filledClass}` : 'empty'}`}
          />
        ))}
      </div>
    </div>
  )
}
```

**Step 5: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

**Step 6: Visual check in browser**

Open `http://localhost:3000` (Flight dashboard). The bottom two bars should now show ~30 angled parallelogram cells. Shields: cyan glow on filled cells. Hull: colour changes based on percentage (mock data may show red/flicker if hull is low).

**Step 7: Commit**

```bash
git add client/src/components/ShipStatus.tsx client/src/index.css
git commit -m "feat: rework hull/shield widgets as parallelogram cell bars"
```

---

## Task 3: Polish — label alignment and spacing

**Files:**
- Modify: `client/src/index.css` (tweak `.para-bar-row` padding if needed after visual review)

**Step 1: Check rendering at 2.5x zoom**

The dashboard renders these widgets at `scale: 2.5`. At that zoom level, verify:
- Cell gap is not too large (adjust `gap` from 3px down to 2px if cells look spaced far apart)
- Label font size reads well (bump `para-bar-label` to `10px` if too small)
- Value font size is prominent (`18px` base = 45px at 2.5x, which is intentional)

**Step 2: Adjust if needed**

Only tweak values that look wrong at 2.5x. The key properties to adjust are `gap`, `.para-bar-label` font-size, and `.para-cell` height.

**Step 3: Commit if any changes were made**

```bash
git add client/src/index.css
git commit -m "chore: polish parallelogram bar spacing at 2.5x zoom"
```

---

## Completion Checklist

- [ ] 30 angled parallelogram cells per bar
- [ ] Shields bar: cyan filled cells with glow, dim empty cells
- [ ] Hull bar: green/orange/red filled cells based on threshold
- [ ] Hull low (<30%): red cells with flicker animation
- [ ] Label (SHIELDS / HULL) top-left, percentage top-right
- [ ] No TypeScript errors (`cd client && npx tsc --noEmit`)
- [ ] `TargetShieldsWidget` and `TargetHullWidget` in `TargetInfo.tsx` are visually unchanged
- [ ] No default exports introduced
- [ ] No new files created (CSS in `index.css`, components in existing `ShipStatus.tsx`)

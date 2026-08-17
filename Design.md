# Design

**Source of truth: `client/tailwind.config.js`.** This document explains the
system that file implements. If the two disagree, the config file wins and
this doc should be updated to match.

## 1. Visual philosophy

Flat, dense, muted — an operations dashboard for people who use it all day,
not a marketing site. Small border radius (4px) throughout, no heavy
shadows except on modals, desaturated status colors rather than bright
SaaS-style colors. Nothing about the palette should read as playful or
consumer-facing; this is closer to an engineering/ops tool than a product
app, which fits an EPC contractor's internal system.

## 2. Colors

### Text

| Token      | Hex       | Use                    |
| ---------- | --------- | ---------------------- |
| `--ink`    | `#1f2937` | Primary text, headings |
| `--text-2` | `#5b6672` | Secondary text, labels |
| `--text-3` | `#9aa3ab` | Muted/placeholder text |

### Surfaces

| Token           | Hex       | Use                                |
| --------------- | --------- | ---------------------------------- |
| `--paper`       | `#f7f8f9` | Page background                    |
| `--panel`       | `#ffffff` | Cards, sidebar, tables             |
| `--line`        | `#e3e6e8` | Default borders/dividers           |
| `--line-strong` | `#cdd2d6` | Input borders, stronger separators |

### Brand / accent

| Token           | Hex       | Use                                   |
| --------------- | --------- | ------------------------------------- |
| `--accent`      | `#2f5d82` | Primary actions, active nav, links    |
| `--accent-dark` | `#254a69` | Primary button hover                  |
| `--accent-bg`   | `#eaf0f4` | Light accent background (chips, tags) |

### Status colors

These map directly to employee/slot status and are the only place bright(er)
color appears — used consistently so status is recognizable at a glance:

| Token                          | Hex                   | Meaning                             |
| ------------------------------ | --------------------- | ----------------------------------- |
| `--gray` / `--gray-bg`         | `#8a94a0` / `#eef0f2` | Available / neutral                 |
| `--teal-light`                 | `#7796a2`             | Reserved                            |
| `--teal` / (with `#e4ebee` bg) | `#3d6e80`             | Booked / progress fill              |
| `--green` / `--green-bg`       | `#3f8f5f` / `#e9f4ec` | Mobilized / success                 |
| `--yellow` / `--yellow-bg`     | `#b8842a` / `#faf1df` | Warning (e.g. compliance expiring)  |
| `--red` / `--red-bg`           | `#b84a4a` / `#fbecec` | Danger, expired, hard-lock warnings |
| `--purple` / `--purple-bg`     | `#7c6c93` / `#f0edf4` | Vacation / Halted                   |

**Rule:** don't introduce a new color for a new status — reuse this set.
If a new state genuinely doesn't fit (available/reserved/booked/mobilized/
halted-vacation/warning/danger), that's a sign to reconsider whether it
needs a new status at all before reaching for a new color.

## 3. Typography

- **Body & headings:** `Inter`, sans-serif.
- **Monospace:** `IBM Plex Mono` — used for job order IDs and other
  identifier-style values (`.mono` class), not for general text.
- **Base size:** 13.5px, line-height 1.45 — deliberately small and dense;
  this is a data-heavy tool, not a marketing page.
- **Headings:** weight 600. No large display sizes — largest heading in the
  app is 18px (page title). Modal titles are 14px, card titles 14.5px.
- **Labels/meta text:** 10–12.5px range, `--text-2` or `--text-3`, often
  uppercase with letter-spacing for section labels (e.g. sidebar section
  headers, filter labels).

## 4. Shape & elevation

- **Radius:** one value used everywhere, `--radius: 4px`. No pill buttons,
  no fully-rounded cards.
- **Shadow:** used only on modals/drawers (`--shadow-modal`), everything
  else is flat with a 1px border instead of elevation. Don't add shadows to
  inline elements like buttons or badges.

## 5. Component patterns already established

- **Buttons:** `.btn` (default, bordered) / `.btn-primary` (accent fill) /
  `.btn-outline` / `.btn-ghost` (no border) / `.btn-danger-outline`. `.btn-sm`
  for compact variants. New buttons should pick one of these, not introduce
  a new visual style.
- **Badges:** `.badge` + a status modifier (`.b-available`, `.b-reserved`,
  `.b-booked`, `.b-mobilized`, `.b-vacation`) — each pairs a light
  background with a small colored dot (`.dot`).
- **Compliance dots:** `.cdot` with `.c-green` / `.c-yellow` / `.c-red` /
  `.c-gray` — a smaller, square variant of the same status-color idea, used
  inline in tables.
- **Cards:** `.jo-card`, `.summary-card` — white panel, 1px border, small
  radius, optional colored left-border accent for emphasis (`.sc-red`,
  `.sc-yellow`, `.sc-teal`).
- **Overlays:** `.overlay` (centered modal backdrop) vs `.drawer-overlay`
  (side-drawer backdrop, used for Auto-Suggest) — these are deliberately
  different components for different interaction weights (a modal demands a
  decision; a drawer is a lighter-weight browse-and-pick).
- **Forms:** `.field` wrapping a `label` + `input`/`select`/`textarea`,
  consistent border/radius/padding across all three input types.

## 6. What not to do

- Don't use Tailwind utility classes in new components — see Rules.md. If
  you're editing a file that still has them, converting to the token system
  is in scope for that change.
- Don't introduce a second accent color. `--accent` (blue-gray) is the only
  brand/interactive color; everything else is status or neutral.
- Don't use pure black or pure white for text/backgrounds — use `--ink` and
  `--panel`/`--paper`, which are deliberately slightly off-pure for a softer,
  less harsh dashboard feel.

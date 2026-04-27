# Responsive Table CSS — Design Spec

## Goal

Make `AppDataTable` visually adaptive across mobile (< 640px), tablet (640–1023px), and desktop (>= 1024px) by scaling font-size, padding, margins, paginator, and editor sizing via CSS `@media` breakpoints in `<style scoped>`.

## Approach

**CSS-only breakpoints** (Approach A). No runtime JS, no CSS custom properties, no container queries. All changes in `AppDataTable.vue` scoped styles.

## Breakpoints

| Token | Range | Purpose |
|-------|-------|---------|
| `sm` | `max-width: 639px` | Mobile — max density |
| `md` | `min-width: 640px` and `max-width: 1023px` | Tablet — moderate density |
| `lg` | `>= 1024px` | Desktop — current sizes, no change |

## Section 1: Cell Typography & Padding

| Property | Desktop (current) | Tablet | Mobile |
|----------|-------------------|--------|--------|
| Body cell padding | `0.5rem 0.75rem` | `0.375rem 0.5rem` | `0.25rem 0.375rem` |
| Body font-size | inherit (~0.875rem) | `0.8125rem` | `0.75rem` |
| Header cell padding | same as body | same as body | same as body |
| Header font-size | inherit | `0.8125rem` | `0.75rem` |

Header text gets truncation: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` — mirrors existing `.cell-text` pattern on body cells.

## Section 2: Cell Editors

| Property | Desktop (current) | Tablet | Mobile |
|----------|-------------------|--------|--------|
| Editor font-size | `0.85rem` | `0.8125rem` | `0.75rem` |
| Editor label padding | `0.25rem 0.375rem` | `0.1875rem 0.25rem` | `0.125rem 0.1875rem` |
| Editor dropdown width | `1.25rem` | `1.125rem` | `1rem` |
| Editor icon size | `0.625rem` | `0.5625rem` | `0.5rem` |

## Section 3: Paginator

| Property | Desktop (current) | Tablet | Mobile |
|----------|-------------------|--------|--------|
| Font-size | `0.75rem` | `0.6875rem` | `0.625rem` |
| Button min-width/height | `1.625rem` | `1.5rem` | `1.375rem` |
| RPP dropdown height | `1.625rem` | `1.5rem` | `1.375rem` |
| Icon size | `0.65rem` | `0.6rem` | `0.5rem` |
| Gap (paginator) | `0.25rem` | `0.1875rem` | `0.125rem` |
| Gap (pages) | `0.125rem` | `0.125rem` | `0.0625rem` |
| Page buttons | all visible | all visible | hide page numbers — show only prev/next + current indicator |

Mobile paginator simplification: hide `.p-paginator-pages` and `.p-paginator-first`/`.p-paginator-last`, keep only prev/next and current page text.

## Section 4: Header Truncation

Apply to both flat and grouped header modes:

```css
:deep(.p-datatable-thead > tr > th) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

The `.grouped-header-cell` and flat header `div` already use `flex items-center` — add `min-width: 0; overflow: hidden` to the flex child text.

## Section 5: ProcFlag Dirty Indicator Removal

Remove the green/amber dot indicator (template lines 706-714 in current file). The `procFlag` composable API remains unchanged — only the visual dot in the first body column is removed.

## Section 6: Checkbox Scaling

| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| Checkbox size | `1.25rem` | `1.125rem` | `1rem` |

## Files Changed

- `frontend/app/components/common/tables/AppDataTable.vue` — scoped styles + template (remove dirty dot)

## Out of Scope

- Column visibility changes per breakpoint (user manages via column manager)
- Card/list layout on mobile (table stays as table)
- Container queries
- Changes to `useAppDataTable` composable or table types

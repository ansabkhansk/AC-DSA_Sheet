# ADR 005 — Calendar library (FullCalendar v6 MIT)

## Context

The PDF requires a standalone calendar for planning and revisits. The plan allowed FullCalendar (MIT plugins only) or react-big-calendar.

## Decision

Use **FullCalendar v6** with MIT plugins: `@fullcalendar/react`, `daygrid`, `timegrid`, `interaction`.

## Alternatives

- react-big-calendar — lighter, fewer built-in views.
- FullCalendar premium plugins — avoided for license clarity.

## Consequences

- Month/week views and interactions ship quickly.
- Bundle size is larger (noted in Vite build warning); acceptable for the demo.

# TMS Frontend — Training & Internship Management System

Angular 19 standalone frontend with two data-entry/enquiry screens
built from the TMS specification.

## Quick Start

```bash
# 1. Install dependencies (requires Node.js 18+)
npm install

# 2. Start the dev server
npm start
# → http://localhost:4200
```

## Screens

| Route | Screen | Description |
|-------|--------|-------------|
| `/course-master` | Course Master | Single-key lookup by Course ID (2-char) |
| `/course-detail` | Course Detail | Composite lookup by Course ID + Course Detail ID |

## Button Behaviour (both screens)

| Button | Action |
|--------|--------|
| **Search** | Look up a record by its key(s) and load it read-only |
| **New (Add)** | Clear the form; all fields become editable for a new record |
| **Save (Submit)** | Insert (in New mode) or update (in Modify mode); blocks duplicate keys |
| **Modify (Edit)** | Unlock non-key fields of the current record for editing; key fields are locked |
| **View (Enquiry)** | Display the current record in fully read-only state |
| **Back** | Reset the screen back to its empty starting state |

## Connecting to a Real Backend

Both services in `src/app/services/` use the same signatures as a REST API.
Replace the in-memory logic with `HttpClient` calls:

```typescript
// course-master.service.ts
getAll()        → GET  /api/course-master
getById(id)     → GET  /api/course-master/:id
create(record)  → POST /api/course-master
update(record)  → PUT  /api/course-master/:id
```

No changes are needed in the components.

## Project Structure

```
tms-frontend/
├── angular.json           ← Angular workspace config (required for ng serve)
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── public/                ← Static assets (Angular 19 convention)
└── src/
    ├── main.ts
    ├── index.html
    ├── styles.css         ← Design tokens + shared styles
    └── app/
        ├── app.component.*     Shell + top nav
        ├── app.config.ts
        ├── app.routes.ts
        ├── models/
        │   ├── course-master.model.ts
        │   └── course-detail.model.ts
        ├── services/
        │   ├── course-master.service.ts
        │   └── course-detail.service.ts
        └── pages/
            ├── course-master/
            │   ├── course-master.component.ts
            │   ├── course-master.component.html
            │   └── course-master.component.css
            └── course-detail/
                ├── course-detail.component.ts
                ├── course-detail.component.html
                └── course-detail.component.css
```

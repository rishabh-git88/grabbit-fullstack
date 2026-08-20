# Grabbit Project Map

## Source of truth

Use these folders for all current development work:

```text
grabbit-fullstack/
├── grabbit-backend/             # Active Render API
│   ├── config/                  # Environment validation and runtime settings
│   ├── controllers/             # HTTP request handlers
│   ├── middleware/              # Authentication and authorization
│   ├── models/                  # MongoDB/Mongoose schemas
│   ├── routes/                  # API route declarations
│   ├── scripts/                 # One-off, repeatable maintenance scripts
│   ├── tests/                   # Node test suite
│   └── utils/                   # Shared backend helpers
├── grabbit-vendor-dashboard/    # Active Vercel React application
│   ├── public/                  # Static web assets
│   └── src/
│       ├── api/                 # API client and endpoint wrappers
│       ├── components/          # Shared vendor/portal UI components
│       ├── context/             # Authentication and theme state
│       ├── hooks/               # Socket and UI hooks
│       ├── pages/               # Portal and vendor routes
│       ├── student/             # Student-only routes, cart state and socket hook
│       └── utils/               # Frontend access helpers
├── docs/                        # Architecture and operational documentation
├── render.yaml                  # Render deployment definition
└── README.md                    # Repository entry point
```

## Placement rules

| Change type | Put it here |
| --- | --- |
| API endpoint | `grabbit-backend/routes/` and its controller in `controllers/` |
| Database schema | `grabbit-backend/models/` |
| Authentication/permissions | `grabbit-backend/middleware/` or `utils/` |
| Vendor web page | `grabbit-vendor-dashboard/src/pages/` |
| Student web page | `grabbit-vendor-dashboard/src/student/pages/` |
| Reusable frontend UI | `grabbit-vendor-dashboard/src/components/` |
| Shared frontend state | `grabbit-vendor-dashboard/src/context/` |
| Deployment configuration | `render.yaml` or the active app's `vercel.json` |
| Setup/operations knowledge | `docs/` |

## Legacy directories

Do not start new work in `grabbit-student-web/`, `grabbit-student-app/`, `GrabbitApp/`, or the nested `grabbit-fullstack/` copy. They are retained for backwards compatibility and history only.

Before removing or archiving any legacy directory, first confirm that no Vercel project, mobile build pipeline, or user still relies on it.

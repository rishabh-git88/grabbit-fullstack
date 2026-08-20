# Deployment Roots

## Production services

| Service | Platform | Repository root | Main configuration |
| --- | --- | --- | --- |
| Backend API | Render | `grabbit-backend/` | `render.yaml` |
| Unified student and vendor portal | Vercel | `grabbit-vendor-dashboard/` | `grabbit-vendor-dashboard/vercel.json` |

The Vercel portal has these routes:

```text
/            Portal selector
/student     Student ordering experience
/vendor      Vendor dashboard
```

The active Vercel configuration rewrites all routes to `index.html`, so direct visits and refreshes of `/student` and `/vendor` work correctly.

## Before changing paths

Changing either active directory name requires updating the corresponding Render or Vercel project Root Directory. Do not move these folders as part of ordinary feature work.

## Legacy deployments

`grabbit-student-web/` has its own Vercel configuration because it was an earlier standalone student portal. Retire its separate deployment before archiving or removing that directory.

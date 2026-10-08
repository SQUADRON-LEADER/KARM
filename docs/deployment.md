# Deployment

The repository is prepared for one Render backend service and one Vercel frontend project.

## 1. Deploy the backend to Render

1. Open Render and choose **New > Blueprint**.
2. Select the GitHub repository. Render detects [`render.yaml`](../render.yaml).
3. Set the secret `MONGODB_URI` to a MongoDB Atlas connection string for the `kram` database.
4. Leave the generated JWT secrets in place. Do not commit local `.env` files or secrets.
5. Deploy and copy the API URL, for example `https://kram-api.onrender.com`.
6. Verify `https://YOUR-API-URL/api/health` returns a healthy response.

The backend service uses `backend/` as its root directory, builds with `npm ci && npm run build`, and starts with `npm start`.

## 2. Deploy the frontend to Vercel

1. Open Vercel and import the same GitHub repository.
2. Keep the repository root as the project root.
3. Vercel uses [`vercel.json`](../vercel.json), runs `npm install` followed by `npm run build`, and selects Nitro's Vercel server preset. `npm install` is intentional because this repository has optional native packages that are platform-specific.
4. Add this environment variable for **Production**, **Preview**, and **Development** as needed:

```text
VITE_API_URL=https://YOUR-API-URL/api
```

5. Deploy and copy the Vercel URL, for example `https://kram.vercel.app`.

## 3. Connect the services

In Render, set:

```text
FRONTEND_URL=https://YOUR-VERCEL-URL
```

Redeploy the backend after changing `FRONTEND_URL`. Production CORS only permits that exact origin. Mobile requests without a browser origin remain supported.

## 4. Smoke test

- Open `https://YOUR-API-URL/api/health`.
- Open the Vercel URL and register a test account.
- Confirm dashboard, projects, and tasks load.
- Confirm browser devtools show API requests going to the Render URL.
- Do not use real personal data.

## Known prerequisite

The backend currently uses MongoDB/Mongoose. Create the Atlas database and network access before the Render deploy. The assessment brief asks for PostgreSQL or MySQL, which remains a separate migration task.

# Gerald Retail Financial Tracker

This frontend is ready to deploy to Vercel as a Vite single-page application.

## Local development

```bash
npm install
npm run dev
```

By default, the app calls `http://localhost:5000/api`. To point it at a deployed backend, create a local `.env` file based on `C:\Proj\software-design-team6-new\financial-tracker\.env.example`.

## Vercel deployment

1. Import `C:\Proj\software-design-team6-new\financial-tracker` as a Vercel project.
2. Keep the framework preset as `Vite`.
3. If you import the monorepo root, set the root directory to `financial-tracker`.
4. Add the environment variables from `C:\Proj\software-design-team6-new\financial-tracker\.env.example`.
5. Set `VITE_API_BASE_URL` to your deployed backend URL, for example `https://your-backend-project.vercel.app/api`.
6. Deploy.

The included `C:\Proj\software-design-team6-new\financial-tracker\vercel.json` enables SPA deep-linking so routes such as `/dashboard`, `/calendar`, and `/assistant` load correctly on refresh.

## Backend note

The companion backend in `C:\Proj\software-design-team6-new\financial-tracker-api` is now set up for a hosted Postgres connection, which makes a fully free Vercel deployment possible without relying on SQLite disk persistence.

# Gerald Retail API

This Flask backend is now prepared for free-friendly deployment on Vercel or any other Python host that can connect to a hosted Postgres database.

## Local run

```bash
pip install -r requirements.txt
python app.py
```

By default, local development continues to use SQLite through `DATABASE_PATH`.

## Environment variables

Use `C:\Proj\software-design-team6-new\financial-tracker-api\.env.example` as the template.

- `GOOGLE_API_KEY`: Gemini API key used by the assistant and recommendations
- `FRONTEND_URL`: primary deployed frontend origin
- `CORS_ORIGINS`: comma-separated allowed origins
- `DATABASE_URL`: hosted Postgres connection string for deployment
- `POSTGRES_SSLMODE`: Postgres SSL mode, usually `require` for hosted providers
- `DATABASE_PATH`: local SQLite fallback path for development

## Recommended free deployment shape

- Frontend: Vercel project rooted at `financial-tracker`
- Backend: separate Vercel project rooted at `financial-tracker-api`
- Database: hosted Postgres using `DATABASE_URL`

The backend automatically uses Postgres whenever `DATABASE_URL` is set. If `DATABASE_URL` is missing, it falls back to the local SQLite file.

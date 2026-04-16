# Gerald Retail API

This Flask backend is prepared for deployment on Render.

## Local run

```bash
pip install -r requirements.txt
python app.py
```

## Environment variables

Use `C:\Proj\software-design-team6-new\financial-tracker-api\.env.example` as the template.

- `GOOGLE_API_KEY`: Gemini API key used by the assistant and recommendations
- `FRONTEND_URL`: primary deployed frontend origin
- `CORS_ORIGINS`: comma-separated allowed origins
- `DATABASE_PATH`: SQLite database file path

## Render deployment

This repository includes `C:\Proj\software-design-team6-new\render.yaml` for a Render Blueprint deploy.

Important notes:

- The service uses a persistent disk mounted at `/var/data`
- SQLite is stored at `/var/data/financial_tracker.db`
- The service is set to the `starter` plan because Render persistent disks require a paid web service
- Python is pinned with `C:\Proj\software-design-team6-new\financial-tracker-api\.python-version` to avoid incompatible defaults with the ML stack

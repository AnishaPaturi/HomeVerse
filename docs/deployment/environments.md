# Deployment Environments

## 1. Environment Configurations

### Local Development
- **Frontend**: `http://localhost:3000` (Next.js Dev Server)
- **Backend**: `http://localhost:8080` (FastAPI Uvicorn with `--reload`)
- **Database**: `sqlite:///./homeverse.db`
- **Storage**: Local filesystem `./storage`

### Staging
- **Frontend**: Vercel Preview Deployments
- **Backend**: AWS ECS / GCP Cloud Run (Containerized)
- **Database**: Managed PostgreSQL (AWS RDS / Supabase)
- **Storage**: AWS S3 Bucket (`homeverse-staging-assets`)

### Production
- **Frontend**: Vercel Edge Network with Custom Domain (`homeverse.ai`)
- **Backend**: AWS ECS Fargate Autoscaling Cluster (Port 8080)
- **Database**: Multi-AZ PostgreSQL with read replicas
- **Storage**: Cloudflare R2 / AWS S3 with CloudFront CDN caching

## 2. Environment Variables Matrix
- `DATABASE_URL`: Connection string for PostgreSQL or SQLite.
- `GEMINI_API_KEY`: API key for Google Gemini 2.5/3.5 Vision and Flash.
- `JWT_SECRET`: 256-bit cryptographically secure secret.
- `STORAGE_TYPE`: `local` or `s3`.
- `NEXT_PUBLIC_API_URL`: Root URL pointing to the FastAPI backend.

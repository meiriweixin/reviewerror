# Deployment Guide

This guide covers deploying the Student Review App to production environments.

## Table of Contents
- [Vercel (Frontend)](#vercel-frontend)
- [Railway/Render (Backend)](#railwayrender-backend)
- [Azure App Service](#azure-app-service)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment Checklist](#post-deployment-checklist)

## Vercel (Frontend)

### Prerequisites
- Vercel account
- GitHub repository

### Steps

1. **Push code to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project:
     - **Framework Preset:** Create React App
     - **Root Directory:** `./`
     - **Build Command:** `npm run build`
     - **Output Directory:** `build`

3. **Set Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add the following:
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
   REACT_APP_SUPABASE_URL=your-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Update Google OAuth:**
   - Add Vercel domain to authorized JavaScript origins
   - Add Vercel domain to authorized redirect URIs

5. **Deploy:**
   - Vercel will auto-deploy on every push to main
   - Manual deploy: `vercel --prod`

## Railway/Render (Backend)

### Option 1: Railway

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login and initialize:**
```bash
railway login
cd backend
railway init
```

3. **Configure railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

4. **Add Procfile:**
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

5. **Set environment variables in Railway dashboard**

6. **Deploy:**
```bash
railway up
```

### Option 2: Render

1. **Create render.yaml:**
```yaml
services:
  - type: web
    name: student-review-api
    env: python
    region: singapore
    plan: starter
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: SECRET_KEY
        sync: false
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: AZURE_OPENAI_ENDPOINT
        sync: false
      - key: AZURE_OPENAI_API_KEY
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
```

2. **Deploy via Render Dashboard:**
   - Connect your GitHub repository
   - Render will auto-detect render.yaml
   - Add environment variables
   - Deploy

## Azure App Service

### Frontend (Static Web App)

1. **Install Azure CLI:**
```bash
# Windows
winget install Microsoft.AzureCLI

# macOS
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

2. **Login and create resource:**
```bash
az login
az staticwebapp create \
  --name student-review-frontend \
  --resource-group StudentReviewApp \
  --source https://github.com/your-repo \
  --location "Southeast Asia" \
  --branch main \
  --app-location "/" \
  --output-location "build" \
  --login-with-github
```

3. **Configure environment variables in Azure Portal**

### Backend (App Service)

1. **Create App Service:**
```bash
az webapp up \
  --name student-review-api \
  --resource-group StudentReviewApp \
  --runtime "PYTHON:3.11" \
  --sku B1 \
  --location "Southeast Asia"
```

2. **Configure startup command:**
```bash
az webapp config set \
  --resource-group StudentReviewApp \
  --name student-review-api \
  --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app"
```

3. **Set environment variables:**
```bash
az webapp config appsettings set \
  --resource-group StudentReviewApp \
  --name student-review-api \
  --settings \
    SECRET_KEY="your-secret-key" \
    AZURE_OPENAI_ENDPOINT="your-endpoint" \
    # ... other variables
```

## Docker Deployment

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT}
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/student_review.db:/app/student_review.db

volumes:
  uploads:
  database:
```

### Deploy with Docker Compose

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Environment Variables

### Production Environment Variables

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://api.studentreview.com
REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxx
```

**Backend (.env.production):**
```env
# Security
SECRET_KEY=<generate-with-openssl-rand-hex-32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com/
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Database
DATABASE_URL=sqlite+aiosqlite:///./student_review.db

# File Upload
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=10485760

# CORS
ALLOWED_ORIGINS=https://studentreview.com,https://www.studentreview.com
```

### Generate SECRET_KEY

```bash
# Python
python -c "import secrets; print(secrets.token_hex(32))"

# OpenSSL
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Post-Deployment Checklist

### Security
- [ ] Update all SECRET_KEY values
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure Content Security Policy (CSP)
- [ ] Set up API key rotation
- [ ] Enable database encryption
- [ ] Configure backup strategy

### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure application monitoring (New Relic, DataDog)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Enable log aggregation
- [ ] Configure alerts for errors and downtime
- [ ] Set up performance monitoring
- [ ] Monitor API rate limits and quotas

### Performance
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Enable gzip/brotli compression
- [ ] Set up database connection pooling
- [ ] Configure auto-scaling (if applicable)
- [ ] Optimize bundle size
- [ ] Enable lazy loading

### Testing
- [ ] Test Google OAuth login flow
- [ ] Test image upload and processing
- [ ] Test vector search functionality
- [ ] Verify all API endpoints
- [ ] Test on multiple devices/browsers
- [ ] Load testing
- [ ] Security scanning

### Documentation
- [ ] Update API documentation
- [ ] Create user guide
- [ ] Document deployment process
- [ ] Create incident response plan
- [ ] Document monitoring setup

### Legal & Compliance
- [ ] Add Privacy Policy
- [ ] Add Terms of Service
- [ ] Cookie consent (if applicable)
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          vercel-args: '--prod'

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

## Troubleshooting

### Common Issues

**CORS errors:**
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Database migrations:**
```bash
# Backup before deployment
sqlite3 student_review.db ".backup backup.db"

# After deployment
sqlite3 student_review.db ".restore backup.db"
```

**Environment variable issues:**
```bash
# Verify all variables are set
env | grep REACT_APP_
env | grep AZURE_
env | grep SUPABASE_
```

## Support

For deployment issues:
- Check platform-specific documentation
- Review deployment logs
- Check environment variables
- Verify API keys and credentials
- Test locally first with production environment

---

Good luck with your deployment! 🚀

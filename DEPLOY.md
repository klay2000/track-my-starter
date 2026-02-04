# Deploying to Google Cloud

This guide walks through deploying Track My Starter to Google Cloud Run with MongoDB Atlas.

## Prerequisites

- [Google Cloud account](https://cloud.google.com/) with billing enabled
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and configured
- [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) (free tier works)

## 1. Set Up MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a database user with read/write access
3. Add `0.0.0.0/0` to the IP Access List (allows Cloud Run to connect)
4. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/trackmystarter
   ```

## 2. Set Up Google Cloud Project

```bash
# Create a new project (or use existing)
gcloud projects create trackmystarter --name="Track My Starter"
gcloud config set project trackmystarter

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create Artifact Registry repository for Docker images
gcloud artifacts repositories create trackmystarter \
  --repository-format=docker \
  --location=us-central1
```

## 3. Deploy Backend

```bash
cd backend

# Build and push the container
gcloud builds submit --tag us-central1-docker.pkg.dev/trackmystarter/trackmystarter/backend

# Deploy to Cloud Run
gcloud run deploy trackmystarter-api \
  --image us-central1-docker.pkg.dev/trackmystarter/trackmystarter/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/trackmystarter"
```

Note the service URL (e.g., `https://trackmystarter-api-xxxxx-uc.a.run.app`).

### Using Secret Manager (Recommended)

For production, store the MongoDB URI in Secret Manager:

```bash
# Create secret
echo -n "mongodb+srv://user:pass@cluster.mongodb.net/trackmystarter" | \
  gcloud secrets create mongodb-uri --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding mongodb-uri \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Deploy with secret
gcloud run deploy trackmystarter-api \
  --image us-central1-docker.pkg.dev/trackmystarter/trackmystarter/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets "MONGODB_URI=mongodb-uri:latest"
```

## 4. Deploy Frontend

First, update the API URL in the frontend:

```bash
cd frontend

# Create production environment file
echo "VITE_API_URL=https://trackmystarter-api-xxxxx-uc.a.run.app" > .env.production
```

Then build and deploy:

```bash
# Build and push the container
gcloud builds submit --tag us-central1-docker.pkg.dev/trackmystarter/trackmystarter/frontend

# Deploy to Cloud Run
gcloud run deploy trackmystarter-web \
  --image us-central1-docker.pkg.dev/trackmystarter/trackmystarter/frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80
```

## 5. Custom Domain (Optional)

```bash
# Map a custom domain
gcloud run domain-mappings create \
  --service trackmystarter-web \
  --domain trackmystarter.com \
  --region us-central1
```

Follow the DNS instructions provided to verify domain ownership.

## Cost Optimization

Cloud Run charges only for actual usage. To minimize costs:

- **CPU allocation**: Set to "CPU is only allocated during request processing"
- **Min instances**: Set to 0 (cold starts are acceptable for low traffic)
- **Max instances**: Set a reasonable limit (e.g., 10)

```bash
gcloud run services update trackmystarter-api \
  --cpu-throttling \
  --min-instances 0 \
  --max-instances 10 \
  --region us-central1

gcloud run services update trackmystarter-web \
  --cpu-throttling \
  --min-instances 0 \
  --max-instances 10 \
  --region us-central1
```

## Updating Deployments

To deploy updates:

```bash
# Backend
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/trackmystarter/trackmystarter/backend
gcloud run deploy trackmystarter-api \
  --image us-central1-docker.pkg.dev/trackmystarter/trackmystarter/backend \
  --region us-central1

# Frontend
cd frontend
gcloud builds submit --tag us-central1-docker.pkg.dev/trackmystarter/trackmystarter/frontend
gcloud run deploy trackmystarter-web \
  --image us-central1-docker.pkg.dev/trackmystarter/trackmystarter/frontend \
  --region us-central1
```

## Monitoring

View logs and metrics in the Cloud Console:

```bash
# View backend logs
gcloud run services logs read trackmystarter-api --region us-central1

# View frontend logs
gcloud run services logs read trackmystarter-web --region us-central1
```

Or visit the [Cloud Run Console](https://console.cloud.google.com/run).

## Troubleshooting

### Container fails to start
- Check logs: `gcloud run services logs read SERVICE_NAME --region us-central1`
- Verify environment variables are set correctly
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`

### CORS errors
- Verify the backend CORS configuration includes the frontend URL
- Check that the `VITE_API_URL` matches the actual backend URL

### Cold start latency
- Consider setting `--min-instances 1` for the backend if cold starts are problematic
- This will incur additional cost but eliminates cold start delays

# DryClean Pro OMS - Production Deployment Guide

This guide provides exhaustive instructions for deploying the DryClean Pro frontend to a serverless AWS infrastructure (S3 + CloudFront) and running it locally via Docker.

---

## 1. Local Development via Docker

To run the application locally as a standalone server using Node.js:

### Prerequisites
- Docker installed on your machine.
- Your Supabase Project URL and Anon Key.

### Steps
1. **Build the Image**:
   ```bash
   docker build \
     --build-arg SUPABASE_URL=your_supabase_url \
     --build-arg SUPABASE_ANON_KEY=your_supabase_key \
     -t dryclean-oms-local .
   ```
2. **Run the Container**:
   ```bash
   docker run -p 3000:3000 dryclean-oms-local
   ```
3. **Access the App**: Open [http://localhost:3000](http://localhost:3000).

---

## 2. AWS Infrastructure Setup (Extreme Detail)

### Step A: S3 Bucket (Storage)
1. Log in to the **AWS Console** and go to **S3**.
2. Click **Create Bucket**. 
   - Name: `dryclean-oms-frontend` (must be globally unique).
   - Region: `us-east-1` (recommended).
3. **Object Ownership**: Set to `Bucket owner preferred`.
4. **Block Public Access**: **Check the box** to "Block all public access". We will use CloudFront OAC for security.
5. Finish creation.

### Step B: CloudFront (Global CDN)
1. Go to **CloudFront** > **Distributions** > **Create Distribution**.
2. **Origin Domain**: Select the S3 bucket created in Step A.
3. **Origin Access**: Select **Origin access control settings (recommended)**.
   - Click **Create new OAC**. Leave defaults and click Create.
4. **Web Application Firewall (WAF)**: Select "Do not enable" for now (or enable for extra security).
5. **Default Root Object**: Type `index.html`.
6. **Error Pages (CRITICAL for React Routing)**:
   - Click the **Error Responses** tab after creation.
   - Click **Create error response**.
   - HTTP error code: `403: Forbidden` (S3 returns 403 when a path doesn't exist).
   - Customize error response: **Yes**.
   - Response page path: `/index.html`.
   - HTTP Response code: `200: OK`.
   - *Repeat this step for `404: Not Found`.*

### Step C: Update S3 Bucket Policy
1. After creating the CloudFront distribution, AWS will provide a **Policy Statement**.
2. Go back to your **S3 Bucket** > **Permissions** > **Bucket Policy** > **Edit**.
3. Paste the policy provided by CloudFront. This allows only CloudFront to read your files.

---

## 3. GitHub Actions Automation

The `.github/workflows/deploy.yml` file automates the build (preprocessing) and upload.

### Step 1: Prepare Secrets
In your GitHub repository, go to **Settings** > **Secrets and Variables** > **Actions** and add:

| Secret Name | Description |
| :--- | :--- |
| `AWS_ACCESS_KEY_ID` | IAM User access key |
| `AWS_SECRET_ACCESS_KEY` | IAM User secret key |
| `S3_BUCKET_NAME` | Name of your S3 bucket |
| `CLOUDFRONT_DISTRIBUTION_ID` | The ID of your CloudFront distribution |
| `SUPABASE_URL` | Your production Supabase URL |
| `SUPABASE_ANON_KEY` | Your production Supabase Anon Key |

### Step 2: How it works
1. **Preprocessing**: GitHub Actions runs `npm run build`. This converts your `.tsx` and `.ts` files into optimized `.js` and `.css` files in the `/dist` folder.
2. **Environment Injection**: The `VITE_` variables are injected during the build, so the frontend knows how to talk to Supabase.
3. **S3 Sync**: The `aws s3 sync` command uploads only changed files to S3.
4. **Invalidation**: The `create-invalidation` command forces CloudFront to clear its edge cache so users see the new version immediately.

---

## 4. Security & Costs
- **Zero Server Maintenance**: No backend to patch or scale.
- **DDoS Protection**: CloudFront handles the traffic spikes.
- **Cost**: S3 and CloudFront are free-tier eligible. For a small business, monthly costs are typically < $0.50 USD.

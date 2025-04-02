# GitHub Workflows

This directory contains GitHub Actions workflows for testing and deploying the frontend application.

## Test Workflow (`test.yml`)

The test workflow runs on:
- All pull requests to the main branch
- Pushes to any branch except main
- Manual triggers via workflow_dispatch

It performs the following tasks:
- Lints the code
- Builds the application
- (Optionally) Runs tests

This ensures code quality before merging into the main branch.

## Deploy Workflow (`cloudflare-deploy.yml`)

The deploy workflow runs on:
- Pushes to the main branch
- Manual triggers via workflow_dispatch

It consists of two jobs:
1. **test**: Runs the same checks as the test workflow
2. **deploy**: Deploys to Cloudflare Pages (only runs if tests pass)

### Required GitHub Secrets

To use the deployment workflow, you need to set up the following secrets in your GitHub repository:

1. `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages deployment permissions
2. `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### How to set up these secrets:

1. Create a Cloudflare API token:
   - Go to your Cloudflare dashboard
   - Navigate to "My Profile" > "API Tokens"
   - Create a custom token with "Pages:Edit" and "Workers:Edit" permissions

2. Get your Cloudflare Account ID:
   - This is visible in the URL of your Cloudflare dashboard: `https://dash.cloudflare.com/ACCOUNT_ID`

3. Add secrets to GitHub:
   - Go to your GitHub repository
   - Navigate to "Settings" > "Secrets and variables" > "Actions"
   - Add the two secrets with the names mentioned above 
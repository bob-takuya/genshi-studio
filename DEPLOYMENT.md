# GitHub Pages Deployment Guide

## Automatic Deployment

The project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup

1. **Enable GitHub Pages in your repository:**
   - Go to Settings → Pages
   - Source: Select "GitHub Actions"

2. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. The GitHub Actions workflow will automatically:
   - Build the project
   - Deploy to GitHub Pages
   - Your site will be available at: `https://[username].github.io/genshi-studio/`

## Manual Deployment

If you prefer manual deployment:

```bash
npm run build
npm run deploy
```

## Local Testing

To test the GitHub Pages deployment locally:

```bash
./test-gh-pages.sh
```

Then visit: http://localhost:8080/genshi-studio/

## Configuration Details

### Vite Configuration
- Base URL: `/genshi-studio/` (configured in `vite.config.ts`)
- Build output: `dist` directory

### Router Configuration
- Using `BrowserRouter` with `basename="/genshi-studio"`
- 404.html handles client-side routing for GitHub Pages

### Asset Paths
All assets use the base path:
- Icons: `/genshi-studio/genshi-logo.svg`
- Manifest: `/genshi-studio/manifest.json`
- Service Worker: `/genshi-studio/sw.js`

## Troubleshooting

### 404 Errors on Page Refresh
The project includes a `404.html` file that redirects all routes to the main app. This is already configured.

### Assets Not Loading
Ensure all asset paths in your code use relative paths or include the base URL.

### Service Worker Issues
The service worker is configured with the correct scope: `/genshi-studio/`

## Repository Settings

Ensure your repository name matches the base URL:
- Repository name: `genshi-studio`
- Base URL in config: `/genshi-studio/`
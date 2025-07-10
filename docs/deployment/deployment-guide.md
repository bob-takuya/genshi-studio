# Genshi Studio Deployment Guide

*Complete production deployment procedures for Genshi Studio*

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Build Process](#build-process)
3. [Static Site Deployment](#static-site-deployment)
4. [CDN Configuration](#cdn-configuration)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [Security Configuration](#security-configuration)
8. [Rollback Procedures](#rollback-procedures)

## Deployment Overview

### Deployment Architecture

```
Development → Build → Testing → Staging → Production
     │           │        │         │          │
   Local       Bundle   E2E      Preview   Live Site
  Testing     Creation  Tests     Deploy    Deploy
     │           │        │         │          │
 Feature     Minify   Quality   Smoke     Monitor
   Dev      Optimize   Gates    Tests    & Alert
```

### Deployment Targets

#### 1. GitHub Pages (Primary)
- **URL**: https://bob-takuya.github.io/genshi-studio/
- **Branch**: `gh-pages` (auto-deployed from `main`)
- **Build**: Automated via GitHub Actions
- **CDN**: GitHub's global CDN

#### 2. Netlify (Alternative)
- **URL**: https://genshi-studio.netlify.app/
- **Source**: GitHub repository
- **Build**: Continuous deployment
- **Features**: Branch previews, form handling

#### 3. Vercel (Alternative)
- **URL**: https://genshi-studio.vercel.app/
- **Source**: GitHub repository
- **Build**: Edge functions support
- **Features**: Analytics, performance insights

#### 4. AWS S3 + CloudFront (Enterprise)
- **Bucket**: `genshi-studio-prod`
- **CDN**: CloudFront global distribution
- **SSL**: AWS Certificate Manager
- **Features**: Custom domain, advanced caching

## Build Process

### Production Build Configuration

**Environment Variables (.env.production):**

```bash
# Application Configuration
VITE_APP_TITLE="Genshi Studio"
VITE_APP_VERSION="2.0.0"
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error

# Feature Flags
VITE_ENABLE_WEBGL=true
VITE_ENABLE_WORKERS=true
VITE_ENABLE_ANALYTICS=true

# Performance Settings
VITE_BUNDLE_ANALYZER=false
VITE_COMPRESSION=true
VITE_SOURCE_MAPS=false

# Security
VITE_CSP_ENABLED=true
VITE_HTTPS_ONLY=true

# Analytics
VITE_GA_TRACKING_ID="G-XXXXXXXXXX"
VITE_SENTRY_DSN="https://xxx@sentry.io/xxx"
```

### Build Scripts

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:analyze": "ANALYZE=true npm run build",
    "build:staging": "NODE_ENV=staging npm run build",
    "build:production": "NODE_ENV=production npm run build",
    "preview": "vite preview --port 3002",
    "deploy:gh-pages": "npm run build && gh-pages -d dist",
    "deploy:netlify": "npm run build && netlify deploy --prod --dir=dist",
    "deploy:vercel": "vercel --prod"
  }
}
```

### Vite Production Configuration

```typescript
// vite.config.ts (production optimizations)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true
    })
  ],
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'graphics-vendor': ['three', 'fabric'],
          'ui-vendor': ['@radix-ui/react-dialog', 'framer-motion'],
          'utils-vendor': ['lodash-es', 'date-fns']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug']
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version)
  }
})
```

### Build Optimization

**Bundle Analysis:**

```bash
# Generate bundle analysis
npm run build:analyze

# Open analysis report
open dist/stats.html
```

**Asset Optimization:**

```typescript
// vite.config.ts - Asset optimization
export default defineConfig({
  assetsInclude: ['**/*.woff2', '**/*.woff'],
  build: {
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`
          }
          if (/woff2?|ttf|eot/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    }
  }
})
```

## Static Site Deployment

### GitHub Pages Deployment

**GitHub Actions Workflow (.github/workflows/deploy.yml):**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: |
        npm run type-check
        npm run lint
        npm run test:coverage
        
    - name: Install Playwright
      run: npx playwright install --with-deps
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Build application
      run: npm run build
      env:
        VITE_GA_TRACKING_ID: ${{ secrets.GA_TRACKING_ID }}
        VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
        
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/
        
    - name: Deploy to GitHub Pages
      if: github.ref == 'refs/heads/main'
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
        cname: genshi-studio.com
```

**Manual GitHub Pages Deployment:**

```bash
# Install gh-pages utility
npm install -g gh-pages

# Build and deploy
npm run build
gh-pages -d dist

# Deploy with custom message
gh-pages -d dist -m "Deploy version 2.0.0"
```

### Netlify Deployment

**netlify.toml Configuration:**

```toml
[build]
  command = "npm run build"
  publish = "dist"
  
[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--prefix=/dev/null"
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    
[[headers]]
  for = "*.woff2"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    
[dev]
  command = "npm run dev"
  port = 3001
  
[functions]
  directory = "netlify/functions"
```

**Deployment Commands:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to staging
netlify deploy --dir=dist

# Deploy to production
netlify deploy --prod --dir=dist
```

### Vercel Deployment

**vercel.json Configuration:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Deployment Commands:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## CDN Configuration

### CloudFront Setup (AWS)

**CloudFormation Template:**

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Genshi Studio CloudFront Distribution'

Parameters:
  DomainName:
    Type: String
    Default: 'genshi-studio.com'
    
Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${DomainName}-static'
      WebsiteConfiguration:
        IndexDocument: 'index.html'
        ErrorDocument: 'index.html'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false
        
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Aliases:
          - !Ref DomainName
          - !Sub 'www.${DomainName}'
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad # Managed-CachingDisabled
          ResponseHeadersPolicyId: 67f7725c-6f97-4210-82d7-5512b31e9d03 # Managed-SecurityHeadersPolicy
        DefaultRootObject: 'index.html'
        Enabled: true
        HttpVersion: http2
        IPV6Enabled: true
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt S3Bucket.DomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
        PriceClass: PriceClass_100
        ViewerCertificate:
          AcmCertificateArn: !Ref SSLCertificate
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
          
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub 'www.${DomainName}'
      ValidationMethod: DNS
```

### Cache Configuration

**Cache Headers Setup:**

```javascript
// Cache configuration for different file types
const cacheConfig = {
  // HTML files - no cache (for SPA routing)
  html: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  
  // Static assets - long cache
  assets: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Vary': 'Accept-Encoding'
  },
  
  // Fonts - long cache
  fonts: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Access-Control-Allow-Origin': '*'
  },
  
  // Images - medium cache
  images: {
    'Cache-Control': 'public, max-age=86400',
    'Vary': 'Accept-Encoding'
  }
}
```

**Service Worker Caching:**

```typescript
// sw.ts - Service Worker cache strategy
const CACHE_NAME = 'genshi-studio-v2.0.0'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/index-*.js',
  '/assets/index-*.css',
  '/assets/fonts/*',
  '/genshi-logo.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
  )
})
```

## Performance Optimization

### Compression Setup

**Gzip/Brotli Configuration:**

```nginx
# Nginx configuration
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml
        application/xml+rss
        text/javascript
        image/svg+xml;
        
    # Brotli compression (if available)
    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml
        application/xml+rss
        text/javascript
        image/svg+xml;
}
```

### Image Optimization

**Build-time Image Processing:**

```javascript
// vite.config.ts - Image optimization plugin
import { defineConfig } from 'vite'
import { imageOptimize } from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    imageOptimize({
      gifsicle: { optimizationLevel: 7 },
      mozjpeg: { quality: 85 },
      pngquant: { quality: [0.65, 0.8] },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: false }
        ]
      }
    })
  ]
})
```

### Font Optimization

**Font Loading Strategy:**

```css
/* Preload critical fonts */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/inter-v12-latin-regular.woff2') format('woff2');
}

/* Subset fonts for better performance */
@font-face {
  font-family: 'NotoSansJP';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/noto-sans-jp-subset.woff2') format('woff2');
  unicode-range: U+3040-309F, U+30A0-30FF, U+4E00-9FAF;
}
```

## Monitoring & Analytics

### Google Analytics Setup

```typescript
// analytics.ts
import { gtag } from 'ga-gtag'

class Analytics {
  private static instance: Analytics
  private initialized = false
  
  static getInstance(): Analytics {
    if (!this.instance) {
      this.instance = new Analytics()
    }
    return this.instance
  }
  
  initialize(trackingId: string) {
    if (this.initialized) return
    
    // Load Google Analytics
    gtag('config', trackingId, {
      page_title: 'Genshi Studio',
      page_location: window.location.href,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    })
    
    this.initialized = true
  }
  
  trackPageView(path: string) {
    gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
      page_path: path
    })
  }
  
  trackEvent(eventName: string, parameters: any) {
    gtag('event', eventName, parameters)
  }
  
  trackPatternCreation(patternType: string) {
    this.trackEvent('pattern_created', {
      event_category: 'engagement',
      event_label: patternType
    })
  }
  
  trackPerformance(metric: string, value: number) {
    this.trackEvent('performance_metric', {
      event_category: 'performance',
      event_label: metric,
      value: Math.round(value)
    })
  }
}
```

### Error Monitoring with Sentry

```typescript
// error-monitoring.ts
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new BrowserTracing({
      tracingOrigins: ['localhost', 'genshi-studio.com', /^\//],
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      )
    })
  ],
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0]
      if (error?.type === 'ChunkLoadError') {
        return null // Ignore chunk loading errors
      }
    }
    return event
  }
})
```

### Performance Monitoring

```typescript
// performance-monitor.ts
class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map()
  
  static measureWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lcp = entries[entries.length - 1]
      this.reportMetric('LCP', lcp.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        this.reportMetric('FID', entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ['first-input'] })
    
    // Cumulative Layout Shift
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.reportMetric('CLS', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }
  
  static reportMetric(name: string, value: number) {
    this.metrics.set(name, value)
    
    // Report to analytics
    Analytics.getInstance().trackPerformance(name, value)
    
    // Report to console in development
    if (import.meta.env.DEV) {
      console.log(`Performance metric: ${name} = ${value}ms`)
    }
  }
}
```

## Security Configuration

### Content Security Policy

```html
<!-- index.html - CSP Meta Tag -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-eval' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://www.google-analytics.com;
  font-src 'self' data:;
  connect-src 'self' https://www.google-analytics.com https://sentry.io;
  worker-src 'self' blob:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

### Security Headers

```typescript
// security-headers.ts
const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'cross-origin'
}
```

## Rollback Procedures

### Automated Rollback

```bash
#!/bin/bash
# rollback.sh - Emergency rollback script

set -e

ROLLBACK_VERSION=${1:-"previous"}
DEPLOYMENT_TARGET=${2:-"github"}

echo "Rolling back to version: $ROLLBACK_VERSION"
echo "Deployment target: $DEPLOYMENT_TARGET"

case $DEPLOYMENT_TARGET in
  "github")
    # Rollback GitHub Pages deployment
    git checkout gh-pages
    git reset --hard HEAD~1
    git push --force-with-lease origin gh-pages
    ;;
    
  "netlify")
    # Rollback Netlify deployment
    netlify api restoreSiteDeploy --data='{"deploy_id": "'$ROLLBACK_VERSION'"}'
    ;;
    
  "vercel")
    # Rollback Vercel deployment
    vercel rollback $ROLLBACK_VERSION
    ;;
    
  "aws")
    # Rollback AWS S3 deployment
    aws s3 sync s3://backup-bucket/$ROLLBACK_VERSION/ s3://production-bucket/ --delete
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
    ;;
    
  *)
    echo "Unknown deployment target: $DEPLOYMENT_TARGET"
    exit 1
    ;;
esac

echo "Rollback completed successfully!"
```

### Health Checks

```typescript
// health-check.ts
class HealthChecker {
  static async checkDeployment(url: string): Promise<boolean> {
    try {
      // Check if site is accessible
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok) return false
      
      // Check if critical resources load
      const criticalChecks = [
        this.checkResourceLoad(`${url}/assets/index.js`),
        this.checkResourceLoad(`${url}/assets/index.css`),
        this.checkPatternGeneration(url)
      ]
      
      const results = await Promise.all(criticalChecks)
      return results.every(result => result)
      
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
  
  private static async checkResourceLoad(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }
  
  private static async checkPatternGeneration(baseUrl: string): Promise<boolean> {
    // This would typically involve a headless browser test
    // to verify that patterns can be generated
    return true // Simplified for example
  }
}
```

### Deployment Verification

```yaml
# .github/workflows/verify-deployment.yml
name: Verify Deployment

on:
  deployment_status

jobs:
  verify:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run smoke tests
      run: |
        npm run test:smoke -- --baseURL=${{ github.event.deployment_status.target_url }}
        
    - name: Notify on failure
      if: failure()
      uses: actions/github-script@v7
      with:
        script: |
          github.rest.repos.createDeploymentStatus({
            owner: context.repo.owner,
            repo: context.repo.repo,
            deployment_id: context.payload.deployment.id,
            state: 'failure',
            description: 'Deployment verification failed'
          })
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Bundle size within limits
- [ ] Browser compatibility verified
- [ ] Accessibility compliance checked
- [ ] Error monitoring configured
- [ ] Analytics tracking verified

### During Deployment
- [ ] Build process completed successfully
- [ ] Assets optimized and compressed
- [ ] CDN cache invalidated if needed
- [ ] SSL certificate valid
- [ ] Security headers configured
- [ ] Monitoring alerts enabled

### Post-Deployment
- [ ] Health checks passing
- [ ] Core Web Vitals within targets
- [ ] Error rates below threshold
- [ ] Analytics tracking working
- [ ] Pattern generation functional
- [ ] Export functionality working
- [ ] Mobile experience verified
- [ ] Rollback plan ready if needed

**Deployment Status**: Ready for Production  
**Last Updated**: 2025-07-09  
**Next Review**: 2025-08-09
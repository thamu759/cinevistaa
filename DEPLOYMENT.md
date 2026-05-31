# Deployment Guide for Midnight Cinema

This guide provides instructions for deploying the Midnight Cinema movie review application to various platforms.

## Overview

The application consists of:
- **Client**: React/Vite frontend (in `/client` directory)
- **Server**: Node/Express backend (in `/server` directory)
- **Database**: MongoDB (with JSON file fallback)

## Deployment Options

### Option 1: Deploy Client and Server Separately (Recommended for Scalability)

#### Client Deployment (Static Site)
The client can be deployed to any static hosting service:

1. **Build the client**:
   ```bash
   cd client
   npm install
   npm run build
   ```
   This produces optimized files in `client/dist/`

2. **Deploy to static hosts**:
   - **Vercel**: `vercel` (after installing Vercel CLI)
   - **Netlify**: Drag & drop `dist` folder or connect Git repo
   - **Firebase Hosting**: `firebase deploy --only hosting`
   - **GitHub Pages**: Configure base in vite.config.js and use `gh-pages` package
   - **Cloudflare Pages**: Connect Git repo

#### Server Deployment (API)
The server can be deployed to any Node.js hosting service:

1. **Prepare the server**:
   ```bash
   cd server
   npm install
   ```
   Ensure you have a MongoDB connection string in your environment variables

2. **Deploy to Node.js hosts**:
   - **Render**: Create a Web Service
   - **Railway**: Deploy from GitHub
   - **Heroku**: Push to Heroku remote
   - **AWS Elastic Beanstalk**: Upload ZIP
   - **DigitalOcean App Platform**: Specify Node.js component

### Option 2: Full-Stack Deployment (Client Served by Server)

For simpler deployment, you can configure the server to serve the built client files:

1. **Modify server.js** to serve static files:
   ```javascript
   // Add this near the top of server.js, after middleware
   const path = require('path');
   app.use(express.static(path.join(__dirname, '../../client/dist')));
   
   // Add this at the very end, before app.listen()
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
   });
   ```

2. **Build and deploy**:
   ```bash
   # Build client
   cd client
   npm run build
   
   # Deploy server (which now includes client)
   cd server
   npm install
   npm start
   ```

### Option 3: Docker Deployment

Create a Dockerfile for containerized deployment:

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
WORKDIR /app/server
RUN npm install
WORKDIR /app/client
RUN npm install

# Copy source code
WORKDIR /app
COPY server/ ./server/
COPY client/ ./client/

# Build client
WORKDIR /app/client
RUN npm run build

# Set workdir to server
WORKDIR /app/server

# Environment variables
ENV PORT=5000
# Add your MongoDB URI here or set via docker run -e
# ENV MONGO_URI=mongodb://localhost:27017/thiraipedia

EXPOSE 5000

CMD ["node", "server.js"]
```

Then build and run:
```bash
docker build -t thiraipedia .
docker run -p 5000:5000 -e MONGO_URI="your_mongodb_uri" thiraipedia
```

## Environment Variables

Set these in your deployment platform:

### Server (.env)
```
PORT=5000
MONGO_URI=mongodb://your_connection_string
TMDB_API_KEY=your_tmdb_api_key
TMDB_ACCESS_TOKEN=your_tmdb_access_token  # Optional, for higher rate limits
```

### Client (if needed)
Most client configuration is done at build time via Vite. If you need runtime config:
- Use `import.meta.env` in Vite
- Or configure via server-provided endpoints

## Database Setup

### MongoDB Atlas (Recommended)
1. Create account at mongodb.com
2. Create a free cluster
3. Get connection string
4. Set as `MONGO_URI` environment variable

### Local Development (JSON Fallback)
If no `MONGO_URI` is provided, the app automatically falls back to using `db.json` in the server directory.

## Build Optimizations

For production builds, consider:

1. **Enable compression** in server.js:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Add caching headers** for static assets
3. **Use a CDN** for serving client assets
4. **Implement rate limiting** on API endpoints:
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use(limiter);
   ```

## Common Deployment Issues

### 1. Client-Side Routing
If deploying client separately, ensure your hosting service redirects all routes to `index.html` for client-side routing to work.

### 2. CORS Issues
If client and server are on different domains, ensure CORS is properly configured in server.js:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
```

### 3. Asset Paths
After building, ensure asset paths are correct. Vite should handle this automatically with the correct `base` configuration.

### 4. Database Connection
Test your MongoDB connection string locally before deploying.

## Monitoring and Logging

For production deployments, consider adding:

1. **Error tracking**: Sentry, LogRocket
2. **Performance monitoring**: New Relic, Datadog
3. **Logging**: Winston or Morgan middleware
4. **Health checks**: Add `/health` endpoint

## Example: Deploying to Render.com

1. **Create Web Service** for backend:
   - Build Command: `cd client && npm install && npm run build && cd ../server && npm install`
   - Start Command: `cd server && npm start`
   - Environment: Node.js
   - Add environment variables under "Environment"

2. **Create Static Site** for frontend (alternative approach):
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/dist`
   - Environment: Static Site

## Verification

After deployment:
1. Test all endpoints work correctly
2. Verify movie data loads from database
3. Test user authentication flows
4. Check that image proxy works correctly
5. Verify responsive design on mobile devices

## Maintenance

- Set up automated backups for MongoDB
- Monitor logs for errors
- Keep dependencies updated with `npm outdated` and `npm update`
- Consider setting up CI/CD pipeline for automated testing and deployment
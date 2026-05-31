#!/bin/bash
# Deployment helper script for thiraipedia

echo "=== thiraipedia Deployment Helper ==="
echo "This script helps build and prepare the application for deployment."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
  echo "Error: Please run this script from the project root directory."
  exit 1
fi

echo "1. Installing dependencies..."
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

echo ""
echo "2. Building client for production..."
cd client
npm run build
cd ..

echo ""
echo "3. Checking build output..."
if [ -d "client/dist" ] && [ -f "client/dist/index.html" ]; then
  echo "✓ Client built successfully!"
  echo "  Built files are in: ./client/dist/"
else
  echo "✗ Client build failed or output not found!"
  exit 1
fi

echo ""
echo "4. Creating production environment file template..."
if [ ! -f ".env.production" ]; then
  cat > .env.production << EOF
# Production Environment Variables
# Copy this to .env when deploying

PORT=5000
MONGO_URI=mongodb://your_connection_string_here
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_ACCESS_TOKEN=your_tmdb_access_token_here  # Optional
EOF
  echo "✓ Created .env.production template"
  echo "  Please copy to .env and fill in your values before deploying"
else
  echo "✓ .env.production already exists"
fi

echo ""
echo "5. Deployment options:"
echo ""
echo "Option A: Deploy client and server separately (Recommended)"
echo "  - Deploy client/dist to static host (Vercel, Netlify, etc.)"
echo "  - Deploy server to Node.js host (Render, Railway, etc.)"
echo ""
echo "Option B: Deploy full-stack (server serves client)"
echo "  1. Modify server.js to serve static files:"
echo "     - Add: app.use(express.static(path.join(__dirname, '../../client/dist')));"
echo "     - Add: app.get('*', (req, res) => { res.sendFile(path.join(__dirname, '../../client/dist/index.html')); });"
echo "  2. Deploy server (which now includes built client)"
echo ""
echo "Option C: Use Docker"
echo "  - See DEPLOYMENT.md for Dockerfile example"
echo ""
echo "Next steps:"
echo "  1. Read DEPLOYMENT.md for detailed instructions"
echo "  2. Set up your environment variables"
echo "  3. Choose your deployment method"
echo "  4. Deploy!"
echo ""
echo "=== Deployment preparation complete ==="
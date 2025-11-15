#!/bin/bash

# Test setup script for dual-hand skeleton visualization

echo "🧪 Setting up local testing environment..."

# Create test branch if not already on one
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo "📝 Creating test branch..."
    git checkout -b test/dual-hand-skeleton
else
    echo "✓ Already on branch: $CURRENT_BRANCH"
fi

# Create models directory
echo "📁 Setting up models directory..."
mkdir -p public/models/skeleton_arm

# Copy GLB files
echo "📦 Copying GLB files..."
if [ -d "/Users/ethan/Downloads/skeleton_arm parts" ]; then
    cp "/Users/ethan/Downloads/skeleton_arm parts"/*.glb public/models/skeleton_arm/ 2>/dev/null
    FILE_COUNT=$(ls public/models/skeleton_arm/*.glb 2>/dev/null | wc -l | tr -d ' ')
    echo "✓ Copied $FILE_COUNT GLB files"
else
    echo "⚠️  Source directory not found. Please copy GLB files manually to public/models/skeleton_arm/"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Create it with your API key (see API_KEY_SETUP.md)"
fi

echo ""
echo "✅ Setup complete! Now run:"
echo "   npm run dev"
echo ""
echo "Then open: http://localhost:3000/skeleton"


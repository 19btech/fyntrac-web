#!/bin/bash
set -e

# Create font directories
mkdir -p public/fonts/geist
mkdir -p public/fonts/geist-mono
mkdir -p public/fonts/inter

echo "📁 Created font directories."

# -------------------------------
# Download Geist Font (from Vercel repo)
# -------------------------------
echo "⬇️ Downloading Geist fonts..."
curl -L -o public/fonts/geist/Geist-Regular.woff2 \
  https://raw.githubusercontent.com/vercel/geist-font/main/packages/geist/static/Geist-Regular.woff2

curl -L -o public/fonts/geist/Geist-Medium.woff2 \
  https://raw.githubusercontent.com/vercel/geist-font/main/packages/geist/static/Geist-Medium.woff2

curl -L -o public/fonts/geist/Geist-Bold.woff2 \
  https://raw.githubusercontent.com/vercel/geist-font/main/packages/geist/static/Geist-Bold.woff2

# -------------------------------
# Download Geist Mono Font
# -------------------------------
echo "⬇️ Downloading Geist Mono fonts..."
curl -L -o public/fonts/geist-mono/GeistMono-Regular.woff2 \
  https://raw.githubusercontent.com/vercel/geist-font/main/packages/mono/static/GeistMono-Regular.woff2

curl -L -o public/fonts/geist-mono/GeistMono-Medium.woff2 \
  https://raw.githubusercontent.com/vercel/geist-font/main/packages/mono/static/GeistMono-Medium.woff2

# -------------------------------
# Download Inter Font (Google Fonts)
# -------------------------------
echo "⬇️ Downloading Inter fonts..."
curl -L -o public/fonts/inter/Inter-Regular.woff2 \
  https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bwght%5D.woff2

# (Optional) Add a few more Inter weights for variety
curl -L -o public/fonts/inter/Inter-Bold.woff2 \
  https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bwght%5D.woff2

echo "✅ Fonts downloaded successfully!"


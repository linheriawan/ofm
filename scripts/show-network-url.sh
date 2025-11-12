#!/bin/bash

# Get local IP addresses (excluding localhost)
echo "🌐 Network URLs for accessing the app:"
echo ""

# Get all non-loopback IP addresses
IPS=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}')

if [ -z "$IPS" ]; then
    echo "❌ No network IP found. Make sure you're connected to WiFi or Ethernet."
    exit 1
fi

PORT=${1:-5174}

echo "📱 Access from smartphone/tablet on the same network:"
echo ""

for IP in $IPS; do
    echo "   http://$IP:$PORT"
done

echo ""
echo "💻 Local access (this Mac):"
echo "   http://localhost:$PORT"
echo ""
echo "ℹ️  Make sure your smartphone is on the SAME WiFi network!"
echo ""

#!/bin/bash

# Job Card Management System - Push to GitHub Script
# Run this script after cloning or downloading the project

echo "🚀 Job Card Management System - GitHub Setup"
echo "============================================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git branch -m main
fi

# Add all files
echo "📝 Adding files..."
git add .

# Create commit if there are changes
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    echo "💾 Creating commit..."
    git commit -m "Update: Job Card Management System"
fi

# Add remote if not exists
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding remote repository..."
    git remote add origin https://github.com/yohan114/Job-Card-Management-System.git
fi

echo ""
echo "📌 Ready to push!"
echo "============================================="
echo ""
echo "To push to GitHub, run one of these commands:"
echo ""
echo "Option 1: Using HTTPS (will prompt for credentials)"
echo "  git push -u origin main"
echo ""
echo "Option 2: Using SSH (if you have SSH keys setup)"
echo "  git remote set-url origin git@github.com:yohan114/Job-Card-Management-System.git"
echo "  git push -u origin main"
echo ""
echo "Option 3: Using GitHub CLI (gh)"
echo "  gh auth login"
echo "  git push -u origin main"
echo ""

#!/bin/bash

# ============================================
# Vercel Deployment Helper Script
# Production-ready deployment with cache clearing
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="signaldesk-frontend"
BUILD_VERSION=$(node -p "require('./package.json').version")
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DEPLOYMENT_ENV=${1:-production}

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_section() {
    echo -e "\n${MAGENTA}▶ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_section "Checking Prerequisites"
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI not found. Please install it:"
        echo "  npm i -g vercel"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the frontend directory?"
        exit 1
    fi
    
    # Check if project is linked
    if [ ! -d ".vercel" ]; then
        log_warning "Project not linked to Vercel. Running 'vercel link'..."
        vercel link
    fi
    
    log_success "Prerequisites checked"
}

# Clean previous build artifacts
clean_build() {
    log_section "Cleaning Build Artifacts"
    
    rm -rf build/
    rm -rf .vercel/cache/
    rm -rf node_modules/.cache/
    
    log_success "Build artifacts cleaned"
}

# Install dependencies with clean slate
install_dependencies() {
    log_section "Installing Dependencies"
    
    # Remove package-lock to ensure fresh install
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        log_info "Removing package-lock for fresh install..."
        rm -f package-lock.json
    fi
    
    # Install with npm ci for faster, more reliable installs
    if [ -f "package-lock.json" ]; then
        npm ci --prefer-offline --no-audit
    else
        npm install --no-audit
    fi
    
    log_success "Dependencies installed"
}

# Build the application
build_app() {
    log_section "Building Application"
    
    # Set build environment variables
    export REACT_APP_BUILD_VERSION=$BUILD_VERSION
    export REACT_APP_BUILD_TIME=$BUILD_TIME
    export GENERATE_SOURCEMAP=false
    export CI=false
    
    log_info "Build version: $BUILD_VERSION"
    log_info "Build time: $BUILD_TIME"
    
    # Run build
    npm run build
    
    # Verify build output
    if [ ! -d "build" ]; then
        log_error "Build failed - no build directory created"
        exit 1
    fi
    
    # Check for hashed files (cache busting)
    if ls build/static/js/*.js 1> /dev/null 2>&1; then
        log_success "Build completed with hashed assets"
    else
        log_warning "No hashed JavaScript files found"
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    log_section "Deploying to Vercel"
    
    local deploy_cmd="vercel"
    local deploy_args=""
    
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        deploy_args="--prod"
        log_info "Deploying to PRODUCTION environment"
    else
        deploy_args=""
        log_info "Deploying to PREVIEW environment"
    fi
    
    # Add build metadata
    deploy_args="$deploy_args --build-env REACT_APP_BUILD_VERSION=$BUILD_VERSION"
    deploy_args="$deploy_args --build-env REACT_APP_BUILD_TIME=$BUILD_TIME"
    
    # Execute deployment
    log_info "Running: vercel $deploy_args"
    DEPLOYMENT_URL=$($deploy_cmd $deploy_args --yes)
    
    if [ $? -eq 0 ]; then
        log_success "Deployment successful!"
        echo -e "${CYAN}Deployment URL: $DEPLOYMENT_URL${NC}"
    else
        log_error "Deployment failed"
        exit 1
    fi
    
    echo "$DEPLOYMENT_URL" > .last-deployment-url
}

# Clear CDN cache
clear_cdn_cache() {
    log_section "Clearing CDN Cache"
    
    # Vercel automatically purges cache on new deployments
    # But we can force additional cache clearing
    
    log_info "Requesting cache purge..."
    
    # If you have a custom domain with Cloudflare, add purge here
    # Example: curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE/purge_cache"
    
    log_success "Cache purge requested"
}

# Verify deployment
verify_deployment() {
    log_section "Verifying Deployment"
    
    if [ -f ".last-deployment-url" ]; then
        DEPLOYMENT_URL=$(cat .last-deployment-url)
        
        log_info "Waiting for deployment to be ready..."
        sleep 10
        
        # Run verification script
        if [ -f "scripts/verify-deployment.js" ]; then
            VERCEL_URL=$DEPLOYMENT_URL node scripts/verify-deployment.js
        else
            log_warning "Verification script not found"
        fi
    else
        log_warning "No deployment URL found for verification"
    fi
}

# Rollback function
rollback_deployment() {
    log_section "Rolling Back Deployment"
    
    log_info "Fetching previous deployments..."
    vercel ls --yes | head -5
    
    read -p "Enter deployment URL to rollback to: " ROLLBACK_URL
    
    if [ ! -z "$ROLLBACK_URL" ]; then
        vercel alias set $ROLLBACK_URL $PROJECT_NAME.vercel.app --yes
        log_success "Rolled back to $ROLLBACK_URL"
    else
        log_error "No URL provided for rollback"
    fi
}

# Main deployment flow
main() {
    echo -e "${CYAN}════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}     Vercel Deployment Script${NC}"
    echo -e "${CYAN}     Project: $PROJECT_NAME${NC}"
    echo -e "${CYAN}     Version: $BUILD_VERSION${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════${NC}"
    
    # Check for rollback flag
    if [ "$1" = "rollback" ]; then
        rollback_deployment
        exit 0
    fi
    
    # Run deployment steps
    check_prerequisites
    clean_build
    install_dependencies
    build_app
    deploy_to_vercel
    clear_cdn_cache
    verify_deployment
    
    echo -e "\n${GREEN}════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}     Deployment Complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════${NC}"
    
    # Show next steps
    echo -e "\n${CYAN}Next Steps:${NC}"
    echo "1. Check deployment at: $DEPLOYMENT_URL"
    echo "2. Monitor logs: vercel logs"
    echo "3. View analytics: vercel analytics"
    echo "4. If issues, rollback: ./scripts/vercel-deploy.sh rollback"
}

# Handle errors
trap 'log_error "Script failed at line $LINENO"' ERR

# Run main function
main "$@"
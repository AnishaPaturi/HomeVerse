#!/usr/bin/env bash
# ==============================================================================
# HomeVerse Docker Build & Tag Script (Phase 32)
# Builds frontend and backend images tagged with commit SHA and latest,
# with optional push to AWS ECR.
# ==============================================================================

set -e

# Derive short commit SHA
if command -v git &> /dev/null && git rev-parse --is-inside-work-tree &> /dev/null; then
    COMMIT_SHA=$(git rev-parse --short HEAD)
else
    COMMIT_SHA="dev-$(date +%s)"
fi

echo "======================================================"
echo " HomeVerse Docker CI Build (Phase 32)"
echo " Commit SHA: ${COMMIT_SHA}"
echo "======================================================"

# Determine registry prefix
REGISTRY="${AWS_ECR_REGISTRY:-}"
PUSH_FLAG="${1:-}"

BACKEND_LOCAL_TAG="homeverse-backend:${COMMIT_SHA}"
BACKEND_LATEST_TAG="homeverse-backend:latest"
FRONTEND_LOCAL_TAG="homeverse-frontend:${COMMIT_SHA}"
FRONTEND_LATEST_TAG="homeverse-frontend:latest"

# 1. Build Backend Image
echo ""
echo "--> Building Backend Docker Image (${BACKEND_LOCAL_TAG})..."
docker build \
    -t "${BACKEND_LOCAL_TAG}" \
    -t "${BACKEND_LATEST_TAG}" \
    -f infrastructure/docker/backend.Dockerfile .

# 2. Build Frontend Image
echo ""
echo "--> Building Frontend Docker Image (${FRONTEND_LOCAL_TAG})..."
docker build \
    -t "${FRONTEND_LOCAL_TAG}" \
    -t "${FRONTEND_LATEST_TAG}" \
    -f infrastructure/docker/frontend.Dockerfile .

# 3. Optional ECR Tag & Push
if [ -n "$REGISTRY" ]; then
    echo ""
    echo "--> Tagging for AWS ECR Registry: ${REGISTRY}..."
    docker tag "${BACKEND_LOCAL_TAG}" "${REGISTRY}/homeverse-backend:${COMMIT_SHA}"
    docker tag "${BACKEND_LOCAL_TAG}" "${REGISTRY}/homeverse-backend:latest"
    docker tag "${FRONTEND_LOCAL_TAG}" "${REGISTRY}/homeverse-frontend:${COMMIT_SHA}"
    docker tag "${FRONTEND_LOCAL_TAG}" "${REGISTRY}/homeverse-frontend:latest"

    if [ "$PUSH_FLAG" == "--push" ]; then
        echo "--> Pushing images to AWS ECR..."
        docker push "${REGISTRY}/homeverse-backend:${COMMIT_SHA}"
        docker push "${REGISTRY}/homeverse-backend:latest"
        docker push "${REGISTRY}/homeverse-frontend:${COMMIT_SHA}"
        docker push "${REGISTRY}/homeverse-frontend:latest"
        echo "--> ECR Push completed successfully."
    else
        echo "--> Run with '--push' flag to publish images to AWS ECR."
    fi
fi

echo ""
echo "======================================================"
echo " Docker images built successfully!"
echo " - ${BACKEND_LOCAL_TAG}"
echo " - ${FRONTEND_LOCAL_TAG}"
echo "======================================================"

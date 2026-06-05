#!/usr/bin/env bash
#
# Deploy Notion Crafts to AWS (S3 + CloudFront).
#
#   ./deploy.sh            build, upload, and invalidate the CDN
#   ./deploy.sh --no-build skip `npm run build` (deploy whatever is in dist/)
#   ./deploy.sh --dry-run  show what would change without uploading
#
set -euo pipefail

# ---- config -----------------------------------------------------------------
AWS_PROFILE="${AWS_PROFILE:-dhiraj-aws-acct}"
BUCKET="notioncrafts-web"
DISTRIBUTION_ID="EA3NYFPNNXPHL"
DIST_DIR="dist"
SITE_URL="https://notioncrafts.com"
# -----------------------------------------------------------------------------

cd "$(dirname "$0")"

BUILD=1
DRY_RUN=""
for arg in "$@"; do
  case "$arg" in
    --no-build) BUILD=0 ;;
    --dry-run)  DRY_RUN="--dryrun" ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//' | sed -n '2,8p'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

aws_() { aws --profile "$AWS_PROFILE" "$@"; }

echo "▶ Verifying AWS credentials (profile: $AWS_PROFILE)…"
aws_ sts get-caller-identity --query Arn --output text

if [[ "$BUILD" == "1" ]]; then
  echo "▶ Building site…"
  npm run build
else
  echo "▶ Skipping build (--no-build)."
fi

if [[ ! -d "$DIST_DIR" ]]; then
  echo "✗ $DIST_DIR/ not found — run without --no-build." >&2
  exit 1
fi

# Hashed/static assets: cache hard for a year (filenames are content-hashed).
echo "▶ Uploading immutable assets…"
aws_ s3 sync "$DIST_DIR" "s3://$BUCKET" --delete $DRY_RUN \
  --exclude "*.html" --exclude "*.xml" --exclude "*.txt" \
  --cache-control "public,max-age=31536000,immutable"

# HTML / sitemap / robots: always revalidate so deploys go live immediately.
echo "▶ Uploading HTML (no-cache)…"
aws_ s3 sync "$DIST_DIR" "s3://$BUCKET" $DRY_RUN \
  --exclude "*" --include "*.html" --include "*.xml" --include "*.txt" \
  --cache-control "public,max-age=0,must-revalidate" \
  --content-type "text/html; charset=utf-8"

if [[ -n "$DRY_RUN" ]]; then
  echo "✓ Dry run complete — nothing uploaded, CDN not invalidated."
  exit 0
fi

echo "▶ Invalidating CloudFront cache…"
INVALIDATION_ID=$(aws_ cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" --paths "/*" \
  --query "Invalidation.Id" --output text)
echo "  invalidation: $INVALIDATION_ID"

echo
echo "✓ Deployed → $SITE_URL"
echo "  (CDN invalidation usually completes within a minute or two.)"

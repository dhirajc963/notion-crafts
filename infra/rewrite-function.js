// CloudFront Function (runtime: cloudfront-js-2.0)
// Directory-index rewrite for the static S3 (REST/OAC) origin, which — unlike an
// S3 website endpoint — does NOT resolve index.html for subpaths. Maps:
//   /e/clock/      -> /e/clock/index.html
//   /e/clock       -> /e/clock/index.html   (extensionless)
//   /              -> /index.html
// Files with an extension (/_astro/app.js, /favicon.svg) pass through untouched.
// The /i/* icon route has its own behavior+function, so it never reaches this.

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
    // no '.' in the final path segment -> treat as a directory
    request.uri = uri + '/index.html';
  }
  return request;
}

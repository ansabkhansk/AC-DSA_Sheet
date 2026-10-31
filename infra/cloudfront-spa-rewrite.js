/**
 * CloudFront Function (viewer-request) for the default S3 origin behaviour only.
 * Rewrites SPA deep links to /index.html so /calendar and /sheet/* reload correctly.
 * Do NOT attach this to the /api/* behaviour (risk R1 in PROJECT_PLAN.md).
 *
 * Create in AWS Console → CloudFront → Functions, then associate with the
 * Default (*) behaviour (viewer-request). Publishing creates a chargeable
 * CloudFront Function invocation cost (free tier usually covers demo traffic).
 */
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.indexOf('.') === -1) {
    request.uri = '/index.html';
  }

  return request;
}

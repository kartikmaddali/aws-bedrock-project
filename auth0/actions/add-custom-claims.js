/**
 * Auth0 Action — Post-Login: inject HVAC Copilot custom claims.
 * -----------------------------------------------------------------------------
 * Where this runs: Auth0 Dashboard → Actions → Library → Build Custom →
 *   Trigger: "Login / Post Login". Paste this file's contents, then drag the
 *   Action into the Login flow (Actions → Flows → Login) and Deploy.
 *
 * What it does: copies the corporate identity (organization + service tier)
 * onto BOTH the ID token and the Access token using the namespaced claim keys
 * the app reads (see lib/types.ts -> ORG_CLAIM / TIER_CLAIM).
 *
 * IMPORTANT (demo note): the namespace below is a non-routable `.demo` URI used
 * purely as a unique claim identifier. Auth0 never fetches it. It is NOT a real
 * domain and implies no affiliation with any company. If you fork this for a
 * real tenant, change the namespace to a domain you control and keep it in sync
 * with ORG_CLAIM / TIER_CLAIM in the app.
 */

// Must match lib/types.ts exactly.
const NAMESPACE = "https://hvac-copilot.demo";
const ORG_CLAIM = `${NAMESPACE}/org`;
const TIER_CLAIM = `${NAMESPACE}/tier`;

/**
 * @param {Event} event - Details about the user and the login request.
 * @param {PostLoginAPI} api - Interface to affect the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Resolve org + tier. Prefer values stored on app_metadata (set by an admin
  // or a provisioning script); fall back to demo defaults so the storyline
  // always has the claims it expects.
  const meta = event.user.app_metadata || {};
  const org = meta.org || "Apex Cooling LLC";
  const tier = meta.tier || "Platinum";

  // Put the claims on the ID token (so the client/session sees them) and the
  // Access token (so the resource server / Bedrock tools can authorize on them).
  api.idToken.setCustomClaim(ORG_CLAIM, org);
  api.idToken.setCustomClaim(TIER_CLAIM, tier);
  api.accessToken.setCustomClaim(ORG_CLAIM, org);
  api.accessToken.setCustomClaim(TIER_CLAIM, tier);
};

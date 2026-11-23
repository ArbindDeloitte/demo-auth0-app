/**
 * Auth0 Action: Post User Registration
 * Writes given_name, family_name and name to the root of the user profile
 * (Management API) and removes the transient app_metadata.pending_name.
 *
 * Dependency: auth0 (v4.x)
 * Secrets:    DOMAIN, CLIENT_ID, CLIENT_SECRET (M2M app with update:users)
 */

const { ManagementClient } = require('auth0');

// Overridable for tests
exports._createClient = (event) =>
  new ManagementClient({
    domain: event.secrets.DOMAIN,
    clientId: event.secrets.CLIENT_ID,
    clientSecret: event.secrets.CLIENT_SECRET,
  });

exports.onExecutePostUserRegistration = async (event) => {
  const pending = (event.user.app_metadata || {}).pending_name;
  if (!pending) return;

  const given = pending.given_name || '';
  const family = pending.family_name || '';

  try {
    await exports._createClient(event).users.update(
      event.user.user_id,
      {
        given_name: given,
        family_name: family,
        name: `${given} ${family}`.trim(),
        app_metadata: { pending_name: null }, // null removes the key
      }
    );
  } catch (err) {
    // Registration already succeeded; log instead of failing it.
    console.error(`post-user-registration failed for ${event.user.user_id}: ${err.message}`);
  }
};

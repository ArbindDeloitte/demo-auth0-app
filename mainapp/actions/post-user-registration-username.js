/**
 * Auth0 Action: Post User Registration - set username = Auth0 user id
 *
 * Copies the user's id (without the "auth0|" connection prefix) into `username`.
 *
 * Prerequisites on the database connection:
 *   - "Requires Username" is enabled (otherwise Auth0 ignores/rejects username)
 *   - Maximum username length is raised to at least 24 (default max is 15,
 *     and the generated id is 24 characters)
 *
 * Username can't be updated in the same Management API call as metadata
 * (Auth0 restriction), so this is its own call / its own Action.
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
  const userId = event.user.user_id;
  if (!userId) return;

  // "auth0|65f0..." -> "65f0..." ("|" is not an allowed username character)
  const username = String(userId).split('|').pop();
  if (!username || event.user.username === username) return;

  try {
    // The Management API needs the full prefixed id
    const fullId = String(userId).includes('|') ? userId : `auth0|${userId}`;
    await exports._createClient(event).users.update(fullId, { username });
  } catch (err) {
    // Registration already succeeded; log instead of failing it.
    console.error(`post-user-registration-username failed for ${userId}: ${err.message}`);
  }
};

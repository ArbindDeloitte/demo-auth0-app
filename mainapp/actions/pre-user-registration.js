/**
 * Auth0 Action: Pre User Registration
 * Validates the signup form, stores preferences in user_metadata, and
 * hands the names to the Post User Registration Action via a transient
 * app_metadata.pending_name.
 *
 * The signup HTML inputs must carry these `name` attributes (Auth0 only
 * forwards inputs whose name starts with `ulp-`; ids are not posted).
 */

const FIELDS = {
  firstName: ['ulp-first-name'],
  lastName: ['ulp-last-name'],
  comms: ['ulp-comms'],
  terms: ['ulp-tc'],
  lang: ['ulp-lang'],
};

const DEFAULT_LANGUAGE = 'en';
const ALLOWED_LANGUAGES = ['en', 'es', 'zh', 'ko', 'hy', 'tl', 'vi']; // extend as needed
const MAX_NAME_LENGTH = 100;

const pick = (body, keys) => {
  for (const k of keys) {
    if (body[k] !== undefined && body[k] !== null) {
      return Array.isArray(body[k]) ? body[k][body[k].length - 1] : body[k];
    }
  }
  return undefined;
};

// Checkboxes post "on"/"true"/"1"; unchecked ones are absent.
const toBool = (v) => ['true', 'on', '1', 'yes'].includes(String(v).toLowerCase());

const cleanName = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');

exports.onExecutePreUserRegistration = async (event, api) => {
  const body = (event.request && event.request.body) || {};

  // TEMPORARY DIAGNOSTIC: logs field NAMES only (never values; body has the password). Remove once FIELDS is confirmed.
  console.log('pre-user-registration body keys:', JSON.stringify(Object.keys(body)));
  Object.keys(body)
    .filter((k) => k.startsWith('ulp-') && !/pass/i.test(k))
    .forEach((k) =>
      console.log('pre-user-registration', k, 'type=' + typeof body[k], 'value=', JSON.stringify(body[k]).slice(0, 500))
    );

  const first = cleanName(pick(body, FIELDS.firstName));
  const last = cleanName(pick(body, FIELDS.lastName));
  const termsAccepted = toBool(pick(body, FIELDS.terms));
  const commsOptIn = toBool(pick(body, FIELDS.comms));
  let language = String(pick(body, FIELDS.lang) || '').trim().toLowerCase();

  if (!first || first.length > MAX_NAME_LENGTH) {
    return api.validation.error('invalid_first_name', 'First name cannot be blank.');
  }
  if (!last || last.length > MAX_NAME_LENGTH) {
    return api.validation.error('invalid_last_name', 'Last name cannot be blank.');
  }
  if (!termsAccepted) {
    return api.validation.error(
      'terms_not_accepted',
      'You must accept the Terms and Conditions to sign up.'
    );
  }
  if (!ALLOWED_LANGUAGES.includes(language)) language = DEFAULT_LANGUAGE;

  api.user.setUserMetadata('communication_preference', commsOptIn);
  api.user.setUserMetadata('terms_accepted', true);
  api.user.setUserMetadata('terms_accepted_at', new Date().toISOString());
  api.user.setUserMetadata('language', language);

  // Transient hand-off; removed by the Post User Registration Action
  api.user.setAppMetadata('pending_name', { given_name: first, family_name: last });
};

const assert = require('assert');
const Module = require('module');
const origLoad = Module._load;
Module._load = function (req, ...rest) {
  return req === 'auth0' ? { ManagementClient: function () {} } : origLoad.call(this, req, ...rest);
};
const pre = require('./pre-user-registration');
const post = require('./post-user-registration');

const mkPre = (body) => {
  const md = {}, am = {}; let err = null;
  const api = {
    user: { setUserMetadata: (k, v) => { md[k] = v; }, setAppMetadata: (k, v) => { am[k] = v; } },
    validation: { error: (code, msg) => { err = { code, msg }; } },
  };
  return { event: { request: { body } }, api, md, am, get err() { return err; } };
};

(async () => {
  let t = mkPre({ 'ulp-first-name': '  Ada ', 'ulp-last-name': 'Lovelace', 'ulp-tc': 'on', 'ulp-comms': 'on', 'ulp-lang': 'ES' });
  await pre.onExecutePreUserRegistration(t.event, t.api);
  assert.strictEqual(t.err, null);
  assert.deepStrictEqual(Object.keys(t.md).sort(), ['communication_preference', 'language', 'terms_accepted', 'terms_accepted_at']);
  assert.strictEqual(t.md.communication_preference, true);
  assert.strictEqual(t.md.language, 'es');
  assert.ok(!isNaN(Date.parse(t.md.terms_accepted_at)));
  assert.deepStrictEqual(t.am.pending_name, { given_name: 'Ada', family_name: 'Lovelace' });

  t = mkPre({ 'ulp-first-name': 'A', 'ulp-last-name': 'B', 'ulp-tc': ['false', 'true'], 'ulp-lang': 'xx' });
  await pre.onExecutePreUserRegistration(t.event, t.api);
  assert.strictEqual(t.md.communication_preference, false);
  assert.strictEqual(t.md.language, 'en');

  t = mkPre({ 'ulp-first-name': '   ', 'ulp-last-name': 'B', 'ulp-tc': 'on' });
  await pre.onExecutePreUserRegistration(t.event, t.api);
  assert.strictEqual(t.err.code, 'invalid_first_name'); assert.deepStrictEqual(t.md, {});

  t = mkPre({ 'ulp-first-name': 'A', 'ulp-tc': 'on' });
  await pre.onExecutePreUserRegistration(t.event, t.api);
  assert.strictEqual(t.err.code, 'invalid_last_name');

  t = mkPre({ 'ulp-first-name': 'A', 'ulp-last-name': 'B' });
  await pre.onExecutePreUserRegistration(t.event, t.api);
  assert.strictEqual(t.err.code, 'terms_not_accepted'); assert.deepStrictEqual(t.md, {});

  t = mkPre(undefined);
  await pre.onExecutePreUserRegistration(t.event, t.api);
  assert.strictEqual(t.err.code, 'invalid_first_name');

  const calls = [];
  post._createClient = () => ({ users: { update: async (...a) => { calls.push(a); } } });
  await post.onExecutePostUserRegistration({ secrets: {}, user: { user_id: 'auth0|1', app_metadata: { pending_name: { given_name: 'Ada', family_name: 'Lovelace' } } } });
  assert.strictEqual(calls[0][0], 'auth0|1');
  assert.deepStrictEqual(calls[0][1], { given_name: 'Ada', family_name: 'Lovelace', name: 'Ada Lovelace', app_metadata: { pending_name: null } });

  calls.length = 0;
  await post.onExecutePostUserRegistration({ secrets: {}, user: { user_id: 'x' } });
  assert.strictEqual(calls.length, 0);

  post._createClient = () => ({ users: { update: async () => { throw new Error('boom'); } } });
  const orig = console.error; let logged = '';
  console.error = (m) => { logged = m; };
  await post.onExecutePostUserRegistration({ secrets: {}, user: { user_id: 'x', app_metadata: { pending_name: { given_name: 'A', family_name: 'B' } } } });
  console.error = orig;
  assert.ok(logged.includes('boom'));

  console.log('All tests passed');
})().catch((e) => { console.error(e); process.exit(1); });

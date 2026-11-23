const assert = require('assert');
const Module = require('module');
const origLoad = Module._load;
Module._load = function (req, ...rest) {
  return req === 'auth0' ? { ManagementClient: function () {} } : origLoad.call(this, req, ...rest);
};
const a = require('./post-user-registration-username');

(async () => {
  const calls = [];
  a._createClient = () => ({ users: { update: async (...x) => { calls.push(x); } } });

  await a.onExecutePostUserRegistration({ secrets: {}, user: { user_id: 'auth0|65f0abc' } });
  assert.deepStrictEqual(calls[0], ['auth0|65f0abc', { username: '65f0abc' }]);

  calls.length = 0; // raw id without prefix
  await a.onExecutePostUserRegistration({ secrets: {}, user: { user_id: '65f0abc' } });
  assert.deepStrictEqual(calls[0], ['auth0|65f0abc', { username: '65f0abc' }]);

  calls.length = 0; // already set
  await a.onExecutePostUserRegistration({ secrets: {}, user: { user_id: 'auth0|1', username: '1' } });
  assert.strictEqual(calls.length, 0);

  a._createClient = () => ({ users: { update: async () => { throw new Error('boom'); } } });
  const orig = console.error; let logged = '';
  console.error = (m) => { logged = m; };
  await a.onExecutePostUserRegistration({ secrets: {}, user: { user_id: 'auth0|1' } });
  console.error = orig;
  assert.ok(logged.includes('boom'));

  console.log('All tests passed');
})().catch((e) => { console.error(e); process.exit(1); });

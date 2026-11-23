const assert = require('assert');
const Module = require('module');
const origLoad = Module._load;
let transportOpts = null;
Module._load = function (req, ...rest) {
  return req === 'nodemailer'
    ? { createTransport: (o) => { transportOpts = o; return { sendMail: async () => {} }; } }
    : origLoad.call(this, req, ...rest);
};
const a = require('./post-change-password');

const mkEvent = (over = {}) => ({
  secrets: { SMTP_HOST: 'smtp.x.com', SMTP_PORT: '587', SMTP_Username: 'u', SMTP_User_Password: 'p', MAIL_FROM: 'LADWP <no-reply@x.com>', SUPPORT_EMAIL: 'help@x.com' },
  user: { user_id: 'auth0|1', email: 'ada@x.com', given_name: 'Ada' },
  request: { ip: '1.2.3.4' },
  ...over,
});

(async () => {
  // message content
  const m = a.buildMessage(mkEvent());
  assert.strictEqual(m.to, 'ada@x.com');
  assert.strictEqual(m.from, 'LADWP <no-reply@x.com>');
  assert.ok(m.text.includes('Hello Ada,') && m.text.includes('1.2.3.4') && m.text.includes('help@x.com'));
  assert.ok(!/password\s*[:=]/i.test(m.text)); // no secrets/passwords in body

  // HTML escaping of user-controlled name
  const x = a.buildMessage(mkEvent({ user: { email: 'a@x.com', given_name: '<script>x</script>' } }));
  assert.ok(!x.html.includes('<script>'));

  // transport options: 587 -> STARTTLS, 465 -> implicit TLS
  a._createTransport({ ...mkEvent().secrets, SMTP_PORT: '587' });
  assert.strictEqual(transportOpts.secure, false);
  assert.strictEqual(transportOpts.requireTLS, true);
  a._createTransport({ ...mkEvent().secrets, SMTP_PORT: '465' });
  assert.strictEqual(transportOpts.secure, true);

  // sends exactly once
  const sent = [];
  a._createTransport = () => ({ sendMail: async (msg) => { sent.push(msg); } });
  await a.onExecutePostChangePassword(mkEvent(), {});
  assert.strictEqual(sent.length, 1);

  // no email -> no send
  sent.length = 0;
  await a.onExecutePostChangePassword(mkEvent({ user: { user_id: 'x' } }), {});
  assert.strictEqual(sent.length, 0);

  // SMTP failure must not throw, must not leak credentials
  a._createTransport = () => ({ sendMail: async () => { throw new Error('connect ECONNREFUSED'); } });
  const orig = console.error; let logged = '';
  console.error = (m) => { logged = m; };
  await a.onExecutePostChangePassword(mkEvent(), {});
  console.error = orig;
  assert.ok(logged.includes('ECONNREFUSED') && !logged.includes('p'.repeat(8)));

  console.log('All tests passed');
})().catch((e) => { console.error(e); process.exit(1); });

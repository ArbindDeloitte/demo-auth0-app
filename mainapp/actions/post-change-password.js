/**
 * Auth0 Action: Post Change Password
 * Sends a confirmation email over SMTP after a user successfully changes
 * their password.
 *
 * Dependency: nodemailer (v6.x)
 * Secrets:
 *   SMTP_HOST     e.g. smtp.office365.com
 *   SMTP_PORT     e.g. 587 (STARTTLS) or 465 (implicit TLS)
 *   SMTP_Username       SMTP login
 *   SMTP_User_Password  SMTP password / app password
 *   MAIL_FROM     e.g. "LADWP <no-reply@example.com>"
 *   SUPPORT_EMAIL (optional) shown in the "wasn't you" line
 */

const nodemailer = require('nodemailer');

const LOGO_CID = 'ladwp-logo';
// 96x96 PNG of the LADWP check-circle logo (shown at 48x48 for sharpness on HiDPI)
const LOGO_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAADj0lEQVR42u2dz7GjMAzGM1RACZSQElxCTpxdAiXkxJUSUgIlUAIlUAIlvN2DM8N6ZN4mli3ZfAfNzuxLCHw/W5L/iVsz9jeYnEEEAAAAGAAAAAwAAAAGAAAAAwAAgAHAP2aasR+asZ+asV+c/QTs/ffJfccAwOfWOfHOhP7UFnfNDgDCZplFD9nqfgsAmrFv//77bMZ+PxFsa8Z+dp97OLdi3HeP13n//8N9dnbfDV13d59rrwpgOBF+dq20Y3Jp1l3zDMRlABjnBqiWbhO3yNb9xhb4fVM7gCkQII1QQ6BizpTTLeXMbFai61slwX8nAvW9FgCGeMBZOvgRrmkmGsijdABWaav/pDfYUgFYIsjdCxh534kgbUsDYAmf2hY0R9MSMcuWAsAULv4ZhId2AHfPh5YqfgjCzu1GU97sVrj4x+faUjWqVIOsvZCA+23PnrQBMDlTN8EU9fiMRhOAzRtk1bqCNXsuVgWAp+d62ooBtJ4rekoD8G/IViw+5YqiGxxn618utJi+cPWC2BvZuYNSIWa4egFXV9wuJD6VeFgJAGtFvt9ENsA1N4DOy4lLznxeXzai1tOgywlgqCTvf0UOII/jgiEngKUC9/MiFovuEW5oyQkguutVID7lirMAMIVnP1ziU9mQyQGgZP/PLX50HIiddn5eXHx/NmDKAWBJuURXmPg3p8HXgTgWgLm4+H5MzALgpyAAqcWnFqOyAmgvLj41Is4KIPZcQOniR2siAeC4e+JVgfi30lyQL9CrcPFFXZCJ7AGcECTEFwnCHGkoNwQp8UXSUK6BGBcESfFFBmKcUxGxEKTFF5mK4J6M+xaCBvFFJuNSTEd/CkGL+CLT0akWZP4XgibxRRZkUi5J/gZBk/iiS5IpF2VCELSJL7oon3pbShs4Ta9JfNFtKTl2RoQgaDn8YTn2xWrfmpj8jFbJWxNzbc59Q9AkPlsqzjkKXBP7W01nztRsT8cBDeEDGn5KerUjSkPsNblubL3gIT0Wl4tjqpUcU6VOS+KgtkCtiLXCeECVKlBbrKO7QLGOTjOAmiqmUFMh7INNFGyqsGBTCMKOkmV5AdyIIngo2pcZABUTSipbmXz3d861UxRuFQRADdaOD4vSxZmDHIp3CwI46/ooXy8Q/J6/vGgBL3DI2CNyvsJERRamMRfHS3wU1vLBa6xgAAAAMAAAABgAAAAMAAAABgAAAAOA4u0PRoduyeZA0HQAAAAASUVORK5CYII=';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Overridable for tests
exports._createTransport = (secrets) => {
  const port = Number(secrets.SMTP_PORT) || 465;
  return nodemailer.createTransport({
    host: secrets.SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS; otherwise STARTTLS is negotiated
    requireTLS: port !== 465,
    auth: { user: secrets.SMTP_Username, pass: secrets.SMTP_User_Password },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
  });
};

exports.buildMessage = (event) => {
  const name = event.user.given_name || '';
  const when = new Date().toUTCString();
  const ip = event.request && event.request.ip;
  const support = event.secrets.SUPPORT_EMAIL;

  // Logo is embedded in the email (CID attachment), so no hosting or remote-image
  // loading is needed; mail clients like Outlook show it by default.
  const logo = `<p><img src="cid:${LOGO_CID}" width="48" height="48" alt="LADWP" style="display:block;border:0;"></p>`;

  const hello = name ? `Hello ${name},` : 'Hello,';
  const detail = `Your password was changed on ${when}${ip ? ` from IP address ${ip}` : ''}.`;
  const warn = `If you did not make this change, reset your password immediately${
    support ? ` and contact us at ${support}` : ''
  }.`;

  return {
    from: event.secrets.MAIL_FROM,
    to: event.user.email,
    subject: 'Your password was changed',
    text: [hello, '', detail, '', warn].join('\n'),
    html: `${logo}<p>${esc(hello)}</p><p>${esc(detail)}</p><p>${esc(warn)}</p>`,
    attachments: [
      {
        filename: 'logo.png',
        content: LOGO_PNG_BASE64,
        encoding: 'base64',
        cid: LOGO_CID,
        contentDisposition: 'inline',
      },
    ],
  };
};

exports.onExecutePostChangePassword = async (event, api) => {
  if (!event.user.email) return;

  try {
    await exports._createTransport(event.secrets).sendMail(exports.buildMessage(event));
  } catch (err) {
    // The password change already succeeded; log instead of failing the flow.
    // (Never log the SMTP credentials or message body.)
    console.error(`post-change-password email failed for ${event.user.user_id}: ${err.message}`);
  }
};

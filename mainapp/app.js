require('dotenv').config();


const express = require('express');
const { auth } = require('express-openid-connect');
const escape = require('escape-html');
const https = require('https');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


const app = express();


/* ==================================================
  Auth0 Configuration
  ================================================== */


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
 auth({
   authRequired: false,
   auth0Logout: true,


   secret: process.env.SECRET,
   baseURL: process.env.BASE_URL,
   clientID: process.env.CLIENT_ID,
   clientSecret: process.env.CLIENT_SECRET,
   issuerBaseURL: process.env.ISSUER_BASE_URL,


   authorizationParams: {
     response_type: 'code',
     audience: process.env.API_AUDIENCE,
     scope: 'openid profile email write:files read:files offline_access',
    //  scope: 'openid profile email write:authRocks delete:authRocks read:authRocks offline_access',
   },
 })
);


/* ==================================================
  HTML Layout
  ================================================== */


function page(content) {
 return `
<!DOCTYPE html>
<html lang="en">


<head>


 <meta charset="UTF-8">


 <meta
   name="viewport"
   content="width=device-width, initial-scale=1.0"
 >


 <title>Auth0 OIDC Demo</title>


 <style>
/* ==========================================
  JWT Status
  ========================================== */


.jwt-status {
 display: flex;


 align-items: center;


 gap: 15px;


 padding: 18px;


 border-radius: 14px;


 background:
   rgba(34,197,94,0.08);


 border:
   1px solid rgba(34,197,94,0.2);


 color: #d1fae5;
}


.jwt-status-icon {
 width: 38px;
 height: 38px;


 border-radius: 50%;


 display: flex;
 align-items: center;
 justify-content: center;


 background: #22c55e;


 color: white;


 font-weight: 700;
}


.jwt-status p {
 margin-top: 4px;


 color: #94a3b8;


 font-size: 13px;
}


.opaque-status {
 padding: 18px;


 border-radius: 14px;


 background:
   rgba(245,158,11,0.08);


 border:
   1px solid rgba(245,158,11,0.2);


 color: #fcd34d;


 font-size: 14px;
}




/* ==========================================
  Claims
  ========================================== */


.claims {
 display: grid;


 grid-template-columns:
   repeat(auto-fit, minmax(240px, 1fr));


 gap: 12px;
}


.claim {
 padding: 16px;


 border-radius: 12px;


 background:
   rgba(15,23,42,0.7);


 border:
   1px solid rgba(255,255,255,0.08);
}


.claim-name {
 color: #64748b;


 font-size: 12px;


 margin-bottom: 7px;


 font-weight: 600;
}


.claim-value {
 color: #e2e8f0;


 font-family:
   "SFMono-Regular",
   Consolas,
   monospace;


 font-size: 12px;


 word-break: break-word;


 line-height: 1.5;
}




/* ==========================================
  JWT Structure
  ========================================== */


.jwt-structure {
 display: flex;


 align-items: center;


 gap: 8px;


 padding: 20px;


 border-radius: 14px;


 background: #020617;


 border:
   1px solid rgba(255,255,255,0.08);


 font-family:
   "SFMono-Regular",
   Consolas,
   monospace;


 font-size: 13px;


 overflow-x: auto;
}


.jwt-header {
 color: #f87171;
}


.jwt-payload {
 color: #60a5fa;
}


.jwt-signature {
 color: #34d399;
}


.separator {
 color: #64748b;
}


.jwt-explanation {
 display: grid;


 grid-template-columns:
   repeat(auto-fit, minmax(200px, 1fr));


 gap: 12px;


 margin-top: 12px;
}


.jwt-explanation > div {
 padding: 15px;


 border-radius: 12px;


 background:
   rgba(255,255,255,0.04);


 color: #94a3b8;


 font-size: 12px;


 line-height: 1.5;
}


.jwt-explanation strong {
 color: #e2e8f0;
}




/* ==========================================
  Validation Warning
  ========================================== */


.validation-warning {
 margin-top: 25px;


 padding: 18px;


 border-radius: 14px;


 background:
   rgba(245,158,11,0.08);


 border:
   1px solid rgba(245,158,11,0.2);


 color: #fcd34d;


 font-size: 13px;


 line-height: 1.6;
}


   * {
     box-sizing: border-box;
     margin: 0;
     padding: 0;
   }


   body {
     font-family:
       Inter,
       -apple-system,
       BlinkMacSystemFont,
       "Segoe UI",
       sans-serif;


     min-height: 100vh;


     background:
       radial-gradient(
         circle at top left,
         #4f46e5 0,
         transparent 35%
       ),
       radial-gradient(
         circle at bottom right,
         #7c3aed 0,
         transparent 35%
       ),
       #0f172a;


     color: #f8fafc;


     display: flex;
     flex-direction: column;
   }


   /* ==============================
      Navigation
      ============================== */


   nav {
     height: 72px;


     padding: 0 6%;


     display: flex;
     align-items: center;
     justify-content: space-between;


     background: rgba(15, 23, 42, 0.65);


     border-bottom:
       1px solid rgba(255,255,255,0.08);


     backdrop-filter: blur(14px);
   }


   .brand {
     display: flex;
     align-items: center;
     gap: 12px;


     font-weight: 700;
     font-size: 18px;
   }


   .logo {
     width: 40px;
     height: 40px;


     border-radius: 11px;


     display: flex;
     align-items: center;
     justify-content: center;


     background:
       linear-gradient(
         135deg,
         #635bff,
         #8b5cf6
       );


     box-shadow:
       0 10px 30px
       rgba(99,91,255,0.35);


     font-size: 21px;
   }


   .protocol {
     display: flex;
     align-items: center;
     gap: 8px;


     color: #94a3b8;


     font-size: 13px;
   }


   .dot {
     width: 8px;
     height: 8px;


     background: #22c55e;


     border-radius: 50%;


     box-shadow:
       0 0 10px #22c55e;
   }


   /* ==============================
      Main
      ============================== */


   main {
     flex: 1;


     display: flex;
     justify-content: center;
     align-items: center;


     padding: 60px 20px;
   }


   /* ==============================
      Card
      ============================== */


   .card {
     width: 100%;
     max-width: 900px;


     padding: 42px;


     border-radius: 24px;


     background:
       rgba(255,255,255,0.07);


     border:
       1px solid rgba(255,255,255,0.12);


     box-shadow:
       0 30px 80px
       rgba(0,0,0,0.35);


     backdrop-filter: blur(20px);
   }


   .login-card {
     max-width: 460px;
   }


   /* ==============================
      Hero
      ============================== */


   .icon {
     width: 64px;
     height: 64px;


     border-radius: 18px;


     margin-bottom: 24px;


     display: flex;
     align-items: center;
     justify-content: center;


     background:
       linear-gradient(
         135deg,
         #635bff,
         #8b5cf6
       );


     font-size: 30px;


     box-shadow:
       0 15px 35px
       rgba(99,91,255,0.3);
   }


   h1 {
     font-size: 32px;


     margin-bottom: 12px;
   }


   .subtitle {
     color: #94a3b8;


     line-height: 1.6;


     margin-bottom: 30px;
   }


   /* ==============================
      Buttons
      ============================== */


   .button {
     width: 100%;


     display: flex;
     align-items: center;
     justify-content: center;


     padding: 15px 20px;


     border-radius: 12px;


     background: #635bff;


     color: white;


     text-decoration: none;


     font-weight: 600;


     border: none;


     cursor: pointer;


     transition:
       transform .2s,
       background .2s,
       box-shadow .2s;


     box-shadow:
       0 10px 30px
       rgba(99,91,255,0.35);
   }


   .button:hover {
     transform: translateY(-2px);


     background: #554df0;


     box-shadow:
       0 15px 35px
       rgba(99,91,255,0.5);
   }


   .secondary {
     background:
       rgba(255,255,255,0.07);


     border:
       1px solid rgba(255,255,255,0.12);


     box-shadow: none;
   }


   .secondary:hover {
     background:
       rgba(255,255,255,0.12);


     box-shadow: none;
   }


   /* ==============================
      Profile Header
      ============================== */


   .profile-header {
     display: flex;


     justify-content: space-between;


     align-items: center;


     margin-bottom: 32px;
   }


   .user {
     display: flex;
     align-items: center;
     gap: 18px;
   }


   .avatar {
     width: 64px;
     height: 64px;


     border-radius: 50%;


     display: flex;
     align-items: center;
     justify-content: center;


     background:
       linear-gradient(
         135deg,
         #635bff,
         #8b5cf6
       );


     font-size: 23px;


     font-weight: 700;
   }


   .user h1 {
     font-size: 25px;


     margin-bottom: 5px;
   }


   .authenticated {
     color: #22c55e;


     font-size: 13px;
   }


   .logout {
     color: #cbd5e1;


     text-decoration: none;


     padding: 10px 18px;


     border-radius: 10px;


     border:
       1px solid rgba(255,255,255,0.12);
   }


   .logout:hover {
     background:
       rgba(255,255,255,0.08);
   }


   /* ==============================
      Sections
      ============================== */


   .section {
     margin-top: 26px;
   }


   .section-title {
     display: flex;


     align-items: center;


     gap: 8px;


     margin-bottom: 12px;


     font-size: 16px;


     font-weight: 600;


     color: #cbd5e1;
   }


   /* ==============================
      Profile
      ============================== */


   pre {
     background: #020617;


     border:
       1px solid rgba(255,255,255,0.08);


     border-radius: 14px;


     padding: 20px;


     overflow-x: auto;


     color: #cbd5e1;


     font-size: 12px;


     line-height: 1.6;


     white-space: pre-wrap;


     word-break: break-word;
   }


   /* ==============================
      Access Token
      ============================== */


   .token-box {
     position: relative;


     background: #020617;


     border:
       1px solid rgba(99,91,255,0.35);


     border-radius: 14px;


     padding: 20px;


     margin-top: 10px;
   }


   .token-label {
     color: #818cf8;


     font-size: 12px;


     font-weight: 600;


     margin-bottom: 12px;


     text-transform: uppercase;


     letter-spacing: .08em;
   }


   .token {
     color: #e2e8f0;


     font-family:
       "SFMono-Regular",
       Consolas,
       monospace;


     font-size: 12px;


     line-height: 1.7;


     word-break: break-all;


     white-space: pre-wrap;


     padding-right: 10px;
   }


   .copy-button {
     margin-top: 16px;


     width: auto;


     padding: 9px 15px;


     font-size: 13px;
   }


   .warning {
     margin-top: 14px;


     padding: 13px 15px;


     border-radius: 10px;


     background:
       rgba(245,158,11,0.08);


     border:
       1px solid rgba(245,158,11,0.18);


     color: #fcd34d;


     font-size: 12px;


     line-height: 1.5;
   }


   /* ==============================
      Footer
      ============================== */


   footer {
     text-align: center;


     padding: 20px;


     color: #64748b;


     font-size: 12px;
   }


   /* ==============================
      Mobile
      ============================== */


   @media (max-width: 650px) {


     nav {
       padding: 0 20px;
     }


     .protocol {
       display: none;
     }


     .card {
       padding: 28px 22px;
     }


     .profile-header {
       align-items: flex-start;


       flex-direction: column;


       gap: 20px;
     }


     .logout {
       width: 100%;


       text-align: center;
     }


   }


 </style>


</head>


<body>


 <nav>


   <div class="brand">


     <div class="logo">
       🔐
     </div>


     <span>
       Auth0 OIDC Demo
     </span>


   </div>


   <div class="protocol">


     <span class="dot"></span>


     OAuth 2.0 / OpenID Connect


   </div>


 </nav>


 <main>


   ${content}


 </main>


 <footer>


   Auth0 → Authorization Code Flow → Node.js


 </footer>


</body>


</html>
`;
}


/* ==================================================
  Signup
  ================================================== */


app.get('/signup', (req, res) =>
 res.oidc.login({
   returnTo: '/',
   authorizationParams: {
     screen_hint: 'signup',
   },
 })
);


/* ==================================================
  Decode JWT for demonstration
  ================================================== */


function decodeJwt(token) {
 try {
   const parts = token.split('.');


   // JWT should have:
   // header.payload.signature
   if (parts.length !== 3) {
     return null;
   }


   const decodeBase64Url = (value) => {
     return Buffer
       .from(
         value
           .replace(/-/g, '+')
           .replace(/_/g, '/'),
         'base64'
       )
       .toString('utf8');
   };


   const header = JSON.parse(
     decodeBase64Url(parts[0])
   );


   const payload = JSON.parse(
     decodeBase64Url(parts[1])
   );


   return {
     header,
     payload
   };


 } catch (error) {


   console.error(
     'Unable to decode JWT:',
     error.message
   );


   return null;
 }
}
/* ==================================================
  Auth0 Management API Helpers
  ================================================== */


function httpsPost(hostname, path, headers, payload) {
 return new Promise((resolve, reject) => {
   const body = JSON.stringify(payload);
   const options = {
     hostname,
     path,
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Content-Length': Buffer.byteLength(body),
       ...headers
     }
   };
   const req = https.request(options, (res) => {
     let data = '';
     res.on('data', chunk => data += chunk);
     res.on('end', () => {
       try {
         resolve({ status: res.statusCode, body: JSON.parse(data) });
       } catch (e) {
         resolve({ status: res.statusCode, body: data });
       }
     });
   });
   req.on('error', reject);
   req.write(body);
   req.end();
 });
}


function httpsPatch(hostname, path, headers, payload) {
 return new Promise((resolve, reject) => {
   const body = JSON.stringify(payload);
   const options = {
     hostname,
     path,
     method: 'PATCH',
     headers: {
       'Content-Type': 'application/json',
       'Content-Length': Buffer.byteLength(body),
       ...headers
     }
   };
   const req = https.request(options, (res) => {
     let data = '';
     res.on('data', chunk => data += chunk);
     res.on('end', () => {
       try {
         resolve({ status: res.statusCode, body: JSON.parse(data) });
       } catch (e) {
         resolve({ status: res.statusCode, body: data });
       }
     });
   });
   req.on('error', reject);
   req.write(body);
   req.end();
 });
}


function mgmtDomain() {
 return process.env.AUTH0_TENANT_DOMAIN;
}


async function getManagementToken() {
 const domain = mgmtDomain();
 const result = await httpsPost(domain, '/oauth/token', {}, {
   grant_type: 'client_credentials',
   client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
   client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
   audience: `https://${domain}/api/v2/`
 });
 if (result.status !== 200 || !result.body.access_token) {
   throw new Error(result.body.error_description || result.body.error || 'Failed to get management token');
 }
 return result.body.access_token;
}


function httpsGet(hostname, path, headers) {
 return new Promise((resolve, reject) => {
   const options = { hostname, path, method: 'GET', headers };
   const req = https.request(options, (res) => {
     let data = '';
     res.on('data', chunk => data += chunk);
     res.on('end', () => {
       try {
         resolve({ status: res.statusCode, body: JSON.parse(data) });
       } catch (e) {
         resolve({ status: res.statusCode, body: data });
       }
     });
   });
   req.on('error', reject);
   req.end();
 });
}


async function getAuth0User(userId) {
 const token = await getManagementToken();
 const encodedId = encodeURIComponent(userId);
 const fields = 'email,given_name,family_name,nickname,username,user_metadata';
 const result = await httpsGet(
   mgmtDomain(),
   `/api/v2/users/${encodedId}?fields=${fields}`,
   { Authorization: `Bearer ${token}` }
 );
 if (result.status < 200 || result.status >= 300) {
   throw new Error(result.body.message || `Failed to fetch user (${result.status})`);
 }
 return result.body;
}


function generateOTP() {
 return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOTP(otp) {
 return crypto.createHash('sha256').update(otp + process.env.SECRET).digest('hex');
}

function encryptValue(text) {
 const iv = crypto.randomBytes(16);
 const key = crypto.scryptSync(process.env.SECRET, 'otp-salt', 32);
 const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
 const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
 return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptValue(data) {
 const [ivHex, encHex] = data.split(':');
 const key = crypto.scryptSync(process.env.SECRET, 'otp-salt', 32);
 const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
 return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString();
}

async function smtpTransport() {
 return nodemailer.createTransport({
   host: '127.0.0.1',
   port: 1025,
   secure: false,
   ignoreTLS: true
 });
}

async function sendEmailOTP(userId, email) {
 const otp = generateOTP();
 const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

 await updateAuth0User(userId, {
   user_metadata: {
     pending_email: email,
     pending_email_otp_hash: hashOTP(otp),
     pending_email_otp_expiry: expiry
   }
 });

 const transport = await smtpTransport();
 const info = await transport.sendMail({
   from: '"LADWP" <no-reply@ladwp.com>',
   to: email,
   subject: 'Your email verification code',
   html: `
     <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px">
       <h2 style="margin-bottom:8px">Verify your email</h2>
       <p style="color:#555;margin-bottom:24px">
         Use the code below to verify <strong>${email}</strong>.<br>
         It expires in <strong>10 minutes</strong>.
       </p>
       <div style="font-size:40px;font-weight:700;letter-spacing:12px;text-align:center;
                   padding:24px;background:#f4f4f8;border-radius:12px;margin-bottom:24px">
         ${otp}
       </div>
       <p style="color:#888;font-size:13px">If you didn't request this, ignore this email.</p>
     </div>
   `
 });

 // Log the Ethereal preview URL to the terminal so you can open and read the email
 console.log('\n========== OTP EMAIL PREVIEW ==========');
 console.log('To:     ', email);
 console.log('Code:   ', otp);
 console.log('Preview:', nodemailer.getTestMessageUrl(info));
 console.log('=======================================\n');
}

async function verifyEmailOTP(userId, email, otp) {
 const userData = await getAuth0User(userId);
 const meta = userData.user_metadata || {};

 if (meta.pending_email !== email) {
   throw new Error('Email mismatch — please restart the verification process.');
 }
 if (!meta.pending_email_otp_hash || !meta.pending_email_otp_expiry) {
   throw new Error('No pending verification found — please request a new code.');
 }
 if (Date.now() > meta.pending_email_otp_expiry) {
   throw new Error('Code has expired — please request a new one.');
 }
 if (hashOTP(otp) !== meta.pending_email_otp_hash) {
   throw new Error('Incorrect code — please try again.');
 }
}


async function updateAuth0User(userId, updates) {
 const token = await getManagementToken();
 const encodedId = encodeURIComponent(userId);
 const result = await httpsPatch(
   mgmtDomain(),
   `/api/v2/users/${encodedId}`,
   { Authorization: `Bearer ${token}` },
   updates
 );
 if (result.status < 200 || result.status >= 300) {
   throw new Error(result.body.message || result.body.error || `Update failed (${result.status})`);
 }
 return result.body;
}


/* ==================================================
  Home
  ================================================== */


app.get('/', (req, res) => {


 /* ==================================================
    Check authentication
    ================================================== */


 if (!req.oidc.isAuthenticated()) {


   return res.type('html').send(
     page(`


       <div class="card login-card">


         <div class="icon">
           🔐
         </div>


         <h1>
           Welcome
         </h1>


         <p class="subtitle">
           Sign in with Auth0 using OAuth 2.0
           Authorization Code Flow and
           OpenID Connect.
         </p>


         <a
           href="/login"
           class="button"
         >
           Continue with Auth0 →
         </a>


         <br>


         <a
           href="/signup"
           class="button secondary"
         >
           Create an account
         </a>


       </div>


     `)
   );
 }




 /* ==================================================
    Get user
    ================================================== */


 const user = req.oidc.user || {};


 const accessToken =
   req.oidc.accessToken?.access_token || '';




 /* ==================================================
    Decode Access Token
    ================================================== */


 const decodedToken =
   decodeJwt(accessToken);




 /* ==================================================
    User information
    ================================================== */


 const name =
   user.name ||
   user.email ||
   'Authenticated User';




 const initials =
   name
     .split(' ')
     .map(part => part[0])
     .join('')
     .substring(0, 2)
     .toUpperCase();




 /* ==================================================
    Token information
    ================================================== */


 let tokenHeader = null;
 let tokenPayload = null;


 if (decodedToken) {


   tokenHeader =
     decodedToken.header;


   tokenPayload =
     decodedToken.payload;


 }




 /* ==================================================
    Convert timestamps
    ================================================== */


 function formatTimestamp(timestamp) {


   if (!timestamp) {
     return 'Not available';
   }


   return new Date(
     timestamp * 1000
   ).toLocaleString();


 }




 /* ==================================================
    Console
    ================================================== */


 console.log(
   '===== ACCESS TOKEN ====='
 );


 console.log(accessToken);


 console.log(
   '===== JWT HEADER ====='
 );


 console.log(tokenHeader);


 console.log(
   '===== JWT PAYLOAD ====='
 );


 console.log(tokenPayload);


 console.log(
   '========================'
 );




 /* ==================================================
    Send UI
    ================================================== */


 res.type('html').send(
   page(`


     <div class="card">


       <!-- =========================================
            PROFILE HEADER
            ========================================= -->


       <div class="profile-header">


         <div class="user">


           <div class="avatar">
             ${escape(initials)}
           </div>


           <div>


             <h1>
               ${escape(name)}
             </h1>


             <div class="authenticated">
               ● Successfully authenticated
             </div>

             <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px">
               ${user.given_name || user.family_name ? `
                 <span style="font-size:12px;color:#94a3b8">
                   <span style="color:#64748b">Name:</span>
                   ${escape([user.given_name, user.family_name].filter(Boolean).join(' '))}
                 </span>` : ''}
               ${user.nickname ? `
                 <span style="font-size:12px;color:#94a3b8">
                   <span style="color:#64748b">·</span>
                   <span style="color:#64748b">Username:</span>
                   ${escape(user.nickname)}
                 </span>` : ''}
               ${user.email ? `
                 <span style="font-size:12px;color:#94a3b8">
                   <span style="color:#64748b">·</span>
                   <span style="color:#64748b">Email:</span>
                   ${escape(user.email)}
                 </span>` : ''}
             </div>


           </div>


         </div>




         <div style="display:flex;gap:10px;align-items:center">
           <a
             href="/profile/edit"
             class="logout"
             style="background:rgba(99,91,255,0.15);border-color:rgba(99,91,255,0.35)"
           >
             ✏️ Edit Profile
           </a>
           <a
             href="/logout"
             class="logout"
           >
             Log out
           </a>
         </div>


       </div>




       <!-- =========================================
            USER PROFILE
            ========================================= -->


       <div class="section">


         <div class="section-title">
           👤 User Profile
         </div>


         <pre>${escape(
           JSON.stringify(
             user,
             null,
             2
           )
         )}</pre>


       </div>




       <!-- =========================================
            ACCESS TOKEN
            ========================================= -->


       <div class="section">


         <div class="section-title">
           🔑 Access Token
         </div>


         <div class="token-box">


           <div class="token-label">
             OAuth 2.0 Bearer Token
           </div>


           <div
             id="accessToken"
             class="token"
           >${escape(
             accessToken ||
             'Access token not available'
           )}</div>




           ${
             accessToken
               ? `
                 <button
                   class="button copy-button"
                   onclick="copyToken()"
                 >
                   📋 Copy Access Token
                 </button>
               `
               : ''
           }


         </div>




         <div class="warning">


           ⚠️ Demo only — never expose access
           tokens in your production UI or logs.


         </div>


       </div>




       <!-- =========================================
            JWT DECODED
            ========================================= -->


       <div class="section">


         <div class="section-title">
           📦 Decoded JWT
         </div>




         ${
           decodedToken


             ? `


               <div class="jwt-status">


                 <div class="jwt-status-icon">
                   ✓
                 </div>


                 <div>


                   <strong>
                     This access token is a JWT
                   </strong>


                   <p>
                     The token contains a header,
                     payload, and signature.
                   </p>


                 </div>


               </div>


             `


             : `


               <div class="opaque-status">


                 🔒 This access token does not
                 appear to be a JWT.


                 <br><br>


                 It may be an opaque token and
                 cannot be decoded locally.


               </div>


             `
         }


       </div>




       ${
         decodedToken


           ? `


             <!-- =================================
                  JWT HEADER
                  ================================= -->


             <div class="section">


               <div class="section-title">


                 🧩 JWT Header


               </div>


               <pre>${escape(
                 JSON.stringify(
                   tokenHeader,
                   null,
                   2
                 )
               )}</pre>


             </div>




             <!-- =================================
                  JWT PAYLOAD
                  ================================= -->


             <div class="section">


               <div class="section-title">


                 📄 JWT Payload / Claims


               </div>


               <pre>${escape(
                 JSON.stringify(
                   tokenPayload,
                   null,
                   2
                 )
               )}</pre>


             </div>




             <!-- =================================
                  IMPORTANT CLAIMS
                  ================================= -->


             <div class="section">


               <div class="section-title">


                 🔍 Important Claims


               </div>




               <div class="claims">


                 <div class="claim">


                   <div class="claim-name">
                     Issuer (iss)
                   </div>


                   <div class="claim-value">
                     ${escape(
                       String(
                         tokenPayload.iss ||
                         'Not present'
                       )
                     )}
                   </div>


                 </div>




                 <div class="claim">


                   <div class="claim-name">
                     Subject (sub)
                   </div>


                   <div class="claim-value">
                     ${escape(
                       String(
                         tokenPayload.sub ||
                         'Not present'
                       )
                     )}
                   </div>


                 </div>




                 <div class="claim">


                   <div class="claim-name">
                     Audience (aud)
                   </div>


                   <div class="claim-value">
                     ${escape(
                       JSON.stringify(
                         tokenPayload.aud ||
                         'Not present'
                       )
                     )}
                   </div>


                 </div>




                 <div class="claim">


                   <div class="claim-name">
                     Scope
                   </div>


                   <div class="claim-value">
                     ${escape(
                       String(
                         tokenPayload.scope ||
                         'Not present'
                       )
                     )}
                   </div>


                 </div>




                 <div class="claim">


                   <div class="claim-name">
                     Client ID / Authorized Party
                   </div>


                   <div class="claim-value">
                     ${escape(
                       String(
                         tokenPayload.azp ||
                         tokenPayload.client_id ||
                         'Not present'
                       )
                     )}
                   </div>


                 </div>




                 <div class="claim">


                   <div class="claim-name">
                     Issued At (iat)
                   </div>


                   <div class="claim-value">


                     ${escape(
                       formatTimestamp(
                         tokenPayload.iat
                       )
                     )}


                   </div>


                 </div>




                 <div class="claim">


                   <div class="claim-name">
                     Expires At (exp)
                   </div>


                   <div class="claim-value">


                     ${escape(
                       formatTimestamp(
                         tokenPayload.exp
                       )
                     )}


                   </div>


                 </div>




                 ${
                   tokenPayload.permissions


                     ? `


                       <div class="claim">


                         <div class="claim-name">
                           Permissions
                         </div>


                         <div class="claim-value">


                           ${escape(
                             JSON.stringify(
                               tokenPayload.permissions
                             )
                           )}


                         </div>


                       </div>


                     `


                     : ''
                 }


               </div>


             </div>




             <!-- =================================
                  TOKEN STRUCTURE
                  ================================= -->


             <div class="section">


               <div class="section-title">


                 🧱 JWT Structure


               </div>


               <div class="jwt-structure">


                 <span class="jwt-header">
                   HEADER
                 </span>


                 <span class="separator">
                   .
                 </span>


                 <span class="jwt-payload">
                   PAYLOAD
                 </span>


                 <span class="separator">
                   .
                 </span>


                 <span class="jwt-signature">
                   SIGNATURE
                 </span>


               </div>


               <div class="jwt-explanation">


                 <div>
                   <strong>Header</strong>
                   <br>
                   Algorithm and token type.
                 </div>


                 <div>
                   <strong>Payload</strong>
                   <br>
                   Claims such as iss, sub,
                   aud, scope and exp.
                 </div>


                 <div>
                   <strong>Signature</strong>
                   <br>
                   Used to verify that the
                   token was not modified.
                 </div>


               </div>


             </div>


           `


           : ''
       }




       <!-- =========================================
            VALIDATION WARNING
            ========================================= -->


       ${
         decodedToken


           ? `


             <div class="validation-warning">


               <strong>
                 ⚠️ Decode ≠ Validate
               </strong>


               <br><br>


               The values above are decoded from
               the JWT. Decoding does NOT prove
               that the token was issued by Auth0
               or that its signature is valid.


               Your API should validate the JWT
               signature, issuer, audience,
               expiration and required scopes.


             </div>


           `


           : ''
       }


     </div>




     <!-- =========================================
          COPY SCRIPT
          ========================================= -->


     <script>


       function copyToken() {


         const token =
           document.getElementById(
             'accessToken'
           ).innerText;


         navigator.clipboard
           .writeText(token)
           .then(() => {


             alert(
               'Access token copied!'
             );


           })
           .catch(() => {


             alert(
               'Unable to copy token.'
             );


           });


       }


     </script>


   `)
 );


});


/* ==================================================
  Edit Profile Page
  ================================================== */


app.get('/profile/edit', async (req, res) => {
 if (!req.oidc.isAuthenticated()) {
   return res.redirect('/login');
 }

 const sessionUser = req.oidc.user || {};

 let freshUser = { ...sessionUser };
 try {
   const apiUser = await getAuth0User(sessionUser.sub);
   freshUser = { ...sessionUser, ...apiUser };
 } catch (err) {
   console.error('Failed to fetch user from Management API:', err.message);
 }

 const mfaEnabled = (freshUser.user_metadata || {}).enableMFA === true;

 const flash = req.query.success
   ? `<div class="flash flash-success">✓ ${escape(req.query.success)}</div>`
   : req.query.error
   ? `<div class="flash flash-error">✗ ${escape(req.query.error)}</div>`
   : '';

 res.type('html').send(page(`
   <style>
     .form-section { margin-top: 28px; }
     .form-group { margin-bottom: 18px; }
     .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
     label { display: block; color: #94a3b8; font-size: 13px; font-weight: 600; margin-bottom: 7px; }
     input[type="email"], input[type="password"], input[type="text"] {
       width: 100%; padding: 12px 16px; border-radius: 10px;
       background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.12);
       color: #e2e8f0; font-size: 14px; outline: none; box-sizing: border-box;
     }
     input[type="email"]:focus, input[type="password"]:focus, input[type="text"]:focus {
       border-color: #635bff; box-shadow: 0 0 0 3px rgba(99,91,255,0.2);
     }
     .divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 28px 0; }
     .back-link { display: inline-flex; align-items: center; gap: 6px; color: #94a3b8;
       text-decoration: none; font-size: 13px; margin-bottom: 24px; }
     .back-link:hover { color: #e2e8f0; }
     .flash { padding: 14px 18px; border-radius: 10px; font-size: 13px; margin-bottom: 20px; }
     .flash-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); color: #86efac; }
     .flash-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; }
     .submit-btn { margin-top: 6px; }
     .note { color: #64748b; font-size: 12px; margin-top: 6px; }
     @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }
   </style>

   <div class="card" style="max-width:560px">
     <a href="/" class="back-link">← Back to profile</a>
     <div class="icon" style="margin-bottom:16px">✏️</div>
     <h1 style="font-size:24px;margin-bottom:8px">Edit Profile</h1>
     <p class="subtitle" style="margin-bottom:24px">Update your name, email, or password.</p>

     ${flash}

     <!-- Update Profile Info -->
     <div class="form-section">
       <div class="section-title">👤 Profile Information</div>
       <form method="POST" action="/profile/update-info">
         <div class="form-row">
           <div class="form-group">
             <label for="given_name">First Name</label>
             <input type="text" id="given_name" name="given_name"
               value="${escape(freshUser.given_name || '')}" autocomplete="given-name" placeholder="First name">
           </div>
           <div class="form-group">
             <label for="family_name">Last Name</label>
             <input type="text" id="family_name" name="family_name"
               value="${escape(freshUser.family_name || '')}" autocomplete="family-name" placeholder="Last name">
           </div>
         </div>
         <div class="form-group">
           <label>Username <span style="color:#64748b;font-size:11px;font-weight:400">(assigned by system · read-only)</span></label>
           <div style="padding:12px 16px;border-radius:10px;background:rgba(15,23,42,0.4);
                       border:1px solid rgba(255,255,255,0.06);color:#64748b;font-size:14px;
                       display:flex;align-items:center;gap:8px">
             <span style="color:#475569">@</span>
             ${escape(freshUser.username || '—')}
           </div>
         </div>
         <div class="form-group">
           <label for="nickname">Nickname</label>
           <input type="text" id="nickname" name="nickname"
             value="${escape(freshUser.nickname || '')}" autocomplete="off" placeholder="Nickname">
         </div>
         <button type="submit" class="button submit-btn">Save Profile Info</button>
       </form>
     </div>

     <hr class="divider">

     <!-- Update Email -->
     <div class="form-section">
       <div class="section-title">📧 Update Email</div>
       <form method="POST" action="/profile/update-email">
         <div class="form-group">
           <label for="email">New Email Address</label>
           <input type="email" id="email" name="email"
             value="${escape(freshUser.email || '')}" required autocomplete="email">
         </div>
         <button type="submit" class="button submit-btn">Update Email</button>
       </form>
     </div>

     <hr class="divider">

     <!-- Update Password -->
     <div class="form-section">
       <div class="section-title">🔒 Update Password</div>
       <form method="POST" action="/profile/update-password">
         <div class="form-group">
           <label for="password">New Password</label>
           <input type="password" id="password" name="password"
             minlength="8" required autocomplete="new-password"
             placeholder="Minimum 8 characters">
         </div>
         <div class="form-group">
           <label for="confirm_password">Confirm New Password</label>
           <input type="password" id="confirm_password" name="confirm_password"
             minlength="8" required autocomplete="new-password"
             placeholder="Re-enter new password">
         </div>
         <p class="note">Password must be at least 8 characters and include uppercase, lowercase, and a number.</p>
         <button type="submit" class="button submit-btn">Update Password</button>
       </form>
     </div>

     <hr class="divider">

     <!-- MFA Toggle -->
     <div class="form-section">
       <div class="section-title">🔐 Multi-Factor Authentication</div>
       <div style="display:flex;align-items:center;justify-content:space-between;
                   padding:18px;border-radius:12px;
                   background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.08);">
         <div>
           <div style="color:#e2e8f0;font-size:14px;font-weight:600;margin-bottom:4px">
             MFA is currently
             <span style="color:${mfaEnabled ? '#22c55e' : '#f87171'}">
               ${mfaEnabled ? 'enabled' : 'disabled'}
             </span>
           </div>
           <div style="color:#64748b;font-size:12px">
             ${mfaEnabled
               ? 'You will be prompted for a second factor on each login.'
               : 'Enable to require a second factor on each login.'}
           </div>
         </div>
         <form method="POST" action="/profile/toggle-mfa" style="margin:0">
           <input type="hidden" name="enableMFA" value="${mfaEnabled ? 'false' : 'true'}">
           <button type="submit" class="button" style="
             width:auto;padding:10px 20px;font-size:13px;
             background:${mfaEnabled
               ? 'rgba(239,68,68,0.15)'
               : 'rgba(34,197,94,0.15)'};
             border:1px solid ${mfaEnabled
               ? 'rgba(239,68,68,0.35)'
               : 'rgba(34,197,94,0.35)'};
             color:${mfaEnabled ? '#fca5a5' : '#86efac'};
             box-shadow:none">
             ${mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
           </button>
         </form>
       </div>
       <p class="note" style="margin-top:10px">
         ⚠️ Changes apply on your next login session.
       </p>
     </div>
   </div>
 `));
});


/* ==================================================
  Update Profile Info
  ================================================== */


app.post('/profile/update-info', async (req, res) => {
 if (!req.oidc.isAuthenticated()) {
   return res.redirect('/login');
 }

 const { given_name, family_name, nickname } = req.body;
 const userId = req.oidc.user.sub;

 const updates = {};
 if (given_name !== undefined) updates.given_name = given_name.trim();
 if (family_name !== undefined) updates.family_name = family_name.trim();
 if (nickname !== undefined) updates.nickname = nickname.trim();

 const firstName = updates.given_name !== undefined ? updates.given_name : (req.oidc.user.given_name || '');
 const lastName = updates.family_name !== undefined ? updates.family_name : (req.oidc.user.family_name || '');
 const fullName = [firstName, lastName].filter(Boolean).join(' ');
 if (fullName) updates.name = fullName;

 try {
   await updateAuth0User(userId, updates);
   res.redirect('/profile/edit?success=Profile+information+updated+successfully');
 } catch (err) {
   console.error('Profile info update error:', err.message);
   res.redirect(`/profile/edit?error=${encodeURIComponent(err.message)}`);
 }
});


/* ==================================================
  Update Email
  ================================================== */


app.post('/profile/update-email', async (req, res) => {
 if (!req.oidc.isAuthenticated()) {
   return res.redirect('/login');
 }

 const { email } = req.body;
 const userId = req.oidc.user.sub;

 if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
   return res.redirect('/profile/edit?error=Invalid+email+address');
 }

 try {
   const currentUser = await getAuth0User(userId);
   const currentEmail = (currentUser.email || req.oidc.user.email || '').toLowerCase();
   console.log('[update-email] submitted:', email, '| current:', currentEmail);

   if (email.toLowerCase() === currentEmail) {
     return res.redirect('/profile/edit?error=This+is+already+your+current+email+address');
   }
 } catch (err) {
   console.error('Could not fetch current email for comparison:', err.message);
 }

 try {
   await sendEmailOTP(userId, email);
   res.redirect(`/profile/verify-email?email=${encodeURIComponent(email)}`);
 } catch (err) {
   console.error('Send OTP error:', err.message);
   res.redirect(`/profile/edit?error=${encodeURIComponent(err.message)}`);
 }
});


/* ==================================================
  Update Password
  ================================================== */


app.post('/profile/update-password', async (req, res) => {
 if (!req.oidc.isAuthenticated()) return res.redirect('/login');

 const { password, confirm_password } = req.body;
 const userId = req.oidc.user.sub;

 if (!password || password.length < 8) {
   return res.redirect('/profile/edit?error=Password+must+be+at+least+8+characters');
 }
 if (password !== confirm_password) {
   return res.redirect('/profile/edit?error=Passwords+do+not+match');
 }

 try {
   const currentUser = await getAuth0User(userId);
   const currentEmail = currentUser.email || req.oidc.user.email;

   const otp = generateOTP();
   const expiry = Date.now() + 10 * 60 * 1000;

   // Encrypt new password + store OTP hash in user_metadata
   await updateAuth0User(userId, {
     user_metadata: {
       pending_password_enc: encryptValue(password),
       pending_password_otp_hash: hashOTP(otp),
       pending_password_otp_expiry: expiry
     }
   });

   // Send OTP to current email
   const transport = await smtpTransport();
   const info = await transport.sendMail({
     from: '"LADWP" <no-reply@ladwp.com>',
     to: currentEmail,
     subject: 'Your password change verification code',
     html: `
       <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px">
         <h2 style="margin-bottom:8px">Password change request</h2>
         <p style="color:#555;margin-bottom:24px">
           Use the code below to confirm your password change.<br>
           It expires in <strong>10 minutes</strong>.
         </p>
         <div style="font-size:40px;font-weight:700;letter-spacing:12px;text-align:center;
                     padding:24px;background:#f4f4f8;border-radius:12px;margin-bottom:24px">
           ${otp}
         </div>
         <p style="color:#888;font-size:13px">If you didn't request this, ignore this email.</p>
       </div>
     `
   });

   console.log('\n========== PASSWORD OTP EMAIL PREVIEW ==========');
   console.log('To:     ', currentEmail);
   console.log('Code:   ', otp);
   console.log('Preview:', nodemailer.getTestMessageUrl(info));
   console.log('================================================\n');

   res.redirect(`/profile/verify-password?email=${encodeURIComponent(currentEmail)}`);
 } catch (err) {
   console.error('Password OTP send error:', err.message);
   res.redirect(`/profile/edit?error=${encodeURIComponent(err.message)}`);
 }
});


/* ==================================================
  Verify Email — OTP Page
  ================================================== */


app.get('/profile/verify-email', (req, res) => {
 if (!req.oidc.isAuthenticated()) return res.redirect('/login');

 const email = req.query.email || '';
 const flash = req.query.error
   ? `<div class="otp-flash otp-flash-error">✗ ${escape(req.query.error)}</div>`
   : '';

 res.type('html').send(page(`
   <style>
     .otp-card { max-width: 440px; text-align: center; }
     .otp-label { color: #94a3b8; font-size: 14px; margin: 8px 0 28px; line-height: 1.6; }
     .otp-email { color: #818cf8; font-weight: 600; }
     .otp-boxes { display: flex; gap: 10px; justify-content: center; margin-bottom: 24px; }
     .otp-box {
       width: 52px; height: 60px; border-radius: 12px; text-align: center;
       font-size: 26px; font-weight: 700; color: #e2e8f0;
       background: rgba(15,23,42,0.8); border: 2px solid rgba(255,255,255,0.12);
       outline: none; caret-color: #635bff;
     }
     .otp-box:focus { border-color: #635bff; box-shadow: 0 0 0 3px rgba(99,91,255,0.25); }
     .otp-box.filled { border-color: rgba(99,91,255,0.5); }
     .otp-flash { padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 20px; text-align: left; }
     .otp-flash-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
     .resend { background: none; border: none; color: #818cf8; font-size: 13px;
       cursor: pointer; text-decoration: underline; margin-top: 16px; }
     .resend:hover { color: #a5b4fc; }
     .back-link { display: inline-flex; align-items: center; gap: 6px; color: #94a3b8;
       text-decoration: none; font-size: 13px; margin-bottom: 24px; }
   </style>

   <div class="card otp-card">
     <a href="/profile/edit" class="back-link">← Back to Edit Profile</a>
     <div class="icon" style="margin:0 auto 20px">📬</div>
     <h1 style="font-size:24px;margin-bottom:10px">Verify Your Email</h1>
     <p class="otp-label">
       We sent a 6-digit code to<br>
       <span class="otp-email">${escape(email)}</span>.<br>
       Enter it below to verify your new address.
     </p>

     ${flash}

     <form method="POST" action="/profile/verify-email" id="otpForm">
       <input type="hidden" name="email" value="${escape(email)}">
       <input type="hidden" name="otp" id="otpHidden">
       <div class="otp-boxes">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="0" autocomplete="off">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="1" autocomplete="off">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="2" autocomplete="off">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="3" autocomplete="off">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="4" autocomplete="off">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="5" autocomplete="off">
       </div>
       <button type="submit" class="button" id="submitBtn" disabled
         style="opacity:0.5;cursor:not-allowed">
         Verify Email
       </button>
     </form>

     <form method="POST" action="/profile/resend-otp">
       <input type="hidden" name="email" value="${escape(email)}">
       <button type="submit" class="resend">Didn't receive it? Resend code</button>
     </form>
   </div>

   <script>
     const boxes = document.querySelectorAll('.otp-box');
     const hidden = document.getElementById('otpHidden');
     const btn = document.getElementById('submitBtn');

     function syncHidden() {
       const val = [...boxes].map(b => b.value).join('');
       hidden.value = val;
       const full = val.length === 6 && [...boxes].every(b => /\\d/.test(b.value));
       btn.disabled = !full;
       btn.style.opacity = full ? '1' : '0.5';
       btn.style.cursor = full ? 'pointer' : 'not-allowed';
     }

     boxes.forEach((box, i) => {
       box.addEventListener('input', () => {
         box.value = box.value.replace(/\\D/g, '').slice(-1);
         if (box.value) {
           box.classList.add('filled');
           if (i < 5) boxes[i + 1].focus();
         } else {
           box.classList.remove('filled');
         }
         syncHidden();
       });

       box.addEventListener('keydown', e => {
         if (e.key === 'Backspace' && !box.value && i > 0) {
           boxes[i - 1].focus();
           boxes[i - 1].value = '';
           boxes[i - 1].classList.remove('filled');
           syncHidden();
         }
       });

       box.addEventListener('paste', e => {
         e.preventDefault();
         const digits = (e.clipboardData.getData('text') || '').replace(/\\D/g, '').slice(0, 6);
         digits.split('').forEach((d, j) => {
           if (boxes[j]) { boxes[j].value = d; boxes[j].classList.add('filled'); }
         });
         const next = Math.min(digits.length, 5);
         boxes[next].focus();
         syncHidden();
       });
     });

     boxes[0].focus();
   </script>
 `));
});


app.post('/profile/verify-email', async (req, res) => {
 if (!req.oidc.isAuthenticated()) return res.redirect('/login');

 const { email, otp } = req.body;
 const userId = req.oidc.user.sub;

 if (!email || !otp || otp.length !== 6) {
   return res.redirect(`/profile/verify-email?email=${encodeURIComponent(email)}&error=Please+enter+the+6-digit+code`);
 }

 try {
   await verifyEmailOTP(userId, email, otp);
   // OTP confirmed — update email + mark verified, clear pending OTP from metadata
   await updateAuth0User(userId, {
     email,
     email_verified: true,
     user_metadata: { pending_email: null, pending_email_otp_hash: null, pending_email_otp_expiry: null }
   });
   res.redirect('/profile/edit?success=Email+updated+and+verified+successfully');
 } catch (err) {
   console.error('OTP verify error:', err.message);
   res.redirect(`/profile/verify-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent(err.message)}`);
 }
});


app.post('/profile/resend-otp', async (req, res) => {
 if (!req.oidc.isAuthenticated()) return res.redirect('/login');

 const { email } = req.body;
 if (!email) return res.redirect('/profile/edit');

 const userId = req.oidc.user.sub;
 try {
   await sendEmailOTP(userId, email);
   res.redirect(`/profile/verify-email?email=${encodeURIComponent(email)}`);
 } catch (err) {
   console.error('Resend OTP error:', err.message);
   res.redirect(`/profile/verify-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent(err.message)}`);
 }
});


/* ==================================================
  Verify Password Change — OTP Page
  ================================================== */


app.get('/profile/verify-password', (req, res) => {
 if (!req.oidc.isAuthenticated()) return res.redirect('/login');

 const email = req.query.email || '';
 const flash = req.query.error
   ? `<div class="otp-flash otp-flash-error">✗ ${escape(req.query.error)}</div>`
   : '';

 res.type('html').send(page(`
   <style>
     .otp-card { max-width: 440px; text-align: center; }
     .otp-label { color: #94a3b8; font-size: 14px; margin: 8px 0 28px; line-height: 1.6; }
     .otp-email { color: #818cf8; font-weight: 600; }
     .otp-boxes { display: flex; gap: 10px; justify-content: center; margin-bottom: 24px; }
     .otp-box {
       width: 52px; height: 60px; border-radius: 12px; text-align: center;
       font-size: 26px; font-weight: 700; color: #e2e8f0;
       background: rgba(15,23,42,0.8); border: 2px solid rgba(255,255,255,0.12);
       outline: none; caret-color: #635bff;
     }
     .otp-box:focus { border-color: #635bff; box-shadow: 0 0 0 3px rgba(99,91,255,0.25); }
     .otp-box.filled { border-color: rgba(99,91,255,0.5); }
     .otp-flash { padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 20px; text-align: left; }
     .otp-flash-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
     .resend { background: none; border: none; color: #818cf8; font-size: 13px;
       cursor: pointer; text-decoration: underline; margin-top: 16px; }
     .resend:hover { color: #a5b4fc; }
     .back-link { display: inline-flex; align-items: center; gap: 6px; color: #94a3b8;
       text-decoration: none; font-size: 13px; margin-bottom: 24px; }
   </style>

   <div class="card otp-card">
     <a href="/profile/edit" class="back-link">← Back to Edit Profile</a>
     <div class="icon" style="margin:0 auto 20px">🔒</div>
     <h1 style="font-size:24px;margin-bottom:10px">Confirm Password Change</h1>
     <p class="otp-label">
       We sent a 6-digit code to<br>
       <span class="otp-email">${escape(email)}</span>.<br>
       Enter it below to confirm your new password.
     </p>

     ${flash}

     <form method="POST" action="/profile/verify-password" id="otpForm">
       <input type="hidden" name="email" value="${escape(email)}">
       <input type="hidden" name="otp" id="otpHidden">
       <div class="otp-boxes">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="0" autocomplete="off">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="1" autocomplete="off">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="2" autocomplete="off">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="3" autocomplete="off">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="4" autocomplete="off">
         <input class="otp-box" type="text" inputmode="numeric" maxlength="1" data-index="5" autocomplete="off">
       </div>
       <button type="submit" class="button" id="submitBtn" disabled style="opacity:0.5;cursor:not-allowed">
         Confirm Password Change
       </button>
     </form>

     <form method="POST" action="/profile/resend-password-otp">
       <input type="hidden" name="email" value="${escape(email)}">
       <button type="submit" class="resend">Didn't receive it? Resend code</button>
     </form>
   </div>

   <script>
     const boxes = document.querySelectorAll('.otp-box');
     const hidden = document.getElementById('otpHidden');
     const btn = document.getElementById('submitBtn');

     function syncHidden() {
       const val = [...boxes].map(b => b.value).join('');
       hidden.value = val;
       const full = val.length === 6 && [...boxes].every(b => /\\d/.test(b.value));
       btn.disabled = !full;
       btn.style.opacity = full ? '1' : '0.5';
       btn.style.cursor = full ? 'pointer' : 'not-allowed';
     }

     boxes.forEach((box, i) => {
       box.addEventListener('input', () => {
         box.value = box.value.replace(/\\D/g, '').slice(-1);
         if (box.value) { box.classList.add('filled'); if (i < 5) boxes[i + 1].focus(); }
         else box.classList.remove('filled');
         syncHidden();
       });
       box.addEventListener('keydown', e => {
         if (e.key === 'Backspace' && !box.value && i > 0) {
           boxes[i - 1].focus(); boxes[i - 1].value = '';
           boxes[i - 1].classList.remove('filled'); syncHidden();
         }
       });
       box.addEventListener('paste', e => {
         e.preventDefault();
         const digits = (e.clipboardData.getData('text') || '').replace(/\\D/g, '').slice(0, 6);
         digits.split('').forEach((d, j) => { if (boxes[j]) { boxes[j].value = d; boxes[j].classList.add('filled'); } });
         boxes[Math.min(digits.length, 5)].focus();
         syncHidden();
       });
     });
     boxes[0].focus();
   </script>
 `));
});


app.post('/profile/verify-password', async (req, res) => {
 if (!req.oidc.isAuthenticated()) return res.redirect('/login');

 const { email, otp } = req.body;
 const userId = req.oidc.user.sub;

 if (!otp || otp.length !== 6) {
   return res.redirect(`/profile/verify-password?email=${encodeURIComponent(email)}&error=Please+enter+the+6-digit+code`);
 }

 try {
   const userData = await getAuth0User(userId);
   const meta = userData.user_metadata || {};

   if (!meta.pending_password_otp_hash || !meta.pending_password_otp_expiry || !meta.pending_password_enc) {
     return res.redirect('/profile/edit?error=No+pending+password+change+found.+Please+try+again.');
   }
   if (Date.now() > meta.pending_password_otp_expiry) {
     return res.redirect(`/profile/verify-password?email=${encodeURIComponent(email)}&error=Code+has+expired.+Please+request+a+new+one.`);
   }
   if (hashOTP(otp) !== meta.pending_password_otp_hash) {
     return res.redirect(`/profile/verify-password?email=${encodeURIComponent(email)}&error=Incorrect+code.+Please+try+again.`);
   }

   const newPassword = decryptValue(meta.pending_password_enc);

   // Apply password + clear pending metadata
   await updateAuth0User(userId, {
     password: newPassword,
     user_metadata: { pending_password_enc: null, pending_password_otp_hash: null, pending_password_otp_expiry: null }
   });

   res.redirect('/profile/edit?success=Password+updated+successfully');
 } catch (err) {
   console.error('Password verify error:', err.message);
   res.redirect(`/profile/verify-password?email=${encodeURIComponent(email)}&error=${encodeURIComponent(err.message)}`);
 }
});


app.post('/profile/resend-password-otp', async (req, res) => {
 if (!req.oidc.isAuthenticated()) return res.redirect('/login');

 const { email } = req.body;
 const userId = req.oidc.user.sub;

 try {
   const userData = await getAuth0User(userId);
   const meta = userData.user_metadata || {};

   if (!meta.pending_password_enc) {
     return res.redirect('/profile/edit?error=No+pending+password+change.+Please+start+again.');
   }

   const otp = generateOTP();
   const expiry = Date.now() + 10 * 60 * 1000;

   await updateAuth0User(userId, {
     user_metadata: {
       ...meta,
       pending_password_otp_hash: hashOTP(otp),
       pending_password_otp_expiry: expiry
     }
   });

   const transport = await smtpTransport();
   const info = await transport.sendMail({
     from: '"LADWP" <no-reply@ladwp.com>',
     to: email,
     subject: 'Your password change verification code',
     html: `<div style="font-family:sans-serif;padding:32px;text-align:center">
       <h2>Password change code</h2>
       <div style="font-size:40px;font-weight:700;letter-spacing:12px;padding:24px;
                   background:#f4f4f8;border-radius:12px;margin:20px 0">${otp}</div>
       <p style="color:#888;font-size:13px">Expires in 10 minutes.</p></div>`
   });

   console.log('\n========== PASSWORD OTP RESEND ==========');
   console.log('Code:   ', otp);
   console.log('Preview:', nodemailer.getTestMessageUrl(info));
   console.log('=========================================\n');

   res.redirect(`/profile/verify-password?email=${encodeURIComponent(email)}`);
 } catch (err) {
   console.error('Resend password OTP error:', err.message);
   res.redirect(`/profile/verify-password?email=${encodeURIComponent(email)}&error=${encodeURIComponent(err.message)}`);
 }
});


/* ==================================================
  Toggle MFA
  ================================================== */


app.post('/profile/toggle-mfa', async (req, res) => {
 if (!req.oidc.isAuthenticated()) {
   return res.redirect('/login');
 }

 const userId = req.oidc.user.sub;
 const enable = req.body.enableMFA === 'true';

 try {
   await updateAuth0User(userId, {
     user_metadata: { enableMFA: enable }
   });
   const msg = enable
     ? 'MFA+enabled.+You+will+be+prompted+on+your+next+login.'
     : 'MFA+disabled.+Takes+effect+on+your+next+login.';
   res.redirect(`/profile/edit?success=${msg}`);
 } catch (err) {
   console.error('MFA toggle error:', err.message);
   res.redirect(`/profile/edit?error=${encodeURIComponent(err.message)}`);
 }
});


/* ==================================================
  Start Server
  ================================================== */


const port =
 process.env.PORT || 3000;


app.listen(
 port,
 () => {


   console.log(
     `Listening on http://localhost:${port}`
   );


 }
);
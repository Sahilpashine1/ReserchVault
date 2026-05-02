/**
 * Email Service — ResearchVault
 * Uses Nodemailer with Gmail SMTP (or any SMTP provider).
 * All credentials come from environment variables (never hardcoded).
 */

const nodemailer = require('nodemailer');

// ── Build transporter lazily (so missing env vars don't crash startup) ──────
function createTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error(
            'EMAIL_USER and EMAIL_PASS must be set in .env to send emails. ' +
            'See .env.example for instructions.'
        );
    }

    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',   // 'gmail' | 'outlook' | 'yahoo'
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS   // For Gmail: use an App Password, not your real password
        },
        // Optional: custom SMTP host/port (overrides `service`)
        ...(process.env.EMAIL_HOST && {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            service: undefined   // clear service when host is provided
        })
    });
}

/**
 * Send the OTP verification email after registration.
 * @param {string} toEmail   - Recipient's email address
 * @param {string} name      - Recipient's display name
 * @param {string} otp       - 6-digit OTP code
 */
async function sendOTPEmail(toEmail, name, otp) {
    const transporter = createTransporter();
    const fromName = process.env.EMAIL_FROM_NAME || 'ResearchVault';
    const fromAddr = process.env.EMAIL_USER;

    const mailOptions = {
        from: `"${fromName}" <${fromAddr}>`,
        to: toEmail,
        subject: '🔐 Verify your ResearchVault account',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#f3f4f6; margin:0; padding:20px; }
    .card { background:#ffffff; border-radius:12px; max-width:480px; margin:0 auto;
            padding:36px 32px; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .logo { text-align:center; margin-bottom:24px; }
    .logo-text { font-size:1.4rem; font-weight:800; color:#2563eb; letter-spacing:-0.5px; }
    h2 { color:#1e293b; font-size:1.15rem; margin:0 0 10px; text-align:center; }
    p  { color:#64748b; font-size:0.9rem; line-height:1.6; margin:8px 0; }
    .otp-box {
      background:linear-gradient(135deg,#eff6ff,#dbeafe);
      border:2px solid #3b82f6;
      border-radius:12px;
      text-align:center;
      padding:24px 16px;
      margin:24px 0;
    }
    .otp-label { font-size:0.78rem; font-weight:600; color:#2563eb; margin-bottom:8px; }
    .otp-code  { font-size:2.5rem; font-weight:900; letter-spacing:0.35em;
                 color:#1e40af; font-family:'Courier New',monospace; }
    .otp-expiry{ font-size:0.75rem; color:#6b7280; margin-top:8px; }
    .footer    { text-align:center; margin-top:28px; font-size:0.75rem; color:#94a3b8; }
    .warning   { background:#fef9c3; border:1px solid #fde047; border-radius:8px;
                 padding:10px 14px; font-size:0.8rem; color:#713f12; margin-top:16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"><span class="logo-text">🔬 ResearchVault</span></div>
    <h2>Verify your email address</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Thanks for registering! Use the OTP below to verify your account and get started.</p>

    <div class="otp-box">
      <div class="otp-label">Your One-Time Password</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏳ This code expires in <strong>10 minutes</strong></div>
    </div>

    <div class="warning">
      ⚠️ Never share this OTP with anyone. ResearchVault will never ask for your OTP via phone or chat.
    </div>

    <p style="margin-top:20px;">If you did not create an account, please ignore this email.</p>
    <div class="footer">
      © ${new Date().getFullYear()} ResearchVault · Faculty Publications Management System
    </div>
  </div>
</body>
</html>
        `.trim(),
        // Plain text fallback
        text: `Hi ${name},\n\nYour ResearchVault OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not register, please ignore this email.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${toEmail} [messageId: ${info.messageId}]`);
    return info;
}

/**
 * Send a password reset OTP (used by forgot-password flow).
 * @param {string} toEmail
 * @param {string} name
 * @param {string} otp
 */
async function sendPasswordResetEmail(toEmail, name, otp) {
    const transporter = createTransporter();
    const fromName = process.env.EMAIL_FROM_NAME || 'ResearchVault';
    const fromAddr = process.env.EMAIL_USER;

    const mailOptions = {
        from: `"${fromName}" <${fromAddr}>`,
        to: toEmail,
        subject: '🔑 Reset your ResearchVault password',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family:'Segoe UI',Arial,sans-serif; background:#f3f4f6; margin:0; padding:20px; }
    .card { background:#fff; border-radius:12px; max-width:480px; margin:0 auto;
            padding:36px 32px; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .logo-text { font-size:1.4rem; font-weight:800; color:#2563eb; }
    .otp-box { background:linear-gradient(135deg,#fff7ed,#fed7aa); border:2px solid #f97316;
               border-radius:12px; text-align:center; padding:24px 16px; margin:24px 0; }
    .otp-code { font-size:2.5rem; font-weight:900; letter-spacing:0.35em;
                color:#9a3412; font-family:'Courier New',monospace; }
    .otp-expiry { font-size:0.75rem; color:#6b7280; margin-top:8px; }
    p { color:#64748b; font-size:0.9rem; line-height:1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div style="text-align:center;margin-bottom:24px;"><span class="logo-text">🔬 ResearchVault</span></div>
    <h2 style="color:#1e293b;text-align:center;">Password Reset Request</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received a request to reset your password. Use the OTP below:</p>
    <div class="otp-box">
      <div style="font-size:0.78rem;font-weight:600;color:#ea580c;margin-bottom:8px;">Password Reset OTP</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏳ Expires in <strong>10 minutes</strong></div>
    </div>
    <p>If you did not request a password reset, please ignore this email — your password will remain unchanged.</p>
  </div>
</body>
</html>
        `.trim(),
        text: `Hi ${name},\n\nYour password reset OTP is: ${otp}\n\nExpires in 10 minutes.\n\nIf you did not request this, ignore this email.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${toEmail}`);
    return info;
}

module.exports = { sendOTPEmail, sendPasswordResetEmail };

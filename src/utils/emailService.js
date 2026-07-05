import nodemailer from "nodemailer";

let transporter = null;
/**
 * Lazily initialize and return the Nodemailer transporter.
 */
const getTransporter = () => {
  if (!transporter) {
    const isSecure =
      process.env.EMAIL_SECURE === "true" || process.env.EMAIL_PORT === "465";
    const port = parseInt(process.env.EMAIL_PORT) || (isSecure ? 465 : 587);

    const configOpts = {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: port,
      secure: isSecure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

    if (process.env.EMAIL_SERVICE) {
      delete configOpts.host;
      delete configOpts.port;
      delete configOpts.secure;
      configOpts.service = process.env.EMAIL_SERVICE;
    }

    console.log(
      `Initializing Nodemailer transporter (Service: ${process.env.EMAIL_SERVICE || "custom"}, Host: ${configOpts.host || "default"}, Port: ${configOpts.port || "default"}, Secure: ${configOpts.secure || "default"})...`,
    );
    transporter = nodemailer.createTransport(configOpts);
  }
  return transporter;
};

/**
 * Basic sanity check on a Brevo API key's shape (does NOT verify it's active/authorized —
 * only catches obvious copy/paste mistakes like a masked or truncated key).
 */
const isPlausibleBrevoKey = (key) => {
  if (!key) return false;
  return key.startsWith("xkeysib-") && key.length > 40;
};

/**
 * Generate a beautiful HTML email with the OTP code.
 * @param {string} otp  - 6-digit OTP string
 * @param {string} name - Recipient's display name
 */
const getOtpEmailTemplate = (otp, name = "there") => {
  const digits = otp.split("");
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="padding:0 6px;">
          <div style="
            width:48px;height:56px;
            background:#f0f4ff;
            border:2px solid #00897b;
            border-radius:12px;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            font-size:28px;
            font-weight:700;
            color:#312e81;
            font-family:'Segoe UI',Arial,sans-serif;
            line-height:56px;
            text-align:center;
          ">${d}</div>
        </td>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="
          background:#ffffff;
          border-radius:20px;
          box-shadow:0 4px 24px rgba(99,102,241,0.10);
          overflow:hidden;
          max-width:560px;
          width:100%;
        ">
          <!-- Header -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);
              padding:36px 40px 32px;
              text-align:center;
            ">
              <div style="
                display:inline-block;
                background:rgba(255,255,255,0.15);
                border-radius:16px;
                padding:12px 20px;
                margin-bottom:16px;
              ">
                <span style="font-size:32px;">🔐</span>
              </div>
              <h1 style="
                margin:0;
                color:#ffffff;
                font-size:26px;
                font-weight:700;
                letter-spacing:-0.5px;
              ">Email Verification</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.80);font-size:14px;">
                Profile Manager
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:15px;">Hi <strong style="color:#1e293b;">${name}</strong>,</p>
              <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.6;">
                Thanks for signing up! Use the verification code below to confirm your email address and activate your account.
              </p>

              <!-- OTP Boxes -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>${digitBoxes}</tr>
              </table>

              <!-- Expiry notice -->
              <div style="
                background:#fff7ed;
                border:1px solid #fed7aa;
                border-radius:10px;
                padding:14px 18px;
                margin-bottom:28px;
              ">
                <p style="margin:0;color:#9a3412;font-size:13px;text-align:center;">
                  ⏰ &nbsp;This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
                </p>
              </div>

              <p style="margin:0 0 6px;color:#64748b;font-size:14px;">
                If you did not create an account, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"/>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 36px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} Profile Manager. All rights reserved.
              </p>
              <p style="margin:6px 0 0;color:#cbd5e1;font-size:11px;">
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Send OTP verification email.
 * @param {string} email - Recipient email address
 * @param {string} otp   - 6-digit OTP
 * @param {string} name  - Recipient's name
 */
export const sendOtpEmail = async (email, otp, name = "there") => {
  const subject = "🔐 Your Email Verification Code";
  const htmlContent = getOtpEmailTemplate(otp, name);
  const senderEmail =
    process.env.EMAIL_USER || "palashendrakumar.b2c@gmail.com";
  const senderName = "Profile Manager";

  // Option 1: Resend HTTP API (Ideal for bypassing Render free-tier SMTP block)
  if (process.env.RESEND_API_KEY) {
    console.log("Sending email via Resend HTTP API...");
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: [email],
          subject: subject,
          html: htmlContent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Log full response body — the actual reason (invalid key, unverified
        // domain, etc.) is always in here even when the thrown message is generic.
        console.error("Resend API error response:", JSON.stringify(data));
        throw new Error(
          `Resend API error: ${response.status} - ${JSON.stringify(data)}`,
        );
      }
      console.log("Email sent successfully via Resend API:", data.id);
      return;
    } catch (err) {
      console.error("Failed to send email via Resend API:", err);
      throw err;
    }
  }

  // Option 2: Brevo HTTP API (Alternative HTTP API)
  if (process.env.BREVO_API_KEY) {
    // Catch the #1 real-world cause of silent Brevo failures early: a masked,
    // truncated, or otherwise malformed key pasted from the dashboard.
    if (!isPlausibleBrevoKey(process.env.BREVO_API_KEY)) {
      console.error(
        "BREVO_API_KEY does not look like a valid Brevo key (should start with 'xkeysib-' " +
          "and be a long string). Generate a fresh key in Brevo → Settings → SMTP & API → " +
          "API Keys & MCP, since masked/partial keys shown in the dashboard cannot be reused.",
      );
    }

    console.log("Sending email via Brevo HTTP API...");
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: email, name: name }],
          subject: subject,
          htmlContent: htmlContent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Log full response body — Brevo's error `message` (e.g. "Key not found",
        // "Sender not authorized") is the real clue and was previously swallowed.
        console.error("Brevo API error response:", JSON.stringify(data));
        throw new Error(
          `Brevo API error: ${response.status} - ${JSON.stringify(data)}`,
        );
      }
      console.log("Email sent successfully via Brevo API:", data.messageId);
      return;
    } catch (err) {
      console.error("Failed to send email via Brevo API:", err);
      throw err;
    }
  }

  // Option 3: Nodemailer SMTP
  console.log("Sending email via SMTP (Nodemailer)...");
  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  };

  try {
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail(mailOptions);
    console.log("Email sent successfully via SMTP.");
  } catch (err) {
    console.error("Failed to send email via SMTP:", err);
    throw err;
  }
};

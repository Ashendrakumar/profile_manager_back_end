import nodemailer from "nodemailer";

/**
 * Create a Nodemailer transporter using Gmail SMTP.
 * Requires EMAIL_USER and EMAIL_PASS in .env
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
  const mailOptions = {
    from: `"Profile Manager" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Your Email Verification Code",
    html: getOtpEmailTemplate(otp, name),
  };

  await transporter.sendMail(mailOptions);
};

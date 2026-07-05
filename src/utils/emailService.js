import "dotenv/config";
import config from "../config/config.js";

const BREVO_API_KEY = config.brevoApiKey || process.env.BREVO_API_KEY;
const SENDER_EMAIL = config.emailUser || process.env.EMAIL_USER;
const SENDER_NAME = "Profile Manager";

/**
 * Send a one-time-password email.
 * Works the same locally and on Render — uses Brevo's HTTPS API,
 * so it's never affected by SMTP ports being blocked.
 *
 * @param {string} email - recipient's email address
 * @param {string} otp   - the OTP code to send (e.g. "482913")
 * @param {string} [name] - recipient's display name
 */
export const sendOtpEmail = async (email, otp, name = "there") => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email, name }],
      subject: "Your Verification Code",
      htmlContent: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;">
          <h2>Hi ${name},</h2>
          <p>Your verification code is:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#312e81;">${otp}</p>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Brevo email error:", data);
    throw new Error(
      `Failed to send OTP email: ${data.message || response.status}`,
    );
  }

  console.log("OTP email sent:", data.messageId);
};

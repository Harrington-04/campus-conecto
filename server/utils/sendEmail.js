// server/utils/sendEmail.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetEmail(to, token) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const from = process.env.EMAIL_FROM || "noreply@campusconecto.com";
  const baseUrl = process.env.FRONTEND_URL || "";
  if (!baseUrl) {
    throw new Error("FRONTEND_URL is not set");
  }

  const resetLink = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(to)}`;

  const subject = "Reset your Campus Conecto password";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your Campus Conecto account password.</p>
      <p>Click the button below to reset your password. This link expires in 15 minutes.</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${resetLink}"
           style="background:#4a6cf7;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;display:inline-block">
           Reset Password
        </a>
      </p>
      <p>Or copy and paste this URL into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <br/>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>— Campus Conecto Team</p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email via Resend");
  }

  return data?.id || true;
}

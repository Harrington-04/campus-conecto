// server/utils/emailsender.js
import nodemailer from "nodemailer";

// Prefer HTTP email API (Resend) to avoid SMTP being blocked on some hosts (e.g., Render)
const hasResend = !!process.env.RESEND_API_KEY;

async function sendViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: new Error("RESEND_API_KEY not set") };

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `Campus Conecto <no-reply@campusconecto.com>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Resend API error: ${resp.status} ${text}`);
    }

    const data = await resp.json();
    return { ok: true, id: data.id };
  } catch (error) {
    return { ok: false, error };
  }
}

const createTransporter = () => {
  // Default to Gmail service, allow overriding host/port if provided
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export async function sendWelcomeEmail(toEmail, fullName, role = "user") {
  const subject = "Welcome to Campus Conecto!";
  const html = `
        <h2>Hello ${fullName},</h2>
        <p>🎉 Welcome to <strong>Campus Conecto</strong> as a <strong>${role}</strong>!</p>
        <p>We're excited to have you on board. Explore academic circles, share ideas, and grow together!</p>
        <p>🔗 Visit <a href="https://campusconecto.com">campusconecto.com</a> to get started.</p>
        <br/>
        <p>— Campus Conecto Team</p>
      `;

  // Try Resend first if available
  if (hasResend) {
    const res = await sendViaResend({ to: toEmail, subject, html });
    if (res.ok) {
      console.log("✅ Welcome email sent (Resend):", res.id);
      return true;
    }
    console.error("❌ Resend welcome email failed:", res.error);
  }

  // Fallback to SMTP
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Campus Conecto" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html,
    });
    console.log("✅ Welcome email sent (SMTP):", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed (SMTP):", error);
    return false;
  }
}

export async function sendPasswordResetOTP(toEmail, otp) {
  const subject = "Password Reset OTP - Campus Conecto";
  const html = `
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password for your Campus Conecto account.</p>
        <p>Here is your One-Time Password (OTP):</p>
        <h1 style="font-size: 40px; letter-spacing: 5px; text-align: center; color: #4a6cf7;">${otp}</h1>
        <p>This OTP is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
        <br/>
        <p>— Campus Conecto Team</p>
      `;

  // Try Resend first if available
  if (hasResend) {
    const res = await sendViaResend({ to: toEmail, subject, html });
    if (res.ok) {
      console.log("✅ Password reset OTP sent (Resend):", res.id);
      return true;
    }
    console.error("❌ Resend OTP email failed:", res.error);
  }

  // Fallback to SMTP
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Campus Conecto" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html,
    });
    console.log("✅ Password reset OTP sent (SMTP):", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Password reset email sending failed (SMTP):", error);
    return false;
  }
}

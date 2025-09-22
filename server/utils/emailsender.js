// server/utils/emailsender.js
import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS,
    },
  });
};

export async function sendWelcomeEmail(toEmail, fullName, role = "user") {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"Campus Conecto" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Welcome to Campus Conecto!",
      html: `
        <h2>Hello ${fullName},</h2>
        <p>🎉 Welcome to <strong>Campus Conecto</strong> as a <strong>${role}</strong>!</p>
        <p>We're excited to have you on board. Explore academic circles, share ideas, and grow together!</p>
        <p>🔗 Visit <a href="https://campusconecto.com">campusconecto.com</a> to get started.</p>
        <br/>
        <p>— Campus Conecto Team</p>
      `,
    });

    console.log("✅ Welcome email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return false;
  }
}

export async function sendPasswordResetOTP(toEmail, otp) {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"Campus Conecto" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Password Reset OTP - Campus Conecto",
      html: `
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password for your Campus Conecto account.</p>
        <p>Here is your One-Time Password (OTP):</p>
        <h1 style="font-size: 40px; letter-spacing: 5px; text-align: center; color: #4a6cf7;">${otp}</h1>
        <p>This OTP is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
        <br/>
        <p>— Campus Conecto Team</p>
      `,
    });

    console.log("✅ Password reset OTP sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Password reset email sending failed:", error);
    return false;
  }
}

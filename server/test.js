const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., 'smtp.gmail.com', 'smtp.office365.com'
  port: parseInt(process.env.SMTP_PORT) || 587, // 587 for TLS, 465 for SSL, 25 for non-secure
  secure: process.env.SMTP_SECURE === "true", // true for 465 (SSL), false for other ports (TLS)
  auth: {
    user: process.env.SMTP_USER, // Your SMTP username/email
    pass: process.env.SMTP_PASS, // Your SMTP password
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

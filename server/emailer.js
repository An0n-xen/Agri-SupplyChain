const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Store OTPs temporarily (in production, use Redis or database)
const otpStorage = new Map();

// Configure SMTP email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g., 'smtp.gmail.com', 'smtp.office365.com'
    port: parseInt(process.env.SMTP_PORT) || 587, // 587 for TLS, 465 for SSL, 25 for non-secure
    secure: true, // true for 465 (SSL), false for other ports (TLS)
    auth: {
      user: process.env.SMTP_USER, // Your SMTP username/email
      pass: process.env.SMTP_PASS, // Your SMTP password
    },
    // Additional SMTP options
    tls: {
      // Do not fail on invalid certificates (for development only)
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
    // Connection timeout
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email
const sendOTPEmail = async (email, otp, userName = "User") => {
  const transporter = createEmailTransporter();

  const mailOptions = {
    // from: {
    //   name: process.env.SMTP_FROM_NAME || "", // Replace with your app name
    //   address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    // },
    to: email,
    subject: "Password Reset - Verification Code",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 10px;
            border: 1px solid #ddd;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .otp-code {
            background-color: #007bff;
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            letter-spacing: 3px;
            margin: 20px 0;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          
          <p>Hello ${userName},</p>
          
          <p>We received a request to reset your password. Please use the verification code below to proceed:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This verification code will expire in <strong>10 minutes</strong>.</p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Never share this code with anyone</li>
              <li>Our team will never ask for this code via phone or email</li>
            </ul>
          </div>
          
          <p>If you're having trouble with the password reset process, please contact our support team.</p>
          
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; 2025 Your App Name. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    // Plain text version for email clients that don't support HTML
    text: `
      Hello ${userName},
      
      We received a request to reset your password.
      
      Your verification code is: ${otp}
      
      This code will expire in 10 minutes.
      
      If you didn't request this password reset, please ignore this email.
      Never share this code with anyone.
      
      Best regards,
      Your App Name Team
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send verification email");
  }
};

// Main function to generate and send OTP
const sendPasswordResetOTP = async (email, userName) => {
  try {
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Store OTP with expiration
    otpStorage.set(email, {
      otp: otp,
      expiresAt: expiresAt,
      attempts: 0,
    });

    // Send email
    await sendOTPEmail(email, otp, userName);

    console.log(
      `OTP sent to ${email}: ${otp} (expires at ${new Date(expiresAt)})`
    );

    return {
      success: true,
      message: "Verification code sent successfully",
    };
  } catch (error) {
    console.error("Error in sendPasswordResetOTP:", error);
    throw error;
  }
};

// Function to verify OTP
const verifyOTP = (email, userOTP) => {
  const otpData = otpStorage.get(email);

  if (!otpData) {
    return {
      success: false,
      message: "No verification code found. Please request a new one.",
    };
  }

  // Check if OTP has expired
  if (Date.now() > otpData.expiresAt) {
    otpStorage.delete(email);
    return {
      success: false,
      message: "Verification code has expired. Please request a new one.",
    };
  }

  // Check attempt limit (prevent brute force)
  if (otpData.attempts >= 3) {
    otpStorage.delete(email);
    return {
      success: false,
      message:
        "Too many failed attempts. Please request a new verification code.",
    };
  }

  // Verify OTP
  if (otpData.otp === userOTP.toString()) {
    // OTP is correct, but don't delete yet (needed for password reset)
    return {
      success: true,
      message: "Verification code verified successfully",
    };
  } else {
    // Increment attempts
    otpData.attempts++;
    otpStorage.set(email, otpData);
    return {
      success: false,
      message: `Invalid verification code. ${
        3 - otpData.attempts
      } attempts remaining.`,
    };
  }
};

// Function to clear OTP after successful password reset
const clearOTP = (email) => {
  otpStorage.delete(email);
};

// Cleanup expired OTPs (run this periodically)
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, otpData] of otpStorage.entries()) {
    if (now > otpData.expiresAt) {
      otpStorage.delete(email);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  sendPasswordResetOTP,
  verifyOTP,
  clearOTP,
  cleanupExpiredOTPs,
};

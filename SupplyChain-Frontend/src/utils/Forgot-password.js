import React, { useState } from "react";
import "../css/Registration.css";
import block from "../images/logo-ct.png";
import Axios from "axios";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email/phone, 2: verification code, 3: new password
  const [loginId, setLoginId] = useState(""); // Can be phone or email
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  const handleLoginIdChange = (e) => {
    setLoginId(e.target.value);
  };

  const handleVerificationCodeChange = (e) => {
    setVerificationCode(e.target.value);
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const sendResetCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await Axios.post(
        "http://localhost:3001/forgot-password/send-code",
        {
          loginId: loginId,
        }
      );

      setMessage("Verification code sent successfully!");
      setMessageType("success");
      setStep(2);
    } catch (error) {
      console.error("Send code error:", error);
      if (error.response) {
        setMessage(
          error.response.data.message || "Failed to send verification code"
        );
      } else if (error.request) {
        setMessage("No response from server. Please check your connection.");
      } else {
        setMessage("An error occurred. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await Axios.post(
        "http://localhost:3001/forgot-password/verify-code",
        {
          loginId: loginId,
          code: verificationCode,
        }
      );

      setMessage("Code verified successfully!");
      setMessageType("success");
      setStep(3);
    } catch (error) {
      console.error("Verify code error:", error);
      if (error.response) {
        setMessage(error.response.data.message || "Invalid verification code");
      } else {
        setMessage("An error occurred. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    try {
      const response = await Axios.post(
        "http://localhost:3001/forgot-password/reset-password",
        {
          loginId: loginId,
          code: verificationCode,
          newPassword: newPassword,
        }
      );

      setMessage("Password reset successfully! Redirecting to login...");
      setMessageType("success");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error("Reset password error:", error);
      if (error.response) {
        setMessage(error.response.data.message || "Failed to reset password");
      } else {
        setMessage("An error occurred. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleResendCode = () => {
    setStep(1);
    setVerificationCode("");
    setMessage("");
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <a className="navbar-brand text-white" href="#">
          <img
            src={block}
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt=""
          />
          &nbsp; Forgot Password
        </a>
      </nav>
      <div className="countainer">
        <div className="card">
          <div className="card-header p-3 pt-2">
            <div className="icon icon-lg icon-shape bg-gradient-primary shadow-primary text-center border-radius-xl mt-n4 position-absolute">
              <i className="material-icons opacity-10">lock_reset</i>
            </div>
            <div className="text-end pt-1">
              <h4 className="mb-0 text-info">
                {step === 1 && "Reset Password"}
                {step === 2 && "Enter Verification Code"}
                {step === 3 && "Set New Password"}
              </h4>
            </div>
          </div>
          <div className="fertiliser-body">
            {/* Display message */}
            {message && (
              <div
                className={`alert ${
                  messageType === "success" ? "alert-success" : "alert-danger"
                } mb-3`}
              >
                {message}
              </div>
            )}

            {/* Step 1: Enter email/phone */}
            {step === 1 && (
              <form onSubmit={sendResetCode} name="forgotPasswordForm">
                <p className="text-muted mb-3">
                  Enter your email address or phone number to receive a
                  verification code.
                </p>

                <label className="label-r">Phone Number or Email:</label>
                <div className="input-group input-group-outline mb-3">
                  <input
                    type="text"
                    id="loginId"
                    name="loginId"
                    className="form-control"
                    placeholder="Enter your phone number or email"
                    required
                    value={loginId}
                    onChange={handleLoginIdChange}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-lg bg-gradient-info btn-lg w-100 mt-2 mb-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Sending Code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Enter verification code */}
            {step === 2 && (
              <form onSubmit={verifyCode} name="verifyCodeForm">
                <p className="text-muted mb-3">
                  We've sent a verification code to <strong>{loginId}</strong>.
                  Please enter the code below.
                </p>

                <label className="label-r">Verification Code:</label>
                <div className="input-group input-group-outline mb-3">
                  <input
                    type="text"
                    id="verificationCode"
                    name="verificationCode"
                    className="form-control"
                    placeholder="Enter 6-digit verification code"
                    required
                    value={verificationCode}
                    onChange={handleVerificationCodeChange}
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-lg bg-gradient-info btn-lg w-100 mt-2 mb-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-link text-info p-0"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    Didn't receive code? Resend
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set new password */}
            {step === 3 && (
              <form onSubmit={resetPassword} name="resetPasswordForm">
                <p className="text-muted mb-3">
                  Please enter your new password below.
                </p>

                <label className="label-r">New Password:</label>
                <div className="input-group input-group-outline mb-3">
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    className="form-control"
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>

                <label className="label-r">Confirm New Password:</label>
                <div className="input-group input-group-outline mb-3">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="Confirm new password"
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-lg bg-gradient-info btn-lg w-100 mt-2 mb-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}

            {/* Back to login link */}
            <div className="text-center">
              <p className="mb-0">
                Remember your password?{" "}
                <button
                  type="button"
                  className="btn btn-link text-info p-0"
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                >
                  Back to Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

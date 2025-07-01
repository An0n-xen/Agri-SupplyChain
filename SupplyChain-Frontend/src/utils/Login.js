import React, { useState } from "react";
import "../css/Registration.css";
import block from "../images/logo-ct.png";
import Axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { dbActions } from "../store/dbSlice"; // Adjust path as needed

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loginId, setLoginId] = useState(""); // Can be phone or email
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loginIdF = (e) => {
    setLoginId(e.target.value);
  };

  const passwordF = (e) => {
    setPassword(e.target.value);
  };

  const login = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      console.log("Sending login data:", {
        loginId: loginId,
        password: password,
      });

      // First, authenticate user credentials
      const loginResponse = await Axios.post(
        "http://localhost:3001/authentication",
        {
          loginId: loginId,
          password: password,
        }
      );

      console.log("Login response:", loginResponse.data);

      const userData = loginResponse.data;

      // Store user data
      localStorage.setItem("userToken", loginResponse.data.token);
      localStorage.setItem("userData", JSON.stringify(userData));

      // Check if user has a valid role
      const validRoles = [
        "farmer",
        "processor",
        "retailer",
        "consumer",
        "investor",
        "admin",
        "qualitychecker",
      ];

      if (!validRoles.includes(userData.role)) {
        alert("Register yourself or wait for approval from admin");
        setIsLoggingIn(false);
        return;
      }

      // User has valid role, proceed with login
      dispatch(dbActions.role(userData.role));
      dispatch(dbActions.logIn());
      dispatch(dbActions.userAccount(userData.publicKey));

      // Navigate to role-specific page
      navigate(`/${userData.role}`);
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        // Server responded with error status
        console.error("Server error response:", error.response.data);
        alert(
          `Login failed: ${error.response.data.message || error.response.data}`
        );
      } else if (error.request) {
        // Request was made but no response
        console.error("No response from server:", error.request);
        alert(
          "No response from server. Please check if the server is running."
        );
      } else {
        // Something else happened
        console.error("Request setup error:", error.message);
        alert("Login failed. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleRegister = () => {
    navigate("/register");
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
          &nbsp; Login
        </a>
      </nav>
      <div className="countainer">
        <div className="card">
          <div className="card-header p-3 pt-2">
            <div className="icon icon-lg icon-shape bg-gradient-primary shadow-primary text-center border-radius-xl mt-n4 position-absolute">
              <i className="material-icons opacity-10">login</i>
            </div>
            <div className="text-end pt-1">
              <h4 className="mb-0 text-info">Login</h4>
            </div>
          </div>
          <div className="fertiliser-body">
            <form onSubmit={login} name="loginForm">
              <label className={"label-r"}> Phone Number or Email:</label>
              <div className="input-group input-group-outline mb-3">
                <input
                  type="text"
                  id="loginId"
                  name="loginId"
                  className="form-control"
                  placeholder="Enter your phone number or email"
                  required
                  onChange={loginIdF}
                  disabled={isLoggingIn}
                />
              </div>

              <label className={"label-r"}> Password:</label>
              <div className="input-group input-group-outline mb-3">
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter your password"
                  required
                  onChange={passwordF}
                  disabled={isLoggingIn}
                />
              </div>

              <div className="text-end mb-3">
                <button
                  type="button"
                  className="btn btn-link text-info p-0"
                  onClick={handleForgotPassword}
                  disabled={isLoggingIn}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-lg bg-gradient-info btn-lg w-100 mt-2 mb-3"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Signing In...
                  </>
                ) : (
                  "Login"
                )}
              </button>

              <div className="text-center">
                <p className="mb-0">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="btn btn-link text-info p-0"
                    onClick={handleRegister}
                    disabled={isLoggingIn}
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

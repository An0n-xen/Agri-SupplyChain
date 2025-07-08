import React, { useState } from "react";
import "../css/Registration.css";
import block from "../images/logo-ct.png";
import Axios from "axios";
import { useNavigate } from "react-router-dom";

function Registration() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [no, setNo] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("farmer");
  const [isRegistering, setIsRegistering] = useState(false);

  const numberF = (e) => {
    setNo(e.target.value);
  };

  const nameF = (e) => {
    setName(e.target.value);
  };

  const addressF = (e) => {
    setAddress(e.target.value);
  };

  const roleF = (e) => {
    setRole(e.target.value);
  };

  const emailF = (e) => {
    setEmail(e.target.value);
  };

  const passwordF = (e) => {
    setPassword(e.target.value);
  };

  const register = async (e) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      console.log("Sending registration data:", {
        name: name,
        number: no,
        address: address,
        role: role,
        email: email,
        password: password,
      });

      // Send registration data to backend - wallet will be created there
      const response = await Axios.post("http://localhost:3001/registration", {
        name: name,
        number: no,
        address: address,
        role: role,
        email: email,
        password: password,
      });

      console.log("Registration response:", response.data);

      if (response.data.success) {
        alert(
          `Registration successful! Your account has been created.\nWallet Address: ${response.data.walletAddress}\n\nPlease save this information safely.`
        );
        navigate("/");
      } else {
        alert(
          response.data.message || "Registration failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response) {
        // Server responded with error status
        console.error("Server error response:", error.response.data);
        alert(
          `Registration failed: ${
            error.response.data.message || error.response.data
          }`
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
        alert("Registration failed. Please try again.");
      }
      // alert("Registration failed. Please check your connection and try again.");
    } finally {
      setIsRegistering(false);
    }
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
          &nbsp; Registration
        </a>
      </nav>
      <div className="countainer">
        <div className="card">
          <div className="card-header p-3 pt-2">
            <div className="icon icon-lg icon-shape bg-gradient-success shadow-success text-center border-radius-xl mt-n4 position-absolute">
              <i className="material-icons opacity-10">question_answer</i>
            </div>
            <div className="text-end pt-1">
              <h4 className="mb-0 text-info">Registration</h4>
            </div>
          </div>
          <div className="fertiliser-body">
            <form onSubmit={register} name="form">
              <label className={"label-r"}> Name:</label>
              <div className="input-group input-group-outline mb-3">
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  placeholder="Enter your full name"
                  required
                  onChange={nameF}
                  disabled={isRegistering}
                />
              </div>

              <label className={"label-r"}> Contact No:</label>
              <div className="input-group input-group-outline mb-3 ">
                <input
                  type="tel"
                  id="contact"
                  name="contact"
                  className="form-control"
                  placeholder="+233 24 123 4567"
                  required
                  onChange={numberF}
                  disabled={isRegistering}
                />
              </div>

              <label className={"label-r"}> Email:</label>
              <div className="input-group input-group-outline mb-3 ">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter your email address"
                  required
                  onChange={emailF}
                  disabled={isRegistering}
                />
              </div>

              <label className={"label-r"}> Password:</label>
              <div className="input-group input-group-outline mb-3 ">
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter your password"
                  required
                  onChange={passwordF}
                  disabled={isRegistering}
                />
              </div>

              <label className={"label-r"}> Location:</label>
              <div className="input-group input-group-outline mb-3">
                <textarea
                  id="address"
                  name="address"
                  className="form-control"
                  placeholder="Enter your physical address here"
                  required
                  onChange={addressF}
                  disabled={isRegistering}
                />
              </div>

              <label className={"label-r"}> Register as:</label>
              <select
                id="role"
                name="role"
                className="form-select form-select-lg mb-3"
                required
                onChange={roleF}
                disabled={isRegistering}
              >
                <option value="farmer">Farmer</option>
                <option value="processor">Processor</option>
                <option value="retailer">Retailer</option>
                {/* <option value="consumer">Consumer</option>
                <option value="investor">Investor</option>
                <option value="qualitychecker">Quality Checker</option> */}
              </select>

              <div
                className="info-box mb-3 p-3"
                style={{
                  backgroundColor: "#e8f5e8",
                  borderRadius: "8px",
                  border: "1px solid #d4edda",
                }}
              >
                <p
                  className="mb-2"
                  style={{ color: "#155724", fontWeight: "bold" }}
                >
                  <i
                    className="material-icons"
                    style={{ fontSize: "18px", verticalAlign: "middle" }}
                  >
                    info
                  </i>
                  &nbsp; What happens when you register:
                </p>
                <ul
                  style={{
                    color: "#155724",
                    marginBottom: 0,
                    paddingLeft: "20px",
                  }}
                >
                  <li>
                    A secure blockchain wallet will be automatically created for
                    you
                  </li>
                  <li>Your wallet will be managed safely by our system</li>
                  <li>No technical blockchain knowledge required</li>
                  <li>Your account will be reviewed by our admin team</li>
                </ul>
              </div>

              <p className="note">
                <span style={{ color: "tomato" }}> Note: </span>
                <br />
                Please ensure your contact number is correct as the admin may
                need to verify your identity before approving your account.
                <br />
                <strong>
                  Your blockchain wallet will be created automatically - no
                  MetaMask or technical setup required!
                </strong>
              </p>

              <button
                type="submit"
                className="btn btn-lg bg-gradient-info btn-lg w-100 mt-4 mb-0"
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Creating Account & Wallet...
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Registration;

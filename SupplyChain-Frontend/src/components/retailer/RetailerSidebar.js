import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../../images/logo-ct.png";

function RetailerSidebar() {
  const location = useLocation();

  // Function to check if current path matches the nav item
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar-body">
      <div
        className="sidenav navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-0 fixed-start ms-0 bg-gradient-dark"
        id="sidenav-main"
      >
        <div className="baju sidenav-header">
          <a className="navbar-brand m-0" target="_blank">
            <Link to="/">
              <img src={logo} className="navbar-brand-img" alt="main_logo" />
              <span className="ms-1 font-weight-bold text-white">
                AgriChain
              </span>
            </Link>
          </a>
        </div>
        <hr className="horizontal light mt-0 mb-2" />
        <div
          className="collapse navbar-collapse w-auto max-height-vh-100 mb-3"
          id="sidenav-collapse-main"
        >
          <ul className="navbar-nav">
            <li className="nav-item nav-tile">
              <Link
                to="/retailer"
                className={`nav-link text-white ${
                  isActive("/retailer") ? "active bg-gradient-warning" : ""
                }`}
              >
                <div className="text-white text-center me-2 d-flex align-items-center justify-content-center">
                  <i className="material-icons opacity-10">dashboard</i>
                </div>
                <span className="nav-link-text ms-1">Dashboard</span>
              </Link>
            </li>

            <li className="nav-item mt-3">
              <div className="ps-4 ms-2 pb-2 text-uppercase text-xs text-white font-weight-bolder opacity-8">
                Features
              </div>
            </li>

            <li className="nav-item nav-tile">
              <Link
                to="/retailer/processorbroadcast"
                className={`nav-link text-white ${
                  isActive("/retailer/processorbroadcast")
                    ? "active bg-gradient-warning"
                    : ""
                }`}
              >
                <div className="text-white text-center me-2 d-flex align-items-center justify-content-center">
                  <i className="material-icons opacity-10">table_view</i>
                </div>
                <span className="nav-link-text ms-1">Processor Broadcast</span>
              </Link>
            </li>

            <li className="nav-item nav-tile">
              <Link
                to="/retailer/rprevioustransactions"
                className={`nav-link text-white ${
                  isActive("/retailer/rprevioustransactions")
                    ? "active bg-gradient-warning"
                    : ""
                }`}
              >
                <div className="text-white text-center me-2 d-flex align-items-center justify-content-center">
                  <i className="material-icons opacity-10">table_view</i>
                </div>
                <span className="nav-link-text ms-1">
                  Previous Transactions
                </span>
              </Link>
            </li>

            <li className="nav-item nav-tile">
              <Link
                to="/retailer/previousorders"
                className={`nav-link text-white ${
                  isActive("/retailer/previousorders")
                    ? "active bg-gradient-warning"
                    : ""
                }`}
              >
                <div className="text-white text-center me-2 d-flex align-items-center justify-content-center">
                  <i className="material-icons opacity-10">table_view</i>
                </div>
                <span className="nav-link-text ms-1">Customer Orders</span>
              </Link>
            </li>

            <li className="nav-item nav-tile">
              <Link
                to="/retailer/broadcastToCustomer"
                className={`nav-link text-white ${
                  isActive("/retailer/broadcastToCustomer")
                    ? "active bg-gradient-warning"
                    : ""
                }`}
              >
                <div className="text-white text-center me-2 d-flex align-items-center justify-content-center">
                  <i className="material-icons opacity-10">table_view</i>
                </div>
                <span className="nav-link-text ms-1">
                  Broadcast To Customer
                </span>
              </Link>
            </li>

            <li className="nav-item nav-tile">
              <Link
                to="/retailer/retailerbroadcasts"
                className={`nav-link text-white ${
                  isActive("/retailer/retailerbroadcasts")
                    ? "active bg-gradient-warning"
                    : ""
                }`}
              >
                <div className="text-white text-center me-2 d-flex align-items-center justify-content-center">
                  <i className="material-icons opacity-10">table_view</i>
                </div>
                <span className="nav-link-text ms-1">Retailer Broadcast</span>
              </Link>
            </li>

            <li className="nav-item nav-tile">
              <Link
                to="/retailer/status"
                className={`nav-link text-white ${
                  isActive("/retailer/status")
                    ? "active bg-gradient-warning"
                    : ""
                }`}
              >
                <div className="text-white text-center me-2 d-flex align-items-center justify-content-center">
                  <i className="material-icons opacity-10">table_view</i>
                </div>
                <span className="nav-link-text ms-1">Track Status</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RetailerSidebar;

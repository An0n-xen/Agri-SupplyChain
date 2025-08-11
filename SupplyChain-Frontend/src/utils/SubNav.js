// import React from 'react'

// function SubNav(props) {

//     const {heading} = props

//   return (
//     <div className='nav-body'>
//         <nav class="navbar navbar-main navbar-expand-lg px-0 mx-1 shadow-none border-radius-xl" id="navbarBlur"
//             navbar-scroll="true">
//             <div class="container-fluid py-1 px-3">
//                 <nav aria-label="breadcrumb">
//                     <ol class="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
//                         <li class="breadcrumb-item text-sm"><span class="opacity-5 text-dark" >Pages</span>
//                         </li>
//                         <li class="breadcrumb-item text-sm text-dark active" aria-current="page">{heading}</li>
//                     </ol>
//                 </nav>
//             </div>
//         </nav>
//     </div>
//   )
// }

// export default SubNav

import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { dbActions } from "../store/dbSlice";

function SubNav(props) {
  const { heading } = props;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear Redux state and localStorage
    dispatch(dbActions.logOut());
    // Navigate to welcome page
    navigate("/");
  };

  return (
    <div className="nav-body">
      <nav
        className="navbar navbar-main navbar-expand-lg px-0 mx-1 shadow-none border-radius-xl"
        id="navbarBlur"
        navbar-scroll="true"
      >
        <div className="container-fluid py-1 px-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
              <li className="breadcrumb-item text-sm">
                <span className="opacity-5 text-dark">Pages</span>
              </li>
              <li
                className="breadcrumb-item text-sm text-dark active"
                aria-current="page"
              >
                {heading}
              </li>
            </ol>
          </nav>
          <div className="ms-auto">
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogout}
              title="Logout"
            >
              <i className="material-icons opacity-10">logout</i>
              Logout
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default SubNav;

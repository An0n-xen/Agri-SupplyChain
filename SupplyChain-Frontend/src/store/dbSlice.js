// import { createSlice } from "@reduxjs/toolkit";
// import Axios from "axios";

// const dbSlice = createSlice({
//   name: "db",
//   initialState: {
//     userAcc: "",
//     loggedIn: false,
//     role: "",
//     reload: 0,
//     address: "0x75DED5e2eA4232Dcb97ebf23a0157210AB5B25D1",
//   },
//   reducers: {
//     reload(state, action) {
//       state.reload += 1;
//     },
//     userAccount(state, action) {
//       state.userAcc = action.payload;
//     },
//     logIn(state, action) {
//       state.loggedIn = true;
//     },
//     role(state, action) {
//       state.role = action.payload;
//     },
//   },
// });

// export const dbActions = dbSlice.actions;

// export default dbSlice;

import { createSlice } from "@reduxjs/toolkit";

// Helper functions to manage localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem("authState");
    if (serializedState === null) {
      return {
        userAcc: "",
        loggedIn: false,
        role: "",
        reload: 0,
        address: "0x75DED5e2eA4232Dcb97ebf23a0157210AB5B25D1",
      };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return {
      userAcc: "",
      loggedIn: false,
      role: "",
      reload: 0,
      address: "0x75DED5e2eA4232Dcb97ebf23a0157210AB5B25D1",
    };
  }
};

const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("authState", serializedState);
  } catch (err) {
    // Ignore write errors
  }
};

const dbSlice = createSlice({
  name: "db",
  initialState: loadState(), // Load initial state from localStorage
  reducers: {
    reload(state, action) {
      state.reload += 1;
      saveState(state);
    },
    userAccount(state, action) {
      state.userAcc = action.payload;
      saveState(state);
    },
    logIn(state, action) {
      state.loggedIn = true;
      saveState(state);
    },
    logOut(state, action) {
      state.loggedIn = false;
      state.userAcc = "";
      state.role = "";
      // Clear localStorage on logout
      localStorage.removeItem("authState");
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
    },
    role(state, action) {
      state.role = action.payload;
      saveState(state);
    },
  },
});

export const dbActions = dbSlice.actions;

export default dbSlice;

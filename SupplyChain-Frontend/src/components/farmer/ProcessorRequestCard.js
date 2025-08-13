import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { dbActions } from "../../store/dbSlice";
import { useSelector } from "react-redux";
import Payment from "../../../src/artifacts/contracts/Payment.sol/Payment.json";
import { ethers } from "ethers";
import { Logger } from "ethers/lib/utils";

function ProcessorRequestCard(props) {
  const { crop, processor, rquantity, qprice, id, crop_id, processor_name } =
    props;

  const dispatch = useDispatch();
  const paymentAddress = useSelector((state) => state.db.address);
  const acc = useSelector((state) => state.db.userAcc);
  const rejectHandler = async (e) => {
    await axios
      .delete(`http://localhost:3001/processorBidDelete/${id}`)
      .then((resp) => {
        alert(resp.data);
      });
    dispatch(dbActions.reload());
  };

  const insureHandler = async (e) => {
    // await axios
    //   .put(`http://localhost:3001/insure/${id}/${crop_id}`, {
    //     name: crop,
    //     quantity: rquantity,
    //     address: acc,
    //   })
    //   .then((resp) => {
    //     console.log(resp.data);
    //     alert(resp.data);
    //   });
    // dispatch(dbActions.reload());
    try {
      const resp = await axios.put(
        `http://localhost:3001/insure/${id}/${crop_id}`,
        {
          name: crop,
          quantity: rquantity,
          address: acc,
        }
      );

      console.log("Response:", resp.data);
      alert(resp.data);

      dispatch(dbActions.reload());
    } catch (error) {
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Status code:", error.response.status);
        alert(`Server Error: ${error.response.data}`);
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("No response from server. Please check your connection.");
      } else {
        console.error("Request setup error:", error.message);
        alert(`Error: ${error.message}`);
      }
    }
  };
  return (
    <div className="col-5 mb-xl-5 mb-4">
      <div className="card">
        <div className="card-header p-3 pt-2">
          <div className="text-end pt-1">
            <p className="display-7 mb-0 text-capitalize font-weight-bolder">
              Crop : {crop}
            </p>
          </div>
        </div>
        {/* <hr className="dark horizontal my-0"></hr> */}
        <div className="row">
          <div className="card-footer p-2">
            <p className="mb-0">
              <span className="text-success text-sm font-weight-bolder">
                Name :
              </span>
              &nbsp;&nbsp;{processor_name}&nbsp;&nbsp;&nbsp;&nbsp;
            </p>
          </div>
          <div className="card-footer p-2">
            <p className="mb-0">
              <span className="text-success text-sm font-weight-bolder">
                Requested Quantity :
              </span>
              &nbsp;&nbsp;{rquantity}&nbsp;&nbsp;&nbsp;&nbsp;
            </p>
          </div>
          <div className="card-footer p-2">
            <p className="mb-0">
              <span className="text-success text-sm font-weight-bolder">
                Quoted Price :
              </span>
              &nbsp;&nbsp;GH₵{qprice}&nbsp;&nbsp;&nbsp;&nbsp;
            </p>
          </div>
          <div className="row">
            <button
              type="submit"
              name="request"
              class="btn bg-gradient-success btn-lg w-40 ml-3 mr-2 mt-4 text-sm"
              onClick={insureHandler}
              value={id}
            >
              Insure
            </button>
            <button
              type="click"
              name="request"
              class="btn bg-gradient-danger btn-lg w-40 ml-1 mt-4"
              onClick={rejectHandler}
              value={id}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessorRequestCard;

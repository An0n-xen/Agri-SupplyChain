import React, { useEffect, useState } from "react";
import axios from "axios";
import Payment from "../../../src/artifacts/contracts/Payment.sol/Payment.json";
import { ethers } from "ethers";
import { Logger } from "ethers/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { dbActions } from "../../store/dbSlice";
function RProcessorCard(props) {
  const { product, price, available, id, seller, email } = props;

  const [result, setResult] = useState("");
  const [d, setD] = useState(false);

  const dispatch = useDispatch();
  const paymentAddress = useSelector((state) => state.db.address);
  const userId = useSelector((state) => state.db.userAcc);
  const [priceE, setPriceE] = useState(0);
  let results;

  useEffect(() => {
    axios
      .get("https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=INR,")
      .then((response) => {
        setPriceE(response.data.INR);
      });
  }, [priceE]);
  const payment = async (e) => {
    // pay karo
    e.preventDefault();
    await axios
      .post(`http://localhost:3001/paidProcessor/${id}`, {
        product,
        quantity: available,
        seller,
        buyer: userId,
        price,
        email,
      })
      .then((resp) => {
        console.log(resp.data);
        // Redirect to Paystack payment page
        window.location.href = resp.data.data.authorization_url;
      });
    dispatch(dbActions.reload());
  };
  return (
    <div className="col-3 mb-xl-5 mb-4">
      <div className="card">
        <div className="card-header p-3 pt-2">
          <div className="text-end pt-1">
            <p className="display-7 mb-0 text-capitalize font-weight-bolder">
              {product}
            </p>
          </div>
        </div>
        {/* <hr className="dark horizontal my-0"></hr> */}
        <div className="row">
          <div className="card-footer p-2">
            <p className="mb-0">
              <span className="text-success text-sm font-weight-bolder">
                Price :
              </span>
              &nbsp;&nbsp;GH₵ {price}&nbsp;&nbsp;&nbsp;&nbsp;
            </p>
          </div>
          <div className="card-footer p-2">
            <p className="mb-0">
              <span className="text-success text-sm font-weight-bolder">
                Available :
              </span>
              &nbsp;&nbsp;{available}&nbsp;&nbsp;&nbsp;&nbsp;
            </p>
          </div>
        </div>
        <div className="farmerproduct-body mt-1">
          <form>
            <div class="text-center">
              <button
                type="click"
                onClick={payment}
                name="broadcastCrop"
                class="btn btn-lg bg-gradient-info btn-lg w-100 mt-4 mb-0"
              >
                Pay
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RProcessorCard;

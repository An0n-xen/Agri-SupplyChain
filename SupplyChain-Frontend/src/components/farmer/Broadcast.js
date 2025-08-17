import React, { useState } from "react";
import "../../css/nucleo-icons.css";
import "../../css/nucleo-svg.css";
import "../../css/bootstrap.css";
import "../../css/material-dashboard.css";
import Sidebar from "./Sidebar";
import "../../css/broadcast.css";
import SubNav from "../../utils/SubNav";
import Axios from "axios";
import { useSelector } from "react-redux";

function Broadcast() {
  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const id = useSelector((state) => state.db.userAcc);

  const nameH = (e) => {
    setCrop(e.target.value);
  };

  const quantityH = (e) => {
    setQuantity(e.target.value);
  };

  const unitH = (e) => {
    setUnit(e.target.value);
  };

  const priceH = (e) => {
    setPrice(e.target.value);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage("Saving broadcast to database...");

    try {
      const response = await Axios.post(
        "http://localhost:3001/farmerbrodcast",
        {
          crop: crop,
          quantity: quantity,
          unit: unit,
          price: price,
          id: id,
        }
      );

      // Update loading message when blockchain processing starts
      if (
        response.data.message &&
        response.data.message.includes("blockchain")
      ) {
        setLoadingMessage("Adding to blockchain... This may take a moment");
      }

      // Show success message
      if (response.data.blockchainTx) {
        alert(
          `Success! ${response.data.message}\nBlockchain TX: ${response.data.blockchainTx}`
        );
      } else {
        alert(response.data.message || response.data);
      }

      // Reset form
      setCrop("");
      setQuantity("");
      setUnit("kg");
      setPrice("");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to add broadcast. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="home-body">
      <div className="left-body">
        <Sidebar broad="1"></Sidebar>
      </div>
      <div className="right-body">
        <SubNav heading="Broadcast"></SubNav>
        <div className="broadcast-body">
          <h3>Add a new Broadcast!</h3>
          <div className="broadcast-form">
            <div className="card">
              <div className="card-header p-3 pt-2">
                <div className="icon icon-lg icon-shape bg-gradient-success shadow-success text-center border-radius-xl mt-n4 position-absolute">
                  <i className="material-icons opacity-10">question_answer</i>
                </div>
                <div className="text-end pt-1">
                  <h4 className="mb-0 text-info">Details</h4>
                </div>
              </div>
              <div className="crop-body">
                <form onSubmit={submitHandler}>
                  <div className="input-group input-group-outline mb-3">
                    <input
                      type="text"
                      id="P"
                      name="P"
                      className="form-control"
                      placeholder="Enter crop name"
                      onChange={nameH}
                      value={crop}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Quantity and Unit in a row */}
                  <div className="row mb-3">
                    <div className="col-8">
                      <div className="input-group input-group-outline">
                        <input
                          type="number"
                          id="K"
                          name="K"
                          className="form-control"
                          placeholder="Quantity"
                          step="0.01"
                          min="0.01"
                          onChange={quantityH}
                          value={quantity}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="col-4">
                      <select
                        id="unit"
                        name="unit"
                        className="form-select form-select-lg"
                        style={{
                          height: "42px",
                          fontSize: "14px",
                          border: "1px solid #d2d6da",
                          borderRadius: "0.375rem",
                        }}
                        onChange={unitH}
                        value={unit}
                        required
                        disabled={isLoading}
                      >
                        <option value="kg">Kilograms (kg)</option>
                        <option value="pieces">Pieces</option>
                        <option value="tonnes">Tonnes</option>
                        <option value="bags">Bags</option>
                        <option value="boxes">Boxes</option>
                        <option value="crates">Crates</option>
                        <option value="bundles">Bundles</option>
                        <option value="sacks">Sacks</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group input-group-outline mb-3">
                    <input
                      type="number"
                      id="temperature"
                      name="temperature"
                      className="form-control"
                      placeholder="Expected Price (in GH₵)"
                      step="0.01"
                      min="0.01"
                      onChange={priceH}
                      value={price}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      name="broadcastCrop"
                      className="btn btn-lg bg-gradient-info btn-lg w-100 mt-4 mb-0"
                      disabled={isLoading}
                      style={{ position: "relative" }}
                    >
                      {isLoading ? (
                        <span className="d-flex align-items-center justify-content-center">
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Processing...
                        </span>
                      ) : (
                        "Add Broadcast"
                      )}
                    </button>
                  </div>

                  {/* Loading Message */}
                  {isLoading && loadingMessage && (
                    <div className="mt-3 text-center">
                      <div
                        className="alert alert-info d-flex align-items-center"
                        role="alert"
                      >
                        <div
                          className="spinner-grow spinner-grow-sm me-2"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="d-flex flex-column align-items-start">
                          <span>{loadingMessage}</span>
                          {loadingMessage.includes("blockchain") && (
                            <small className="text-muted mt-1">
                              <i
                                className="material-icons"
                                style={{
                                  fontSize: "14px",
                                  verticalAlign: "middle",
                                }}
                              >
                                link
                              </i>
                              Storing on blockchain for permanent record
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for the loader */}
      <style jsx>{`
        .spinner-grow-sm {
          width: 1rem;
          height: 1rem;
        }

        .alert-info {
          background-color: #e3f2fd;
          border-color: #bbdefb;
          color: #0d47a1;
        }

        form[disabled] {
          opacity: 0.6;
          pointer-events: none;
        }

        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
          border-width: 0.2em;
        }
      `}</style>
    </div>
  );
}

export default Broadcast;

import axios from "axios";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { dbActions } from "../../store/dbSlice";

function QualityCard(props) {
  const { crop, lotId, farmerId, quantity, processor } = props;
  const [samples, setSamples] = useState("");
  const [defect, setDefect] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const dispatch = useDispatch();
  const acc = useSelector((state) => state.db.userAcc);

  const sample = async (e) => {
    setSamples(e.target.value);
  };

  const defective = async (e) => {
    setDefect(e.target.value);
  };

  const remark = async (e) => {
    setRemarks(e.target.value);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage("Submitting quality report...");

    try {
      const response = await axios.post("http://localhost:3001/qualityReport", {
        crop: crop,
        quantity: quantity,
        id: lotId,
        samples: samples,
        defect: defect,
        remarks: remarks,
        qualityCheckerAccount: acc,
      });

      // Update loading message when blockchain processing starts
      if (
        response.data.message &&
        response.data.message.includes("blockchain")
      ) {
        setLoadingMessage("Adding quality check to blockchain...");
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
      setSamples("");
      setDefect("");
      setRemarks("");
      dispatch(dbActions.reload());
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit quality report. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="col-3 mb-xl-5 mb-4">
      <div className={`card ${isLoading ? "loading-card" : ""}`}>
        <div className="card-header p-3 pt-2">
          <div className="text-end pt-1">
            <p className="display-6 mb-0 text-capitalize font-weight-bolder">
              {crop}
            </p>
          </div>
        </div>

        <div className="quality-row ml-1">
          <div className="card-footer p-2">
            <p className="mb-0">
              <span className="text-success text-sm font-weight-bolder">
                Lot ID :
              </span>
              &nbsp;&nbsp;{lotId}&nbsp;&nbsp;&nbsp;&nbsp;
            </p>
          </div>
          <div className="card-footer p-2">
            <p className="mb-0">
              <span className="text-success text-sm font-weight-bolder">
                Quantity :
              </span>
              &nbsp;&nbsp;{quantity}&nbsp;&nbsp;&nbsp;&nbsp;
            </p>
          </div>
        </div>

        <div className="farmerproduct-body mt-1">
          <form onSubmit={submitHandler}>
            <div className="input-group input-group-outline mb-3">
              <input
                type="number"
                id="N"
                name="N"
                className="form-control"
                placeholder="Sample Size"
                required
                value={samples}
                onChange={sample}
                disabled={isLoading}
              />
            </div>
            <div className="input-group input-group-outline mb-3">
              <input
                type="number"
                id="P"
                name="P"
                className="form-control"
                placeholder="Defective"
                required
                value={defect}
                onChange={defective}
                disabled={isLoading}
              />
            </div>
            <div className="input-group input-group-outline mb-3">
              <input
                className="form-control"
                placeholder="Remarks"
                type="text"
                required
                value={remarks}
                onChange={remark}
                disabled={isLoading}
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                name="broadcastCrop"
                className="btn btn-lg bg-gradient-info btn-lg w-100 mt-4 mb-0"
                disabled={isLoading}
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
                  "Push Report"
                )}
              </button>
            </div>

            {/* Loading Message */}
            {isLoading && loadingMessage && (
              <div className="mt-3">
                <div className="quality-loader">
                  <div className="quality-loader-icon">
                    <div
                      className="spinner-grow spinner-grow-sm text-info"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                  <div className="quality-loader-content">
                    <div className="quality-loader-message">
                      {loadingMessage}
                    </div>
                    {loadingMessage.includes("blockchain") && (
                      <div className="quality-loader-submessage">
                        <i className="material-icons">verified_user</i>
                        Recording quality check permanently
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Inline CSS for the loader */}
      <style jsx>{`
        .loading-card {
          position: relative;
          opacity: 0.9;
        }

        .quality-loader {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #e8f5e9;
          border-radius: 6px;
          border: 1px solid #a5d6a7;
          font-size: 13px;
        }

        .quality-loader-icon {
          margin-right: 10px;
        }

        .quality-loader-content {
          flex: 1;
        }

        .quality-loader-message {
          color: #2e7d32;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .quality-loader-submessage {
          display: flex;
          align-items: center;
          color: #1b5e20;
          font-size: 11px;
        }

        .quality-loader-submessage i {
          font-size: 14px;
          margin-right: 4px;
        }

        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
          border-width: 0.2em;
        }

        .spinner-grow-sm {
          width: 0.75rem;
          height: 0.75rem;
        }

        .loading-card input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .loading-card button:disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }

        /* Success animation for quality check */
        @keyframes checkmark {
          0% {
            transform: scale(0) rotate(45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(45deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(45deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default QualityCard;

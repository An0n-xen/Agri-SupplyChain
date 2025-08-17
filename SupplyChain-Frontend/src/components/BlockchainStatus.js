// Add this component to show blockchain verification status
// File: SupplyChain-Frontend/src/components/BlockchainStatus.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import "../css/blockchain-status.css";

function BlockchainStatus({ cropId }) {
  const [blockchainData, setBlockchainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onChain, setOnChain] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);

  useEffect(() => {
    if (cropId) {
      checkBlockchainStatus();
    }
  }, [cropId]);

  const checkBlockchainStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost:3001/getBlockchainData/${cropId}`
      );

      if (response.data.success) {
        setBlockchainData(response.data.data);
        setOnChain(true);
      } else {
        setOnChain(false);
      }
    } catch (err) {
      setOnChain(false);
      if (err.response && err.response.status === 404) {
        // Data not on blockchain yet
        setError("Supply chain data not yet stored on blockchain");
      } else {
        setError("Error checking blockchain status");
      }
    } finally {
      setLoading(false);
    }
  };

  const storeOnBlockchain = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `http://localhost:3001/storeSupplyChainOnBlockchain/${cropId}`
      );

      if (response.data.success) {
        setError(null);
        // Refresh status
        await checkBlockchainStatus();
        alert("Supply chain data successfully stored on blockchain!");
      }
    } catch (err) {
      setError(
        "Failed to store data on blockchain: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const getBlockchainExplorerUrl = () => {
    // Update this based on your blockchain network
    const explorerBaseUrl =
      process.env.REACT_APP_BLOCKCHAIN_EXPLORER ||
      "https://sepolia.etherscan.io";
    return `${explorerBaseUrl}/address/${process.env.REACT_APP_SUPPLY_CHAIN_TRACKING_ADDRESS}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="blockchain-status-container">
      <div className="blockchain-header">
        <h4>
          <i className="material-icons">link</i>
          Blockchain Verification
        </h4>
        {onChain ? (
          <span className="status-badge verified">
            <i className="material-icons">verified</i>
            On-Chain
          </span>
        ) : (
          <span className="status-badge not-verified">
            <i className="material-icons">warning</i>
            Off-Chain
          </span>
        )}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Checking blockchain status...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <i className="material-icons">error</i>
          {error}
        </div>
      )}

      {onChain && blockchainData && (
        <div className="blockchain-data">
          <h5>Blockchain Timestamps:</h5>
          <div className="timestamp-list">
            {blockchainData.farmer && (
              <div className="timestamp-item">
                <span className="label">Farmer Added:</span>
                <span className="value">
                  {formatTimestamp(blockchainData.farmer.timestamp)}
                </span>
              </div>
            )}
            {blockchainData.qualityChecker && (
              <div className="timestamp-item">
                <span className="label">Quality Checked:</span>
                <span className="value">
                  {formatTimestamp(blockchainData.qualityChecker.timestamp)}
                </span>
              </div>
            )}
            {blockchainData.processor && (
              <div className="timestamp-item">
                <span className="label">Processed:</span>
                <span className="value">
                  {formatTimestamp(blockchainData.processor.timestamp)}
                </span>
              </div>
            )}
            {blockchainData.retailer && (
              <div className="timestamp-item">
                <span className="label">At Retailer:</span>
                <span className="value">
                  {formatTimestamp(blockchainData.retailer.timestamp)}
                </span>
              </div>
            )}
            {/* {blockchainData.customers &&
              blockchainData.customers.length > 0 && (
                <div className="timestamp-item">
                  <span className="label">First Customer:</span>
                  <span className="value">
                    {formatTimestamp(blockchainData.customers[0].timestamp)}
                  </span>
                </div>
              )} */}
          </div>

          <div className="blockchain-actions">
            <a
              href={getBlockchainExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-info"
            >
              <i className="material-icons">open_in_new</i>
              View on Explorer
            </a>
          </div>
        </div>
      )}

      {!onChain && !loading && (
        <div className="not-on-chain">
          <p>
            This supply chain data has not been stored on the blockchain yet.
          </p>
          <button
            className="btn btn-info btn-sm"
            onClick={storeOnBlockchain}
            disabled={loading}
          >
            <i className="material-icons">cloud_upload</i>
            Store on Blockchain
          </button>
        </div>
      )}

      <div className="blockchain-info">
        <i className="material-icons">info</i>
        <small>
          Blockchain storage ensures immutable and transparent tracking of the
          supply chain journey.
        </small>
      </div>
    </div>
  );
}

export default BlockchainStatus;

import React, { useState } from "react";
import SubNav from "./SubNav";
import Sidebar from "../components/farmer/Sidebar";
import "../css/bootstrap.css";
import LeftTimelineCard from "./LeftTimelineCard";
import RightTimelineCard from "./RightTimelineCard";
import BlockchainStatus from "../components/BlockchainStatus";
import Payment from "../../src/artifacts/contracts/Payment.sol/Payment.json";
import { ethers } from "ethers";
import { useSelector } from "react-redux";
import "../css/trackstatus.css";
import axios from "axios";

function TrackStatus() {
  const [id, setId] = useState("");
  const [currentCropId, setCurrentCropId] = useState(null); // Track current crop ID
  const paymentAddress = useSelector((state) => state.db.address);
  const [results, setResults] = useState([]);

  const lotId = async (e) => {
    setId(e.target.value);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    console.log(id);
    setCurrentCropId(id); // Set the current crop ID for blockchain component

    loadData();
  };

  async function loadData() {
    await axios
      .get(`http://localhost:3001/getData/${id}`)
      .then(async (response) => {
        setResults(await getArray(response.data));
        console.log(response.data);
      });
  }

  async function getArray(arr) {
    let res = [];
    for (const obj of arr) {
      for (const jso of obj) {
        res.push(jso);
      }
    }
    return res;
  }

  let i = 0;

  const list = results.map((d) => {
    if (i % 2 === 0) {
      i++;
      return (
        <LeftTimelineCard
          key={`left-${i}-${d.public_key}`}
          public_key={d.public_key}
          name={d.name}
          role={d.role}
          contact={d.phone_number || d.number}
          address={d.physical_address || d.address}
        ></LeftTimelineCard>
      );
    }
    i++;
    return (
      <RightTimelineCard
        key={`right-${i}-${d.public_key}`}
        public_key={d.public_key}
        name={d.name}
        role={d.role}
        contact={d.phone_number || d.number}
        address={d.physical_address || d.address}
      ></RightTimelineCard>
    );
  });

  return (
    <div className="home-body">
      <div className="left-body">
        <Sidebar status="1" />
      </div>
      <div className="right-body">
        <SubNav heading="Track Status"></SubNav>
        <div className="broadcast-body">
          <h3>Batch Report</h3>
          <form onSubmit={submitHandler} className="lot-form">
            <div className="input-group input-group-outline mb-3 mr-4 lot-field">
              <input
                type="number"
                required
                value={id}
                onChange={lotId}
                className="form-control"
                placeholder="Enter lotID"
              />
            </div>
            <div>
              <div className="text-center">
                <button
                  type="submit"
                  name="broadcastCrop"
                  className="btn btn-m bg-gradient-info mb-0"
                >
                  Track Product
                </button>
              </div>
            </div>
          </form>

          {/* Add Blockchain Status Component */}
          {currentCropId && results.length > 0 && (
            <BlockchainStatus cropId={currentCropId} />
          )}

          {/* Supply Chain Timeline */}
          {results.length > 0 && (
            <div className="timeline-container">
              <h4 className="timeline-header">Supply Chain Journey</h4>
              {list}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackStatus;

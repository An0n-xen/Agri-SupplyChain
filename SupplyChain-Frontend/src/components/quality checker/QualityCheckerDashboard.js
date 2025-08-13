import React, { useEffect, useState } from "react";
import SubNav from "../../utils/SubNav";
import QualitySidebar from "./QualitySidebar";
import quality from "../../images/quality.png";
import { useSelector } from "react-redux";
import axios from "axios";

function QualityDashboard() {
  const id = useSelector((state) => state.db.userAcc);
  const [result, setResult] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:3001/getUser/${id}`).then((response) => {
      console.log(response.data[0]);
      setResult(response.data[0]);
    });
  }, []);

  return (
    <div className="home-body">
      <div className="left-body">
        <QualitySidebar dash="1"></QualitySidebar>
      </div>
      <div className="right-body">
        <SubNav heading="Dashboard"></SubNav>
        <section className="sectiona about-section gray-bga" id="about">
          <div className="container">
            <div className="row align-items-center flex-row-reverse">
              <div className="col-lg-7">
                <div className="about-text go-to">
                  <h3 className="dark-color">Hello, {result.name}!</h3>
                  <h6 className="theme-color lead">
                    {" "}
                    Occupation: Quality Checker
                  </h6>
                  <p>
                    I <mark>inspect</mark> and verify the quality of
                    agricultural products throughout the supply chain. My role
                    is crucial in ensuring that products meet the required
                    standards before they move from farmers to processors. I
                    conduct thorough examinations, document defects, and provide
                    quality certificates that help maintain trust in the supply
                    chain.
                  </p>
                  <div className="row about-list">
                    <div className="col-md-5">
                      <div className="media">
                        <label>Name</label>
                        <p>{result.name}</p>
                      </div>
                      <div className="media">
                        <label>Address</label>
                        <p>{result.physical_address}</p>
                      </div>
                    </div>
                    <div className="col-md-9">
                      <div className="media">
                        <label>Account</label>
                        <p>{result.public_key}</p>
                      </div>
                      <div className="media">
                        <label>Phone</label>
                        <p>{result.phone_number}</p>
                      </div>
                      <div className="media">
                        <label>Email</label>
                        <p>{result.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="about-avatar">
                  <img className="imga" src={quality} title="" alt="" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default QualityDashboard;

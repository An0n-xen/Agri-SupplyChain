import React from "react";
import InterestCard from "../../utils/InterestCard";
import PaymentCard from "./PaymentCard";
import SubNav from "../../utils/SubNav";
import ProcessorSidebar from "./ProcessorSidebar";
import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

function PendingPayments() {
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const id = useSelector((state) => state.db.userAcc);
  const reload = useSelector((state) => state.db.reload);

  useEffect(() => {
    const fetchPendingPayments = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `http://localhost:3001/pendingPayments/${id}`
        );
        console.log("Fetched data:", response.data);

        // Handle the response structure { count: 0, data: [...] }
        if (response.data && response.data.data) {
          setResult(response.data.data);
        } else if (Array.isArray(response.data)) {
          setResult(response.data);
        } else {
          setResult([]);
        }
      } catch (err) {
        console.error("Error fetching pending payments:", err);
        setError("Failed to load pending payments");
        setResult([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPendingPayments();
    } else {
      setLoading(false);
      setResult([]);
    }
  }, [id, reload]);

  const list = result.map((d, index) => {
    return (
      <PaymentCard
        key={d.crop_id + index} // Add a unique key
        name={d.seller}
        eprice={d.price}
        requestedQuantity={d.quantity}
        lotId={d.crop_id}
        qprice={d.bid_price}
        crop_name={d.crop_name}
        buyer_email={d.email}
      />
    );
  });

  return (
    <div className="home-body">
      <div className="left-body">
        <ProcessorSidebar ppayment="1" />
      </div>
      <div className="right-body">
        <SubNav heading="Pending Payments" />
        <div className="broadcast-body">
          <h3>Pending Payments</h3>
          <div className="container-fluid py-4">
            <div className="row">
              {loading ? (
                <div className="col-12">
                  <p>Loading pending payments...</p>
                </div>
              ) : error ? (
                <div className="col-12">
                  <p className="text-danger">{error}</p>
                </div>
              ) : result.length === 0 ? (
                <div className="col-12">
                  <p>No Pending Payments yet...</p>
                </div>
              ) : (
                list
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PendingPayments;

import React from "react";
import InterestCard from "../../utils/InterestCard";
import SubNav from "../../utils/SubNav";
import ProcessorSidebar from "./ProcessorSidebar";
import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";

function ProcessorInterest() {
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const id = useSelector((state) => state.db.userAcc);
  const reload = useSelector((state) => state.db.reload);
  const dispatch = useDispatch();

  let results;

  useEffect(() => {
    fetchProcessorInterests();
  }, [reload]);

  const fetchProcessorInterests = () => {
    axios
      .get(`http://localhost:3001/processorInterest/${id}`)
      .then((response) => {
        results = response.data;
        setResult(results);
        console.log(response.data);
      })
      .catch((error) => {
        console.error("Error fetching processor interests:", error);
      });
  };

  const handleRemoveInterest = async (interestId) => {
    if (window.confirm("Are you sure you want to remove this interest?")) {
      setLoading(true);
      try {
        await axios.delete(
          `http://localhost:3001/processorInterest/${interestId}`
        );

        // Remove the item from local state immediately for better UX
        setResult((prevResult) =>
          prevResult.filter((item) => item.id !== interestId)
        );

        // Optional: Trigger reload in Redux if other components depend on it
        dispatch({ type: "TRIGGER_RELOAD" });

        console.log("Interest removed successfully");
      } catch (error) {
        console.error("Error removing interest:", error);
        alert("Failed to remove interest. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const list = result.map((element) => {
    return (
      <tr key={element.id}>
        <td>
          <div className="d-flex px-2 py-1">
            <div>
              <i className="material-icons opacity-10">grass</i>
            </div>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <div className="d-flex flex-column justify-content-center">
              <h5 className="mb-0 text-sm">{element.crop_name}</h5>
            </div>
          </div>
        </td>
        <td>
          <p className="text-xs font-weight-bold mb-0">GH₵ {element.price}</p>
        </td>
        <td className="align-middle text-center text-sm">
          <h6 className="mb-0 text-sm">{element.quantity}</h6>
        </td>
        <td className="align-middle text-center text-sm">
          <h6 className="mb-0 text-sm">{element.status}</h6>
        </td>
        <td className="align-middle text-center">
          {element.status?.toLowerCase() === "open" ? (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleRemoveInterest(element.id)}
              disabled={loading}
              title="Remove Interest"
            >
              <i className="material-icons text-sm">delete</i>
            </button>
          ) : (
            <span className="text-muted text-xs">-</span>
          )}
        </td>
      </tr>
    );
  });

  return (
    <div className="home-body">
      <div className="left-body">
        <ProcessorSidebar pInterest="1" />
      </div>
      <div className="right-body">
        <SubNav heading="Processor Interest"></SubNav>
        <br></br>
        <div className="gainers-body">
          <div className="container-fluid py-0">
            <div className="row">
              <div className="col-12">
                <div className="card my-4">
                  <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
                    <div className="bg-gradient-danger shadow-success border-radius-lg pt-4 pb-3">
                      <h6 className="text-white text-capitalize ps-3">
                        Processor Interests!
                      </h6>
                    </div>
                  </div>
                  <div className="card-body px-0 pb-2">
                    <div className="table-responsive p-0">
                      <table className="table align-items-center mb-0">
                        <thead>
                          <tr>
                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                              Farmer Name
                            </th>
                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                              Price Quoted
                            </th>
                            <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                              Quantity Requested
                            </th>
                            <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                              Status
                            </th>
                            <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>{list}</tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessorInterest;

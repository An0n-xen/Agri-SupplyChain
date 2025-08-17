// Add these helper functions to your server/index.js

// Helper function to add farmer to blockchain
async function addFarmerToBlockchain(cropId, farmerData) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545"
    );
    const adminWallet = new ethers.Wallet(
      process.env.ADMIN_PRIVATE_KEY,
      provider
    );
    const contract = new ethers.Contract(
      SUPPLY_CHAIN_TRACKING_ADDRESS,
      SupplyChainTrackingABI,
      adminWallet
    );

    console.log(`\n🌾 Adding farmer to blockchain for crop ${cropId}`);

    const tx = await contract.addFarmer(
      cropId,
      farmerData.public_key || ethers.constants.AddressZero,
      farmerData.name || "",
      "farmer",
      farmerData.phone_number || farmerData.number || "",
      farmerData.physical_address || farmerData.address || ""
    );

    console.log("Farmer transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log(
      "✅ Farmer added to blockchain. Gas used:",
      receipt.gasUsed.toString()
    );

    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error("❌ Error adding farmer to blockchain:", error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to add quality checker to blockchain
async function addQualityCheckerToBlockchain(cropId, qualityCheckerData) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545"
    );
    const adminWallet = new ethers.Wallet(
      process.env.ADMIN_PRIVATE_KEY,
      provider
    );
    const contract = new ethers.Contract(
      SUPPLY_CHAIN_TRACKING_ADDRESS,
      SupplyChainTrackingABI,
      adminWallet
    );

    console.log(`\n🔍 Adding quality checker to blockchain for crop ${cropId}`);

    const tx = await contract.addQualityChecker(
      cropId,
      qualityCheckerData.public_key || ethers.constants.AddressZero,
      qualityCheckerData.name || "",
      "qualitychecker",
      qualityCheckerData.phone_number || qualityCheckerData.number || "",
      qualityCheckerData.physical_address || qualityCheckerData.address || ""
    );

    console.log("Quality checker transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log(
      "✅ Quality checker added to blockchain. Gas used:",
      receipt.gasUsed.toString()
    );

    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error(
      "❌ Error adding quality checker to blockchain:",
      error.message
    );
    return { success: false, error: error.message };
  }
}

// Helper function to add processor to blockchain
async function addProcessorToBlockchain(cropId, processorData) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545"
    );
    const adminWallet = new ethers.Wallet(
      process.env.ADMIN_PRIVATE_KEY,
      provider
    );
    const contract = new ethers.Contract(
      SUPPLY_CHAIN_TRACKING_ADDRESS,
      SupplyChainTrackingABI,
      adminWallet
    );

    console.log(`\n🏭 Adding processor to blockchain for crop ${cropId}`);

    const tx = await contract.addProcessor(
      cropId,
      processorData.public_key || ethers.constants.AddressZero,
      processorData.name || "",
      "processor",
      processorData.phone_number || processorData.number || "",
      processorData.physical_address || processorData.address || ""
    );

    console.log("Processor transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log(
      "✅ Processor added to blockchain. Gas used:",
      receipt.gasUsed.toString()
    );

    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error("❌ Error adding processor to blockchain:", error.message);
    return { success: false, error: error.message };
  }
}

// Modified farmer broadcast endpoint
app.post("/farmerbrodcast", async (req, res) => {
  const userAccount = req.body.id;
  const crop = req.body.crop;
  const quantity = req.body.quantity;
  const price = req.body.price;

  db.query(
    "INSERT INTO farmer_brodcast (public_key,crop,quantity,price,status) VALUES(?,?,?,?,?)",
    [userAccount, crop, quantity, price, "open"],
    async (err, result) => {
      if (result) {
        const cropId = result.insertId; // Get the newly created crop ID

        // Get farmer details
        db.query(
          "SELECT * FROM users WHERE public_key = ?",
          [userAccount],
          async (err, farmerResult) => {
            if (farmerResult && farmerResult.length > 0) {
              const farmer = farmerResult[0];

              // Add farmer to blockchain
              const blockchainResult = await addFarmerToBlockchain(
                cropId,
                farmer
              );

              if (blockchainResult.success) {
                res.send(
                  `Successfully Broadcasted and added to blockchain! Crop ID: ${cropId}`
                );
              } else {
                res.send(
                  `Broadcast successful but blockchain storage failed: ${blockchainResult.error}. Crop ID: ${cropId}`
                );
              }
            } else {
              res.send("Successfully Broadcasted");
            }
          }
        );
      } else {
        res.send("Broadcast failed");
      }
    }
  );
});

app.post("/farmerbrodcast", async (req, res) => {
  try {
    const { crop, quantity, unit, price, id } = req.body;

    // Validate the unit is one of the allowed values
    const allowedUnits = [
      "kg",
      "tonnes",
      "bags",
      "pieces",
      "boxes",
      "crates",
      "bundles",
      "sacks",
    ];
    if (!allowedUnits.includes(unit)) {
      return res.status(400).json({ message: "Invalid unit specified" });
    }

    // Insert into database
    const query = `
      INSERT INTO farmer_brodcast (crop, quantity, unit, price, public_key, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    db.execute(
      query,
      [crop, quantity, unit, price, id],
      async (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Failed to add broadcast" });
        }

        if (result) {
          const cropId = result.insertId; // Get the newly created crop ID

          // Get farmer details
          db.query(
            "SELECT * FROM users WHERE public_key = ?",
            [id],
            async (err, farmerResult) => {
              if (err) {
                console.error("Error fetching farmer details:", err);
                return res.json({
                  message:
                    "Broadcast added successfully but couldn't fetch farmer details for blockchain",
                  cropId: cropId,
                });
              }

              if (farmerResult && farmerResult.length > 0) {
                const farmer = farmerResult[0];

                // Add farmer to blockchain
                const blockchainResult = await addFarmerToBlockchain(
                  cropId,
                  farmer
                );

                if (blockchainResult.success) {
                  res.json({
                    message:
                      "Broadcast added successfully and stored on blockchain!",
                    cropId: cropId,
                    blockchainTx: blockchainResult.txHash,
                  });
                } else {
                  res.json({
                    message: `Broadcast added successfully but blockchain storage failed: ${blockchainResult.error}`,
                    cropId: cropId,
                  });
                }
              } else {
                res.json({
                  message: "Broadcast added successfully!",
                  cropId: cropId,
                });
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.error("Error adding broadcast:", error);
    res.status(500).json({ message: "Failed to add broadcast" });
  }
});

// Modified quality report endpoint
app.post("/qualityReport", async (req, res) => {
  const crop = req.body.crop;
  const quantity = req.body.quantity;
  const samples = req.body.samples;
  const defect = req.body.defect;
  const remarks = req.body.remarks;
  const cropId = req.body.id;

  db.query(
    "UPDATE insurance SET status = ? WHERE crop_id = ?",
    ["done", cropId],
    (err, result) => {
      if (result) {
        db.query(
          "INSERT INTO report (crop_id,sample_size,defective,remark) VALUES(?,?,?,?)",
          [cropId, samples, defect, remarks],
          async (err, result) => {
            if (result) {
              // Get quality checker details (using the first quality checker)
              db.query(
                "SELECT * FROM users WHERE role = ? LIMIT 1",
                ["qualitychecker"],
                async (err, qualityResult) => {
                  if (qualityResult && qualityResult.length > 0) {
                    const qualityChecker = qualityResult[0];

                    // Add quality checker to blockchain
                    const blockchainResult =
                      await addQualityCheckerToBlockchain(
                        cropId,
                        qualityChecker
                      );

                    if (blockchainResult.success) {
                      res.send(
                        "Successfully Added report and quality checker to blockchain!"
                      );
                    } else {
                      res.send(
                        `Report added but blockchain storage failed: ${blockchainResult.error}`
                      );
                    }
                  } else {
                    res.send("Successfully Added report");
                  }
                }
              );
            } else {
              res.send("Failed to add report");
            }
          }
        );
      } else {
        res.send("Unable to update insurance status");
      }
    }
  );
});

// Modified processor payment endpoint
app.post("/paid", async (req, res) => {
  const crop_name = req.body.crop_name;
  const qprice = req.body.qprice;
  const lotId = req.body.lotId;
  const buyer = req.body.buyer;
  const seller = req.body.seller;
  const quantity = req.body.quantity;

  db.query(
    "INSERT INTO orders (crop_name,price,crop_id,buyer,seller,quantity,status) VALUES(?,?,?,?,?,?,?)",
    [crop_name, qprice, lotId, buyer, seller, quantity, "no"],
    async (err, result) => {
      if (result) {
        // Update farmer broadcast status
        db.query(
          "UPDATE farmer_brodcast SET status = ? WHERE id = ?",
          ["retailer", lotId],
          (err, result) => {
            if (result) {
              // Update offers status
              db.query(
                "UPDATE offers SET status = ? WHERE crop_id = ?",
                ["paid", lotId],
                (err, result) => {
                  if (result) {
                    // Update insurance status
                    db.query(
                      "UPDATE insurance SET status = ? WHERE crop_id = ?",
                      ["sold", lotId],
                      async (err, result) => {
                        if (result) {
                          // Get processor details
                          db.query(
                            "SELECT * FROM users WHERE public_key = ?",
                            [buyer],
                            async (err, processorResult) => {
                              if (
                                processorResult &&
                                processorResult.length > 0
                              ) {
                                const processor = processorResult[0];

                                // Add processor to blockchain
                                const blockchainResult =
                                  await addProcessorToBlockchain(
                                    lotId,
                                    processor
                                  );

                                if (blockchainResult.success) {
                                  res.send(
                                    "Payment done and processor added to blockchain!"
                                  );
                                } else {
                                  res.send(
                                    `Payment done but blockchain storage failed: ${blockchainResult.error}`
                                  );
                                }
                              } else {
                                res.send("Payment done");
                              }
                            }
                          );
                        } else {
                          res.send(
                            "Payment done but failed to update insurance"
                          );
                        }
                      }
                    );
                  } else {
                    res.send("Payment done but failed to update offers");
                  }
                }
              );
            } else {
              res.send("Payment done but failed to update broadcast");
            }
          }
        );
      } else {
        res.send("Payment failed");
      }
    }
  );
});

async function processSuccessfulPayment(
  crop_name,
  qprice,
  lotId,
  buyer,
  seller,
  quantity
) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO orders (crop_name,price,crop_id,buyer,seller,quantity,status) VALUES(?,?,?,?,?,?,?)",
      [crop_name, qprice, lotId, buyer, seller, quantity, "no"], // Changed status to "paid"
      (err, result) => {
        if (err) {
          console.error("Error inserting order:", err);
          reject(new Error("Failed to insert order"));
          return;
        }

        if (result) {
          db.query(
            "UPDATE farmer_brodcast SET status = ? WHERE id = ?",
            ["retailer", lotId],
            (err, result) => {
              if (err) {
                console.error("Error updating farmer_brodcast:", err);
                reject(new Error("Failed to update farmer_brodcast"));
                return;
              }

              if (result) {
                db.query(
                  "UPDATE offers SET status = ? WHERE crop_id = ?",
                  ["paid", lotId],
                  (err, result) => {
                    if (err) {
                      console.error("Error updating offers:", err);
                      reject(new Error("Failed to update offers"));
                      return;
                    }

                    if (result) {
                      db.query(
                        "UPDATE insurance SET status = ? WHERE crop_id = ?",
                        ["sold", lotId],
                        async (err, result) => {
                          if (err) {
                            console.error("Error updating insurance:", err);
                            reject(new Error("Failed to update insurance"));
                            return;
                          }

                          if (result) {
                            console.log(
                              "All database updates completed successfully"
                            );

                            // Get processor details and add to blockchain
                            db.query(
                              "SELECT * FROM users WHERE public_key = ?",
                              [buyer],
                              async (err, processorResult) => {
                                if (err) {
                                  console.error(
                                    "Error fetching processor details:",
                                    err
                                  );
                                  // Still resolve but note the blockchain issue
                                  resolve({
                                    success: true,
                                    message:
                                      "Payment processed successfully but couldn't fetch processor for blockchain",
                                    orderId: result.insertId,
                                  });
                                  return;
                                }

                                if (
                                  processorResult &&
                                  processorResult.length > 0
                                ) {
                                  const processor = processorResult[0];

                                  // Add processor to blockchain
                                  try {
                                    const blockchainResult =
                                      await addProcessorToBlockchain(
                                        lotId,
                                        processor
                                      );

                                    if (blockchainResult.success) {
                                      console.log(
                                        `✅ Processor added to blockchain for crop ${lotId}`
                                      );
                                      resolve({
                                        success: true,
                                        message:
                                          "Payment processed successfully and processor added to blockchain!",
                                        orderId: result.insertId,
                                        blockchainTx: blockchainResult.txHash,
                                      });
                                    } else {
                                      console.error(
                                        `❌ Failed to add processor to blockchain: ${blockchainResult.error}`
                                      );
                                      resolve({
                                        success: true,
                                        message: `Payment processed successfully but blockchain storage failed: ${blockchainResult.error}`,
                                        orderId: result.insertId,
                                      });
                                    }
                                  } catch (blockchainError) {
                                    console.error(
                                      "Blockchain error:",
                                      blockchainError
                                    );
                                    resolve({
                                      success: true,
                                      message:
                                        "Payment processed successfully but blockchain storage failed",
                                      orderId: result.insertId,
                                    });
                                  }
                                } else {
                                  resolve({
                                    success: true,
                                    message: "Payment processed successfully",
                                    orderId: result.insertId,
                                  });
                                }
                              }
                            );
                          } else {
                            reject(new Error("Failed to update insurance"));
                          }
                        }
                      );
                    } else {
                      reject(new Error("Failed to update offers"));
                    }
                  }
                );
              } else {
                reject(new Error("Failed to update farmer_brodcast"));
              }
            }
          );
        } else {
          reject(new Error("Failed to insert order"));
        }
      }
    );
  });
}

// Optional: Add retailer when they pay processor
app.post("/paidProcessor/:id", async (req, res) => {
  const id = req.params["id"];
  const userAccount = req.body.buyer;
  const seller = req.body.seller;
  const product = req.body.product;
  const quantity = req.body.quantity;
  const price = req.body.price;

  db.query(
    "UPDATE processor SET status = ? WHERE crop_id = ?",
    ["close", id],
    (err, result) => {
      if (result) {
        db.query(
          "INSERT INTO retailer (crop_id,product_name,quantity,seller,buyer,status,price) VALUES(?,?,?,?,?,?,?)",
          [id, product, quantity, seller, userAccount, "open", price],
          async (err, result) => {
            if (result) {
              // Get retailer details
              db.query(
                "SELECT * FROM users WHERE public_key = ?",
                [userAccount],
                async (err, retailerResult) => {
                  if (retailerResult && retailerResult.length > 0) {
                    const retailer = retailerResult[0];

                    // Add retailer to blockchain
                    try {
                      const provider = new ethers.providers.JsonRpcProvider(
                        process.env.BLOCKCHAIN_RPC_URL ||
                          "http://localhost:8545"
                      );
                      const adminWallet = new ethers.Wallet(
                        process.env.ADMIN_PRIVATE_KEY,
                        provider
                      );
                      const contract = new ethers.Contract(
                        SUPPLY_CHAIN_TRACKING_ADDRESS,
                        SupplyChainTrackingABI,
                        adminWallet
                      );

                      console.log(
                        `\n🏪 Adding retailer to blockchain for crop ${id}`
                      );

                      const tx = await contract.addRetailer(
                        id,
                        retailer.public_key || ethers.constants.AddressZero,
                        retailer.name || "",
                        "retailer",
                        retailer.phone_number || retailer.number || "",
                        retailer.physical_address || retailer.address || ""
                      );

                      console.log("Retailer transaction sent:", tx.hash);
                      const receipt = await tx.wait();
                      console.log(
                        "✅ Retailer added to blockchain. Gas used:",
                        receipt.gasUsed.toString()
                      );

                      res.send(
                        "Successfully bought by retailer and added to blockchain!"
                      );
                    } catch (error) {
                      console.error(
                        "❌ Error adding retailer to blockchain:",
                        error.message
                      );
                      res.send(
                        "Successfully bought by retailer but blockchain storage failed"
                      );
                    }
                  } else {
                    res.send("Successfully bought by retailer");
                  }
                }
              );
            } else {
              res.send("Failed to insert retailer record");
            }
          }
        );
      } else {
        res.send("Unable to update processor status");
      }
    }
  );
});

// Optional: Add customer when they buy from retailer
app.post("/customerPayment/:id", async (req, res) => {
  const id = req.params["id"];
  const userAccount = req.body.buyer;
  const seller = req.body.seller;
  const product = req.body.product;
  const quantity = req.body.quantityE;
  const price = req.body.price;
  let newQ;
  let tableQ;

  db.query(
    "INSERT INTO sales (crop_id,product_name,quantity,buyer, seller,price) VALUES(?,?,?,?,?,?)",
    [id, product, quantity, userAccount, seller, price],
    async (err, result) => {
      if (result) {
        // Get customer details
        db.query(
          "SELECT * FROM users WHERE public_key = ?",
          [userAccount],
          async (err, customerResult) => {
            if (customerResult && customerResult.length > 0) {
              const customer = customerResult[0];

              // Add customer to blockchain
              try {
                const provider = new ethers.providers.JsonRpcProvider(
                  process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545"
                );
                const adminWallet = new ethers.Wallet(
                  process.env.ADMIN_PRIVATE_KEY,
                  provider
                );
                const contract = new ethers.Contract(
                  SUPPLY_CHAIN_TRACKING_ADDRESS,
                  SupplyChainTrackingABI,
                  adminWallet
                );

                console.log(
                  `\n🛒 Adding customer to blockchain for crop ${id}`
                );

                const tx = await contract.addCustomer(
                  id,
                  customer.public_key || ethers.constants.AddressZero,
                  customer.name || "",
                  "customer",
                  customer.phone_number || customer.number || "",
                  customer.physical_address || customer.address || ""
                );

                console.log("Customer transaction sent:", tx.hash);
                const receipt = await tx.wait();
                console.log(
                  "✅ Customer added to blockchain. Gas used:",
                  receipt.gasUsed.toString()
                );
              } catch (error) {
                console.error(
                  "❌ Error adding customer to blockchain:",
                  error.message
                );
              }
            }
          }
        );

        // Continue with existing quantity update logic
        db.query(
          "SELECT * FROM customer WHERE crop_id = ?",
          [id],
          (err, result) => {
            if (result) {
              tableQ = result[0].quantity;
              newQ = tableQ - quantity;

              if (newQ == 0) {
                db.query(
                  "UPDATE customer SET quantity = ?, status = ? WHERE crop_id = ?",
                  [newQ, "close", id],
                  (err, result) => {
                    if (result) {
                      res.send("Successfully updated and added to blockchain!");
                    } else {
                      res.send("Unable to update");
                    }
                  }
                );
              } else {
                db.query(
                  "UPDATE customer SET quantity = ? WHERE crop_id = ?",
                  [newQ, id],
                  (err, result) => {
                    if (result) {
                      res.send("Successfully updated and added to blockchain!");
                    } else {
                      res.send("Unable to update");
                    }
                  }
                );
              }
            } else {
              res.send("Unable to update");
            }
          }
        );
      }
    }
  );
});

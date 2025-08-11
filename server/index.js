const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const { ethers } = require("ethers");
const crypto = require("crypto");
require("dotenv").config({ path: "../.env" });
const bcrypt = require("bcrypt");
const { sendPasswordResetOTP, verifyOTP, clearOTP } = require("./emailer"); // Adjust path as needed

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: process.env.DB_PASSWORD,
  database: "supplychain",
});

// Temporary storage functions (use Redis or database in production)
const temporaryTransactions = new Map();

const saltRounds = 12;
// Encryption key for storing private keys (add this to your .env file)
const ENCRYPTION_KEY_STRING =
  process.env.WALLET_ENCRYPTION_KEY || "your-32-character-secret-key-here!!";

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(ENCRYPTION_KEY_STRING)
  .digest();
const ALGORITHM = "aes-256-cbc";

// Function to encrypt private key
function encryptPrivateKey(privateKey) {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Encrypt the private key
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Combine IV and encrypted data (IV is needed for decryption)
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    throw new Error("Encryption failed: " + error.message);
  }
}

// Function to decrypt private key (for when you need to use the wallet)
function decryptPrivateKey(encryptedPrivateKey) {
  try {
    // Split the IV and encrypted data
    const parts = encryptedPrivateKey.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encryptedData = parts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed: " + error.message);
  }
}

// Create wallet function
function createWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  };
}

// Helper function to get user's wallet for transactions (use this in other parts of your app)
function getUserWallet(userId, callback) {
  db.query(
    "SELECT encrypted_private_key FROM users WHERE id = ?",
    [userId],
    (err, result) => {
      if (err || result.length === 0) {
        return callback(err || new Error("User not found"), null);
      }

      try {
        const decryptedPrivateKey = decryptPrivateKey(
          result[0].encrypted_private_key
        );
        const wallet = new ethers.Wallet(decryptedPrivateKey);
        callback(null, wallet);
      } catch (decryptError) {
        callback(decryptError, null);
      }
    }
  );
}

// Function to perform transactions on behalf of users
function performTransactionForUser(
  userId,
  contractAddress,
  contractABI,
  functionName,
  params,
  callback
) {
  getUserWallet(userId, (err, wallet) => {
    if (err) {
      return callback(err, null);
    }

    try {
      // Connect to blockchain provider
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.BLOCKCHAIN_RPC_URL
      );
      const walletWithProvider = wallet.connect(provider);

      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        walletWithProvider
      );

      // Call contract function
      contract[functionName](...params)
        .then((transaction) => transaction.wait())
        .then((receipt) => {
          // Log transaction
          db.query(
            "INSERT INTO wallet_transactions (user_id, transaction_hash, transaction_type, status) VALUES (?, ?, ?, 'success')",
            [userId, receipt.transactionHash, functionName]
          );
          callback(null, receipt);
        })
        .catch((txError) => {
          // Log failed transaction
          db.query(
            "INSERT INTO wallet_transactions (user_id, transaction_type, status, error_message) VALUES (?, ?, 'failed', ?)",
            [userId, functionName, txError.message]
          );
          callback(txError, null);
        });
    } catch (error) {
      callback(error, null);
    }
  });
}

// Updated registration endpoint with automatic wallet creation
app.post("/registration", async (req, res) => {
  const { name, number, address, role, email, password } = req.body;

  // Validate input
  if (!name || !number || !address || !role || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be filled",
    });
  }

  try {
    // Check if user already exists (by phone number)
    const existingUser = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM users WHERE phone_number = ?",
        [number],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this phone number already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new wallet for the user
    const walletInfo = createWallet();

    // Encrypt the private key and mnemonic before storing
    const encryptedPrivateKey = encryptPrivateKey(walletInfo.privateKey);
    const encryptedMnemonic = encryptPrivateKey(walletInfo.mnemonic);

    // Insert user data with generated wallet and hashed password
    const insertQuery = `
      INSERT INTO users 
      (name, phone_number, physical_address, role, email, password, public_key, encrypted_private_key, encrypted_mnemonic, role_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
    `;

    const insertResult = await new Promise((resolve, reject) => {
      db.query(
        insertQuery,
        [
          name,
          number,
          address,
          role,
          email,
          hashedPassword,
          walletInfo.address,
          encryptedPrivateKey,
          encryptedMnemonic,
        ],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    console.log("New user registered:", {
      id: insertResult.insertId,
      name: name,
      walletAddress: walletInfo.address,
      role: role,
    });

    res.json({
      success: true,
      message:
        "Registration successful! Your account is pending admin approval.",
      walletAddress: walletInfo.address,
      userId: insertResult.insertId,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.message && error.message.includes("wallet")) {
      return res.status(500).json({
        success: false,
        message: "Failed to create wallet. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
});

app.post("/authentication", async (req, res) => {
  const loginId = req.body.loginId; // This will be email or phone number
  const password = req.body.password;

  console.log(loginId, "checking authentication for");

  // Validate input
  if (!loginId || !password) {
    return res.status(400).json({
      success: false,
      message: "Login ID and password are required",
    });
  }

  try {
    // Check if loginId is email or phone number and query accordingly
    const users = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM users WHERE (email = ? OR phone_number = ?) AND role_status != ?",
        [loginId, loginId, "pending"],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or account pending approval",
      });
    }

    const user = users[0];
    console.log("User found:", {
      id: user.id,
      name: user.name,
      role: user.role,
    });

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Password is valid, return user data
    console.log("Authentication successful for user:", user.name);

    res.send({
      role: user.role,
      publicKey: user.public_key,
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
});

const getUserByEmailOrPhone = async (loginId) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM users WHERE email = ? OR phone_number = ?",
      [loginId, loginId],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.length > 0 ? result[0] : null);
        }
      }
    );
  });
};

// Send OTP route
app.post("/forgot-password/send-code", async (req, res) => {
  const { loginId } = req.body;

  console.log("Sending OTP to:", loginId);

  try {
    // First check if user exists and get their email
    const user = await getUserByEmailOrPhone(loginId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await sendPasswordResetOTP(user.email, user.name);

    res.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send verification code",
    });
  }
});

// Verify OTP route
app.post("/forgot-password/verify-code", async (req, res) => {
  const { loginId, code } = req.body;

  try {
    const user = await getUserByEmailOrPhone(loginId);
    const result = verifyOTP(user.email, code);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
});

// Verify OTP route
app.post("/forgot-password/reset-password", async (req, res) => {
  const { loginId, code, newPassword } = req.body;

  try {
    const user = await getUserByEmailOrPhone(loginId);
    // const result = verifyOTP(user.email, code);

    // if (result.success) {
    //   res.json(result);
    // } else {
    //   res.status(400).json(result);
    // }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password in the database
    db.query(
      "UPDATE users SET password = ? WHERE email = ? OR phone_number = ?",
      [hashedPassword, user.email, user.phone_number],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to reset password",
          });
        }

        // Clear OTP after successful password reset
        clearOTP(user.email);

        res.json({
          success: true,
          message: "Password reset successfully",
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
});

// New endpoint to get user wallet address by user ID (for admin purposes)
app.get("/user-wallet/:userId", (req, res) => {
  const userId = req.params.userId;

  db.query(
    "SELECT public_key, name, role FROM users WHERE id = ?",
    [userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        walletAddress: result[0].public_key,
        name: result[0].name,
        role: result[0].role,
      });
    }
  );
});

app.post("/microfinance", (req, res) => {
  const id = req.body.id;
  const price = req.body.price;
  const quantity = req.body.quantity;
  const name = req.body.name;
  const dates = req.body.dates;
  db.query(
    "SELECT * FROM loan WHERE user = ?  && status != ?",
    [id, "paid"],
    (err, result) => {
      console.log(result);
      if (result.length === 0) {
        db.query(
          "INSERT INTO loan (user,crop_name,quantity,exp_price,yield_date,holding,amount,status,days_left) VALUES(?,?,?,?,?,?,?,?,?)",
          [id, name, quantity, price, dates, 0, 0, "open", dates],
          (err, result) => {
            if (result) {
              res.send("Successfull 3");
            } else {
              res.send("Something went wrong");
            }
          }
        );
      } else {
        res.send("You have already taken a loan");
      }
    }
  );
});

app.post("/offer/:idd", (req, res) => {
  const id = req.params["idd"];
  const cropId = req.body.id;
  const seller = req.body.name;
  const userAccount = req.body.user;
  const crop = req.body.crop;
  const quantity = req.body.quantity;
  const price = req.body.price;
  const priceC = req.body.priceC;
  //  insert bid once

  db.query(
    "SELECT * FROM offers WHERE buyer = ? && crop_id = ?",
    [userAccount, id],
    (err, result) => {
      console.log("crop id", id);
      console.log("bid results", result);
      if (result.length == 0) {
        db.query(
          "INSERT INTO offers (buyer,seller,price,crop_id,crop_name,quantity,bid_price,status) VALUES(?,?,?,?,?,?,?,?)",
          [userAccount, seller, price, id, crop, quantity, priceC, "open"],
          (err, result) => {
            if (result) {
              res.send("Successfully Bidded");
            }
          }
        );
      } else {
        res.send("Already bidded");
      }
    }
  );
});

// app.post("/farmerbrodcast", (req, res) => {
//   const userAccount = req.body.id;
//   const crop = req.body.crop;
//   const quantity = req.body.quantity;
//   const price = req.body.price;
//   db.query(
//     "INSERT INTO farmer_brodcast (public_key,crop,quantity,price,status) VALUES(?,?,?,?,?)",
//     [userAccount, crop, quantity, price, "open"],
//     (err, result) => {
//       if (result) {
//         res.send("Successfully Broadcasted");
//       }
//     }
//   );
// });

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

    await db.execute(query, [crop, quantity, unit, price, id]);

    res.json("Broadcast added successfully!");
  } catch (error) {
    console.error("Error adding broadcast:", error);
    res.status(500).json({ message: "Failed to add broadcast" });
  }
});

// Function to process successful payment (your commented database operations)
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
        if (result) {
          db.query(
            "UPDATE farmer_brodcast SET status = ? WHERE id = ?",
            ["retailer", lotId],
            (err, result) => {
              if (result) {
                db.query(
                  "UPDATE offers SET status = ? WHERE crop_id = ?",
                  ["paid", lotId],
                  (err, result) => {
                    if (result) {
                      db.query(
                        "UPDATE insurance SET status = ? WHERE crop_id = ?",
                        ["sold", lotId],
                        (err, result) => {
                          if (result) {
                            console.log(
                              "All database updates completed successfully"
                            );
                            resolve("Payment processed successfully");
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

async function processRetailPayment(
  product,
  price,
  id,
  seller,
  buyer,
  quantity
) {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE processor SET status = ? WHERE crop_id = ?",
      ["close", id],
      (err, result) => {
        if (result) {
          db.query(
            "INSERT INTO retailer (crop_id, product_name, quantity, seller, buyer, status, price) VALUES(?,?,?,?,?,?,?)",
            [id, product, quantity, seller, buyer, "open", price],
            (err, result) => {
              if (result) {
                console.log("Retailer purchase processed successfully");
                resolve("Successfully bought by retailer");
              } else {
                reject(new Error("Failed to insert into retailer table"));
              }
            }
          );
        } else {
          reject(new Error("Failed to update processor table"));
        }
      }
    );
  });
}

// Helper function to generate unique reference
function generateReference() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ref_${timestamp}_${random}`;
}

// Fixed /paid endpoint
app.post("/paid", async (req, res) => {
  const { crop_name, qprice, lotId, buyer, seller, quantity, email } = req.body;

  // Fixed URL - removed extra quote
  const url = `${PAYSTACK_BASE_URL}/transaction/initialize`;

  console.log(crop_name, qprice, lotId, buyer, seller, quantity);

  const totalAmount = parseFloat(qprice) * 100;
  const reference = generateReference();

  // CREATE THE transactionData OBJECT HERE - This was missing!
  const transactionData = {
    email: email, // Assuming buyer is an email address
    amount: totalAmount,
    reference: reference,
    callback_url: "http://localhost:3000/payment-success", // Your frontend success page
    metadata: {
      custom_fields: [
        {
          display_name: "Crop Name",
          variable_name: "crop_name",
          value: crop_name,
        },
        {
          display_name: "Lot ID",
          variable_name: "lot_id",
          value: lotId.toString(),
        },
        {
          display_name: "Seller",
          variable_name: "seller",
          value: seller,
        },
        {
          display_name: "Quantity",
          variable_name: "quantity",
          value: quantity.toString(),
        },
        {
          display_name: "Unit Price",
          variable_name: "unit_price",
          value: qprice.toString(),
        },
        {
          display_name: "Processor Pay",
          variable_name: "processor_pay",
          value: "processor_pay",
        },
      ],
    },
  };

  const payer = "processor_pay";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionData), // Now transactionData is defined!
    });

    const data = await response.json();

    if (response.ok && data.status) {
      console.log("Transaction initialized successfully:", data);

      // Store transaction details - IMPORTANT: Use the reference from Paystack response
      const paystackReference = data.data.reference;
      temporaryTransactions.set(paystackReference, {
        crop_name,
        qprice,
        lotId,
        buyer,
        seller,
        quantity,
        payer,
      });

      // Send successful response back to client
      res.status(200).json({
        success: true,
        message: "Payment initialized successfully",
        data: {
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference,
        },
      });
    } else {
      console.error("Error initializing transaction:", data);
      res.status(400).json({
        success: false,
        message: data.message || "Failed to initialize transaction",
        error: data,
      });
    }
  } catch (error) {
    console.error("Network error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

app.post(
  "/paystack-webhook",
  express.json({ type: "application/json" }),
  async (req, res) => {
    const event = req.body;
    console.log("Webhook received:", event);

    // Handle successful charge
    if (event.event === "charge.success") {
      const { reference, status, metadata } = event.data;

      if (status === "success") {
        try {
          // Get the stored transaction details

          console.log("Meta data", metadata.custom_fields.at(-1).value);
          if (metadata.custom_fields.at(-1).value === "retail_pay") {
            const transactionDetails = await getTemporaryTransaction(reference);

            console.log("retail payer");

            if (transactionDetails) {
              const { product, price, id, seller, buyer, quantity } =
                transactionDetails;

              // Execute your database operations here
              await processRetailPayment(
                product,
                price,
                id,
                seller,
                buyer,
                quantity
              );

              console.log(
                `Payment processed successfully for reference: ${reference}`
              );

              // Clean up temporary storage
              await removeTemporaryTransaction(reference);
            } else {
              console.error(
                "Transaction details not found for reference:",
                reference
              );
            }
          } else if (metadata.custom_fields.at(-1).value == "processor_pay") {
            const transactionDetails = await getTemporaryTransaction(reference);

            if (transactionDetails) {
              const { crop_name, qprice, lotId, buyer, seller, quantity } =
                transactionDetails;

              // Execute your database operations here
              await processSuccessfulPayment(
                crop_name,
                qprice,
                lotId,
                buyer,
                seller,
                quantity
              );

              console.log(
                `Payment processed successfully for reference: ${reference}`
              );

              // Clean up temporary storage
              await removeTemporaryTransaction(reference);
            } else {
              console.error(
                "Transaction details not found for reference:",
                reference
              );
            }
          }
        } catch (error) {
          console.error("Error processing webhook:", error);
        }
      }
    }

    res.status(200).send("OK");
  }
);

async function storeTemporaryTransaction(reference, data) {
  temporaryTransactions.set(reference, data);
  // In production, store this in database or Redis with TTL
}

async function getTemporaryTransaction(reference) {
  return temporaryTransactions.get(reference);
}

async function removeTemporaryTransaction(reference) {
  temporaryTransactions.delete(reference);
}

app.post("/qualityReport", (req, res) => {
  const crop = req.body.crop;
  const quantity = req.body.quantity;
  const samples = req.body.samples;
  const defect = req.body.defect;
  const remarks = req.body.remarks;
  const id = req.body.id;
  db.query(
    "UPDATE  insurance SET status = ? WHERE crop_id = ?",
    ["done", id],
    (err, result) => {
      if (result) {
        db.query(
          "INSERT INTO report (crop_id,sample_size,defective,remark) VALUES(?,?,?,?)",
          [id, samples, defect, remarks],
          (err, result) => {
            if (result) {
              res.send("Successfully Added report");
            }
          }
        );
      } else {
        res.send("Unable to update");
      }
    }
  );
});

app.get("/verify", (req, res) => {
  db.query(
    "SELECT * FROM users WHERE role_status = ?",
    ["pending"],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/requestPendingPayments", (req, res) => {
  db.query(
    "SELECT * FROM loan WHERE status = ?",
    ["pending"],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/retailerBrodcast", (req, res) => {
  db.query(
    "SELECT * FROM processor JOIN user_wallet_info ON processor.processor = user_wallet_info.wallet_address WHERE processor.status = ? ORDER BY processor.id DESC",
    ["open"],
    (err, result) => {
      if (result) {
        console.log(result);
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/loanRequest", (req, res) => {
  db.query("SELECT * FROM loan WHERE status = ?", ["open"], (err, result) => {
    if (result) {
      res.send(result);
    } else {
      res.send(false);
    }
  });
});

app.get("/orders/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    `SELECT *
    FROM orders
    JOIN user_wallet_info 
        ON orders.buyer = user_wallet_info.wallet_address
    WHERE seller = ?;
`,
    [id],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/payback/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM loan WHERE user = ? && status = ?",
    [id, "processed"],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/investorRequests/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM loan WHERE user = ? && status = ?",
    [id, "open"],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/requestCreditScore/:id", (req, res) => {
  const id = req.params["id"];
  db.query("SELECT * FROM credit_score WHERE user = ?", [id], (err, result) => {
    if (result) {
      res.send(result);
    } else {
      res.send(false);
    }
  });
});

app.get("/history/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM orders WHERE seller = ? ORDER BY id DESC",
    [id],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/previousPurchases/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM sales WHERE buyer = ? ORDER BY id DESC",
    [id],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/pendingPayments/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    `SELECT 
          offers.crop_id,
          offers.price, 
          offers.seller,
          offers.bid_price,
          offers.crop_name,
          offers.quantity,
          buyer.email AS buyer_email,
          buyer.name  AS buyer_name,
          seller.name AS seller_name
    FROM offers
    JOIN insurance 
        ON offers.crop_id = insurance.crop_id
    JOIN user_wallet_info AS buyer 
        ON offers.buyer = buyer.wallet_address
    JOIN user_wallet_info AS seller
        ON offers.seller = seller.wallet_address
    WHERE offers.buyer = ? 
  AND insurance.status = ?;
`,
    [id, "done"],
    (err, result) => {
      console.log(result);
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database query failed",
          error: err.message,
        });
      }

      if (result && result.length > 0) {
        res.send(result);
      } else {
        res.status(200).json({
          success: true,
          data: [],
          count: 0,
          message: "No pending payments found",
        });
      }
    }
  );
});

// Todo
// Change from no to paid
app.get("/processorPurchases/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM orders WHERE buyer = ? && status = ?",
    [id, "no"],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/retailerPurchases/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM retailer WHERE buyer = ? && status = ?",
    [id, "open"],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/processorInterest/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM offers WHERE buyer = ? ORDER BY id DESC",
    [id, "open"],

    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.put("/insure/:id/:crop_id", (req, res) => {
  const id = req.params["id"];
  const crop_id = req.params["crop_id"];
  const name = req.body.name;
  const quantity = req.body.quantity;

  db.query(
    "SELECT * FROM insurance WHERE crop_id = ?",
    [crop_id],
    (err, result) => {
      if (result.length == 0) {
        db.query(
          "UPDATE offers  SET status = ?  WHERE crop_id = ?",
          ["approve", id],

          (err, result) => {
            if (result) {
              db.query(
                "INSERT INTO insurance (crop_id,status,name,quantity) VALUES(?,?,?,?)",
                [crop_id, "insured", name, quantity],
                (err, result) => {
                  if (result) {
                    res.send("Successfull 1");
                  }
                }
              );
            } else {
              res.send(false);
            }
          }
        );
      } else {
        res.send("already insured");
      }
    }
  );
});
app.get("/processorBids/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    `SELECT *
    FROM offers
    JOIN user_wallet_info
        ON offers.seller = user_wallet_info.wallet_address
    WHERE seller = ? AND status = ?;
    `,
    [id, "open"],

    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});
app.get("/qualityC", (req, res) => {
  db.query(
    "SELECT * FROM insurance WHERE status = ? ORDER BY id DESC",
    ["insured"],

    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

// app.get("/farmerbrodcastcall/:id", (req, res) => {
//   const id = req.params["id"];
//   db.query(
//     "SELECT * FROM farmer_brodcast WHERE public_key = ? && status = ?",
//     [id, "open"],

//     (err, result) => {
//       if (result) {
//         res.send(result);
//       } else {
//         res.send(false);
//       }
//     }
//   );
// });

app.get("/farmerbrodcastcall/:id", async (req, res) => {
  try {
    const farmerId = req.params.id;

    const query = `
      SELECT id, crop, quantity, unit, price, created_at 
      FROM farmer_broadcasts 
      WHERE farmer_id = ? 
      ORDER BY created_at DESC
    `;

    const [results] = await db.execute(query, [farmerId]);
    res.json(results);
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    res.status(500).json({ message: "Failed to fetch broadcasts" });
  }
});

app.get("/reportScore/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM report WHERE crop_id = ?",
    [id],

    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});
app.get("/ratingScore/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM credit_score WHERE user = ? ",
    [id],

    (err, result) => {
      if (result.length == 0) {
        // insert
        db.query(
          "INSERT INTO credit_score (user,total_rating_count,credit_score) VALUES(?,?,?)",
          [id, 0, 0],
          (err, result) => {
            if (result) {
              res.send({
                total_rating_count: 0,
                credit_score: 0,
              });
            }
          }
        );
      } else {
        res.send(result);
      }
    }
  );
});
app.get("/report/:lotId", (req, res) => {
  const id = req.params["lotId"];
  db.query(
    "SELECT * FROM report WHERE crop_id = ? ",
    [id],

    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});
app.get("/farmerbrodcastcallprocessor", (req, res) => {
  db.query(
    // "SELECT * FROM farmer_brodcast WHERE  status = ? ORDER BY id DESC"
    `SELECT farmer_brodcast.*, user_wallet_info.name FROM farmer_brodcast JOIN user_wallet_info ON farmer_brodcast.public_key = user_wallet_info.wallet_address WHERE  farmer_brodcast.status = ? ORDER BY farmer_brodcast.id DESC`,
    ["open"],

    (err, result) => {
      console.log(result);
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});
app.get("/reailerBrodcasts/:id", (req, res) => {
  db.query(
    "SELECT * FROM customer WHERE  status = ? ORDER BY id DESC",
    ["open"],

    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});
app.get("/checkAvailability/:id/:quantity", (req, res) => {
  const id = req.params["id"];
  const quantity = req.params["quantity"];
  db.query(
    "SELECT * FROM customer WHERE  crop_id = ? && status = ? && quantity >= ?",
    [id, "open", quantity],

    (err, result) => {
      if (result.length > 0) {
        res.send(result);
      } else {
        res.send({
          text: "Enter a valid quantity",
        });
      }
    }
  );
});
app.delete("/reject/:id", (req, res) => {
  const id = req.params["id"];

  db.query("DELETE  FROM users WHERE id = ?", [id], (err, result) => {
    if (result) {
      res.send("Deleted Successfully");
    } else {
      res.send("Unable to Delete");
    }
  });
});
app.delete("/rejectInvestment/:id", (req, res) => {
  const id = req.params["id"];

  db.query(
    "DELETE  FROM loan WHERE user = ? && status = ?",
    [id, "open"],
    (err, result) => {
      if (result) {
        res.send("Deleted Successfully");
      } else {
        res.send("Unable to Delete");
      }
    }
  );
});
app.put("/approve/:id", (req, res) => {
  const id = req.params["id"];

  db.query(
    "UPDATE  users SET role_status = ? WHERE id = ?",
    ["approved", id],
    (err, result) => {
      if (result) {
        res.send("Successfully Updated");
      } else {
        res.send("Unable to update");
      }
    }
  );
});
app.put("/paidFarmerByInvestor/:id", (req, res) => {
  const id = req.params["id"];

  db.query(
    "UPDATE  loan SET status = ? WHERE user = ? && status = ?",
    ["processed", id, "pending"],
    (err, result) => {
      if (result) {
        res.send("Successfully Updated");
      } else {
        res.send("Unable to update");
      }
    }
  );
});
app.put("/paidToInvestor/:id", (req, res) => {
  const id = req.params["id"];

  db.query(
    "UPDATE  loan SET status = ? WHERE user = ? && status = ?",
    ["paid", id, "processed"],
    (err, result) => {
      if (result) {
        res.send("Successfully Updated");
      } else {
        res.send("Unable to update");
      }
    }
  );
});
app.put("/updateInvestment/:id", (req, res) => {
  const id = req.params["id"];

  db.query(
    "UPDATE  loan SET status  = ? WHERE user = ? && status = ?",
    ["pending", id, "open"],
    (err, result) => {
      if (result) {
        res.send("Successfully Updated");
      } else {
        res.send("Unable to update");
      }
    }
  );
});
app.put("/investorRequest/:id", (req, res) => {
  const id = req.params["id"];
  const holding = req.body.holding;
  const amount = req.body.amount;
  db.query(
    "UPDATE  loan SET holding = ?, amount = ? WHERE user = ?",
    [holding, amount, id],
    (err, result) => {
      if (result) {
        res.send("Successfully Updated");
      } else {
        res.send("Unable to update");
      }
    }
  );
});
app.put("/creditUpdate/:id", (req, res) => {
  const id = req.params["id"];
  const trc = req.body.trc;
  const cs = req.body.cs;
  db.query(
    "UPDATE  credit_score SET total_rating_count = ? , credit_score = ? WHERE user = ?",
    [trc, cs, id],
    (err, result) => {
      if (result) {
        res.send("Successfully Updated creditScore");
      } else {
        res.send("Unable to update");
      }
    }
  );
});
app.post("/brodcastToRetailer/:id", (req, res) => {
  const id = req.params["id"];
  const userAccount = req.body.id;
  const product = req.body.product;
  const quantity = req.body.quantity;
  const price = req.body.price;
  db.query(
    "UPDATE  orders SET status = ? WHERE crop_id = ?",
    ["yes", id],
    (err, result) => {
      if (result) {
        //insert

        db.query(
          "INSERT INTO processor (product_name,crop_id,quantity,price,processor,status) VALUES(?,?,?,?,?,?)",
          [product, id, quantity, price, userAccount, "open"],
          (err, result) => {
            if (result) {
              res.send("Successfully Brodcasted to retailer");
            }
          }
        );
      } else {
        res.send("Unable to update");
      }
    }
  );
});
app.post("/customerPayment/:id", (req, res) => {
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
    (err, result) => {
      if (result) {
        db.query(
          "SELECT * FROM customer WHERE crop_id = ?",
          [id],
          (err, result) => {
            if (result) {
              tableQ = result[0].quantity;
              newQ = tableQ - quantity;

              if (newQ == 0) {
                // update with status close
                db.query(
                  "UPDATE  customer SET  quantity = ? , status = ?  WHERE crop_id = ?",
                  [newQ, "close", id],
                  (err, result) => {
                    if (result) {
                      res.send("Successfully Updated in customer Db1");
                    } else {
                      res.send("Unable to update");
                    }
                  }
                );
              } else {
                // update only qunatity
                db.query(
                  "UPDATE  customer SET  quantity = ? WHERE crop_id = ?",
                  [newQ, id],
                  (err, result) => {
                    if (result) {
                      res.send("Successfully Updated in customer Db2");
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

app.post("/brodcastToCustomer/:id", (req, res) => {
  const id = req.params["id"];
  const userAccount = req.body.brodcaster;
  const price = req.body.price;
  let quantity;
  let product;
  db.query(
    "UPDATE  retailer SET status = ? WHERE crop_id = ?",
    ["yes", id],
    (err, result) => {
      if (result) {
        db.query(
          "SELECT * FROM retailer WHERE crop_id = ?",
          [id],
          (err, result) => {
            if (result) {
              quantity = result[0].quantity;
              product = result[0].product_name;

              db.query(
                "INSERT INTO customer (product_name,crop_id,quantity,price,retailer,status) VALUES(?,?,?,?,?,?)",
                [product, id, quantity, price, userAccount, "open"],
                (err, result) => {
                  if (result) {
                    res.send("Successfully Brodcasted to Customer");
                  }
                }
              );
            } else {
              res.send(false);
            }
          }
        );
      } else {
        res.send("Unable to update");
      }
    }
  );
});

// app.post("/paidProcessor/:id", (req, res) => {
//   const id = req.params["id"];
//   const userAccount = req.body.buyer;
//   const seller = req.body.seller;
//   const product = req.body.product;
//   const quantity = req.body.quantity;
//   const price = req.body.price;
//   db.query(
//     "UPDATE  processor SET status = ? WHERE crop_id = ?",
//     ["close", id],
//     (err, result) => {
//       if (result) {
//         //insert

//         db.query(
//           "INSERT INTO retailer (crop_id,product_name,quantity,seller,buyer,status,price) VALUES(?,?,?,?,?,?,?)",
//           [id, product, quantity, seller, userAccount, "open", price],
//           (err, result) => {
//             if (result) {
//               res.send("Successfully Bought by retailer");
//             }
//           }
//         );
//       } else {
//         res.send("Unable to update");
//       }
//     }
//   );
// });

app.post("/paidProcessor/:id", async (req, res) => {
  const id = req.params["id"];
  const buyer = req.body.buyer;
  const seller = req.body.seller;
  const product = req.body.product;
  const quantity = req.body.quantity;
  const price = req.body.price;
  const email = req.body.email;

  // Fixed URL - removed extra quote
  const url = `${PAYSTACK_BASE_URL}/transaction/initialize`;

  const totalAmount = parseFloat(price) * 100;
  const reference = generateReference();

  const transactionData = {
    email: email, // Assuming buyer is an email address
    amount: totalAmount,
    reference: reference,
    callback_url: "http://localhost:3000/payment-success", // Your frontend success page
    metadata: {
      custom_fields: [
        {
          display_name: "Product",
          variable_name: "product",
          value: product,
        },
        {
          display_name: "ID",
          variable_name: "id",
          value: id.toString(),
        },
        {
          display_name: "Seller",
          variable_name: "seller",
          value: seller,
        },
        {
          display_name: "Buyer",
          variable_name: "buyer",
          value: buyer,
        },
        {
          display_name: "Quantity",
          variable_name: "quantity",
          value: quantity.toString(),
        },
        {
          display_name: "Unit Price",
          variable_name: "unit_price",
          value: price.toString(),
        },
        {
          display_name: "Retail Pay",
          variable_name: "retail_pay",
          value: "retail_pay",
        },
      ],
    },
  };

  const payer = "retailer_pay";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionData), // Now transactionData is defined!
    });

    const data = await response.json();

    if (response.ok && data.status) {
      console.log("Transaction initialized successfully:", data);

      // Store transaction details - IMPORTANT: Use the reference from Paystack response
      const paystackReference = data.data.reference;
      temporaryTransactions.set(paystackReference, {
        product,
        price,
        id,
        seller,
        buyer,
        quantity,
        payer,
      });

      // Send successful response back to client
      res.status(200).json({
        success: true,
        message: "Payment initialized successfully",
        data: {
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference,
        },
      });
    } else {
      console.error("Error initializing transaction:", data);
      res.status(400).json({
        success: false,
        message: data.message || "Failed to initialize transaction",
        error: data,
      });
    }
  } catch (error) {
    console.error("Network error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }

  // db.query(
  //   "UPDATE  processor SET status = ? WHERE crop_id = ?",
  //   ["close", id],
  //   (err, result) => {
  //     if (result) {
  //       //insert

  //       db.query(
  //         "INSERT INTO retailer (crop_id,product_name,quantity,seller,buyer,status,price) VALUES(?,?,?,?,?,?,?)",
  //         [id, product, quantity, seller, userAccount, "open", price],
  //         (err, result) => {
  //           if (result) {
  //             res.send("Successfully Bought by retailer");
  //           }
  //         }
  //       );
  //     } else {
  //       res.send("Unable to update");
  //     }
  //   }
  // );
});

app.put("/paidUpdate/:lotId", (req, res) => {
  const id = req.params["lotId"];
  db.query(
    "UPDATE  farmer_brodcast SET status = ? WHERE id = ?",
    ["retailer", id],
    (err, result) => {
      if (result) {
        db.query(
          "UPDATE  offers SET status = ? WHERE crop_id = ?",
          ["paid", id],
          (err, result) => {
            if (result) {
              db.query(
                "UPDATE  insurance SET status = ? WHERE crop_id = ?",
                ["sold", id],
                (err, result) => {
                  if (result) {
                    res.send("Payment done");
                  }
                }
              );
            }
          }
        );
      } else {
        res.send("Unable to update");
      }
    }
  );
});

app.delete("/processorBidDelete/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "DELETE  FROM offers WHERE id = ?",
    [id],

    (err, result) => {
      if (result) {
        res.send("Successfully Rejected");
      } else {
        res.send("error,Something went wrong");
      }
    }
  );
});

app.get("/processorBroadcast/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM processor WHERE processor = ? ORDER BY id DESC",
    [id],

    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/processorOrderDetails/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM retailer WHERE seller = ? AND status='yes' ORDER BY id",
    [id],

    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/retailerOrderHistory/:id", (req, res) => {
  const id = req.params["id"];
  db.query(
    "SELECT * FROM sales where seller = ? ORDER BY id DESC",
    [id],

    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/getData/:crop", (req, res) => {
  const crop = req.params["crop"];
  db.query(
    "SELECT * FROM users where public_key = (SELECT public_key FROM farmer_brodcast where id = ?)",
    [crop],
    (err, farmer) => {
      if (farmer) {
        db.query(
          "SELECT * FROM users where role = ? LIMIT 1",
          ["qualitychecker"],
          (err, quality) => {
            if (quality) {
              db.query(
                "SELECT * FROM users where public_key = (SELECT buyer FROM orders where crop_id = ?)",
                [crop],
                (err, processor) => {
                  if (processor) {
                    db.query(
                      "SELECT * FROM users where public_key = (SELECT buyer FROM retailer where crop_id = ?)",
                      [crop],
                      (err, retailer) => {
                        if (retailer) {
                          db.query(
                            "SELECT * FROM users where public_key IN (SELECT DISTINCT(buyer) FROM sales where crop_id = ?)",
                            [crop],
                            (err, customer) => {
                              if (customer) {
                                const response = [
                                  farmer,
                                  quality,
                                  processor,
                                  retailer,
                                  customer,
                                ];
                                res.send(response);
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

app.get("/getInvestments", (req, res) => {
  db.query(
    "SELECT * FROM loan WHERE status = ? ORDER BY id DESC",
    ["paid"],
    (err, investments) => {
      if (investments) {
        res.send(investments);
      } else {
        res.send(false);
      }
    }
  );
});

app.get("/getUser/:id", (req, res) => {
  const id = req.params["id"];
  db.query("SELECT * FROM users where public_key = ?", [id], (err, result) => {
    if (result) {
      res.send(result);
    } else {
      res.send(false);
    }
  });
});

app.get("/countofusers", (req, res) => {
  db.query("SELECT COUNT(id) as count FROM users", (err, result) => {
    if (result) {
      res.send(result);
    } else {
      res.send(false);
    }
  });
});

app.get("/getAllCrops", (req, res) => {
  db.query(
    "SELECT id from farmer_brodcast ORDER BY id DESC LIMIT 10",
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    }
  );
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

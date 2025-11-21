const jwt = require("jsonwebtoken");
require('dotenv').config();

function authenticateToken(req, res, next) {
  // Expecting header: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];
  if (!token && req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token; // cookie fallback
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET not set in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach decoded info to request
    req.user = decoded; 

    next(); // move on to the next middleware or route
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authenticateToken;

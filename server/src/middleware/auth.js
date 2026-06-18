const jwt = require("jsonwebtoken");

const createAuthMiddleware = (jwtSecret) => {
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = user;
      next();
    });
  };

  const authenticateEventToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const headerToken = authHeader && authHeader.split(" ")[1];
    const queryToken = req.query.token;
    const token = headerToken || queryToken;

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = user;
      next();
    });
  };

  return { authenticateToken, authenticateEventToken };
};

module.exports = { createAuthMiddleware };
const path = require("path");

const PORT = 5000;
const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "annotationApp";
const JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production";
const SERVER_ROOT = path.resolve(__dirname, "..", "..");
const UPLOADS_ROOT = path.join(SERVER_ROOT, "uploads");

module.exports = {
  PORT,
  MONGO_URL,
  DB_NAME,
  JWT_SECRET,
  SERVER_ROOT,
  UPLOADS_ROOT,
};
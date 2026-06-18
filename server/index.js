const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { PORT, JWT_SECRET, UPLOADS_ROOT } = require("./src/config/constants");
const { connectDatabase, ObjectId } = require("./src/config/database");
const { createUploadMiddleware } = require("./src/config/uploads");
const { createAuthMiddleware } = require("./src/middleware/auth");
const { createAccessMiddleware } = require("./src/middleware/access");
const { createAnnotationEvents } = require("./src/realtime/annotationEvents");
const { createGoogleDriveService } = require("./src/services/googleDriveService");
const { createUserTeamService } = require("./src/services/userTeamService");
const { makeRequestError } = require("./src/utils/errors");
const { getFileType } = require("./src/utils/fileTypes");
const { registerRoutes } = require("./src/routes");

const startServer = async () => {
  const app = express();
  const { collections } = await connectDatabase();
  const { upload, taskUpload } = createUploadMiddleware(UPLOADS_ROOT);
  const { authenticateToken, authenticateEventToken } = createAuthMiddleware(JWT_SECRET);
  const { checkProjectAccess, checkTaskAccess } = createAccessMiddleware({ collections, ObjectId });
  const annotationEvents = createAnnotationEvents({ collections, ObjectId });
  const userTeamService = createUserTeamService({ collections, ObjectId, makeRequestError });
  const googleDriveService = createGoogleDriveService({ collections, ObjectId, port: PORT, makeRequestError });

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(UPLOADS_ROOT));

  annotationEvents.registerAnnotationEventRoute(app, authenticateEventToken);

  registerRoutes(app, {
    ...collections,
    ...annotationEvents,
    ...googleDriveService,
    ...userTeamService,
    authenticateToken,
    authenticateEventToken,
    checkProjectAccess,
    checkTaskAccess,
    upload,
    taskUpload,
    ObjectId,
    bcrypt,
    jwt,
    crypto,
    fs,
    path,
    JWT_SECRET,
    makeRequestError,
    getFileType,
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Features enabled:");
    console.log("- Project task count tracking");
    console.log("- Project owners management");
    console.log("- Task assignment by email");
    console.log("- Role-based access control");
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

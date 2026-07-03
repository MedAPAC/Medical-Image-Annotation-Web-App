const registerAuthRoutes = require("./authRoutes");
const registerGoogleDriveRoutes = require("./googleDriveRoutes");
const registerAnnotationRoutes = require("./annotationRoutes");
const registerProjectRoutes = require("./projectRoutes");
const registerTaskRoutes = require("./taskRoutes");
const registerTeamRoutes = require("./teamRoutes");
const registerProfileRoutes = require("./profileRoutes");
const registerInferenceRoutes = require("./inferenceRoutes");
const registerAiRoutes = require("./aiRoutes");
const registerTicketRoutes = require("./ticketRoutes");

const registerRoutes = (app, context) => {
  registerAuthRoutes(app, context);
  registerGoogleDriveRoutes(app, context);
  registerAnnotationRoutes(app, context);
  registerProjectRoutes(app, context);
  registerTaskRoutes(app, context);
  registerTeamRoutes(app, context);
  registerProfileRoutes(app, context);
  registerInferenceRoutes(app, context);
  registerAiRoutes(app, context);
  registerTicketRoutes(app, context);
};

module.exports = { registerRoutes };
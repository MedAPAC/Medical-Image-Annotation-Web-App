const { MongoClient, ObjectId } = require("mongodb");
const { MONGO_URL, DB_NAME } = require("./constants");

const connectDatabase = async () => {
  const client = await MongoClient.connect(MONGO_URL, { useUnifiedTopology: true });
  const db = client.db(DB_NAME);

  const collections = {
    db,
    annotationsCollection: db.collection("annotations"),
    usersCollection: db.collection("users"),
    projectsCollection: db.collection("projects"),
    tasksCollection: db.collection("tasks"),
    googleDriveConnectionsCollection: db.collection("google_drive_connections"),
    taskTimersCollection: db.collection("task_timers"),
    teamsCollection: db.collection("teamsCollection"),
  };

  await collections.taskTimersCollection.createIndex({ taskId: 1, userId: 1 }, { unique: true });
  await collections.googleDriveConnectionsCollection.createIndex({ userId: 1 }, { unique: true });

  console.log("Connected to MongoDB!");

  await collections.tasksCollection.createIndex({ userId: 1 });
  await collections.tasksCollection.createIndex({ projectId: 1 });
  await collections.tasksCollection.createIndex({ status: 1 });
  await collections.tasksCollection.createIndex({ assignedTo: 1 });
  await collections.projectsCollection.createIndex({ owners: 1 });

  return { client, db, collections };
};

module.exports = { connectDatabase, ObjectId };
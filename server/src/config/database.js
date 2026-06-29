const { MongoClient, ObjectId } = require('mongodb');
const { MONGO_URL, DB_NAME, AUDIT_RETENTION_DAYS } = require('./constants');

const connectDatabase = async () => {
  const client = await MongoClient.connect(MONGO_URL, {
    maxPoolSize: 30,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    retryWrites: true,
  });
  const db = client.db(DB_NAME);

  const collections = {
    db,
    annotationsCollection: db.collection('annotations'),
    usersCollection: db.collection('users'),
    projectsCollection: db.collection('projects'),
    tasksCollection: db.collection('tasks'),
    googleDriveConnectionsCollection: db.collection('google_drive_connections'),
    taskTimersCollection: db.collection('taskTimersCollection'),
    teamsCollection: db.collection('teamsCollection'),
    securityAuditCollection: db.collection('security_audit'),
    oauthStatesCollection: db.collection('oauth_states'),
  };

  await collections.taskTimersCollection.createIndex({ taskId: 1, userId: 1 }, { unique: true });
  await collections.googleDriveConnectionsCollection.createIndex({ userId: 1 }, { unique: true });
  await collections.usersCollection.createIndex({ email: 1 }, { unique: true });
  await collections.annotationsCollection.createIndex({ taskId: 1, filename: 1 }, { unique: true });
  await collections.oauthStatesCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await collections.oauthStatesCollection.createIndex({ nonce: 1 }, { unique: true });
  await collections.securityAuditCollection.createIndex({ occurredAt: -1 });
  if (AUDIT_RETENTION_DAYS > 0) {
    await collections.securityAuditCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }

  await collections.tasksCollection.createIndex({ userId: 1 });
  await collections.tasksCollection.createIndex({ projectId: 1 });
  await collections.tasksCollection.createIndex({ status: 1 });
  await collections.tasksCollection.createIndex({ assignedTo: 1 });
  await collections.tasksCollection.createIndex({ assignees: 1 });
  await collections.projectsCollection.createIndex({ owners: 1 });

  console.log('Connected to MongoDB.');
  return { client, db, collections };
};

module.exports = { connectDatabase, ObjectId };

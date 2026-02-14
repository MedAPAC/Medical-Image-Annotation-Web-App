const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for general file uploads
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}-${timestamp}${ext}`);
  },
});

const upload = multer({ storage: generalStorage });
app.use("/uploads", express.static(uploadDir));

const mongoUrl = "mongodb://localhost:27017";
const dbName = "annotationApp";
let db, annotationsCollection, usersCollection, projectsCollection, tasksCollection;

MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    annotationsCollection = db.collection("annotations");
    usersCollection = db.collection("users");
    projectsCollection = db.collection("projects");
    tasksCollection = db.collection("tasks");
    taskTimersCollection = db.collection("task_timers"); 
    taskTimersCollection.createIndex({ taskId: 1, userId: 1 }, { unique: true });

    console.log("Connected to MongoDB!");
    
    // Create indexes
    tasksCollection.createIndex({ userId: 1 });
    tasksCollection.createIndex({ projectId: 1 });
    tasksCollection.createIndex({ status: 1 });
    tasksCollection.createIndex({ assignedTo: 1 });
    projectsCollection.createIndex({ owners: 1 });
  })
  .catch((err) => {
    console.error("Failed to Connect to MongoDB!", err);
  });

const JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production";

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to determine file type
function getFileType(filename) {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.endsWith('.dcm') || lowerName.endsWith('.dicom')) return 'dicom';
  if (lowerName.endsWith('.nii') || lowerName.endsWith('.nii.gz')) return 'nifti';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || 
      lowerName.endsWith('.png') || lowerName.endsWith('.gif') || 
      lowerName.endsWith('.bmp') || lowerName.endsWith('.tiff') || lowerName.endsWith('.tif')) return 'image';
  
  return 'other';
}

// Middleware to check if user can access project
const checkProjectAccess = async (req, res, next) => {
  try {
    const project = await projectsCollection.findOne({ 
      _id: new ObjectId(req.params.projectId),
      $or: [
        { userId: req.user.id },
        { owners: req.user.id }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    req.project = project;
    next();
  } catch (err) {
    console.error('Project access check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to check if user can access task
const checkTaskAccess = async (req, res, next) => {
  try {
    const task = await tasksCollection.findOne({ 
      _id: new ObjectId(req.params.taskId),
      $or: [
        { userId: req.user.id },
        { assignedTo: req.user.id },
        { createdBy: req.user.email },
        // Check if user is an owner of the project
        { 
          projectId: { $exists: true },
          $expr: {
            $let: {
              vars: {
                project: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: { $ifNull: [await projectsCollection.find({}).toArray(), []] },
                        as: "proj",
                        cond: { $eq: ["$$proj._id", { $toObjectId: "$projectId" }] }
                      }
                    },
                    0
                  ]
                }
              },
              in: {
                $or: [
                  { $eq: ["$$project.userId", req.user.id] },
                  { $in: [req.user.id, { $ifNull: ["$$project.owners", []] }] }
                ]
              }
            }
          }
        }
      ]
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }
    
    req.task = task;
    next();
  } catch (err) {
    console.error('Task access check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};




const taskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the Task ID or a temp folder
    const taskId = req.params.taskId; 
    const uploadDir = path.join(__dirname, 'uploads', 'tasks', taskId);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname.toLowerCase();
    let extension = path.extname(originalName);

    // ➤ CRITICAL FIX: Preserve .nii.gz extension
    if (originalName.endsWith('.nii.gz')) {
      extension = '.nii.gz';
    }
    if (originalName.endsWith('.nii')) {
      extension = '.nii';
    }

    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + extension);
  }
});

const taskUpload = multer({
  storage: taskStorage,
  limits: { fileSize: 1000 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    // Allow all standard images and medical formats
    const allowed = ['.jpg', '.jpeg', '.png', '.nii', '.nii.gz', '.dcm', '.dicom'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Check .nii.gz explicitly
    if (file.originalname.toLowerCase().endsWith('.nii.gz') || allowed.includes(ext) || file.originalname.toLowerCase().endsWith('.nii')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});



// ==================== HELPER FUNCTIONS ====================

// Helper to get user by email
const getUserByEmail = async (email) => {
  return await usersCollection.findOne({ email: email.toLowerCase() });
};

// Helper to validate email list
const validateAndGetUserIds = async (emails) => {
  if (!Array.isArray(emails) || emails.length === 0) {
    return [];
  }
  
  const userIds = [];
  const invalidEmails = [];
  
  for (const email of emails) {
    const user = await getUserByEmail(email.trim());
    if (user) {
      userIds.push(user._id.toString());
    } else {
      invalidEmails.push(email);
    }
  }
  
  if (invalidEmails.length > 0) {
    throw new Error(`The following emails are not registered users: ${invalidEmails.join(', ')}`);
  }
  
  return userIds;
};

// ==================== AUTH ROUTES ====================

app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId;

    const token = jwt.sign({ id: userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: userId, name, email: email.toLowerCase() }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed. Please try again." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Keep old endpoints for backward compatibility
app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already Registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId;

    const token = jwt.sign({ id: userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: userId, name, email: email.toLowerCase() }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed. Please try again." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Verify token endpoint
app.get("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout endpoint (client-side token removal)
app.post("/api/auth/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// ==================== ANNOTATION ROUTES ====================

app.post("/upload", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ 
    filename: req.file.filename, 
    originalName: req.file.originalname,
    userId: req.user.id
  });
});

// server.js (or your routes file)

// POST: Save Annotations & Classifications
// Payload: { taskId, filename, sliceData: { "0": { ... }, "1": { ... } } }
app.post("/save-annotations", authenticateToken, async (req, res) => {
  if (!annotationsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { taskId, filename, sliceData } = req.body;

  if (!filename || !taskId) {
    return res.status(400).json({ error: "Missing filename or taskId" });
  }

  try {
    // We update the specific document for this file/user/task
    // We use $set to update the 'slices' field. 
    // Note: This replaces the slices map for this file with the new state from frontend.
    
    await annotationsCollection.updateOne(
      { 
        filename: filename, 
        taskId: taskId,
        userId: req.user.id 
      },
      {
        $set: {
          slices: sliceData, // Map of index -> data
          userId: req.user.id,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({ message: "Changes Successfully Saved!" });
  } catch (err) {
    console.error("Failed to save annotations to DB:", err);
    res.status(500).json({ error: "Failed to Save Changes." });
  }
});

// GET: Retrieve Annotations
app.get("/annotations/:taskId", authenticateToken, async (req, res) => {
  if (!annotationsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { taskId } = req.params;
  const { fileName } = req.query; // Expect filename in query string

  try {
    const doc = await annotationsCollection.findOne({ 
      filename: fileName, 
      taskId: taskId,
      userId: req.user.id 
    });

    if (!doc) {
      // Return empty structure if new file
      return res.json({}); 
    }

    // Return the 'slices' map: { "0": { editorState, classification... }, "1": ... }
    res.json(doc.slices || {}); 
  } catch (err) {
    console.error("Failed to fetch annotations from DB", err);
    res.status(500).json({ error: "Failed to fetch annotations" });
  }
});

// ==================== PROJECT ROUTES ====================

// Create a new project
app.post("/api/projects", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { name, description, labels, attributes, ownerEmails } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Project name is required" });
  }

  try {
    // Validate and get owner IDs if provided
    let owners = [req.user.id]; // Creator is always an owner
    if (ownerEmails && Array.isArray(ownerEmails) && ownerEmails.length > 0) {
      const additionalOwnerIds = await validateAndGetUserIds(ownerEmails);
      owners = [...owners, ...additionalOwnerIds];
    }

    const newProject = {
      name: name.trim(),
      description: description || "",
      labels: Array.isArray(labels) ? labels : [],
      attributes: Array.isArray(attributes) ? attributes : [],
      userId: req.user.id, // Primary creator/owner
      owners: [...new Set(owners)], // Remove duplicates
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      tasks: 0, // Initialize task count
      progress: 0
    };

    const result = await projectsCollection.insertOne(newProject);
    
    res.json({
      message: "Project created successfully",
      project: {
        id: result.insertedId,
        ...newProject
      }
    });
  } catch (err) {
    console.error("Failed to create project:", err);
    res.status(500).json({ error: err.message || "Failed to create project. Please try again." });
  }
});

// Get all projects accessible to user (owned or shared)
app.get("/api/projects", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const projects = await projectsCollection
      .find({
        $or: [
          { userId: req.user.id },
          { owners: req.user.id }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get user details for owners
    const projectsWithOwnerDetails = await Promise.all(
      projects.map(async (project) => {
        const ownerDetails = [];
        for (const ownerId of project.owners || []) {
          const user = await usersCollection.findOne(
            { _id: new ObjectId(ownerId) },
            { projection: { name: 1, email: 1 } }
          );
          if (user) {
            ownerDetails.push({
              id: user._id,
              name: user.name,
              email: user.email
            });
          }
        }
        
        return {
          ...project,
          ownerDetails
        };
      })
    );
    
    res.json({ projects: projectsWithOwnerDetails });
  } catch (err) {
    console.error("Failed to fetch projects:", err);
    res.status(500).json({ error: "Failed to fetch projects. Please try again." });
  }
});

// Get a single project by ID
app.get("/api/projects/:id", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      $or: [
        { userId: req.user.id },
        { owners: req.user.id }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found or access denied" });
    }

    // Get owner details
    const ownerDetails = [];
    for (const ownerId of project.owners || []) {
      const user = await usersCollection.findOne(
        { _id: new ObjectId(ownerId) },
        { projection: { name: 1, email: 1 } }
      );
      if (user) {
        ownerDetails.push({
          id: user._id,
          name: user.name,
          email: user.email
        });
      }
    }

    res.json({ 
      project: {
        ...project,
        ownerDetails
      }
    });
  } catch (err) {
    console.error("Failed to fetch project:", err);
    if (err.name === 'BSONTypeError') {
      return res.status(400).json({ error: "Invalid Project ID format." });
    }
    res.status(500).json({ error: "Failed to fetch project. Please try again." });
  }
});

// Update a project (only owners can update)
app.put("/api/projects/:id", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { name, description, labels, attributes, status, ownerEmails } = req.body;

  try {
    // Check if user is an owner of the project
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to update this project" });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    
    if (labels !== undefined && Array.isArray(labels)) {
      updateData.labels = labels;
    }
    
    if (attributes !== undefined && Array.isArray(attributes)) {
      updateData.attributes = attributes;
    }
    
    if (status) updateData.status = status;

    // Handle owner updates if provided
    if (ownerEmails !== undefined) {
      if (!Array.isArray(ownerEmails)) {
        return res.status(400).json({ error: "ownerEmails must be an array" });
      }
      
      // Always include the original creator
      const owners = [project.userId];
      if (ownerEmails.length > 0) {
        const additionalOwnerIds = await validateAndGetUserIds(ownerEmails);
        owners.push(...additionalOwnerIds);
      }
      
      updateData.owners = [...new Set(owners)]; // Remove duplicates
    }

    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Project not found or no changes made" });
    }

    res.json({ message: "Project updated successfully" });
  } catch (err) {
    console.error("Failed to update project:", err);
    if (err.name === 'BSONTypeError') {
      return res.status(400).json({ error: "Invalid Project ID format." });
    }
    res.status(500).json({ error: err.message || "Failed to update project. Please try again." });
  }
});

// Add owners to a project
app.post("/api/projects/:id/owners", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { emails } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Please provide an array of email addresses" });
  }

  try {
    // Check if user is an owner of the project
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to manage owners for this project" });
    }

    // Get user IDs for the emails
    const newOwnerIds = await validateAndGetUserIds(emails);
    
    // Add new owners to the project
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $addToSet: { owners: { $each: newOwnerIds } },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ 
      message: "Owners added successfully",
      addedCount: newOwnerIds.length
    });
  } catch (err) {
    console.error("Failed to add owners:", err);
    res.status(500).json({ error: err.message || "Failed to add owners. Please try again." });
  }
});

// Remove owners from a project
app.delete("/api/projects/:id/owners", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { ownerId } = req.body;

  if (!ownerId) {
    return res.status(400).json({ error: "Owner ID is required" });
  }

  try {
    // Check if user is an owner of the project and not trying to remove themselves
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to manage owners for this project" });
    }

    // Don't allow removing the original creator
    if (ownerId === project.userId.toString()) {
      return res.status(400).json({ error: "Cannot remove the original creator from project owners" });
    }

    // Don't allow removing yourself
    if (ownerId === req.user.id) {
      return res.status(400).json({ error: "Cannot remove yourself from project owners" });
    }

    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $pull: { owners: ownerId },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Project not found or owner not in list" });
    }

    res.json({ message: "Owner removed successfully" });
  } catch (err) {
    console.error("Failed to remove owner:", err);
    res.status(500).json({ error: "Failed to remove owner. Please try again." });
  }
});

// Delete a project (only owners can delete)
app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  if (!projectsCollection || !tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    // Check if user is an owner of the project
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to delete this project" });
    }

    // Delete all tasks associated with this project
    const tasks = await tasksCollection.find({ projectId: req.params.id }).toArray();
    
    // Delete uploaded files for each task
    for (const task of tasks) {
      if (task.files && task.files.length > 0) {
        const uploadDir = `uploads/tasks/${task._id}`;
        if (fs.existsSync(uploadDir)) {
          fs.rmSync(uploadDir, { recursive: true, force: true });
        }
      }
    }
    
    // Delete tasks from database
    await tasksCollection.deleteMany({ projectId: req.params.id });

    // Delete project
    const result = await projectsCollection.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project and all associated tasks deleted successfully" });
  } catch (err) {
    console.error("Failed to delete project:", err);
    if (err.name === 'BSONTypeError') {
      return res.status(400).json({ error: "Invalid Project ID format." });
    }
    res.status(500).json({ error: "Failed to delete project. Please try again." });
  }
});

// ==================== TASK ROUTES ====================

// Get all tasks accessible to user
app.get('/api/tasks', authenticateToken, async (req, res) => {
  if (!tasksCollection || !projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    // Get projects where user is an owner
    const userProjects = await projectsCollection.find({
      $or: [
        { userId: req.user.id },
        { owners: req.user.id }
      ]
    }).toArray();

    const projectIds = userProjects.map(project => project._id.toString());

    // Get tasks where user is assigned or user owns the project
    const tasks = await tasksCollection.find({
      $or: [
        { assignedTo: req.user.id },
        { projectId: { $in: projectIds } },
        { createdBy: req.user.email }
      ]
    }).sort({ createdAt: -1 }).toArray();

    // Get assignee details
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        let assigneeDetails = null;
        if (task.assignedTo) {
          const user = await usersCollection.findOne(
            { _id: new ObjectId(task.assignedTo) },
            { projection: { name: 1, email: 1 } }
          );
          if (user) {
            assigneeDetails = {
              id: user._id,
              name: user.name,
              email: user.email
            };
          }
        }

        return {
          ...task,
          assigneeDetails
        };
      })
    );

    res.json({ tasks: tasksWithDetails });
  } catch (err) {
    console.error('Failed to fetch tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get tasks for a specific project
app.get('/api/projects/:projectId/tasks', authenticateToken, checkProjectAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const tasks = await tasksCollection.find({
      projectId: req.params.projectId
    }).sort({ createdAt: -1 }).toArray();

    // Get assignee details
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        let assigneeDetails = null;
        if (task.assignedTo) {
          const user = await usersCollection.findOne(
            { _id: new ObjectId(task.assignedTo) },
            { projection: { name: 1, email: 1 } }
          );
          if (user) {
            assigneeDetails = {
              id: user._id,
              name: user.name,
              email: user.email
            };
          }
        }

        return {
          ...task,
          assigneeDetails
        };
      })
    );

    res.json({ tasks: tasksWithDetails });
  } catch (err) {
    console.error('Failed to fetch project tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task
// Get single task
app.get('/api/tasks/:taskId', authenticateToken, checkTaskAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const task = req.task;

    // 1. Populate Single Assignee (Legacy)
    let assigneeDetails = null;
    if (task.assignedTo) {
      const user = await usersCollection.findOne(
        { _id: new ObjectId(task.assignedTo) },
        { projection: { name: 1, email: 1 } }
      );
      if (user) assigneeDetails = { id: user._id, name: user.name, email: user.email };
    }

    // 2. Populate Multiple Assignees (New)
    let assigneesList = []; // This will contain emails/names
    if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
        // Find all users whose IDs are in the assignees array
        const users = await usersCollection.find({
            _id: { $in: task.assignees.map(id => new ObjectId(id)) }
        }).project({ email: 1, name: 1 }).toArray();
        
        // We mostly need the emails for the frontend tags
        assigneesList = users.map(u => u.email); 
    } else if (assigneeDetails) {
        // Fallback: if only old assignedTo exists, add it to the list
        assigneesList = [assigneeDetails.email];
    }

    res.json({ 
      task: {
        ...task,
        assigneeDetails, // Legacy object
        assignees: assigneesList // New Array of emails ['a@b.com', 'c@d.com']
      }
    });
  } catch (err) {
    console.error('Failed to fetch task:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});


// Create a new task
// Create a new task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  if (!tasksCollection || !projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  // Accept assigneeEmails (Array) OR assigneeEmail (String - legacy)
  const { name, projectId, subset, description, assigneeEmails, assigneeEmail, priority } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Task name is required" });
  }
  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    const project = await projectsCollection.findOne({ 
      _id: new ObjectId(projectId),
      $or: [{ userId: req.user.id }, { owners: req.user.id }]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Handle Assignees
    let assigneeIds = [];
    
    // 1. Check for new array format
    if (assigneeEmails && Array.isArray(assigneeEmails) && assigneeEmails.length > 0) {
        assigneeIds = await validateAndGetUserIds(assigneeEmails);
    } 
    // 2. Fallback to old single string format
    else if (assigneeEmail) {
        const userIds = await validateAndGetUserIds([assigneeEmail]);
        assigneeIds = userIds;
    }

    const newTask = {
      name: name.trim(),
      description: description || '',
      projectId: projectId,
      projectName: project.name,
      subset: subset || 'train',
      
      assignees: assigneeIds, // New Array
      assignedTo: assigneeIds.length > 0 ? assigneeIds[0] : null, // Legacy support
      
      priority: priority || 'medium',
      status: 'pending',
      state: 'new',
      files: [],
      labels: project.labels || [],
      attributes: project.attributes || [],
      userId: req.user.id,
      createdBy: req.user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      completedItems: 0,
      totalItems: 0
    };

    const result = await tasksCollection.insertOne(newTask);
    
    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      { $inc: { tasks: 1 }, $set: { updatedAt: new Date() } }
    );

    res.json({
      message: "Task created successfully",
      task: { id: result.insertedId, ...newTask }
    });
  } catch (err) {
    console.error("Failed to create task:", err);
    res.status(500).json({ error: "Failed to create task. Please try again." });
  }
});


// Update task assignees (Multiple)
app.put('/api/tasks/:taskId/assign', authenticateToken, checkTaskAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  // Expecting an array of emails
  const { assigneeEmails } = req.body; 

  try {
    // Verify user has permission (must be project owner)
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.task.projectId),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to assign tasks for this project" });
    }

    // Use the existing helper function to validate and convert emails to IDs
    let assigneeIds = [];
    if (assigneeEmails && Array.isArray(assigneeEmails) && assigneeEmails.length > 0) {
        assigneeIds = await validateAndGetUserIds(assigneeEmails);
    }

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(req.params.taskId) },
      { 
        $set: { 
          assignees: assigneeIds, // New Array Field
          // Maintain backward compatibility by setting assignedTo to the first user
          assignedTo: assigneeIds.length > 0 ? assigneeIds[0] : null,
          updatedAt: new Date() 
        }
      }
    );

    if (result.modifiedCount === 0) {
      // It's possible the data was the same, but we return success
      // return res.status(404).json({ error: 'Task not found' });
    }

    // Fetch the updated task to return the full list of emails
    const updatedTask = await tasksCollection.findOne({ _id: new ObjectId(req.params.taskId) });
    
    // Resolve IDs back to emails for the frontend response
    let resolvedEmails = [];
    if (updatedTask.assignees && updatedTask.assignees.length > 0) {
        const users = await usersCollection.find({ 
            _id: { $in: updatedTask.assignees.map(id => new ObjectId(id)) } 
        }).toArray();
        resolvedEmails = users.map(u => u.email);
    }
    
    // Manually attach this to the response object so frontend updates immediately
    updatedTask.assignees = resolvedEmails;

    res.json({
      message: 'Task assignments updated successfully',
      task: updatedTask
    });
  } catch (err) {
    console.error('Failed to update task assignment:', err);
    res.status(500).json({ error: err.message || 'Failed to update task assignment' });
  }
});

// Upload files to a task
app.post('/api/tasks/:taskId/files', authenticateToken, checkTaskAccess, taskUpload.array('files'), async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Generate ObjectId for each file to allow specific deletion later
    const files = req.files.map(file => ({
      _id: new ObjectId(), // <--- CRITICAL: Generate ID for the file
      originalName: file.originalname,
      filename: file.filename,
      path: file.path, // relative path usually handled by multer storage
      size: file.size,
      mimetype: file.mimetype,
      type: getFileType(file.originalname),
      uploadedAt: new Date()
    }));

    console.log('Files to be saved:', files.map(f => f.originalName));

    // Add files to task
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(req.params.taskId) },
      {
        $push: { files: { $each: files } },
        $set: { 
          updatedAt: new Date(),
          totalItems: (req.task.totalItems || 0) + files.length
        }
      }
    );

    // Return the files with their new IDs
    res.json({
      message: 'Files uploaded successfully',
      files: files,
      totalFiles: (req.task.files ? req.task.files.length : 0) + files.length
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to upload files: ' + err.message });
  }
});

// Delete a specific file from a task
app.delete('/api/tasks/:taskId/files/:fileId', authenticateToken, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { taskId, fileId } = req.params;

  try {
    // 1. Get the task to find the file path
    const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Check permissions (Project Owner or Creator)
    const project = await projectsCollection.findOne({
        _id: new ObjectId(task.projectId),
        $or: [{ owners: req.user.id }, { userId: req.user.id }]
    });

    if (!project && task.createdBy !== req.user.email) {
        return res.status(403).json({ error: "Permission denied" });
    }

    // 2. Find the file in the array
    // We check both string ID and ObjectId for backward compatibility
    const fileToDelete = task.files.find(f => 
        (f._id && f._id.toString() === fileId) || f.filename === fileId
    );

    if (!fileToDelete) {
        return res.status(404).json({ error: 'File not found in task' });
    }

    // 3. Remove from Disk
    if (fileToDelete.path) {
        // Construct absolute path. 
        // Note: fileToDelete.path from Multer is usually the full path, 
        // but if it's relative, ensure we join it correctly.
        const filePath = path.resolve(fileToDelete.path); 
        
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`Deleted file from disk: ${filePath}`);
            } catch (unlinkErr) {
                console.error("Error deleting file from disk:", unlinkErr);
                // Continue to remove from DB even if disk delete fails
            }
        }
    }

    // 4. Remove from Database
    await tasksCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { 
            $pull: { files: { _id: fileToDelete._id } },
            $inc: { totalItems: -1 } // Decrease total items count
        }
    );

    res.json({ success: true, message: 'File deleted successfully' });

  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// -------------------------------------------------------------------------
// GET: Retrieve Timer
// -------------------------------------------------------------------------
app.get('/api/tasks/:taskId/timer', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    console.log(`[Timer GET] Fetching for Task: ${taskId}, User: ${userId}`);

    // Try finding exact match first (String comparison)
    let timerRecord = await db.collection('taskTimersCollection').findOne({ 
      taskId: taskId, 
      userId: userId 
    });

    // If not found, logic to handle ObjectId mismatch just in case
    // (Only strictly necessary if your DB mixes types, but safer to keep simple first)
    
    const seconds = timerRecord ? timerRecord.seconds : 0;
    console.log(`[Timer GET] Found seconds: ${seconds}`);
    
    res.json({ seconds });
  } catch (err) {
    console.error("Timer GET Error:", err);
    res.status(500).json({ error: "Failed to fetch timer" });
  }
});

// -------------------------------------------------------------------------
// POST: Save Timer (Update or Insert)
// -------------------------------------------------------------------------
app.post('/api/tasks/:taskId/timer', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { seconds } = req.body;

    console.log(`[Timer POST] Saving ${seconds}s for Task: ${taskId}`);

    // Validation
    if (seconds === undefined || seconds === null) {
        console.error("[Timer POST] Error: 'seconds' is missing in body");
        return res.status(400).json({ error: "Seconds required" });
    }

    // Upsert Logic
    const result = await db.collection('taskTimersCollection').updateOne(
      { taskId: taskId, userId: userId },
      { 
        $set: { 
          seconds: Number(seconds), // Force Number type
          updatedAt: new Date() 
        },
        $setOnInsert: { 
          createdAt: new Date(),
          taskId: taskId, // Ensure these fields exist on creation
          userId: userId 
        }
      },
      { upsert: true }
    );

    res.json({ success: true, savedSeconds: seconds });
  } catch (err) {
    console.error("Timer POST Error:", err);
    res.status(500).json({ error: "Failed to save timer" });
  }
});

// Update task
app.put('/api/tasks/:taskId', authenticateToken, checkTaskAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    // Check if user has permission (must be project owner or assignee)
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.task.projectId),
      $or: [
        { owners: req.user.id },
        { userId: req.user.id }
      ]
    });

    const isAssignee = req.task.assignedTo === req.user.id;
    
    if (!project && !isAssignee) {
      return res.status(403).json({ error: "You don't have permission to update this task" });
    }

    const updates = req.body;
    updates.updatedAt = new Date();

    // If user is not project owner, restrict what they can update
    if (!project && isAssignee) {
      // Assignee can only update progress and status
      const allowedFields = ['progress', 'completedItems', 'status'];
      const restrictedUpdates = {};
      for (const key in updates) {
        if (allowedFields.includes(key)) {
          restrictedUpdates[key] = updates[key];
        }
      }
      Object.assign(updates, restrictedUpdates);
    }

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(req.params.taskId) },
      { $set: updates }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Task not found or no changes made' });
    }

    const updatedTask = await tasksCollection.findOne({ _id: new ObjectId(req.params.taskId) });

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (err) {
    console.error('Failed to update task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task progress
app.put('/api/tasks/:taskId/progress', authenticateToken, checkTaskAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const { progress, completedItems } = req.body;
    
    if (progress === undefined && completedItems === undefined) {
      return res.status(400).json({ error: 'Progress or completedItems required' });
    }

    // Check if user is assignee or project owner
    const isAssignee = req.task.assignedTo === req.user.id;
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.task.projectId),
      $or: [
        { owners: req.user.id },
        { userId: req.user.id }
      ]
    });

    if (!isAssignee && !project) {
      return res.status(403).json({ error: "You don't have permission to update this task's progress" });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (progress !== undefined) {
      updateData.progress = Math.min(Math.max(progress, 0), 100);
    }

    if (completedItems !== undefined) {
      updateData.completedItems = Math.max(0, completedItems);
      
      // Calculate progress if not provided
      if (progress === undefined && req.task.totalItems > 0) {
        updateData.progress = Math.round((completedItems / req.task.totalItems) * 100);
      }
    }

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(req.params.taskId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Progress updated successfully',
      progress: updateData.progress,
      completedItems: updateData.completedItems
    });
  } catch (err) {
    console.error('Failed to update progress:', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Delete task
app.delete('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  if (!tasksCollection || !projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const task = await tasksCollection.findOne({ 
      _id: new ObjectId(req.params.taskId)
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has permission (must be project owner)
    const project = await projectsCollection.findOne({
      _id: new ObjectId(task.projectId),
      $or: [
        { userId: req.user.id },
        { owners: req.user.id }
      ]
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to delete this task" });
    }

    // Delete uploaded files
    if (task.files && task.files.length > 0) {
      const uploadDir = `uploads/tasks/${req.params.taskId}`;
      if (fs.existsSync(uploadDir)) {
        fs.rmSync(uploadDir, { recursive: true, force: true });
      }
    }

    // Delete task
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(req.params.taskId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update project task count - DECREMENT
    await projectsCollection.updateOne(
      { _id: new ObjectId(task.projectId) },
      { 
        $inc: { tasks: -1 },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`Task count decremented for project ${task.projectId}`);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Failed to delete task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get task statistics
app.get('/api/tasks/stats', authenticateToken, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    // Get projects where user is an owner
    const userProjects = await projectsCollection.find({
      $or: [
        { userId: req.user.id },
        { owners: req.user.id }
      ]
    }).toArray();

    const projectIds = userProjects.map(project => project._id.toString());

    // Get tasks where user is assigned or user owns the project
    const stats = await tasksCollection.aggregate([
      {
        $match: {
          $or: [
            { assignedTo: req.user.id },
            { projectId: { $in: projectIds } },
            { createdBy: req.user.email }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalProgress: { $avg: '$progress' }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          averageProgress: { $round: ['$totalProgress', 2] },
          _id: 0
        }
      }
    ]).toArray();

    const totalTasks = stats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      totalTasks,
      byStatus: stats,
      summary: {
        pending: stats.find(s => s.status === 'pending')?.count || 0,
        inProgress: stats.find(s => s.status === 'in_progress')?.count || 0,
        completed: stats.find(s => s.status === 'completed')?.count || 0
      }
    });
  } catch (err) {
    console.error('Failed to fetch task stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// server.js - Add these routes


// ---------------------------------------------------------
// GET: Fetch Teams (Owned by user or where user is member)
// ---------------------------------------------------------
app.get('/api/teams', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email; // Assuming your auth token has email

    const teams = await db.collection('teamsCollection').find({
      $or: [
        { createdBy: userId },       // Teams I created
        { members: userEmail }       // Teams I am a member of
      ]
    }).sort({ createdAt: -1 }).toArray();

    res.json(teams);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// ---------------------------------------------------------
// POST: Create New Team
// ---------------------------------------------------------
app.post('/api/teams', authenticateToken, async (req, res) => {
  try {
    const { name, members } = req.body; // members should be array of emails
    const userId = req.user.id;

    if (!name) return res.status(400).json({ error: "Team name is required" });

    const newTeam = {
      name,
      members: members || [],
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('teamsCollection').insertOne(newTeam);
    res.status(201).json({ ...newTeam, _id: result.insertedId });
  } catch (err) {
    console.error("Error creating team:", err);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// ---------------------------------------------------------
// PUT: Update Team (Edit name or members)
// ---------------------------------------------------------
app.put('/api/teams/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, members } = req.body;
    const userId = req.user.id;

    // Check ownership
    const team = await db.collection('teamsCollection').findOne({ _id: new ObjectId(id) });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.createdBy !== userId) return res.status(403).json({ error: "Not authorized to edit this team" });

    await db.collection('teamsCollection').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          name, 
          members, 
          updatedAt: new Date() 
        } 
      }
    );

    res.json({ success: true, message: "Team updated" });
  } catch (err) {
    console.error("Error updating team:", err);
    res.status(500).json({ error: "Failed to update team" });
  }
});

// ---------------------------------------------------------
// DELETE: Delete Team
// ---------------------------------------------------------
app.delete('/api/teams/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const team = await db.collection('teamsCollection').findOne({ _id: new ObjectId(id) });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.createdBy !== userId) return res.status(403).json({ error: "Not authorized to delete this team" });

    await db.collection('teamsCollection').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, message: "Team deleted" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

// ==================== SERVER START ====================

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Features enabled:');
  console.log('- Project task count tracking');
  console.log('- Project owners management');
  console.log('- Task assignment by email');
  console.log('- Role-based access control');
});
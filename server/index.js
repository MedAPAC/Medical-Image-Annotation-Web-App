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

// Configure multer for task-specific file uploads
const taskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const taskId = req.params.taskId || Date.now().toString();
    const uploadDir = `uploads/tasks/${taskId}`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const taskUpload = multer({
  storage: taskStorage,
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const fileName = file.originalname.toLowerCase();
    
    // Check by file extension (more reliable for medical files)
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', 
      '.tiff', '.tif', '.nii', '.nii.gz', '.dcm', '.dicom'
    ];
    
    const fileExtension = path.extname(fileName).toLowerCase();
    
    // Check if extension is in allowed list
    const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (hasAllowedExtension) {
      console.log('File accepted by extension:', fileName);
      return cb(null, true);
    }
    
    // Also check MIME type for additional security
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/bmp', 'image/tiff', 'image/tif',
      'application/octet-stream',
      'application/x-nifti',
      'application/dicom',
      'application/x-dicom'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      console.log('File accepted by MIME type:', file.mimetype);
      return cb(null, true);
    }
    
    // Log for debugging
    console.log('File rejected:', {
      name: file.originalname,
      mimetype: file.mimetype,
      extension: fileExtension
    });
    
    cb(new Error(`File type not supported: ${file.originalname}. Allowed: images (JPG, PNG, GIF, BMP, TIFF) and medical files (DICOM, NIfTI).`));
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
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

app.post("/save-annotations", authenticateToken, async (req, res) => {
  if (!annotationsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  const { filename, annotations, classification } = req.body;

  try {
    await annotationsCollection.updateOne(
      { filename, userId: req.user.id },
      {
        $set: {
          annotations,
          classification,
          userId: req.user.id,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    res.json({ message: "Changes Successfully Saved!" });
  } catch (err) {
    console.error("Failed to save annotations to DB:", err);
    res.status(500).json({ error: "Failed to Save Changes. Please Try Again!" });
  }
});

app.get("/annotations/:filename", authenticateToken, async (req, res) => {
  if (!annotationsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const filename = req.params.filename;
  try {
    const doc = await annotationsCollection.findOne({ 
      filename, 
      userId: req.user.id 
    });
    if (!doc) {
      return res.status(404).json({ error: "Annotations not found" });
    }
    res.json({ annotations: doc.annotations, classification: doc.classification });
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
app.get('/api/tasks/:taskId', authenticateToken, checkTaskAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    // Get assignee details
    let assigneeDetails = null;
    if (req.task.assignedTo) {
      const user = await usersCollection.findOne(
        { _id: new ObjectId(req.task.assignedTo) },
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

    res.json({ 
      task: {
        ...req.task,
        assigneeDetails
      }
    });
  } catch (err) {
    console.error('Failed to fetch task:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create a new task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  if (!tasksCollection || !projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { name, projectId, subset, description, assigneeEmail, priority } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Task name is required" });
  }

  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    // Verify project exists and user has access (is an owner)
    const project = await projectsCollection.findOne({ 
      _id: new ObjectId(projectId),
      $or: [
        { userId: req.user.id },
        { owners: req.user.id }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Validate assignee if provided
    let assignedTo = null;
    if (assigneeEmail) {
      const assignee = await getUserByEmail(assigneeEmail);
      if (!assignee) {
        return res.status(400).json({ error: `Assignee email "${assigneeEmail}" is not a registered user` });
      }
      assignedTo = assignee._id.toString();
    }

    const newTask = {
      name: name.trim(),
      description: description || '',
      projectId: projectId,
      projectName: project.name,
      subset: subset || 'train',
      assignedTo: assignedTo,
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
    
    // Update project with task count - THIS IS THE KEY FIX
    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $inc: { tasks: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`Task count updated for project ${projectId}. New count: ${project.tasks + 1}`);

    res.json({
      message: "Task created successfully",
      task: {
        id: result.insertedId,
        ...newTask
      }
    });
  } catch (err) {
    console.error("Failed to create task:", err);
    res.status(500).json({ error: "Failed to create task. Please try again." });
  }
});

// Update task assignee
app.put('/api/tasks/:taskId/assign', authenticateToken, checkTaskAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { assigneeEmail } = req.body;

  try {
    // Verify user has permission (must be project owner)
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.task.projectId),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to assign tasks for this project" });
    }

    let assignedTo = null;
    if (assigneeEmail) {
      const assignee = await getUserByEmail(assigneeEmail);
      if (!assignee) {
        return res.status(400).json({ error: `Assignee email "${assigneeEmail}" is not a registered user` });
      }
      assignedTo = assignee._id.toString();
    }

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(req.params.taskId) },
      { 
        $set: { 
          assignedTo: assignedTo,
          updatedAt: new Date() 
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Task assignment updated successfully',
      assignedTo: assignedTo
    });
  } catch (err) {
    console.error('Failed to update task assignment:', err);
    res.status(500).json({ error: 'Failed to update task assignment' });
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

    const files = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
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

// ==================== SERVER START ====================

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Features enabled:');
  console.log('- Project task count tracking');
  console.log('- Project owners management');
  console.log('- Task assignment by email');
  console.log('- Role-based access control');
});
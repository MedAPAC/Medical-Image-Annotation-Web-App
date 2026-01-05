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
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}-${timestamp}${ext}`);
  },
});

const upload = multer({ storage });
app.use("/uploads", express.static(uploadDir));

const mongoUrl = "mongodb://localhost:27017";
const dbName = "annotationApp";
let db, annotationsCollection, usersCollection, projectsCollection;

MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    annotationsCollection = db.collection("annotations");
    usersCollection = db.collection("users");
    projectsCollection = db.collection("projects");
    console.log("Connected to MongoDB!");
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

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId;

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: userId, name, email }
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
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: "7d" });
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
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already Registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId;

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: userId, name, email }
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
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: "7d" });
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

// Protected routes
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

// Logout endpoint (client-side token removal)
app.post("/api/auth/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Project Management Endpoints

// index.js (Node.js/Express/MongoDB)

// Assuming 'app', 'authenticateToken', 'projectsCollection', 'port', and 'ObjectId' are defined globally or imported.
// You need to import ObjectId from your mongodb driver:
// const { ObjectId } = require('mongodb'); 
// ...

// Create a new project
app.post("/api/projects", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { name, description, labels } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Project name is required" });
  }

  try {
    const newProject = {
      name: name.trim(),
      description: description || "",
      // Ensure labels is saved, defaulting to an empty array if not provided
      labels: Array.isArray(labels) ? labels : [], 
      userId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      tasks: 0,
      progress: 0
    };

    const result = await projectsCollection.insertOne(newProject);
    
    // Omit the MongoDB internal properties from the response for cleanliness
    const { _id, ...projectData } = newProject;

    res.json({
      message: "Project created successfully",
      project: {
        id: result.insertedId,
        ...projectData
      }
    });
  } catch (err) {
    console.error("Failed to create project:", err);
    res.status(500).json({ error: "Failed to create project. Please try again." });
  }
});

// Get all projects for the authenticated user
app.get("/api/projects", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const projects = await projectsCollection
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ projects });
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
      // Assuming ObjectId is available and imported
      _id: new ObjectId(req.params.id), 
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ project });
  } catch (err) {
    console.error("Failed to fetch project:", err);
    // Handle invalid ObjectId format gracefully
    if (err.name === 'BSONTypeError') {
      return res.status(400).json({ error: "Invalid Project ID format." });
    }
    res.status(500).json({ error: "Failed to fetch project. Please try again." });
  }
});

// Update a project
app.put("/api/projects/:id", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  // Destructure all potentially updatable fields, including labels
  const { name, description, labels, status } = req.body; 

  try {
    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    
    // **CRITICAL:** Check if labels is provided and is an array before setting
    if (labels !== undefined && Array.isArray(labels)) { 
      updateData.labels = labels;
    }
    
    if (status) updateData.status = status;

    const result = await projectsCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: req.user.id
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project updated successfully" });
  } catch (err) {
    console.error("Failed to update project:", err);
    // Handle invalid ObjectId format gracefully
    if (err.name === 'BSONTypeError') {
      return res.status(400).json({ error: "Invalid Project ID format." });
    }
    res.status(500).json({ error: "Failed to update project. Please try again." });
  }
});

// Delete a project
app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const result = await projectsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
      userId: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Failed to delete project:", err);
    if (err.name === 'BSONTypeError') {
      return res.status(400).json({ error: "Invalid Project ID format." });
    }
    res.status(500).json({ error: "Failed to delete project. Please try again." });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
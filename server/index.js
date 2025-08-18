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
let db, annotationsCollection, usersCollection;

MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    annotationsCollection = db.collection("annotations");
    usersCollection = db.collection("users");
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.error("Failed to Connect to MongoDB!", err);
  });

const JWT_SECRET = "12345";

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

// *** NEW LOGIN API ***
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

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ filename: req.file.filename, originalName: req.file.originalname });
});

app.post("/save-annotations", async (req, res) => {
  if (!annotationsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  const { filename, annotations, classification } = req.body;

  try {
    await annotationsCollection.updateOne(
      { filename },
      {
        $set: {
          annotations,
          classification,
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

app.get("/annotations/:filename", async (req, res) => {
  if (!annotationsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const filename = req.params.filename;
  try {
    const doc = await annotationsCollection.findOne({ filename });
    if (!doc) {
      return res.status(404).json({ error: "Annotations not found" });
    }
    res.json({ annotations: doc.annotations, classification: doc.classification });
  } catch (err) {
    console.error("Failed to fetch annotations from DB", err);
    res.status(500).json({ error: "Failed to fetch annotations" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

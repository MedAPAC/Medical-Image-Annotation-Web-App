module.exports = function registerTeamRoutes(app, context) {
  const {
    authenticateToken,
    ObjectId,
    db,
  } = context;
// ---------------------------------------------------------
// POST: Verify if user exists
// ---------------------------------------------------------
app.post('/api/verify-user', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim() || email.length > 254) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    res.json({ exists: !!user });
  } catch (err) {
    console.error("Error verifying user:", err);
    res.status(500).json({ error: "Failed to verify user" });
  }
});

// ---------------------------------------------------------
// GET: Fetch Teams
// ---------------------------------------------------------
app.get('/api/teams', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const teams = await db.collection('teamsCollection').find({
      $or: [
        { createdBy: userId },
        { members: userEmail }
      ]
    }).sort({ createdAt: -1 }).toArray();

    res.json(teams);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// ---------------------------------------------------------
// POST: Create New Team Ã¢â‚¬â€ Ã¢Å“â€¦ owner auto-added to members
// ---------------------------------------------------------
app.post('/api/teams', authenticateToken, async (req, res) => {
  try {
    const { name, members } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Team name is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (members !== undefined && !Array.isArray(members)) {
      return res.status(400).json({ error: 'Members must be an array' });
    }
    const extraMembers = members || [];
    if (extraMembers.length > 500 || extraMembers.some((email) => typeof email !== 'string')) {
      return res.status(400).json({ error: 'Invalid team member list' });
    }

    if (extraMembers.length > 0) {
      for (const email of extraMembers) {
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: `Invalid email format: ${email}` });
        }
        // Ã¢Å“â€¦ Owner adding themselves via form is still blocked as before
        if (email.toLowerCase() === userEmail.toLowerCase()) {
          return res.status(400).json({ error: "You cannot add yourself as a member" });
        }
      }

      const uniqueMembers = [...new Set(extraMembers)];
      for (const email of uniqueMembers) {
        const userExists = await db.collection('users').findOne({ email: email.toLowerCase() });
        if (!userExists) {
          return res.status(400).json({ error: `User not found with email: ${email}` });
        }
      }
    }

    // Ã¢Å“â€¦ Owner is always prepended automatically
    const finalMembers = [userEmail, ...extraMembers.filter(e => e.toLowerCase() !== userEmail.toLowerCase())];

    const newTeam = {
      name: name.trim(),
      members: finalMembers,
      createdBy: userId,
      createdByEmail: userEmail,   // Ã¢Å“â€¦ stored for frontend badge rendering
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
// PUT: Update Team Ã¢â‚¬â€ Ã¢Å“â€¦ owner always stays in members
// ---------------------------------------------------------
app.put('/api/teams/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, members } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid team ID" });
    }

    const team = await db.collection('teamsCollection').findOne({ _id: new ObjectId(id) });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.createdBy !== userId) {
      return res.status(403).json({ error: "Not authorized to edit this team. Only the creator can edit." });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Team name is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (members !== undefined && !Array.isArray(members)) {
      return res.status(400).json({ error: 'Members must be an array' });
    }
    const extraMembers = members || [];
    if (extraMembers.length > 500 || extraMembers.some((email) => typeof email !== 'string')) {
      return res.status(400).json({ error: 'Invalid team member list' });
    }

    if (extraMembers.length > 0) {
      for (const email of extraMembers) {
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: `Invalid email format: ${email}` });
        }
        if (email.toLowerCase() === userEmail.toLowerCase()) {
          return res.status(400).json({ error: "You cannot add yourself as a member" });
        }
      }

      const uniqueMembers = [...new Set(extraMembers)];
      for (const email of uniqueMembers) {
        const userExists = await db.collection('users').findOne({ email: email.toLowerCase() });
        if (!userExists) {
          return res.status(400).json({ error: `User not found with email: ${email}` });
        }
      }
    }

    // Ã¢Å“â€¦ Owner always stays as first member
    const finalMembers = [userEmail, ...extraMembers.filter(e => e.toLowerCase() !== userEmail.toLowerCase())];

    await db.collection('teamsCollection').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          name: name.trim(), 
          members: finalMembers,
          createdByEmail: userEmail,   // ensure field exists on older docs
          updatedAt: new Date() 
        } 
      }
    );

    res.json({ success: true, message: "Team updated successfully" });
  } catch (err) {
    console.error("Error updating team:", err);
    res.status(500).json({ error: "Failed to update team" });
  }
});

// ---------------------------------------------------------
// DELETE: Delete Team (unchanged)
// ---------------------------------------------------------
app.delete('/api/teams/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid team ID" });
    }

    const team = await db.collection('teamsCollection').findOne({ _id: new ObjectId(id) });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.createdBy !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this team. Only the creator can delete." });
    }

    await db.collection('teamsCollection').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, message: "Team deleted successfully" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

// POST: Resolve emails to user names
app.post('/api/users/resolve', authenticateToken, async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length > 500 || emails.some((email) => typeof email !== 'string')) {
      return res.status(400).json({ error: "emails array required" });
    }

    const users = await db.collection('users').find(
      { email: { $in: emails.map(e => e.toLowerCase()) } },
      { projection: { email: 1, name: 1 } }
    ).toArray();

    // Return a map of email -> name for easy lookup
    const nameMap = {};
    users.forEach(u => { nameMap[u.email] = u.name; });

    res.json({ nameMap });
  } catch (err) {
    console.error("Error resolving users:", err);
    res.status(500).json({ error: "Failed to resolve users" });
  }
});
};

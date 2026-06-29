module.exports = function registerProfileRoutes(app, context) {
  const {
    authenticateToken,
    ObjectId,
    bcrypt,
    signAccessToken,
    usersCollection,
  } = context;
// User Profile Update API
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
 
    // userId comes from the JWT. Support both string and ObjectId.
    const userId = req.user.id || req.user._id;
 
    if (typeof name !== 'string' || typeof email !== 'string' || !name.trim() || !email.trim()) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    if (name.trim().length > 120 || email.trim().length > 254) {
      return res.status(400).json({ error: 'Name or email is too long.' });
    }
    if (!ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Invalid user session.' });
    }
 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
 
    // Ã¢Å“â€¦ Use the module-level `usersCollection` Ã¢â‚¬â€ NOT a re-created one
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase(),
      _id: { $ne: new ObjectId(userId) },
    });
 
    if (existingUser) {
      return res.status(409).json({ error: 'That email is already in use by another account.' });
    }
 
    // Ã¢Å“â€¦ findOneAndUpdate Ã¢â‚¬â€ compatible with MongoDB driver v4 and v5
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { name: name.trim(), email: email.trim().toLowerCase() } },
      { returnDocument: 'after' }  // driver v5 returns doc directly; v4 wraps in .value
    );
 
    // Handle both driver versions
    const updatedUser = result?.value ?? result;
 
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
 
    // Ã¢Å“â€¦ New token includes `name` so the UI stays in sync
    const newToken = signAccessToken({
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
    });
 
    res.json({
      message: 'Profile updated successfully',
      token: newToken,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/user/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id || req.user._id;
 
    // Ã¢â€â‚¬Ã¢â€â‚¬ Validate inputs Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
 
    if (newPassword.length < 12 || newPassword.length > 128) {
      return res.status(400).json({ error: 'New password must be between 12 and 128 characters.' });
    }
 
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from your current password.' });
    }
 
    // Ã¢â€â‚¬Ã¢â€â‚¬ Fetch the user Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
 
    // Ã¢â€â‚¬Ã¢â€â‚¬ Verify current password Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
 
    // Ã¢â€â‚¬Ã¢â€â‚¬ Hash and save new password Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    const hashedNew = await bcrypt.hash(newPassword, 12);
 
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedNew, updatedAt: new Date() } }
    );
 
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
};

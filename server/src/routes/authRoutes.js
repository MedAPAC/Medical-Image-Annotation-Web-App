const DUMMY_PASSWORD_HASH = '$2b$12$VNLhrJU17HrvrHs800tSkOlbpwkaHbJg37kObXAt/4Al/YtNXc07C';

module.exports = function registerAuthRoutes(app, context) {
  const {
    authenticateToken,
    signAccessToken,
    ObjectId,
    bcrypt,
    usersCollection,
  } = context;

  const normalizeSignupInput = (body = {}) => ({
    name: typeof body.name === 'string' ? body.name.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    password: typeof body.password === 'string' ? body.password : '',
  });

  const isValidEmail = (email) => (
    email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );

  const signup = async (req, res) => {
    const { email, password, name } = normalizeSignupInput(req.body);
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (name.length > 120) return res.status(400).json({ error: 'Name is too long' });
    if (password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 12 and 128 characters' });
    }

    try {
      const existingUser = await usersCollection.findOne({ email }, { projection: { _id: 1 } });
      if (existingUser) return res.status(409).json({ error: 'Email already registered' });

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = {
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await usersCollection.insertOne(newUser);
      req.auditActorUserId = String(result.insertedId);
      const token = signAccessToken({ id: result.insertedId, email, name });
      return res.status(201).json({
        token,
        user: { id: result.insertedId, name, email },
      });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ error: 'Email already registered' });
      console.error('Signup error:', error);
      return res.status(500).json({ error: 'Signup failed. Please try again.' });
    }
  };

  const login = async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password || !isValidEmail(email) || password.length > 128) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    try {
      const user = await usersCollection.findOne({ email });
      const passwordIsValid = await bcrypt.compare(password, user?.password || DUMMY_PASSWORD_HASH);
      if (!user || !passwordIsValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = signAccessToken({
        id: user._id,
        email: user.email,
        name: user.name,
      });
      req.auditActorUserId = String(user._id);
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { lastLoginAt: new Date() } }
      );
      return res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  };

  app.post('/api/auth/signup', signup);
  app.post('/api/auth/login', login);
  app.post('/signup', signup);
  app.post('/login', login);

  app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      let user = null;
      if (userId && ObjectId.isValid(userId)) {
        user = await usersCollection.findOne(
          { _id: new ObjectId(userId) },
          { projection: { name: 1, email: 1 } }
        );
      }
      if (!user && req.user.email) {
        user = await usersCollection.findOne(
          { email: req.user.email.toLowerCase() },
          { projection: { name: 1, email: 1 } }
        );
      }
      if (!user) return res.status(401).json({ error: 'User session is no longer valid' });
      return res.json({ user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(500).json({ error: 'Failed to verify session' });
    }
  });

  app.post('/api/auth/logout', authenticateToken, (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });
};

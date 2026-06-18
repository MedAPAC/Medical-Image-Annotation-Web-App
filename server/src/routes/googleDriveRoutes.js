module.exports = function registerGoogleDriveRoutes(app, context) {
  const {
    authenticateToken,
    crypto,
    jwt,
    JWT_SECRET,
    googleDriveConnectionsCollection,
    GOOGLE_DRIVE_SCOPES,
    GOOGLE_TOKEN_URL,
    getGoogleDriveConfig,
    isGoogleDriveConfigured,
    makeRequestError,
    makeDriveError,
    parseGoogleJsonResponse,
    getStoredGoogleDriveConnection,
  } = context;
app.get("/api/integrations/google-drive/status", authenticateToken, async (req, res) => {
  try {
    const connection = await getStoredGoogleDriveConnection(req.user.id);
    res.json({
      configured: isGoogleDriveConfigured(),
      connected: Boolean(connection?.refreshToken),
      email: connection?.googleEmail || '',
      scopes: connection?.scope || ''
    });
  } catch (err) {
    console.error("Failed to read Google Drive status:", err);
    res.status(500).json({ error: "Failed to read Google Drive status" });
  }
});

app.post("/api/integrations/google-drive/connect", authenticateToken, async (req, res) => {
  if (!isGoogleDriveConfigured()) {
    return res.status(400).json({
      error: "Google Drive is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI on the server."
    });
  }

  const config = getGoogleDriveConfig();
  const returnTo = req.body?.returnTo || 'http://localhost:3000/projects';
  const state = jwt.sign(
    {
      userId: req.user.id,
      nonce: crypto.randomBytes(16).toString('hex'),
      returnTo
    },
    JWT_SECRET,
    { expiresIn: '10m' }
  );

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_DRIVE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state
  });

  res.json({
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  });
});

app.get("/api/integrations/google-drive/callback", async (req, res) => {
  const { code, state, error } = req.query;
  let returnTo = 'http://localhost:3000/projects';

  try {
    if (error) {
      throw makeRequestError(String(error), 400);
    }

    if (!code || !state) {
      throw makeRequestError('Missing Google OAuth callback parameters.', 400);
    }

    if (!isGoogleDriveConfigured()) {
      throw makeRequestError('Google Drive is not configured on the server.', 500);
    }

    const decodedState = jwt.verify(state, JWT_SECRET);
    returnTo = decodedState.returnTo || returnTo;

    const config = getGoogleDriveConfig();
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw await makeDriveError(tokenResponse, 'Failed to connect Google Drive.');
    }

    const tokenData = await parseGoogleJsonResponse(tokenResponse);
    const existingConnection = await getStoredGoogleDriveConnection(decodedState.userId);
    const refreshToken = tokenData.refresh_token || existingConnection?.refreshToken;

    if (!refreshToken) {
      throw makeRequestError('Google did not return a refresh token. Disconnect and try connecting again with consent.', 400);
    }

    let googleEmail = existingConnection?.googleEmail || '';
    if (tokenData.access_token) {
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (profileResponse.ok) {
        const profile = await parseGoogleJsonResponse(profileResponse);
        googleEmail = profile.email || googleEmail;
      }
    }

    const expiresAt = new Date(Date.now() + Math.max((tokenData.expires_in || 3600) - 60, 60) * 1000);

    await googleDriveConnectionsCollection.updateOne(
      { userId: decodedState.userId },
      {
        $set: {
          googleEmail,
          accessToken: tokenData.access_token,
          refreshToken,
          scope: tokenData.scope || GOOGLE_DRIVE_SCOPES.join(' '),
          tokenType: tokenData.token_type || 'Bearer',
          expiresAt,
          updatedAt: new Date()
        },
        $setOnInsert: {
          userId: decodedState.userId,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    const redirectUrl = new URL(returnTo);
    redirectUrl.searchParams.set('googleDrive', 'connected');
    return res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Google Drive OAuth callback failed:", err);
    try {
      const redirectUrl = new URL(returnTo);
      redirectUrl.searchParams.set('googleDrive', 'error');
      redirectUrl.searchParams.set('message', err.message || 'Google Drive connection failed');
      return res.redirect(redirectUrl.toString());
    } catch {
      return res.status(err.status || 500).send(err.message || 'Google Drive connection failed');
    }
  }
});

app.delete("/api/integrations/google-drive/disconnect", authenticateToken, async (req, res) => {
  try {
    await googleDriveConnectionsCollection.deleteOne({ userId: req.user.id });
    res.json({ message: "Google Drive disconnected" });
  } catch (err) {
    console.error("Failed to disconnect Google Drive:", err);
    res.status(500).json({ error: "Failed to disconnect Google Drive" });
  }
});
};

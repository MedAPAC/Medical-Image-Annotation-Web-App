const createUserTeamService = ({ collections, ObjectId, makeRequestError }) => {
  const getUserByEmail = async (email) => {
    return collections.usersCollection.findOne({ email: email.toLowerCase() });
  };

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
      throw new Error(`The following emails are not registered users: ${invalidEmails.join(", ")}`);
    }

    return userIds;
  };

  const uniqueStrings = (items) => [...new Set((items || []).filter(Boolean).map(String))];

  const normalizeEmails = (emails) => uniqueStrings(emails)
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  const getOwnedTeamMemberEmails = async (teamIds, user) => {
    const normalizedTeamIds = uniqueStrings(teamIds);
    if (normalizedTeamIds.length === 0) {
      return [];
    }

    const invalidTeamId = normalizedTeamIds.find(teamId => !ObjectId.isValid(teamId));
    if (invalidTeamId) {
      throw makeRequestError(`Invalid team ID: ${invalidTeamId}`, 400);
    }

    const teams = await collections.db.collection("teamsCollection").find({
      _id: { $in: normalizedTeamIds.map(teamId => new ObjectId(teamId)) },
      createdBy: user.id,
    }).toArray();

    if (teams.length !== normalizedTeamIds.length) {
      throw makeRequestError("You can only use teams you created.", 403);
    }

    return normalizeEmails(
      teams.flatMap(team => [
        team.createdByEmail,
        ...(Array.isArray(team.members) ? team.members : []),
      ])
    );
  };

  const resolveUserIdsFromEmailsAndTeams = async ({ emails = [], teamIds = [], user }) => {
    if (!Array.isArray(emails)) {
      throw makeRequestError("emails must be an array", 400);
    }

    if (!Array.isArray(teamIds)) {
      throw makeRequestError("teamIds must be an array", 400);
    }

    const teamEmails = await getOwnedTeamMemberEmails(teamIds, user);
    const resolvedIds = await validateAndGetUserIds([
      ...normalizeEmails(emails),
      ...teamEmails,
    ]);

    return uniqueStrings(resolvedIds);
  };

  return {
    getUserByEmail,
    validateAndGetUserIds,
    uniqueStrings,
    normalizeEmails,
    getOwnedTeamMemberEmails,
    resolveUserIdsFromEmailsAndTeams,
  };
};

module.exports = { createUserTeamService };
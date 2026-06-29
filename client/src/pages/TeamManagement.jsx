import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';
import { Plus, Search, Trash2, Edit2, X, UserPlus, Calendar, Users } from 'lucide-react';
import '../styles/TeamManagement.css';

import { apiUrl } from '../config/api';

const Toast = ({ toasts, removeToast }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        <span>{t.message}</span>
        <button onClick={() => removeToast(t.id)} className="toast-close">
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

const TeamManagement = () => {
  const { user, token, loading: authLoading } = useAuth();

  const [myTeams, setMyTeams] = useState([]);
  const [joinedTeams, setJoinedTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my');
  const [nameMap, setNameMap] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);

  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const resolveNames = useCallback(async (teams) => {
    const allEmails = [...new Set(teams.flatMap(t => t.members || []))];
    if (allEmails.length === 0) return;
    try {
      const res = await axios.post(apiUrl('/api/users/resolve'),
        { emails: allEmails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNameMap(prev => ({ ...prev, ...res.data.nameMap }));
    } catch {
    }
  }, [token]);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl('/api/teams'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const owned = res.data.filter(t => t.createdBy === user.id);
      const joined = res.data.filter(t => t.createdBy !== user.id);
      setMyTeams(owned);
      setJoinedTeams(joined);
      await resolveNames(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        addToast('Session expired. Please log in again.');
      } else {
        addToast('Failed to fetch teams');
      }
    } finally {
      setLoading(false);
    }
  }, [addToast, resolveNames, token, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || !user) return;
    fetchTeams();
  }, [authLoading, fetchTeams, token, user]);

  const getDisplayName = (email) =>
    nameMap[email?.toLowerCase()] || email?.split('@')[0] || email;

  const getInitials = (email) => {
    const name = nameMap[email?.toLowerCase()];
    if (name) {
      const parts = name.trim().split(' ');
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    }
    return (email?.split('@')[0] || '??').slice(0, 2).toUpperCase();
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const verifyUserExists = async (email) => {
    try {
      const res = await axios.post(apiUrl('/api/verify-user'),
        { email }, { headers: { Authorization: `Bearer ${token}` } });
      return res.data.exists;
    } catch { return false; }
  };

  const resolveNewEmail = async (email) => {
    if (nameMap[email.toLowerCase()]) return;
    try {
      const res = await axios.post(apiUrl('/api/users/resolve'),
        { emails: [email] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNameMap(prev => ({ ...prev, ...res.data.nameMap }));
    } catch { }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setTeamName('');
    setMembers([]);
    setNewMemberEmail('');
    setEmailError('');
    setShowModal(true);
  };

  const handleOpenEdit = (team) => {
    setIsEditing(true);
    setCurrentTeamId(team._id);
    setTeamName(team.name);
    const ownerEmail = team.createdByEmail || user.email;
    setMembers((team.members || []).filter(m => m.toLowerCase() !== ownerEmail.toLowerCase()));
    setNewMemberEmail('');
    setEmailError('');
    setShowModal(true);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setEmailError('');
    const trimmed = newMemberEmail.trim().toLowerCase();
    if (!validateEmail(trimmed)) { setEmailError('Please enter a valid email address'); return; }
    if (members.map(m => m.toLowerCase()).includes(trimmed)) { setEmailError('This email is already added'); return; }
    if (trimmed === user.email.toLowerCase()) { setEmailError('You cannot add yourself as a member'); return; }
    const exists = await verifyUserExists(trimmed);
    if (!exists) { setEmailError('No user found with this email address'); return; }
    await resolveNewEmail(trimmed);
    setMembers([...members, trimmed]);
    setNewMemberEmail('');
  };

  const handleRemoveMember = (email) => setMembers(members.filter(m => m !== email));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) { addToast('Team name is required'); return; }

    const isDuplicate = myTeams.some(t =>
      t.name.toLowerCase() === teamName.trim().toLowerCase() &&
      (!isEditing || t._id !== currentTeamId)
    );
    if (isDuplicate) { addToast('You already have a team with this name'); return; }

    const endpoint = isEditing
      ? apiUrl(`/api/teams/${currentTeamId}`)
      : apiUrl('/api/teams');
    const method = isEditing ? 'put' : 'post';

    try {
      setSubmitting(true);
      await axios[method](endpoint, { name: teamName, members }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchTeams();
      addToast(isEditing ? 'Team updated successfully' : 'Team created successfully', 'success');
    } catch (error) {
      addToast(error.response?.data?.error || 'Failed to save team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await axios.delete(apiUrl(`/api/teams/${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTeams();
      addToast('Team deleted', 'success');
    } catch (error) {
      addToast(error.response?.data?.error || 'Failed to delete team');
    }
  };

  const filteredTeams = (activeTab === 'my' ? myTeams : joinedTeams)
    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderTeamCard = (team, isOwner) => {
    const ownerEmail = team.createdByEmail || user.email;
    return (
      <div key={team._id} className="team-card">
        <div className="card-top">
          <div className="card-icon-wrap">
            <Users size={18} />
          </div>
          {isOwner && (
            <div className="card-actions">
              <button onClick={() => handleOpenEdit(team)} className="icon-btn" title="Edit team">
                <Edit2 size={15} />
              </button>
              <button onClick={() => handleDelete(team._id)} className="icon-btn danger" title="Delete team">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        <h3 className="card-title">{team.name}</h3>

        <div className="card-meta">
          <span><Calendar size={13} /> {new Date(team.createdAt).toLocaleDateString()}</span>
          <span><Users size={13} /> {team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="members-preview">
          {team.members.slice(0, 4).map((m, i) => {
            const isTeamOwner = m.toLowerCase() === ownerEmail.toLowerCase();
            return (
              <span
                key={i}
                className={`badge ${isTeamOwner ? 'badge-owner' : 'badge-member'}`}
                title={m}
              >
                {getDisplayName(m)}
                {isTeamOwner && <span className="owner-dot" />}
              </span>
            );
          })}
          {team.members.length > 4 && (
            <span className="badge badge-more">+{team.members.length - 4}</span>
          )}
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="team-page-container">
        <Header page="teams" />
        <div className="state-message">Loading…</div>
      </div>
    );
  }

  return (
    <div className="team-page-container">
      <Header page="teams" />
      <Toast toasts={toasts} removeToast={removeToast} />

      <main className="team-content">
        <div className="page-header">
          <div>
            <h1>Teams</h1>
            <p className="page-subtitle">Manage your annotation teams</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search teams…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} /> New team
            </button>
          </div>
        </div>

        <div className="tab-bar">
          <button className={`tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
            My Teams <span className="tab-count">{myTeams.length}</span>
          </button>
          <button className={`tab ${activeTab === 'joined' ? 'active' : ''}`} onClick={() => setActiveTab('joined')}>
            Joined Teams <span className="tab-count">{joinedTeams.length}</span>
          </button>
        </div>

        {loading ? (
          <div className="state-message">Loading teams…</div>
        ) : filteredTeams.length > 0 ? (
          <div className="teams-grid">
            {filteredTeams.map(team => renderTeamCard(team, activeTab === 'my'))}
          </div>
        ) : (
          <div className="empty-state">
            <Users size={36} strokeWidth={1.5} />
            <p>{activeTab === 'my' ? 'No teams yet — create one to get started.' : "You haven't joined any teams yet."}</p>
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{isEditing ? 'Edit team' : 'Create new team'}</h2>
              <button onClick={() => setShowModal(false)} className="modal-close"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Team name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Radiology Dept A"
                  required
                />
              </div>

              <div className="field">
                <label>Add members by email</label>
                <div className="email-row">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => { setNewMemberEmail(e.target.value); setEmailError(''); }}
                    placeholder="user@example.com"
                  />
                  <button type="button" onClick={handleAddMember} className="btn-add">
                    <UserPlus size={16} />
                  </button>
                </div>
                {emailError && <span className="field-error">{emailError}</span>}
              </div>

              <div className="members-list">
                {members.length === 0
                  ? <span className="list-empty">No members added yet</span>
                  : members.map((email, i) => (
                    <div key={i} className="member-row">
                      <div className="member-avatar">{getInitials(email)}</div>
                      <div className="member-info">
                        <span className="member-name">{getDisplayName(email)}</span>
                        <span className="member-email">{email}</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveMember(email)} className="btn-remove">
                        <X size={13} />
                      </button>
                    </div>
                  ))
                }
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;

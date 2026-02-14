import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';
import { Plus, Search, Trash2, Edit2, X, UserPlus, Calendar, Users } from 'lucide-react';
import '../styles/TeamManagement.css'; // We will create this CSS next

const TeamManagement = () => {
  const { user, token } = useAuth();
  
  // State
  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);
  
  // Form State
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // 1. Fetch Teams on Mount
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(res.data);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handlers
  const handleOpenCreate = () => {
    setIsEditing(false);
    setTeamName('');
    setMembers([]);
    setNewMemberEmail('');
    setShowModal(true);
  };

  const handleOpenEdit = (team) => {
    setIsEditing(true);
    setCurrentTeamId(team._id);
    setTeamName(team.name);
    setMembers(team.members || []);
    setNewMemberEmail('');
    setShowModal(true);
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (newMemberEmail && !members.includes(newMemberEmail)) {
      setMembers([...members, newMemberEmail]);
      setNewMemberEmail('');
    }
  };

  const handleRemoveMember = (email) => {
    setMembers(members.filter(m => m !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isEditing 
      ? `http://localhost:5000/api/teams/${currentTeamId}` 
      : 'http://localhost:5000/api/teams';
    
    const method = isEditing ? 'put' : 'post';

    try {
      await axios[method](endpoint, { name: teamName, members }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchTeams(); // Refresh list
    } catch (error) {
      alert("Failed to save team");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/teams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTeams();
    } catch (error) {
      alert("Failed to delete team (You may not be the owner)");
    }
  };

  // Filter Teams
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="team-page-container">
      <Header page="teams" />
      
      <main className="team-content">
        <div className="team-header">
          <h1>Team Management</h1>
          
          <div className="team-actions">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search teams..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="create-btn" onClick={handleOpenCreate}>
              <Plus size={18} /> Create Team
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading teams...</div>
        ) : (
          <div className="teams-grid">
            {filteredTeams.length > 0 ? filteredTeams.map(team => (
              <div key={team._id} className="team-card">
                <div className="card-header">
                  <h3>{team.name}</h3>
                  {/* Only show actions if current user is creator */}
                  {/* Note: In a real app, check team.createdBy === user.id */}
                  <div className="card-actions">
                    <button onClick={() => handleOpenEdit(team)} className="icon-btn edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(team._id)} className="icon-btn delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="card-details">
                  <div className="detail-item">
                    <Calendar size={14} />
                    <span>Created: {new Date(team.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <Users size={14} />
                    <span>{team.members.length} Members</span>
                  </div>
                </div>

                <div className="members-preview">
                  {team.members.slice(0, 3).map((m, i) => (
                    <span key={i} className="member-badge">{m.split('@')[0]}</span>
                  ))}
                  {team.members.length > 3 && <span className="more-badge">+{team.members.length - 3}</span>}
                </div>
              </div>
            )) : (
              <div className="no-teams">
                <p>No teams found. Create one to get started!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL FOR CREATE / EDIT */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Team' : 'Create New Team'}</h2>
              <button onClick={() => setShowModal(false)} className="close-btn"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Team Name</label>
                <input 
                  type="text" 
                  value={teamName} 
                  onChange={(e) => setTeamName(e.target.value)} 
                  required 
                  placeholder="e.g. Radiology Dept A"
                />
              </div>

              <div className="form-group">
                <label>Add Members (by email)</label>
                <div className="add-member-row">
                  <input 
                    type="email" 
                    value={newMemberEmail} 
                    onChange={(e) => setNewMemberEmail(e.target.value)} 
                    placeholder="user@example.com"
                  />
                  <button type="button" onClick={handleAddMember} className="add-btn">
                    <UserPlus size={18}/>
                  </button>
                </div>
              </div>

              <div className="members-list">
                {members.map((email, index) => (
                  <div key={index} className="member-item">
                    <span>{email}</span>
                    <button type="button" onClick={() => handleRemoveMember(email)} className="remove-btn">
                      <X size={14}/>
                    </button>
                  </div>
                ))}
                {members.length === 0 && <span className="empty-msg">No members added yet</span>}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">{isEditing ? 'Update Team' : 'Create Team'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;

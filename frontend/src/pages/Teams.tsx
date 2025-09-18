import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Users, 
  User,
  Crown,
  Shield,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { teamApi } from '../api/teamApi';
import Navbar from '../components/Navbar';

interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  members: TeamMember[];
}

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface CreateTeamData {
  name: string;
  description: string;
}

export default function Teams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Core state
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create team modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createTeamForm, setCreateTeamForm] = useState<CreateTeamData>({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await teamApi.getTeams();
      setTeams(response.teams || []);
    } catch (error: any) {
      console.error('Error loading teams:', error);
      toast.error(error.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!createTeamForm.name.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    try {
      setCreating(true);
      console.log('🚀 Creating team with data:', createTeamForm);
      
      const response = await teamApi.createTeam({
        name: createTeamForm.name.trim(),
        description: createTeamForm.description.trim() || undefined
      });
      
      console.log('✅ Team created successfully:', response);
      
      // Show success message
      toast.success(response.message || 'Team created successfully');
      
      // Reset form and close modal
      setCreateTeamForm({ name: '', description: '' });
      setShowCreateModal(false);
      
      // Reload teams to show the new team
      await loadTeams();
    } catch (error: any) {
      console.error('❌ Error creating team:', error);
      
      // Show specific error message from server or generic message
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to create team. Please try again.';
      
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setCreateTeamForm({ name: '', description: '' });
    setShowCreateModal(false);
    setCreating(false);
  };

  const handleFormChange = (field: keyof CreateTeamData, value: string) => {
    setCreateTeamForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenMemberModal = async (team: Team) => {
    // Navigate to team management page instead of modal
    navigate(`/teams/${team.id}/manage`);
  };

  const getUserRole = (team: Team, userId: string) => {
    const member = team.members.find(m => m.user.id === userId);
    return member?.role || 'MEMBER';
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navbar />

      {/* Controls */}
      <div className="container mx-auto px-4 pt-20 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Create Team Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Team
          </button>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'No teams found' : 'No teams yet'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search criteria' 
                  : 'Create your first team to start collaborating'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Team
                </button>
              )}
            </div>
          ) : (
            filteredTeams.map((team) => (
              <div
                key={team.id}
                className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-purple-400">
                      {getUserRole(team, user?.id || '') === 'OWNER' && <Crown className="h-4 w-4" />}
                      {getUserRole(team, user?.id || '') === 'ADMIN' && <Shield className="h-4 w-4" />}
                      {getUserRole(team, user?.id || '') === 'MEMBER' && <User className="h-4 w-4" />}
                      <span className="text-xs font-medium">
                        {getUserRole(team, user?.id || '')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(team.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 3).map((member) => (
                        <div
                          key={member.id}
                          className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-gray-900"
                          title={member.user.firstName && member.user.lastName 
                            ? `${member.user.firstName} ${member.user.lastName}` 
                            : member.user.email}
                        >
                          {member.user.firstName 
                            ? member.user.firstName[0].toUpperCase() 
                            : member.user.email[0].toUpperCase()}
                        </div>
                      ))}
                      {team.members.length > 3 && (
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-gray-900">
                          +{team.members.length - 3}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenMemberModal(team)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget && !creating) {
              handleCancelCreate();
            }
          }}
        >
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create New Team</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={createTeamForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Enter team name"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={createTeamForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Brief description of the team (optional)"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelCreate}
                disabled={creating}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={creating || !createTeamForm.name.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {creating ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
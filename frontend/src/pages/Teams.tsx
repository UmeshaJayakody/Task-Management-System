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
  Calendar,
  Filter,
  Activity,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { teamApi } from '../api/teamApi';

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

  // Filter and sort state
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'created'>('name');
  const [filterRole, setFilterRole] = useState<'all' | 'OWNER' | 'ADMIN' | 'MEMBER'>('all');
  const [showFilters, setShowFilters] = useState(false);

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

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || getUserRole(team, user?.id || '') === filterRole;
    
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'members':
        return b.members.length - a.members.length;
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // Calculate statistics
  const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);
  const myOwnedTeams = teams.filter(team => getUserRole(team, user?.id || '') === 'OWNER').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4 pt-20 py-6">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="mb-8">
              <div className="h-8 bg-gray-700 rounded w-64 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="h-4 bg-gray-700 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-gray-700 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Controls skeleton */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 h-12 bg-gray-700 rounded-lg"></div>
              <div className="h-12 w-32 bg-gray-700 rounded-lg"></div>
            </div>
            
            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="h-6 bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-24 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="w-8 h-8 bg-gray-700 rounded-full"></div>
                      ))}
                    </div>
                    <div className="h-8 w-20 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 pt-20 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Teams</h1>
              <p className="text-gray-400">Collaborate and manage your teams effectively</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Teams</p>
                  <p className="text-2xl font-bold text-white">{teams.length}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Members</p>
                  <p className="text-2xl font-bold text-white">{totalMembers}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <UserPlus className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Teams Owned</p>
                  <p className="text-2xl font-bold text-white">{myOwnedTeams}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Crown className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Enhanced Controls */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search and Create */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search teams by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-lg transition-all flex items-center gap-2 ${
                showFilters 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {(filterRole !== 'all' || sortBy !== 'name') && (
                <span className="bg-red-500 text-white text-xs rounded-full w-2 h-2"></span>
              )}
            </button>

            {/* Create Team Button */}
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Create Team
            </button>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Role Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    title="Filter teams by your role"
                  >
                    <option value="all">All Roles</option>
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    title="Sort teams by different criteria"
                  >
                    <option value="name">Team Name</option>
                    <option value="members">Member Count</option>
                    <option value="created">Creation Date</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                  <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400 text-sm">
                      {filteredTeams.length} of {teams.length} teams
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-12 w-12 text-gray-500" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">
                  {searchTerm ? 'No teams found' : 'No teams yet'}
                </h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {searchTerm 
                    ? 'Try adjusting your search criteria or filters to find the teams you\'re looking for' 
                    : 'Create your first team to start collaborating with your colleagues and manage projects together'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                    Create Your First Team
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredTeams.map((team) => {
              const userRole = getUserRole(team, user?.id || '');
              const isOwner = userRole === 'OWNER';
              const isAdmin = userRole === 'ADMIN';
              
              return (
                <div
                  key={team.id}
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Role badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isOwner 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : isAdmin 
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {isOwner && <Crown className="h-3 w-3" />}
                      {isAdmin && <Shield className="h-3 w-3" />}
                      {!isOwner && !isAdmin && <User className="h-3 w-3" />}
                      <span>{userRole}</span>
                    </div>
                  </div>
                  
                  <div className="relative z-10 p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-1">
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                          {team.description}
                        </p>
                      )}
                    </div>

                    {/* Team Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(team.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </div>

                    {/* Member Avatars and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex -space-x-2 mr-3">
                          {team.members.slice(0, 4).map((member) => {
                            const memberRole = member.role;
                            return (
                              <div
                                key={member.id}
                                className={`relative w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900 transition-transform hover:scale-110 hover:z-10 ${
                                  memberRole === 'OWNER' 
                                    ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                                    : memberRole === 'ADMIN'
                                    ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                }`}
                                title={`${member.user.firstName && member.user.lastName 
                                  ? `${member.user.firstName} ${member.user.lastName}` 
                                  : member.user.email} (${memberRole})`}
                              >
                                {member.user.firstName 
                                  ? member.user.firstName[0].toUpperCase() 
                                  : member.user.email[0].toUpperCase()}
                                
                                {/* Role indicator */}
                                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-gray-900 ${
                                  memberRole === 'OWNER' 
                                    ? 'bg-purple-400' 
                                    : memberRole === 'ADMIN'
                                    ? 'bg-orange-400'
                                    : 'bg-blue-400'
                                }`}>
                                  {memberRole === 'OWNER' && <Crown className="h-2 w-2 text-white p-0.5" />}
                                  {memberRole === 'ADMIN' && <Shield className="h-2 w-2 text-white p-0.5" />}
                                </div>
                              </div>
                            );
                          })}
                          {team.members.length > 4 && (
                            <div className="w-9 h-9 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900 hover:scale-110 transition-transform">
                              +{team.members.length - 4}
                            </div>
                          )}
                        </div>
                        
                        {team.members.length === 0 && (
                          <span className="text-gray-500 text-sm">No members</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenMemberModal(team)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Manage</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Hover effect border */}
                  <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-blue-500/20 transition-colors duration-300 pointer-events-none" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Enhanced Create Team Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget && !creating) {
              handleCancelCreate();
            }
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Create New Team</h2>
              <p className="text-gray-400">Start collaborating with your colleagues</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={createTeamForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Enter a unique team name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  maxLength={50}
                />
                <div className="text-right mt-1">
                  <span className="text-xs text-gray-500">
                    {createTeamForm.name.length}/50
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Description <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={createTeamForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Brief description of the team's purpose and goals"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-right mt-1">
                  <span className="text-xs text-gray-500">
                    {createTeamForm.description.length}/200
                  </span>
                </div>
              </div>

              {/* Features Preview */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">What you'll get:</h4>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    Team collaboration workspace
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    Shared task management
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    Member role management
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCancelCreate}
                disabled={creating}
                className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 disabled:bg-gray-500/30 text-gray-300 hover:text-white rounded-xl transition-all font-medium border border-gray-600/50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={creating || !createTeamForm.name.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Team
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
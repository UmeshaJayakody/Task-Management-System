import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Users, ArrowLeft, Crown, Shield, UserMinus, CheckSquare, Calendar, User, MessageSquare, Send } from 'lucide-react';
import { teamApi } from '../api/teamApi';
import { userApi } from '../api/userApi';
import { taskApi } from '../api/taskApi';
import { commentApi, type Comment, type CreateCommentData } from '../api/commentApi';
import type { Team } from '../api/teamApi';
import type { UserProfile } from '../api/userApi';
import type { Task } from '../api/taskApi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function TeamManagement() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'tasks'>('members');
  
  // Member management state
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  
  // Task management state
  const [teamTasks, setTeamTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Comment management state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    if (teamId) {
      loadTeam();
      loadTeamTasks();
    }
  }, [teamId]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const response = await teamApi.getTeams();
      const foundTeam = response.teams.find((t: Team) => t.id === teamId);
      if (foundTeam) {
        setTeam(foundTeam);
      } else {
        toast.error('Team not found');
        navigate('/teams');
      }
    } catch (error) {
      console.error('Error loading team:', error);
      toast.error('Failed to load team');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamTasks = async () => {
    if (!teamId) return;
    
    try {
      setLoadingTasks(true);
      const response = await taskApi.getTasks({ teamId });
      setTeamTasks(response.tasks || []);
    } catch (error) {
      console.error('Error loading team tasks:', error);
      toast.error('Failed to load team tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleSearchMembers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await userApi.searchUsers(searchTerm);
      
      if (response && response.users) {
        // Filter out users who are already team members
        const existingMemberIds = team?.members.map(m => m.user.id) || [];
        const filteredUsers = response.users.filter(
          (searchUser: UserProfile) => !existingMemberIds.includes(searchUser.id)
        );
        setSearchResults(filteredUsers);
      } else {
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Error searching members:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!team) return;

    const userToAdd = searchResults.find(user => user.id === userId);
    if (!userToAdd) {
      toast.error('User not found');
      return;
    }

    try {
      setAddingMember(true);
      const result = await teamApi.addMember(team.id, userId, 'MEMBER');
      
      // Optimistic update
      const newMember = {
        id: result.membership?.id || `temp-${Date.now()}`,
        userId: userId,
        teamId: team.id,
        role: 'MEMBER' as const,
        joinedAt: new Date().toISOString(),
        user: userToAdd
      };

      const updatedTeam = {
        ...team,
        members: [...team.members, newMember]
      };
      setTeam(updatedTeam);
      
      toast.success('Member added successfully');
      setMemberSearchTerm('');
      setSearchResults([]);
      
    } catch (error: any) {
      console.error('Error adding member:', error);
      let errorMessage = 'Failed to add member';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return;

    try {
      await teamApi.removeMember(team.id, memberId);
      
      // Update team state
      const updatedTeam = {
        ...team,
        members: team.members.filter(member => member.id !== memberId)
      };
      setTeam(updatedTeam);
      
      toast.success('Member removed successfully');
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const getUserRole = (team: Team, userId: string) => {
    const member = team.members.find(m => m.user.id === userId);
    return member?.role || 'MEMBER';
  };

  const canManageTeam = (team: Team) => {
    const userRole = getUserRole(team, user?.id || '');
    return userRole === 'OWNER' || userRole === 'ADMIN';
  };

  const handleTaskClick = (task: Task) => {
    // Navigate to task detail page (we'll create this later)
    navigate(`/tasks/${task.id}`);
  };

  // Comment handling functions
  const handleShowComments = async (task: Task) => {
    setSelectedTaskForComments(task);
    setShowCommentsModal(true);
    await loadTaskComments(task.id);
  };

  const loadTaskComments = async (taskId: string) => {
    try {
      setLoadingComments(true);
      const response = await commentApi.getTaskComments(taskId);
      // Backend returns { comments: Comment[], pagination: ... }
      setComments(response.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTaskForComments) return;

    try {
      setAddingComment(true);
      const commentData: CreateCommentData = {
        content: newComment.trim(),
        taskId: selectedTaskForComments.id
      };
      
      await commentApi.createComment(commentData);
      setNewComment('');
      await loadTaskComments(selectedTaskForComments.id);
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const closeCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedTaskForComments(null);
    setComments([]);
    setNewComment('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading team...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Team not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navbar />
      
      {/* Team Header */}
      <div className="pt-20 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/teams')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Back to Teams"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{team.name}</h1>
              {team.description && (
                <p className="text-gray-300 mt-1">{team.description}</p>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              Members ({team.members.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              Tasks ({teamTasks.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'members' ? (
          <div className="space-y-6">
            {/* Add Member Section */}
            {canManageTeam(team) && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Add New Member</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Search by Email</label>
                    <input
                      type="email"
                      placeholder="Enter email to search users..."
                      value={memberSearchTerm}
                      onChange={(e) => {
                        setMemberSearchTerm(e.target.value);
                        handleSearchMembers(e.target.value);
                      }}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Search Results */}
                  {searchLoading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400">Searching...</div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-400">Search Results:</p>
                      {searchResults.map((searchUser) => (
                        <div
                          key={searchUser.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div>
                            <p className="text-white font-medium">
                              {searchUser.firstName && searchUser.lastName 
                                ? `${searchUser.firstName} ${searchUser.lastName}` 
                                : searchUser.email}
                            </p>
                            <p className="text-gray-400 text-sm">{searchUser.email}</p>
                          </div>
                          <button
                            onClick={() => handleAddMember(searchUser.id)}
                            disabled={addingMember}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                          >
                            {addingMember ? 'Adding...' : 'Add Member'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : memberSearchTerm.trim() && !searchLoading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400">No users found</div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Current Members */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Team Members ({team.members.length})</h2>
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {member.role === 'OWNER' ? (
                          <Crown className="h-5 w-5 text-yellow-400" />
                        ) : member.role === 'ADMIN' ? (
                          <Shield className="h-5 w-5 text-blue-400" />
                        ) : (
                          <Users className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {member.user.firstName && member.user.lastName
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user.email}
                        </p>
                        <p className="text-gray-400 text-sm">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        member.role === 'OWNER' 
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : member.role === 'ADMIN'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {member.role}
                      </span>
                      {member.role !== 'OWNER' && canManageTeam(team) && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Remove member"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Tasks Tab */
          <div className="space-y-6">
            {/* Create Task Section */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Team Tasks</h2>
              {canManageTeam(team) && (
                <button
                  onClick={() => navigate(`/teams/${team.id}/create-task`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create Task
                </button>
              )}
            </div>

            {/* Tasks List */}
            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">Loading tasks...</div>
              </div>
            ) : teamTasks.length > 0 ? (
              <div className="grid gap-4">
                {teamTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-2">{task.title}</h3>
                        {task.description && (
                          <p className="text-gray-400 mb-3">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            task.status === 'TODO' ? 'bg-gray-500/20 text-gray-400' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                            task.status === 'IN_REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
                            task.status === 'DONE' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {task.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            task.priority === 'LOW' ? 'bg-gray-500/20 text-gray-400' :
                            task.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                            task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-gray-400">
                              <Calendar className="h-4 w-4" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowComments(task);
                            }}
                            className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="h-4 w-4" />
                            {task._count?.comments || 0}
                          </button>
                        </div>
                      </div>
                      {task.assignments.length > 0 && (
                        <div className="flex flex-col items-end ml-4">
                          <span className="text-xs text-gray-400 mb-2">Assigned to:</span>
                          <div className="flex flex-wrap gap-1">
                            {task.assignments.map((assignment) => (
                              <span
                                key={assignment.user.id}
                                className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs"
                              >
                                <User className="h-3 w-3" />
                                {assignment.user.firstName && assignment.user.lastName
                                  ? `${assignment.user.firstName} ${assignment.user.lastName}`
                                  : assignment.user.email}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <CheckSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">No tasks yet</h3>
                <p className="text-gray-400 mb-4">Create your first task to get started with team collaboration</p>
                {canManageTeam(team) && (
                  <button
                    onClick={() => navigate(`/teams/${team.id}/create-task`)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create First Task
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {showCommentsModal && selectedTaskForComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Comments for "{selectedTaskForComments.title}"
            </h3>
            
            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {loadingComments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading comments...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {comment.user?.firstName && comment.user?.lastName 
                          ? `${comment.user.firstName} ${comment.user.lastName}`
                          : comment.user?.email || 'Unknown User'
                        }
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
                disabled={addingComment}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeCommentsModal}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={addingComment || !newComment.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {addingComment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Add Comment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
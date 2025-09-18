import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Users, ArrowLeft, Crown, Shield, UserMinus, CheckSquare, Calendar, User, MessageSquare, Send, Star, Clock } from 'lucide-react';
import { teamApi } from '../api/teamApi';
import { userApi } from '../api/userApi';
import { taskApi } from '../api/taskApi';
import { commentApi, type Comment, type CreateCommentData } from '../api/commentApi';
import type { Team } from '../api/teamApi';
import type { UserProfile } from '../api/userApi';
import type { Task } from '../api/taskApi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Button, Card, CardHeader, CardContent, Modal, Input, Badge } from '../components/ui';

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

  const handleAddComment = async () => {
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
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      {/* Enhanced Team Header with glassmorphism */}
      <div className="pt-20 border-b border-white/10">
        <div className="relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-accent-600/10 to-primary-600/10 opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
          
          <div className="relative container mx-auto px-4 py-8">
            <div className="flex items-center gap-6 mb-6 animate-slide-up">
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/teams')}
                leftIcon={ArrowLeft}
                className="hover-lift"
              >
                Back
              </Button>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gradient-primary mb-2 animate-fade-in">
                  {team.name}
                </h1>
                {team.description && (
                  <p className="text-gray-300 text-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {team.description}
                  </p>
                )}
                
                {/* Team stats */}
                <div className="flex items-center gap-4 mt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <Badge variant="primary" dot>
                    {team.members.length} Members
                  </Badge>
                  <Badge variant="secondary" dot>
                    {teamTasks.length} Tasks
                  </Badge>
                  <Badge variant="success" dot>
                    {teamTasks.filter(t => t.status === 'DONE').length} Completed
                  </Badge>
                </div>
              </div>
            </div>

            {/* Enhanced Tab Navigation with glassmorphism */}
            <div className="flex space-x-2 glass-card rounded-2xl p-2 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 group ${
                  activeTab === 'members'
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-neon'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span>Members</span>
                <Badge size="sm" variant={activeTab === 'members' ? 'default' : 'primary'}>
                  {team.members.length}
                </Badge>
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 group ${
                  activeTab === 'tasks'
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-neon'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <CheckSquare className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span>Tasks</span>
                <Badge size="sm" variant={activeTab === 'tasks' ? 'default' : 'primary'}>
                  {teamTasks.length}
                </Badge>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content with better spacing and animations */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {activeTab === 'members' ? (
          <div className="space-y-8 animate-fade-in">
            {/* Enhanced Add Member Section */}
            {canManageTeam(team) && (
              <Card variant="glass" padding="lg" animated className="hover-lift">
                <CardHeader icon={Plus}>
                  <h2 className="text-2xl font-bold text-white">Add New Member</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Input
                      label="Search by Email"
                      type="email"
                      placeholder="Enter email to search users..."
                      value={memberSearchTerm}
                      onChange={(e) => {
                        setMemberSearchTerm(e.target.value);
                        handleSearchMembers(e.target.value);
                      }}
                      leftIcon={Search}
                      variant="glass"
                      inputSize="lg"
                    />

                    {/* Enhanced Search Results */}
                    {searchLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-4" />
                        <div className="text-gray-400 text-lg">Searching users...</div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-gray-300 font-medium">Search Results:</p>
                        <div className="grid gap-3">
                          {searchResults.map((searchUser, index) => (
                            <Card
                              key={searchUser.id}
                              variant="gradient"
                              padding="md"
                              hoverable
                              className="animate-slide-up group"
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold text-lg">
                                      {searchUser.firstName && searchUser.lastName 
                                        ? `${searchUser.firstName} ${searchUser.lastName}` 
                                        : 'User'}
                                    </p>
                                    <p className="text-gray-400">{searchUser.email}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="success"
                                  onClick={() => handleAddMember(searchUser.id)}
                                  isLoading={addingMember}
                                  leftIcon={Plus}
                                  className="group-hover:scale-105"
                                >
                                  Add Member
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : memberSearchTerm.trim() && !searchLoading ? (
                      <Card variant="bordered" padding="lg" className="text-center">
                        <div className="py-8">
                          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                          <h3 className="text-white text-xl font-semibold mb-2">No users found</h3>
                          <p className="text-gray-400">Try searching with a different email address</p>
                        </div>
                      </Card>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Current Members Section */}
            <Card variant="glass" padding="lg" animated className="hover-lift">
              <CardHeader icon={Users}>
                <div>
                  <h2 className="text-2xl font-bold text-white">Team Members</h2>
                  <p className="text-gray-400 mt-1">{team.members.length} members in this team</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {team.members.map((member, index) => (
                    <Card
                      key={member.id}
                      variant="gradient"
                      padding="md"
                      hoverable
                      className="animate-slide-up group"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                              member.role === 'OWNER' 
                                ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                                : member.role === 'ADMIN'
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                : 'bg-gradient-to-br from-gray-500 to-gray-600'
                            }`}>
                              {member.role === 'OWNER' ? (
                                <Crown className="w-7 h-7 text-white" />
                              ) : member.role === 'ADMIN' ? (
                                <Shield className="w-7 h-7 text-white" />
                              ) : (
                                <User className="w-7 h-7 text-white" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-dark-800" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-lg">
                              {member.user.firstName && member.user.lastName
                                ? `${member.user.firstName} ${member.user.lastName}`
                                : 'User'}
                            </p>
                            <p className="text-gray-400">{member.user.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={
                              member.role === 'OWNER' ? 'warning' :
                              member.role === 'ADMIN' ? 'info' : 'default'
                            }
                            size="lg"
                            glowing={member.role === 'OWNER'}
                          >
                            {member.role}
                          </Badge>
                          {member.role !== 'OWNER' && canManageTeam(team) && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              leftIcon={UserMinus}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Enhanced Tasks Tab */
          <div className="space-y-8 animate-fade-in">
            {/* Enhanced Create Task Section */}
            <Card variant="glass" padding="lg" animated className="hover-lift">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Team Tasks</h2>
                  <p className="text-gray-400 mt-1">{teamTasks.length} tasks in this team</p>
                </div>
                {canManageTeam(team) && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(`/teams/${team.id}/create-task`)}
                    leftIcon={Plus}
                    glowing
                    className="hover-lift"
                  >
                    Create Task
                  </Button>
                )}
              </div>
            </Card>

            {/* Enhanced Tasks List */}
            {loadingTasks ? (
              <Card variant="glass" padding="xl" className="text-center">
                <div className="py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent mx-auto mb-6" />
                  <div className="text-gray-400 text-xl">Loading tasks...</div>
                </div>
              </Card>
            ) : teamTasks.length > 0 ? (
              <div className="grid gap-6">
                {teamTasks.map((task, index) => (
                  <Card
                    key={task.id}
                    variant="gradient"
                    padding="lg"
                    hoverable
                    animated
                    onClick={() => handleTaskClick(task)}
                    className="cursor-pointer group animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-white font-semibold text-xl group-hover:text-primary-300 transition-colors">
                            {task.title}
                          </h3>
                          <Badge 
                            variant={
                              task.status === 'TODO' ? 'default' :
                              task.status === 'IN_PROGRESS' ? 'info' :
                              task.status === 'IN_REVIEW' ? 'warning' :
                              task.status === 'DONE' ? 'success' :
                              'danger'
                            }
                            size="md"
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge 
                            variant={
                              task.priority === 'LOW' ? 'default' :
                              task.priority === 'MEDIUM' ? 'info' :
                              task.priority === 'HIGH' ? 'warning' :
                              'danger'
                            }
                            size="md"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-gray-400 mb-4 line-clamp-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm">
                          {task.dueDate && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowComments(task);
                            }}
                            leftIcon={MessageSquare}
                            className="text-gray-400 hover:text-primary-400"
                          >
                            {task._count?.comments || 0} Comments
                          </Button>
                        </div>
                      </div>
                      
                      {task.assignments.length > 0 && (
                        <div className="flex flex-col items-end ml-6">
                          <span className="text-xs text-gray-400 mb-3">Assigned to:</span>
                          <div className="flex flex-wrap gap-2 justify-end">
                            {task.assignments.slice(0, 3).map((assignment) => (
                              <div
                                key={assignment.user.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-primary-300 rounded-full text-xs border border-primary-500/30"
                              >
                                <User className="h-3 w-3" />
                                <span>
                                  {assignment.user.firstName && assignment.user.lastName
                                    ? `${assignment.user.firstName} ${assignment.user.lastName}`
                                    : assignment.user.email.split('@')[0]}
                                </span>
                              </div>
                            ))}
                            {task.assignments.length > 3 && (
                              <Badge variant="primary" size="sm">
                                +{task.assignments.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card variant="glass" padding="xl" className="text-center">
                <div className="py-12">
                  <CheckSquare className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-white text-2xl font-semibold mb-3">No tasks yet</h3>
                  <p className="text-gray-400 mb-6 text-lg">Create your first task to get started with team collaboration</p>
                  {canManageTeam(team) && (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => navigate(`/teams/${team.id}/create-task`)}
                      leftIcon={Plus}
                      glowing
                    >
                      Create First Task
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Comments Modal */}
      <Modal
        isOpen={showCommentsModal}
        onClose={closeCommentsModal}
        title={`Comments for "${selectedTaskForComments?.title}"`}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={closeCommentsModal}
              fullWidth
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleAddComment}
              isLoading={addingComment}
              leftIcon={Send}
              fullWidth
              disabled={!newComment.trim()}
            >
              Add Comment
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Comments List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loadingComments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-4" />
                <p className="text-gray-400">Loading comments...</p>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment, index) => (
                <Card
                  key={comment.id}
                  variant="glass"
                  padding="md"
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white">
                          {comment.user?.firstName && comment.user?.lastName 
                            ? `${comment.user.firstName} ${comment.user.lastName}`
                            : comment.user?.email || 'Unknown User'
                          }
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{comment.content}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card variant="glass" padding="xl" className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">No comments yet</h3>
                <p className="text-gray-400">Be the first to share your thoughts!</p>
              </Card>
            )}
          </div>

          {/* Add Comment Form */}
          <Card variant="glass" padding="md">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full p-4 glass border-white/20 rounded-xl focus:outline-none focus:border-primary-500 focus:shadow-neon text-white placeholder-gray-400 resize-none transition-all duration-300"
              rows={4}
              disabled={addingComment}
            />
          </Card>
        </div>
      </Modal>
    </div>
  );
}
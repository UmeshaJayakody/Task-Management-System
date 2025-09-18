import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { teamApi } from '../api/teamApi';
import { taskApi } from '../api/taskApi';
import type { Team } from '../api/teamApi';
import type { CreateTaskData } from '../api/taskApi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function CreateTask() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  const [taskForm, setTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    teamId: teamId || '',
    assigneeIds: []
  });

  useEffect(() => {
    if (teamId) {
      loadTeam();
    }
  }, [teamId]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const response = await teamApi.getTeams();
      const foundTeam = response.teams.find((t: Team) => t.id === teamId);
      if (foundTeam) {
        setTeam(foundTeam);
        setTaskForm(prev => ({ ...prev, teamId: foundTeam.id }));
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

  const getUserRole = (team: Team, userId: string) => {
    const member = team.members.find(m => m.user.id === userId);
    return member?.role || 'MEMBER';
  };

  const canCreateTask = (team: Team) => {
    const userRole = getUserRole(team, user?.id || '');
    return userRole === 'OWNER' || userRole === 'ADMIN';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!team) return;
    
    if (!canCreateTask(team)) {
      toast.error('You do not have permission to create tasks in this team');
      return;
    }

    if (!taskForm.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      setCreating(true);
      
      const taskData: CreateTaskData = {
        ...taskForm,
        dueDate: taskForm.dueDate || undefined
      };

      await taskApi.createTask(taskData);
      toast.success('Task created successfully');
      
      // Navigate back to team management
      navigate(`/teams/${teamId}/manage`);
      
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const handleAssigneeChange = (userId: string, checked: boolean) => {
    const currentAssignees = taskForm.assigneeIds || [];
    if (checked) {
      setTaskForm({
        ...taskForm,
        assigneeIds: [...currentAssignees, userId]
      });
    } else {
      setTaskForm({
        ...taskForm,
        assigneeIds: currentAssignees.filter(id => id !== userId)
      });
    }
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

  if (!canCreateTask(team)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Access Denied</div>
          <p className="text-gray-400 mb-6">You do not have permission to create tasks in this team</p>
          <button
            onClick={() => navigate(`/teams/${teamId}/manage`)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navbar />
      
      {/* Task Header */}
      <div className="pt-20 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/teams/${teamId}/manage`)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Back to Team Management"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Create Task</h1>
              <p className="text-gray-300 mt-1">Team: {team.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Task Title */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Enter task title..."
                  required
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 h-32 resize-none"
                  placeholder="Enter task description..."
                />
              </div>

              {/* Priority and Due Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    title="Select task priority"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Due Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={typeof taskForm.dueDate === 'string' ? taskForm.dueDate : ''}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      title="Select due date"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Team Members Assignment */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-4">
                  Assign to Team Members
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto bg-white/5 rounded-lg p-4 border border-white/10">
                  {team.members.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No team members to assign</p>
                  ) : (
                    team.members.map((member) => (
                      <label key={member.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={taskForm.assigneeIds?.includes(member.userId) || false}
                          onChange={(e) => handleAssigneeChange(member.userId, e.target.checked)}
                          className="rounded bg-white/10 border-white/20 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="text-white font-medium">
                              {member.user.firstName && member.user.lastName
                                ? `${member.user.firstName} ${member.user.lastName}`
                                : member.user.email}
                            </span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              member.role === 'OWNER' 
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : member.role === 'ADMIN'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {member.role}
                            </span>
                            {member.user.email !== (member.user.firstName && member.user.lastName 
                              ? `${member.user.firstName} ${member.user.lastName}` 
                              : member.user.email) && (
                              <p className="text-gray-400 text-sm">{member.user.email}</p>
                            )}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Selected: {taskForm.assigneeIds?.length || 0} member(s)
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate(`/teams/${teamId}/manage`)}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !taskForm.title.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  {creating ? 'Creating Task...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
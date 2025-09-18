import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, User, AlertCircle, Clock, ChevronDown, X, MessageSquare, Send, Target, Activity, CheckCircle, Loader2 } from 'lucide-react';
import { taskApi } from '../api/taskApi';
import type { Task, TaskFilters, CreateTaskData } from '../api/taskApi';
import { teamApi } from '../api/teamApi';
import type { Team } from '../api/teamApi';
import { commentApi } from '../api/commentApi';
import type { Comment, CreateCommentData } from '../api/commentApi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const statusColors = {
  TODO: 'bg-gray-500',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-yellow-500',
  DONE: 'bg-green-500',
  CANCELLED: 'bg-red-500'
};

const statusLabels = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled'
};

// Animated Counter Component for smooth number transitions
const AnimatedCounter = ({ value, duration = 300 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(value);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const startValue = count;
    const difference = value - startValue;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.round(startValue + (difference * progress)));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (difference !== 0) {
      animationFrame = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{count}</span>;
};

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUserTasks, setAllUserTasks] = useState<Task[]>([]); // Store all user tasks for statistics
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  
  // Task creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    teamId: '',
    assigneeIds: []
  });
  const [creating, setCreating] = useState(false);

  // Comment modal state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    console.log('Tasks page loaded, user:', user); // Debug log
    loadData();
  }, []);

  useEffect(() => {
    // Set default filter to "Assigned to Me" when user is available
    if (user && Object.keys(filters).length === 0) {
      setFilters({assigneeId: user.id});
    }
  }, [user]); // Keep simple dependency

  useEffect(() => {
    // Only load tasks if user is available
    if (user) {
      loadTasks();
    }
  }, [filters, searchTerm]);

  // Calculate statistics from current filtered tasks
  const calculateLocalStatistics = (tasks: Task[]) => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'DONE').length;
    const inProgress = tasks.filter(task => task.status === 'IN_PROGRESS').length;
    const todo = tasks.filter(task => task.status === 'TODO').length;
    const inReview = tasks.filter(task => task.status === 'IN_REVIEW').length;
    const overdue = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      return dueDate < today && task.status !== 'DONE';
    }).length;

    return {
      total,
      completed,
      inProgress,
      todo,
      overdue,
      byStatus: {
        todo,
        inProgress,
        inReview,
        done: completed,
        cancelled: tasks.filter(task => task.status === 'CANCELLED').length
      }
    };
  };

  const loadData = async () => {
    try {
      const teamsResponse = await teamApi.getTeams();
      setTeams(teamsResponse.teams || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!user) return; // Exit early if no user
    
    try {
      setFiltersLoading(true);
      
      // Always apply base user filtering - show only tasks assigned to or created by current user
      const baseFilters = {
        // If no specific assigneeId filter is set, default to current user
        // If filters are empty or only contain non-user-specific filters, default to assigned tasks
        ...(Object.keys(filters).length === 0 || (!filters.assigneeId && !filters.createdById) 
            ? { assigneeId: user.id } 
            : {})
      };
      
      // Combine base filters with current filters and search
      const searchFilters = {
        ...baseFilters,
        ...filters,
        ...(searchTerm ? { search: searchTerm } : {})
      };
      
      const response = await taskApi.getTasks(searchFilters);
      const loadedTasks = response.tasks || [];
      setTasks(loadedTasks);
      
      // Load all user-relevant tasks for statistics
      // Make two separate calls: one for assigned tasks, one for created tasks
      const [assignedResponse, createdResponse] = await Promise.all([
        taskApi.getTasks({ assigneeId: user.id }),
        taskApi.getTasks({ createdById: user.id })
      ]);
      
      // Combine and deduplicate tasks (in case user is both creator and assignee)
      const assignedTasks = assignedResponse.tasks || [];
      const createdTasks = createdResponse.tasks || [];
      
      // Use Map to deduplicate by task ID
      const allUserTasksMap = new Map();
      [...assignedTasks, ...createdTasks].forEach(task => {
        allUserTasksMap.set(task.id, task);
      });
      
      const allUserTasks = Array.from(allUserTasksMap.values());
      
      // Store all user tasks for future statistics calculations
      setAllUserTasks(allUserTasks);
      
      // Calculate statistics based on all user-relevant tasks
      const localStats = calculateLocalStatistics(allUserTasks);
      setStatistics(localStats);
      
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setFiltersLoading(false);
    }
  };

  const handleSearch = () => {
    loadTasks();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const oldTask = tasks.find(task => task.id === taskId);
    if (!oldTask) {
      console.error('Task not found in current tasks:', taskId);
      toast.error('Task not found');
      return;
    }

    // Additional safety check for permissions
    if (!canChangeStatus()) {
      console.error('User does not have permission to change this task status');
      toast.error('You do not have permission to change this task status');
      return;
    }

    console.log('Attempting to update task:', {
      taskId,
      newStatus,
      currentUser: user?.id,
      taskCreator: oldTask.createdBy.id,
      assignedUsers: oldTask.assignments.map(a => a.user.id),
      canChange: canChangeStatus(),
      currentFilters: filters,
      taskTeam: oldTask.team?.id
    });

    // Optimistic update - update UI immediately
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus as any }
        : task
    );
    setTasks(updatedTasks);

    // Also update the allUserTasks for statistics
    const updatedAllUserTasks = allUserTasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus as any }
        : task
    );
    setAllUserTasks(updatedAllUserTasks);

    // Optimistically update statistics based on the updated all user tasks
    const newStats = calculateLocalStatistics(updatedAllUserTasks);
    setStatistics(newStats);

    try {
      await taskApi.updateTask(taskId, { status: newStatus as any });
      toast.success(`Task status updated to ${statusLabels[newStatus as keyof typeof statusLabels]}`);
      
      // Recalculate statistics based on current allUserTasks (they're already updated optimistically)
      const currentStats = calculateLocalStatistics(allUserTasks);
      setStatistics(currentStats);
    } catch (error: any) {
      console.error('Error updating task:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        taskId,
        newStatus,
        userCanChange: canChangeStatus()
      });
      
      // Revert optimistic updates on error
      loadTasks();
      
      const errorMessage = error.response?.data?.message || 'Failed to update task status';
      toast.error(errorMessage);
      
      if (error.response?.status === 500 && errorMessage.includes('insufficient permissions')) {
        console.warn('Permission issue detected. This might be a backend permission logic mismatch.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !['DONE', 'CANCELLED'].includes('status');
  };

  const handleCreateTask = async () => {
    if (!createTaskForm.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      setCreating(true);
      console.log('Creating task with data:', createTaskForm); // Debug log
      
      // Prepare task data with proper date conversion
      const taskData = {
        title: createTaskForm.title.trim(),
        description: createTaskForm.description?.trim() || undefined,
        priority: createTaskForm.priority,
        dueDate: createTaskForm.dueDate || undefined,
        teamId: createTaskForm.teamId || undefined,
        assigneeIds: (createTaskForm.assigneeIds && createTaskForm.assigneeIds.length > 0) ? createTaskForm.assigneeIds : undefined,
      };
      
      console.log('Prepared task data:', taskData); // Debug log
      
      const response = await taskApi.createTask(taskData);
      console.log('Task creation response:', response); // Debug log
      
      toast.success('Task created successfully');
      setShowCreateModal(false);
      setCreateTaskForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        teamId: '',
        assigneeIds: []
      });
      await loadTasks(); // Ensure tasks are reloaded
    } catch (error: any) {
      console.error('Error creating task:', error);
      console.error('Error response:', error.response); // Debug log
      toast.error(error.message || error.response?.data?.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const handleFormChange = (field: keyof CreateTaskData, value: any) => {
    setCreateTaskForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const canChangeStatus = () => {
    // Allow anyone to change task status
    return true;
  };

  // Comment functions
  const handleShowComments = async (task: Task) => {
    setSelectedTaskForComments(task);
    setShowCommentsModal(true);
    await loadTaskComments(task.id);
  };

  const loadTaskComments = async (taskId: string) => {
    try {
      setLoadingComments(true);
      const response = await commentApi.getTaskComments(taskId);
      setComments(response.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTaskForComments || !newComment.trim()) return;

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
      
      // Refresh tasks to update comment count
      loadTasks();
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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navbar />

      {/* Statistics Cards */}
      {statistics && (
        <div className="container mx-auto px-4 pt-20 py-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:from-blue-500/25 hover:to-blue-600/15 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">
                    <AnimatedCounter value={statistics.total} />
                  </div>
                  <div className="text-blue-200 text-sm font-medium">Total Tasks</div>
                </div>
                <div className="p-3 bg-blue-500/30 rounded-xl">
                  <Target className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 hover:from-yellow-500/25 hover:to-yellow-600/15 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">
                    <AnimatedCounter value={statistics.byStatus.todo} />
                  </div>
                  <div className="text-yellow-200 text-sm font-medium">To Do</div>
                </div>
                <div className="p-3 bg-yellow-500/30 rounded-xl">
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:from-purple-500/25 hover:to-purple-600/15 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">
                    <AnimatedCounter value={statistics.byStatus.inProgress} />
                  </div>
                  <div className="text-purple-200 text-sm font-medium">In Progress</div>
                </div>
                <div className="p-3 bg-purple-500/30 rounded-xl">
                  <Activity className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 hover:from-green-500/25 hover:to-green-600/15 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">
                    <AnimatedCounter value={statistics.byStatus.done} />
                  </div>
                  <div className="text-green-200 text-sm font-medium">Completed</div>
                </div>
                <div className="p-3 bg-green-500/30 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 hover:from-red-500/25 hover:to-red-600/15 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">
                    <AnimatedCounter value={statistics.overdue || 0} />
                  </div>
                  <div className="text-red-200 text-sm font-medium">Overdue</div>
                </div>
                <div className="p-3 bg-red-500/30 rounded-xl">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={`container mx-auto px-4 ${!statistics ? 'pt-20' : ''} pb-6`}>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={filtersLoading}
              className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 ${
                filtersLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {filtersLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Filter className="h-5 w-5" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Add Task Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Task
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  aria-label="Filter by status"
                >
                  <option value="">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  aria-label="Filter by priority"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Team</label>
                <select
                  value={filters.teamId || ''}
                  onChange={(e) => handleFilterChange('teamId', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  aria-label="Filter by team"
                >
                  <option value="">All Teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilters({assigneeId: user?.id})}
            disabled={filtersLoading}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              filters.assigneeId === user?.id && !filters.status
                ? 'bg-green-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            } ${filtersLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {filtersLoading && filters.assigneeId === user?.id && !filters.status && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            Assigned to Me
          </button>
          <button
            onClick={() => setFilters({createdById: user?.id})}
            disabled={filtersLoading}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              filters.createdById === user?.id 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            } ${filtersLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {filtersLoading && filters.createdById === user?.id && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            Created by Me
          </button>
          {teams.length > 0 && (
            <button
              onClick={() => {
                // Show tasks from teams where user is a member
                const userTeamIds = teams
                  .filter(team => team.members.some(member => member.user.id === user?.id))
                  .map(team => team.id);
                if (userTeamIds.length > 0) {
                  setFilters({teamId: userTeamIds[0]}); // For now, just use first team. We could enhance this later
                }
              }}
              disabled={filtersLoading}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                filters.teamId && teams.some(team => team.id === filters.teamId && team.members.some(member => member.user.id === user?.id))
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              } ${filtersLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {filtersLoading && filters.teamId && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              My Team Tasks
            </button>
          )}
        </div>

        {/* Tasks List */}
        <div className="space-y-6">
          {filtersLoading ? (
            <div className="text-center py-16">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
                <div className="text-gray-400 text-xl mb-3">Loading tasks...</div>
                <p className="text-gray-500">Please wait while we fetch your tasks</p>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
                <div className="text-gray-400 text-xl mb-3">No tasks found</div>
                <p className="text-gray-500 mb-6">Create your first task to get started</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  Create Task
                </button>
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className="group bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:from-white/12 hover:to-white/8 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">{task.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[task.status]} shadow-lg`}>
                          {statusLabels[task.status]}
                        </span>
                        <span className={`text-sm font-bold px-2 py-1 rounded-full border ${
                          task.priority === 'URGENT' ? 'border-red-500 text-red-400 bg-red-500/10' :
                          task.priority === 'HIGH' ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                          task.priority === 'MEDIUM' ? 'border-blue-500 text-blue-400 bg-blue-500/10' :
                          'border-gray-500 text-gray-400 bg-gray-500/10'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-300 mb-4 leading-relaxed">{task.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-400" />
                        <span className="font-medium">Created by:</span>
                        <span className="text-white">{task.createdBy.firstName || task.createdBy.email}</span>
                      </div>
                      
                      {task.team && (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-purple-500"></div>
                          <span className="font-medium">Team:</span>
                          <span className="text-white">{task.team.name}</span>
                        </div>
                      )}

                      {task.dueDate && (
                        <div className={`flex items-center gap-2 ${isOverdue(task.dueDate) ? 'text-red-400' : 'text-blue-400'}`}>
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Due:</span>
                          <span className={isOverdue(task.dueDate) ? 'text-red-300 font-bold' : 'text-white'}>{formatDate(task.dueDate)}</span>
                          {isOverdue(task.dueDate) && (
                            <AlertCircle className="h-4 w-4 text-red-400 animate-pulse" />
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-400" />
                        <span className="font-medium">Created:</span>
                        <span className="text-white">{formatDate(task.createdAt)}</span>
                      </div>
                    </div>

                    {task.assignments.length > 0 && (
                      <div className="bg-white/5 rounded-lg p-3 mb-4">
                        <span className="text-sm font-medium text-gray-300 mb-2 block">Assigned to:</span>
                        <div className="flex flex-wrap gap-2">
                          {task.assignments.map((assignment) => (
                            <span key={assignment.user.id} className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                              <User className="h-3 w-3 mr-1" />
                              {assignment.user.firstName || assignment.user.email}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3 ml-6">
                    {canChangeStatus() ? (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white/15 hover:bg-white/15 transition-all min-w-[140px]"
                        title="Change task status"
                        aria-label="Change task status"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    ) : (
                      <div className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 text-sm font-medium min-w-[140px] text-center">
                        {task.status === 'TODO' && 'To Do'}
                        {task.status === 'IN_PROGRESS' && 'In Progress'}
                        {task.status === 'IN_REVIEW' && 'In Review'}
                        {task.status === 'DONE' && 'Done'}
                        {task.status === 'CANCELLED' && 'Cancelled'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments and Dependencies Section */}
                <div className="mt-4 pt-4 border-t border-white/10 flex gap-6 text-sm">
                  <button
                    onClick={() => handleShowComments(task)}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer group"
                  >
                    <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">
                      {task._count?.comments || 0} comment{(task._count?.comments || 0) !== 1 ? 's' : ''}
                    </span>
                  </button>
                  {task._count?.dependencies > 0 && (
                    <div className="flex items-center gap-2 text-orange-400">
                      <div className="h-4 w-4 rounded-full border-2 border-orange-400"></div>
                      <span className="font-medium">{task._count.dependencies} dependenc{task._count.dependencies !== 1 ? 'ies' : 'y'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create New Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close modal"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateTask(); }} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Title *</label>
                <input
                  type="text"
                  value={createTaskForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Description</label>
                <textarea
                  value={createTaskForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Priority</label>
                <select
                  value={createTaskForm.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  aria-label="Task priority"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Due Date</label>
                <input
                  type="date"
                  value={typeof createTaskForm.dueDate === 'string' ? createTaskForm.dueDate : ''}
                  onChange={(e) => handleFormChange('dueDate', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  aria-label="Due date"
                />
              </div>

              {teams.length > 0 && (
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Team</label>
                  <select
                    value={createTaskForm.teamId}
                    onChange={(e) => {
                      handleFormChange('teamId', e.target.value);
                      // Clear assignees when team changes
                      handleFormChange('assigneeIds', []);
                    }}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    aria-label="Select team"
                  >
                    <option value="">No team (Personal task)</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assignee Selection - Only show when a team is selected */}
              {createTaskForm.teamId && (
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Assign To Team Members</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {teams
                      .find(t => t.id === createTaskForm.teamId)
                      ?.members.map(member => (
                        <label key={member.id} className="flex items-center gap-2 p-2 bg-white/5 rounded cursor-pointer hover:bg-white/10 transition-colors">
                          <input
                            type="checkbox"
                            checked={createTaskForm.assigneeIds?.includes(member.user.id) || false}
                            onChange={(e) => {
                              const userId = member.user.id;
                              const currentAssignees = createTaskForm.assigneeIds || [];
                              
                              if (e.target.checked) {
                                handleFormChange('assigneeIds', [...currentAssignees, userId]);
                              } else {
                                handleFormChange('assigneeIds', currentAssignees.filter(id => id !== userId));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <div className="text-white text-sm">
                              {member.user.firstName && member.user.lastName
                                ? `${member.user.firstName} ${member.user.lastName}`
                                : member.user.email}
                            </div>
                            <div className="text-gray-400 text-xs flex items-center gap-1">
                              <span>{member.user.email}</span>
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                member.role === 'OWNER' 
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : member.role === 'ADMIN'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                  {createTaskForm.teamId && teams.find(t => t.id === createTaskForm.teamId)?.members.length === 0 && (
                    <p className="text-gray-400 text-sm">No team members available</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !createTaskForm.title.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedTaskForComments && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !addingComment) {
              closeCommentsModal();
            }
          }}
        >
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Comments for "{selectedTaskForComments.title}"
            </h3>
            
            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {loadingComments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-400 mt-2">Loading comments...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-white">
                        {comment.user?.firstName && comment.user?.lastName 
                          ? `${comment.user.firstName} ${comment.user.lastName}`
                          : comment.user?.email || 'Unknown User'
                        }
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>

            {/* Add Comment Form */}
            <div className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-400 resize-none"
                rows={3}
                disabled={addingComment}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeCommentsModal}
                  disabled={addingComment}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleAddComment}
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
              <p className="text-xs text-gray-400 text-center">
                Press Ctrl+Enter to quickly add comment
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
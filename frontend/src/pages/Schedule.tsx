import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Filter, Search } from 'lucide-react';
import GanttChart from '../components/GanttChart';
import { taskApi, type Task, type TaskFilters } from '../api/taskApi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Schedule() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  useEffect(() => {
    fetchCreatedTasks();
  }, [user, statusFilter, priorityFilter, searchTerm]);

  const fetchCreatedTasks = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const filters: TaskFilters = {
        createdById: user.id,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        limit: 100 // Get more tasks for better Gantt view
      };

      const response = await taskApi.getTasks(filters);
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Error fetching created tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  const activeFiltersCount = [searchTerm, statusFilter, priorityFilter].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              {/* Header skeleton */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
                  <div>
                    <div className="h-8 bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-64"></div>
                  </div>
                </div>
              </div>

              {/* Filters skeleton */}
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                <div className="h-6 bg-gray-700 rounded w-24 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>

              {/* Gantt chart skeleton */}
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="h-6 bg-gray-700 rounded w-32 mb-6"></div>
                <div className="h-96 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/20 rounded-xl backdrop-blur-sm">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Schedule</h1>
                <p className="text-gray-400">Gantt chart view of tasks created by you</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                aria-label="Filter by status"
                title="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                aria-label="Filter by priority"
                title="Filter by priority"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Tasks</p>
                  <p className="text-2xl font-bold text-white">{tasks.length}</p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">In Progress</p>
                  <p className="text-2xl font-bold text-white">
                    {tasks.filter(task => task.status === 'IN_PROGRESS').length}
                  </p>
                </div>
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {tasks.filter(task => task.status === 'DONE').length}
                  </p>
                </div>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <User className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Overdue</p>
                  <p className="text-2xl font-bold text-white">
                    {tasks.filter(task => 
                      task.dueDate && 
                      new Date(task.dueDate) < new Date() && 
                      task.status !== 'DONE'
                    ).length}
                  </p>
                </div>
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Gantt Chart */}
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Calendar className="h-5 w-5 text-white" />
              <h2 className="text-xl font-semibold text-white">Task Timeline</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-gray-400">Loading tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Calendar className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No tasks found</p>
                <p className="text-sm">Create some tasks to see them in the Gantt chart</p>
              </div>
            ) : (
              <GanttChart tasks={tasks} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
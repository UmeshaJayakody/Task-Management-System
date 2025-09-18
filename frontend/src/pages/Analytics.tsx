import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, CheckSquare, Clock, Calendar, Target, Award } from 'lucide-react';
import Navbar from '../components/Navbar';
import { taskApi, type Task } from '../api/taskApi';
import { teamApi } from '../api/teamApi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalTeams: number;
  tasksCreatedByUser: number;
  tasksAssignedToUser: number;
  completionRate: number;
  averageTaskDuration: number;
  monthlyTasksCompleted: number[];
  priorityDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  statusDistribution: {
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
    CANCELLED: number;
  };
}

export default function Analytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch all tasks
      const allTasksResponse = await taskApi.getTasks({ limit: 1000 });
      const allTasks: Task[] = allTasksResponse.tasks || [];
      
      // Fetch tasks created by user
      const createdTasksResponse = await taskApi.getTasks({ 
        createdById: user.id, 
        limit: 1000 
      });
      const createdTasks: Task[] = createdTasksResponse.tasks || [];
      
      // Fetch tasks assigned to user
      const assignedTasksResponse = await taskApi.getTasks({ 
        assigneeId: user.id, 
        limit: 1000 
      });
      const assignedTasks: Task[] = assignedTasksResponse.tasks || [];
      
      // Fetch teams (if API exists)
      let totalTeams = 0;
      try {
        const teamsResponse = await teamApi.getTeams();
        totalTeams = teamsResponse.teams?.length || 0;
      } catch (error) {
        console.warn('Teams API not available:', error);
      }

      // Calculate analytics
      const now = new Date();
      const completedTasks = allTasks.filter(task => task.status === 'DONE');
      const inProgressTasks = allTasks.filter(task => task.status === 'IN_PROGRESS');
      const overdueTasks = allTasks.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) < now && 
        task.status !== 'DONE'
      );

      // Calculate completion rate
      const completionRate = allTasks.length > 0 ? 
        (completedTasks.length / allTasks.length) * 100 : 0;

      // Calculate average task duration
      const completedTasksWithDuration = completedTasks.filter(task => 
        task.completedAt && task.createdAt
      );
      const averageTaskDuration = completedTasksWithDuration.length > 0 ?
        completedTasksWithDuration.reduce((sum, task) => {
          const created = new Date(task.createdAt);
          const completed = new Date(task.completedAt!);
          return sum + (completed.getTime() - created.getTime());
        }, 0) / completedTasksWithDuration.length / (1000 * 60 * 60 * 24) : 0; // Convert to days

      // Calculate monthly completed tasks (last 12 months)
      const monthlyTasksCompleted = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        return completedTasks.filter(task => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate >= month && completedDate < nextMonth;
        }).length;
      }).reverse();

      // Calculate priority distribution
      const priorityDistribution = {
        LOW: allTasks.filter(task => task.priority === 'LOW').length,
        MEDIUM: allTasks.filter(task => task.priority === 'MEDIUM').length,
        HIGH: allTasks.filter(task => task.priority === 'HIGH').length,
        URGENT: allTasks.filter(task => task.priority === 'URGENT').length,
      };

      // Calculate status distribution
      const statusDistribution = {
        TODO: allTasks.filter(task => task.status === 'TODO').length,
        IN_PROGRESS: allTasks.filter(task => task.status === 'IN_PROGRESS').length,
        IN_REVIEW: allTasks.filter(task => task.status === 'IN_REVIEW').length,
        DONE: allTasks.filter(task => task.status === 'DONE').length,
        CANCELLED: allTasks.filter(task => task.status === 'CANCELLED').length,
      };

      const analyticsData: AnalyticsData = {
        totalTasks: allTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        overdueTasks: overdueTasks.length,
        totalTeams,
        tasksCreatedByUser: createdTasks.length,
        tasksAssignedToUser: assignedTasks.length,
        completionRate,
        averageTaskDuration,
        monthlyTasksCompleted,
        priorityDistribution,
        statusDistribution,
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string; 
    subtitle?: string; 
  }) => (
    <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, total, color }: { 
    label: string; 
    value: number; 
    total: number; 
    color: string; 
  }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">{label}</span>
          <span className="text-white">{value}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <Navbar />
        <div className="pt-20 flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <span className="ml-4 text-white text-lg">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      <Navbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Analytics</h1>
                  <p className="text-gray-400">Task management insights and statistics</p>
                </div>
              </div>
              
              {/* Time Range Selector */}
              <div className="flex items-center space-x-2">
                {['week', 'month', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range as 'week' | 'month' | 'year')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 capitalize ${
                      timeRange === range
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {analytics && (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Tasks"
                  value={analytics.totalTasks}
                  icon={CheckSquare}
                  color="bg-blue-500/20 text-blue-400"
                />
                <StatCard
                  title="Completed Tasks"
                  value={analytics.completedTasks}
                  icon={Award}
                  color="bg-green-500/20 text-green-400"
                />
                <StatCard
                  title="In Progress"
                  value={analytics.inProgressTasks}
                  icon={Clock}
                  color="bg-yellow-500/20 text-yellow-400"
                />
                <StatCard
                  title="Overdue Tasks"
                  value={analytics.overdueTasks}
                  icon={TrendingUp}
                  color="bg-red-500/20 text-red-400"
                />
              </div>

              {/* Personal Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  title="Tasks Created by You"
                  value={analytics.tasksCreatedByUser}
                  icon={Target}
                  color="bg-purple-500/20 text-purple-400"
                />
                <StatCard
                  title="Tasks Assigned to You"
                  value={analytics.tasksAssignedToUser}
                  icon={Users}
                  color="bg-indigo-500/20 text-indigo-400"
                />
                <StatCard
                  title="Completion Rate"
                  value={`${analytics.completionRate.toFixed(1)}%`}
                  icon={TrendingUp}
                  color="bg-emerald-500/20 text-emerald-400"
                  subtitle={`${analytics.completedTasks} of ${analytics.totalTasks} tasks`}
                />
              </div>

              {/* Charts and Distributions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Status Distribution */}
                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Status Distribution</span>
                  </h3>
                  <div className="space-y-4">
                    <ProgressBar
                      label="Todo"
                      value={analytics.statusDistribution.TODO}
                      total={analytics.totalTasks}
                      color="bg-gray-500"
                    />
                    <ProgressBar
                      label="In Progress"
                      value={analytics.statusDistribution.IN_PROGRESS}
                      total={analytics.totalTasks}
                      color="bg-yellow-500"
                    />
                    <ProgressBar
                      label="In Review"
                      value={analytics.statusDistribution.IN_REVIEW}
                      total={analytics.totalTasks}
                      color="bg-blue-500"
                    />
                    <ProgressBar
                      label="Done"
                      value={analytics.statusDistribution.DONE}
                      total={analytics.totalTasks}
                      color="bg-green-500"
                    />
                    <ProgressBar
                      label="Cancelled"
                      value={analytics.statusDistribution.CANCELLED}
                      total={analytics.totalTasks}
                      color="bg-red-500"
                    />
                  </div>
                </div>

                {/* Priority Distribution */}
                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Priority Distribution</span>
                  </h3>
                  <div className="space-y-4">
                    <ProgressBar
                      label="Low Priority"
                      value={analytics.priorityDistribution.LOW}
                      total={analytics.totalTasks}
                      color="bg-gray-500"
                    />
                    <ProgressBar
                      label="Medium Priority"
                      value={analytics.priorityDistribution.MEDIUM}
                      total={analytics.totalTasks}
                      color="bg-yellow-500"
                    />
                    <ProgressBar
                      label="High Priority"
                      value={analytics.priorityDistribution.HIGH}
                      total={analytics.totalTasks}
                      color="bg-orange-500"
                    />
                    <ProgressBar
                      label="Urgent Priority"
                      value={analytics.priorityDistribution.URGENT}
                      total={analytics.totalTasks}
                      color="bg-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Performance Metrics</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {analytics.averageTaskDuration.toFixed(1)}
                    </p>
                    <p className="text-gray-400 text-sm">Average Days per Task</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {analytics.monthlyTasksCompleted[analytics.monthlyTasksCompleted.length - 1]}
                    </p>
                    <p className="text-gray-400 text-sm">Tasks Completed This Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {analytics.totalTeams}
                    </p>
                    <p className="text-gray-400 text-sm">Teams</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
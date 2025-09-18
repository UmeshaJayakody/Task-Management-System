import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Plus, TrendingUp, Target, Calendar, BarChart3, Activity, ArrowUp, ArrowDown, Minus, CalendarDays } from 'lucide-react';
import { useState, useEffect } from 'react';
import { taskApi } from '../api/taskApi';
import Navbar from '../components/Navbar';
import '../styles/dashboard.css';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  thisWeek: number;
}

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{count}</span>;
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = "#8b5cf6" }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className="progress-ring-circle"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    thisWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentDate] = useState(new Date());

  // Generate calendar data for current month
  const generateCalendarData = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of month and last day of month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Get first day of week for the first day of month (0 = Sunday)
    const startingDayOfWeek = firstDay.getDay();
    
    // Calculate how many days to show from previous month
    const daysFromPrevMonth = startingDayOfWeek;
    
    // Calculate total days to show (6 weeks = 42 days)
    const totalDays = 42;
    
    const calendarDays = [];
    
    // Add days from previous month
    const prevMonth = new Date(currentYear, currentMonth - 1, 0);
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      calendarDays.push({
        date: new Date(currentYear, currentMonth - 1, day),
        day,
        isCurrentMonth: false,
        isToday: false,
        hasDueDate: false,
        taskCount: 0
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      
      // Check if this date has any task due dates
      const tasksForDate = tasks.filter(task => {
        if (!task.dueDate) return false;
        try {
          // Handle different date formats from backend
          const taskDueDate = new Date(task.dueDate);
          // Ensure the date is valid
          if (isNaN(taskDueDate.getTime())) return false;
          
          // Compare dates (ignoring time)
          const taskDateString = taskDueDate.toDateString();
          const currentDateString = date.toDateString();
          return taskDateString === currentDateString;
        } catch (error) {
          console.warn('Invalid due date format:', task.dueDate);
          return false;
        }
      });

      // Separate completed and incomplete tasks for this date
      const completedTasksForDate = tasksForDate.filter(task => task.status === 'DONE');
      const incompleteTasksForDate = tasksForDate.filter(task => task.status !== 'DONE');
      
      // Also check for tasks created or updated on this date for activity
      const allTasksForDate = tasks.filter(task => {
        try {
          const taskCreatedDate = new Date(task.createdAt);
          const taskUpdatedDate = new Date(task.updatedAt);
          const dateString = date.toDateString();
          
          return (
            (taskCreatedDate.toDateString() === dateString) ||
            (taskUpdatedDate.toDateString() === dateString)
          );
        } catch (error) {
          return false;
        }
      });
      
      calendarDays.push({
        date,
        day,
        isCurrentMonth: true,
        isToday,
        hasDueDate: tasksForDate.length > 0,
        taskCount: Math.max(tasksForDate.length, allTasksForDate.length),
        dueTasks: tasksForDate,
        allTasks: allTasksForDate,
        completedTasks: completedTasksForDate,
        incompleteTasks: incompleteTasksForDate,
        hasCompletedTasks: completedTasksForDate.length > 0,
        hasIncompleteTasks: incompleteTasksForDate.length > 0
      });
    }
    
    // Add days from next month to fill the grid
    const remainingDays = totalDays - calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      calendarDays.push({
        date: new Date(currentYear, currentMonth + 1, day),
        day,
        isCurrentMonth: false,
        isToday: false,
        hasDueDate: false,
        taskCount: 0
      });
    }
    
    return calendarDays;
  };

  // Debug log to see user data
  useEffect(() => {
    console.log('Dashboard - Current user:', user);
    console.log('Dashboard - Auth loading:', authLoading);
  }, [user, authLoading]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        console.log('Fetching task statistics...'); // Debug log
        
        // Fetch both statistics and tasks
        const [statsResponse, tasksResponse] = await Promise.all([
          taskApi.getStatistics(),
          taskApi.getTasks()
        ]);
        
        console.log('Statistics response:', statsResponse); // Debug log
        console.log('Tasks response:', tasksResponse); // Debug log
        
        const statsData = statsResponse.statistics || statsResponse; // Handle both response formats
        const tasksData = tasksResponse.tasks || tasksResponse || [];
        
        // Process and validate tasks data
        const validTasks = Array.isArray(tasksData) ? tasksData.filter(task => {
          // Ensure task has basic required fields
          return task && (task.id || task._id) && task.title;
        }) : [];
        
        console.log('Valid tasks with due dates:', validTasks.filter(task => task.dueDate));
        
        // Set tasks for calendar
        setTasks(validTasks);
        
        // For now, use a portion of completed tasks as thisWeek (we'll need to implement this properly later)
        const thisWeekCount = Math.floor((statsData.byStatus?.done || 0) * 0.5); // Rough estimate
        
        const newStats = {
          total: statsData.total || 0,
          completed: statsData.byStatus?.done || 0,
          inProgress: statsData.byStatus?.inProgress || 0,
          thisWeek: thisWeekCount
        };
        
        console.log('Setting stats:', newStats); // Debug log
        setStats(newStats);
      } catch (error) {
        console.error('Failed to fetch task statistics:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    if (user) { // Only fetch stats if user is available
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const goToTasks = () => {
    navigate('/tasks');
  };

  const goToTeams = () => {
    navigate('/teams');
  };

  const goToSchedule = () => {
    // TODO: Implement schedule/calendar page
    console.log('Navigate to schedule');
  };

  const goToAnalytics = () => {
    // TODO: Implement analytics page
    console.log('Navigate to analytics');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navbar />

      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 "></div>
            <div className="relative pl-8 pr-6 ">
              <div className="flex items-center">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent mb-3">
                    Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'User'}! 👋
                  </h1>
                  <p className="text-lg text-gray-300 mb-2">Here's what's happening with your tasks today.</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-green-300">System Online</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-400 mr-2" />
                      <span className="text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stats-card stats-card-blue rounded-xl p-6 group relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-blue-200 text-sm font-medium mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold text-white mb-2">
                    {loading ? '...' : <AnimatedCounter value={stats.total} />}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      <span className="text-xs text-blue-300">All Projects</span>
                    </div>
                    <div className="flex items-center bg-blue-500/20 px-2 py-1 rounded-full">
                      <ArrowUp className="h-3 w-3 text-blue-400 mr-1" />
                      <span className="text-xs text-blue-400 font-medium">+5%</span>
                    </div>
                  </div>
                </div>
                <div className="stats-icon stats-icon-blue p-4 bg-blue-500/30 rounded-xl backdrop-blur-sm">
                  <Target className="h-8 w-8 text-blue-300" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300"></div>
            </div>

            <div className="stats-card stats-card-green rounded-xl p-6 group relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-green-200 text-sm font-medium mb-1">Completed</p>
                  <p className="text-3xl font-bold text-white mb-2">
                    {loading ? '...' : <AnimatedCounter value={stats.completed} />}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-xs text-green-300">
                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% Complete
                      </span>
                    </div>
                    <div className="flex items-center bg-green-500/20 px-2 py-1 rounded-full">
                      <ArrowUp className="h-3 w-3 text-green-400 mr-1" />
                      <span className="text-xs text-green-400 font-medium">+12%</span>
                    </div>
                  </div>
                </div>
                <div className="stats-icon stats-icon-green p-4 bg-green-500/30 rounded-xl backdrop-blur-sm">
                  <CheckCircle className="h-8 w-8 text-green-300" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-300"></div>
            </div>

            <div className="stats-card stats-card-yellow rounded-xl p-6 group relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-yellow-200 text-sm font-medium mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-white mb-2">
                    {loading ? '...' : <AnimatedCounter value={stats.inProgress} />}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                      <span className="text-xs text-yellow-300">Active Tasks</span>
                    </div>
                    <div className="flex items-center bg-yellow-500/20 px-2 py-1 rounded-full">
                      <Minus className="h-3 w-3 text-yellow-400 mr-1" />
                      <span className="text-xs text-yellow-400 font-medium">0%</span>
                    </div>
                  </div>
                </div>
                <div className="stats-icon stats-icon-yellow p-4 bg-yellow-500/30 rounded-xl backdrop-blur-sm">
                  <Clock className="h-8 w-8 text-yellow-300" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300"></div>
            </div>

            <div className="stats-card stats-card-purple rounded-xl p-6 group relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-purple-200 text-sm font-medium mb-1">This Week</p>
                  <p className="text-3xl font-bold text-white mb-2">
                    {loading ? '...' : <AnimatedCounter value={stats.thisWeek} />}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                      <span className="text-xs text-purple-300">Weekly Goal</span>
                    </div>
                    <div className="flex items-center bg-purple-500/20 px-2 py-1 rounded-full">
                      <ArrowDown className="h-3 w-3 text-purple-400 mr-1" />
                      <span className="text-xs text-purple-400 font-medium">-3%</span>
                    </div>
                  </div>
                </div>
                <div className="stats-icon stats-icon-purple p-4 bg-purple-500/30 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="h-8 w-8 text-purple-300" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-300"></div>
            </div>
          </div>

          {/* Charts and Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Progress Overview */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-purple-400" />
                Task Progress
              </h3>
              <div className="flex items-center justify-center mb-4">
                <ProgressRing 
                  progress={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
                  color="#10b981"
                  size={100}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Completed</span>
                  <span className="text-green-400">{stats.completed}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">In Progress</span>
                  <span className="text-yellow-400">{stats.inProgress}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Remaining</span>
                  <span className="text-blue-400">{stats.total - stats.completed - stats.inProgress}</span>
                </div>
              </div>
            </div>

            {/* Monthly Task Trends */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="h-4 w-4 mr-2 text-blue-400" />
                Monthly Trends
              </h3>
              <div className="space-y-4">
                {/* Chart Area */}
                <div className="relative h-24 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg p-3">
                  {/* SVG Line Chart */}
                  <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    <defs>
                      <linearGradient id="gradientBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                      </linearGradient>
                      <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Grid */}
                    <g stroke="#374151" strokeWidth="0.5" opacity="0.3">
                      <line x1="0" y1="15" x2="300" y2="15"/>
                      <line x1="0" y1="30" x2="300" y2="30"/>
                      <line x1="0" y1="45" x2="300" y2="45"/>
                    </g>
                    
                    {/* Created Tasks Line */}
                    <path
                      d="M0,45 Q75,35 150,40 Q225,30 300,25"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      fill="url(#gradientBlue)"
                      opacity="0.8"
                    />
                    
                    {/* Completed Tasks Line */}
                    <path
                      d="M0,50 Q75,45 150,35 Q225,25 300,20"
                      stroke="#10b981"
                      strokeWidth="2"
                      fill="none"
                      opacity="0.9"
                    />
                    
                    {/* Data Points */}
                    <circle cx="75" cy="35" r="2" fill="#3b82f6"/>
                    <circle cx="150" cy="40" r="2" fill="#3b82f6"/>
                    <circle cx="225" cy="30" r="2" fill="#3b82f6"/>
                    <circle cx="300" cy="25" r="2" fill="#3b82f6"/>
                    
                    <circle cx="75" cy="45" r="2" fill="#10b981"/>
                    <circle cx="150" cy="35" r="2" fill="#10b981"/>
                    <circle cx="225" cy="25" r="2" fill="#10b981"/>
                    <circle cx="300" cy="20" r="2" fill="#10b981"/>
                  </svg>
                </div>
                
                {/* Legend */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <div className="w-3 h-0.5 bg-blue-400 mr-2"></div>
                      <span className="text-xs text-gray-400">Created</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-0.5 bg-green-400 mr-2"></div>
                      <span className="text-xs text-gray-400">Completed</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="flex justify-between text-xs">
                  <div className="text-center">
                    <div className="text-blue-400 font-medium">{Math.ceil(stats.total * 0.7)}</div>
                    <div className="text-gray-500">This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-medium">{stats.completed}</div>
                    <div className="text-gray-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-medium">
                      {stats.total > 0 ? Math.round((stats.completed / Math.ceil(stats.total * 0.7)) * 100) : 0}%
                    </div>
                    <div className="text-gray-500">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Activity Calendar */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 text-orange-400" />
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Activity
            </h3>
            
            {/* Calendar Header */}
            <div className="calendar-header">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="calendar-header-day">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="calendar-grid">
              {generateCalendarData().map((calendarDay, index) => {
                let dayClasses = 'calendar-day ';
                
                // Base styling
                if (calendarDay.isCurrentMonth) {
                  dayClasses += 'calendar-day-current-month ';
                } else {
                  dayClasses += 'calendar-day-default ';
                }
                
                // Today styling (highest priority for visual)
                if (calendarDay.isToday) {
                  dayClasses += 'calendar-day-today ';
                }
                
                // Priority order for task status colors:
                // 1. If has both completed and incomplete tasks - show mixed color
                // 2. If only completed tasks - show green
                // 3. If only incomplete tasks - show red/orange
                // 4. Activity level for non-due tasks
                
                if (calendarDay.hasDueDate && !calendarDay.isToday) {
                  if (calendarDay.hasCompletedTasks && calendarDay.hasIncompleteTasks) {
                    // Mixed: both completed and incomplete tasks on same day
                    dayClasses += 'calendar-day-mixed-status ';
                  } else if (calendarDay.hasCompletedTasks && !calendarDay.hasIncompleteTasks) {
                    // All tasks completed - green
                    dayClasses += 'calendar-day-completed ';
                  } else if (calendarDay.hasIncompleteTasks && !calendarDay.hasCompletedTasks) {
                    // All tasks incomplete - red/orange
                    dayClasses += 'calendar-day-due-date ';
                  }
                }
                
                // Activity level based on task count (only if no due dates and not today)
                if (calendarDay.taskCount > 0 && !calendarDay.hasDueDate && !calendarDay.isToday) {
                  if (calendarDay.taskCount === 1) {
                    dayClasses += 'calendar-day-activity-low ';
                  } else if (calendarDay.taskCount <= 3) {
                    dayClasses += 'calendar-day-activity-medium ';
                  } else {
                    dayClasses += 'calendar-day-activity-high ';
                  }
                }
                
                // Generate tooltip text
                let tooltipText = '';
                if (calendarDay.isToday) {
                  tooltipText = 'Today';
                  if (calendarDay.hasDueDate) {
                    const completedCount = calendarDay.completedTasks?.length || 0;
                    const incompleteCount = calendarDay.incompleteTasks?.length || 0;
                    if (completedCount > 0 && incompleteCount > 0) {
                      tooltipText += ` • ${completedCount} completed, ${incompleteCount} due`;
                    } else if (completedCount > 0) {
                      tooltipText += ` • ${completedCount} completed`;
                    } else if (incompleteCount > 0) {
                      tooltipText += ` • ${incompleteCount} due`;
                    }
                  }
                  if (calendarDay.taskCount > (calendarDay.dueTasks?.length || 0)) {
                    tooltipText += ` • ${calendarDay.taskCount - (calendarDay.dueTasks?.length || 0)} active`;
                  }
                } else if (calendarDay.hasDueDate) {
                  const completedCount = calendarDay.completedTasks?.length || 0;
                  const incompleteCount = calendarDay.incompleteTasks?.length || 0;
                  
                  if (completedCount > 0 && incompleteCount > 0) {
                    tooltipText = `${completedCount} completed, ${incompleteCount} due`;
                  } else if (completedCount > 0) {
                    tooltipText = `${completedCount} task${completedCount > 1 ? 's' : ''} completed`;
                  } else if (incompleteCount > 0) {
                    tooltipText = `${incompleteCount} task${incompleteCount > 1 ? 's' : ''} due`;
                  }
                  
                  if (calendarDay.dueTasks && calendarDay.dueTasks.length > 0) {
                    tooltipText += '\n' + calendarDay.dueTasks.map(task => 
                      `• ${task.title} ${task.status === 'DONE' ? '(✓ Completed)' : '(Due)'}`
                    ).join('\n');
                  }
                } else if (calendarDay.taskCount > 0) {
                  tooltipText = `${calendarDay.taskCount} task${calendarDay.taskCount > 1 ? 's' : ''} active`;
                }
                
                return (
                  <div
                    key={index}
                    className={dayClasses}
                    title={tooltipText}
                  >
                    {calendarDay.day}
                    {(calendarDay.taskCount > 0 || calendarDay.isToday) && (
                      <div className="calendar-tooltip">
                        {tooltipText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Compact Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded calendar-day-current-month mr-1.5"></div>
                <span className="text-gray-400">No activity</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded calendar-day-completed mr-1.5"></div>
                <span className="text-gray-400">Completed</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded calendar-day-due-date mr-1.5"></div>
                <span className="text-gray-400">Due/Incomplete</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded calendar-day-mixed-status mr-1.5"></div>
                <span className="text-gray-400">Mixed Status</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded calendar-day-today mr-1.5"></div>
                <span className="text-gray-400">Today</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded calendar-day-activity-low mr-1.5"></div>
                <span className="text-gray-400">Activity</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <Plus className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white ml-3">Create Task</h3>
              </div>
              <p className="text-gray-300 mb-4">Add a new task to your workflow</p>
              <button 
                onClick={goToTasks}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium"
              >
                Manage Tasks
              </button>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white ml-3">Schedule</h3>
              </div>
              <p className="text-gray-300 mb-4">View your task calendar and deadlines</p>
              <button 
                onClick={goToSchedule}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all font-medium"
              >
                View Calendar
              </button>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-orange-500/30 transition-all cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                  <svg className="h-6 w-6 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h1v-3c0-2.21 1.79-4 4-4s4 1.79 4 4v3h1v4H4zm3.5-6c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5H7.5z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white ml-3">Teams</h3>
              </div>
              <p className="text-gray-300 mb-4">Manage teams and collaboration</p>
              <button 
                onClick={goToTeams}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg transition-all font-medium"
              >
                Manage Teams
              </button>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-green-500/30 transition-all cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white ml-3">Analytics</h3>
              </div>
              <p className="text-gray-300 mb-4">Track your productivity and progress</p>
              <button 
                onClick={goToAnalytics}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-medium"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
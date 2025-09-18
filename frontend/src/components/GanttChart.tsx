import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../api/taskApi';

interface GanttChartProps {
  tasks: Task[];
}

interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string;
  priority: string;
  progress: number;
  color: string;
}

const statusColors = {
  TODO: '#6B7280', // gray
  IN_PROGRESS: '#F59E0B', // yellow
  IN_REVIEW: '#3B82F6', // blue
  DONE: '#10B981', // green
  CANCELLED: '#EF4444' // red
};

export default function GanttChart({ tasks }: GanttChartProps) {
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Transform tasks to Gantt format
  const ganttTasks: GanttTask[] = useMemo(() => {
    return tasks
      .filter(task => task.dueDate) // Only include tasks with due dates
      .map(task => {
        const createdDate = new Date(task.createdAt);
        const dueDate = new Date(task.dueDate!);
        const completedDate = task.completedAt ? new Date(task.completedAt) : null;
        
        // Calculate progress based on status
        let progress = 0;
        switch (task.status) {
          case 'TODO':
            progress = 0;
            break;
          case 'IN_PROGRESS':
            progress = 50;
            break;
          case 'IN_REVIEW':
            progress = 80;
            break;
          case 'DONE':
            progress = 100;
            break;
          case 'CANCELLED':
            progress = 0;
            break;
        }

        return {
          id: task.id,
          title: task.title,
          startDate: createdDate,
          endDate: completedDate || dueDate,
          status: task.status,
          priority: task.priority,
          progress,
          color: task.status === 'DONE' ? '#10B981' : statusColors[task.status as keyof typeof statusColors] // Ensure completed tasks are green
        };
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [tasks]);

  // Generate timeline based on view type
  const timeline = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    if (viewType === 'month') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    } else {
      // Week view - show 7 days from current date
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
    }

    return dates;
  }, [currentDate, viewType]);

  const goToPrevious = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const goToNext = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const formatDate = (date: Date) => {
    if (viewType === 'month') {
      return date.getDate().toString();
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const getTaskPosition = (task: GanttTask) => {
    const timelineStart = timeline[0];
    const timelineEnd = timeline[timeline.length - 1];
    const totalDays = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24) + 1;

    const taskStart = Math.max(task.startDate.getTime(), timelineStart.getTime());
    const taskEnd = Math.min(task.endDate.getTime(), timelineEnd.getTime());

    const startOffset = (taskStart - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = Math.max((duration / totalDays) * 100, 2); // Minimum width of 2%

    return { left: `${left}%`, width: `${width}%` };
  };

  const isTaskVisible = (task: GanttTask) => {
    const timelineStart = timeline[0];
    const timelineEnd = timeline[timeline.length - 1];
    
    return task.startDate <= timelineEnd && task.endDate >= timelineStart;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      TODO: 'bg-gray-500/20 text-gray-300',
      IN_PROGRESS: 'bg-yellow-500/20 text-yellow-300',
      IN_REVIEW: 'bg-blue-500/20 text-blue-300',
      DONE: 'bg-green-500/20 text-green-300',
      CANCELLED: 'bg-red-500/20 text-red-300'
    };

    return badges[status as keyof typeof badges] || badges.TODO;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      LOW: 'bg-gray-500/20 text-gray-300',
      MEDIUM: 'bg-yellow-500/20 text-yellow-300',
      HIGH: 'bg-orange-500/20 text-orange-300',
      URGENT: 'bg-red-500/20 text-red-300'
    };

    return badges[priority as keyof typeof badges] || badges.LOW;
  };

  const visibleTasks = ganttTasks.filter(isTaskVisible);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevious}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200"
              title="Previous period"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            
            <h3 className="text-lg font-semibold text-white min-w-[180px] text-center">
              {viewType === 'month' 
                ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : `${timeline[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${timeline[timeline.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              }
            </h3>
            
            <button
              onClick={goToNext}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200"
              title="Next period"
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              viewType === 'week'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewType('month')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              viewType === 'month'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <Calendar className="h-8 w-8 mb-2 opacity-50" />
          <p>No tasks in this time period</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b border-white/10 pb-2 mb-4">
              <div className="w-64 flex-shrink-0 font-medium text-white">Task</div>
              <div className="flex-1 flex">
                {timeline.map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 text-center text-sm text-gray-400 min-w-[40px]"
                  >
                    {formatDate(date)}
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {visibleTasks.map((task) => {
                const position = getTaskPosition(task);
                return (
                  <div key={task.id} className="flex items-center group">
                    {/* Task Info */}
                    <div className="w-64 flex-shrink-0 pr-4">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: task.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium truncate">
                            {task.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 relative h-8 bg-white/5 rounded">
                      <div
                        className={`absolute top-1 bottom-1 rounded flex items-center group-hover:opacity-80 transition-opacity ${
                          task.status === 'DONE' ? 'shadow-lg shadow-green-500/20' : ''
                        }`}
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: task.color,
                          opacity: task.status === 'DONE' ? 0.9 : 0.8 // Make completed tasks slightly more opaque
                        }}
                      >
                        {/* Progress bar */}
                        <div
                          className={`h-full rounded-l ${
                            task.status === 'DONE' ? 'bg-white/50' : 'bg-white/30'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                        
                        {/* Task duration indicator */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-medium ${
                            task.status === 'DONE' ? 'text-white font-bold' : 'text-white opacity-90'
                          }`}>
                            {task.status === 'DONE' ? '✓ 100%' : `${task.progress}%`}
                          </span>
                        </div>
                      </div>

                      {/* Today indicator */}
                      {(() => {
                        const today = new Date();
                        const todayPosition = getTaskPosition({
                          ...task,
                          startDate: today,
                          endDate: today
                        });
                        const isToday = today >= timeline[0] && today <= timeline[timeline.length - 1];
                        
                        return isToday ? (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                            style={{ left: todayPosition.left }}
                          >
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg">
        <h4 className="text-white font-medium mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-300 text-sm">
                {status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-2 bg-purple-500 rounded" />
            <span>Task Duration</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-2 bg-white/30 rounded" />
            <span>Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Clock, Plus, TrendingUp, Target, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-transparent border border-white/20 rounded-xl backdrop-blur-sm">
                <img 
                  src="/Flow.svg" 
                  alt="TaskFlow Logo" 
                  className="h-8 w-8 brightness-0 invert opacity-90" 
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">TaskFlow Dashboard</h1>
                <p className="text-gray-300">Welcome back, {user?.firstName || user?.email}!</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg transition-all backdrop-blur-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tasks</p>
                <p className="text-2xl font-bold text-white">24</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-400">18</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-yellow-400">4</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Week</p>
                <p className="text-2xl font-bold text-purple-400">12</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <div className="p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg mr-3">
              <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-400">Email:</span>
              <span className="ml-2 text-white">{user?.email}</span>
            </div>
            <div>
              <span className="text-gray-400">Name:</span>
              <span className="ml-2 text-white">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.firstName || user?.lastName || 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Phone:</span>
              <span className="ml-2 text-white">{user?.phone || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                <Plus className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white ml-3">Create Task</h3>
            </div>
            <p className="text-gray-300 mb-4">Add a new task to your workflow</p>
            <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium">
              New Task
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
            <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all font-medium">
              View Calendar
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
            <button className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-medium">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
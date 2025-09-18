import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, LogOut, ChevronDown, BarChart3, Users, CheckSquare, Calendar } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const goToTasks = () => {
    navigate('/tasks');
  };

  const goToTeams = () => {
    navigate('/teams');
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToSchedule = () => {
    // TODO: Implement schedule/calendar page
    console.log('Navigate to schedule');
  };

  const goToAnalytics = () => {
    // TODO: Implement analytics page
    console.log('Navigate to analytics');
  };

  const goToSettings = () => {
    // TODO: Implement settings page
    console.log('Navigate to settings');
  };

  // Helper function to check if current path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={goToDashboard}>
              <div className="p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/20 rounded-xl backdrop-blur-sm">
                <img 
                  src="/Flow.svg" 
                  alt="TaskFlow" 
                  className="h-6 w-6 brightness-0 invert opacity-90" 
                />
              </div>
              <span className="text-xl font-bold text-white">TaskFlow</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={goToTasks}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/tasks') || isActive('/create-task')
                    ? 'text-white bg-white/20 border border-white/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                <span>Tasks</span>
              </button>
              
              <button
                onClick={goToTeams}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/teams') || isActive('/team-management')
                    ? 'text-white bg-white/20 border border-white/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Teams</span>
              </button>
              
              <button
                onClick={goToSchedule}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/schedule')
                    ? 'text-white bg-white/20 border border-white/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Schedule</span>
              </button>
              
              <button
                onClick={goToAnalytics}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/analytics')
                    ? 'text-white bg-white/20 border border-white/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200"
              >
                <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-white text-sm hidden sm:block">
                  {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        goToProfile();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        goToSettings();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    
                    <hr className="border-white/10 my-2" />
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Click outside to close dropdown */}
      {showProfileDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileDropdown(false)}
        />
      )}
    </>
  );
}
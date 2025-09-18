import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, LogOut, ChevronDown, BarChart3, Users, CheckSquare, Calendar, Menu, X, Zap } from 'lucide-react';
import { Button, Badge } from './ui';
import type { LucideIcon } from 'lucide-react';

// Enhanced NavButton component
interface NavButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  badge?: string | number;
}

const NavButton = ({ onClick, icon: Icon, label, isActive, badge }: NavButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-r from-primary-600/30 to-accent-600/30 text-white border border-primary-400/50 shadow-neon'
          : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
      }`}
    >
      <Icon className={`h-5 w-5 transition-all duration-300 ${
        isActive ? 'text-primary-300' : 'group-hover:scale-110'
      }`} />
      <span className="font-medium hidden xl:block">{label}</span>
      {badge && (
        <Badge 
          variant={isActive ? 'primary' : 'default'} 
          size="sm"
          className="hidden xl:block"
        >
          {badge}
        </Badge>
      )}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-xl animate-pulse" />
      )}
    </button>
  );
};

// Enhanced DropdownItem component
interface DropdownItemProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  description?: string;
  variant?: 'default' | 'danger';
}

const DropdownItem = ({ onClick, icon: Icon, label, description, variant = 'default' }: DropdownItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 text-left transition-all duration-300 flex items-center space-x-3 group ${
        variant === 'danger' 
          ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
          : 'text-gray-300 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
        variant === 'danger' ? 'text-red-400' : 'text-gray-400'
      }`} />
      <div>
        <div className="font-medium">{label}</div>
        {description && (
          <div className={`text-xs ${variant === 'danger' ? 'text-red-500' : 'text-gray-500'}`}>
            {description}
          </div>
        )}
      </div>
    </button>
  );
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowMobileMenu(false);
    setShowProfileDropdown(false);
  };
  const goToAnalytics = () => {
    navigate('/dashboard');
    setShowMobileMenu(false);
  };

  const goToTasks = () => {
    navigate('/tasks');
    setShowMobileMenu(false);
  };

  const goToTeams = () => {
    navigate('/teams');
    setShowMobileMenu(false);
  };

  const goToProfile = () => {
    navigate('/profile');
    setShowMobileMenu(false);
    setShowProfileDropdown(false);
  };

  const goToDashboard = () => {
    navigate('/dashboard');
    setShowMobileMenu(false);
  };

  const goToSchedule = () => {
    navigate('/schedule');
    setShowMobileMenu(false);
  };



  const goToSettings = () => {
    // TODO: Implement settings page
    console.log('Navigate to settings');
    setShowMobileMenu(false);
    setShowProfileDropdown(false);
  };

  // Helper function to check if current path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Enhanced Navigation Bar with better glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/20 shadow-2xl">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-18">
            {/* Enhanced Logo Section */}
            <button 
              onClick={goToDashboard}
              className="flex items-center space-x-4 group hover-lift transition-all duration-300"
            >
              <div className="relative p-3 bg-gradient-to-br from-primary-500/30 to-accent-500/30 border border-white/30 rounded-2xl backdrop-blur-sm group-hover:shadow-neon transition-all duration-300">
                <img 
                  src="/Flow.svg" 
                  alt="TaskFlow" 
                  className="h-7 w-7 brightness-0 invert opacity-90 group-hover:scale-110 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold text-gradient-primary group-hover:scale-105 transition-transform duration-300">
                  TaskFlow
                </span>
                <div className="text-xs text-gray-400 -mt-1">Team Collaboration</div>
              </div>
            </button>

            {/* Enhanced Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-2">
              <NavButton
                onClick={goToTasks}
                icon={CheckSquare}
                label="Tasks"
                isActive={isActive('/tasks') || isActive('/create-task')}
              />
              
              <NavButton
                onClick={goToTeams}
                icon={Users}
                label="Teams"
                isActive={isActive('/teams') || location.pathname.includes('/teams/')}
              />
              
              <NavButton
                onClick={goToSchedule}
                icon={Calendar}
                label="Schedule"
                isActive={isActive('/schedule')}
              />
              
              <NavButton
                onClick={goToAnalytics}
                icon={BarChart3}
                label="Analytics"
                isActive={isActive('/analytics') || isActive('/dashboard')}
              />
            </div>

            {/* Enhanced Desktop Profile Dropdown */}
            <div className="hidden lg:block relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="group flex items-center space-x-3 px-4 py-3 glass rounded-xl hover:shadow-neon transition-all duration-300 border border-white/20 hover:border-primary-400/50"
              >
                <div className="relative">
                  <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-900 animate-pulse" />
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-white font-medium text-sm">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email?.split('@')[0] || 'User'
                    }
                  </div>
                  <div className="text-gray-400 text-xs">Online</div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-300 ${
                  showProfileDropdown ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Enhanced Desktop Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-64 glass-card border border-white/30 rounded-2xl shadow-2xl overflow-hidden animate-slide-down">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : 'User'
                          }
                        </div>
                        <div className="text-gray-400 text-sm">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <DropdownItem
                      onClick={() => {
                        goToProfile();
                        setShowProfileDropdown(false);
                      }}
                      icon={User}
                      label="Profile"
                      description="Manage your account"
                    />
                    
                    <DropdownItem
                      onClick={() => {
                        goToSettings();
                        setShowProfileDropdown(false);
                      }}
                      icon={Settings}
                      label="Settings"
                      description="Preferences & config"
                    />
                    
                    <div className="border-t border-white/10 my-2" />
                    
                    <DropdownItem
                      onClick={() => {
                        handleLogout();
                        setShowProfileDropdown(false);
                      }}
                      icon={LogOut}
                      label="Sign Out"
                      description="End your session"
                      variant="danger"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-3">
              {/* Mobile Profile Icon */}
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              
              {/* Enhanced Hamburger Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-3 glass rounded-xl hover:shadow-neon transition-all duration-300 border border-white/20"
                aria-label="Toggle mobile menu"
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6 text-white transition-transform duration-300 rotate-90" />
                ) : (
                  <Menu className="h-6 w-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {/* Mobile Navigation Links */}
              <button
                onClick={goToTasks}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive('/tasks') || isActive('/create-task')
                    ? 'text-white bg-white/20 border border-white/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <CheckSquare className="h-5 w-5" />
                <span>Tasks</span>
              </button>
              
              <button
                onClick={goToTeams}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive('/teams') || isActive('/team-management')
                    ? 'text-white bg-white/20 border border-white/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Teams</span>
              </button>
              
              <button
                onClick={goToSchedule}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive('/schedule')
                    ? 'text-white bg-white/20 border border-white/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>Schedule</span>
              </button>
              
              <button
                onClick={goToAnalytics}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive('/analytics')
                    ? 'text-white bg-white/20 border border-white/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Analytics</span>
              </button>

              {/* Mobile Profile Section */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="px-4 py-2 text-sm text-gray-400">
                  Signed in as {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </div>
                
                <button
                  onClick={goToProfile}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={goToSettings}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Click outside to close dropdowns */}
      {(showProfileDropdown || showMobileMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowProfileDropdown(false);
            setShowMobileMenu(false);
          }}
        />
      )}
    </>
  );
}
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Teams from './pages/Teams';
import TeamManagement from './pages/TeamManagement';
import CreateTask from './pages/CreateTask';
import Profile from './pages/Profile';
import Schedule from './pages/Schedule';
import Analytics from './pages/Analytics';
import './App.css';

function AppContent() {
  const location = useLocation();
  
  // Define pages where navbar should NOT be shown
  const pagesWithoutNavbar = ['/signin', '/signup'];
  
  // Check if current page should show navbar
  const shouldShowNavbar = !pagesWithoutNavbar.includes(location.pathname);

  return (
    <div className="App">
      {shouldShowNavbar && <Navbar />}
      <Routes>
              {/* Public Routes */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tasks" 
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teams" 
                element={
                  <ProtectedRoute>
                    <Teams />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teams/:teamId/manage" 
                element={
                  <ProtectedRoute>
                    <TeamManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teams/:teamId/create-task" 
                element={
                  <ProtectedRoute>
                    <CreateTask />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/schedule" 
                element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all route - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: '1px solid #374151'
                }
              }}
            />
          </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppContent />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

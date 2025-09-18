import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { useAuth } from '../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, Lock, Loader, Eye, EyeOff, ArrowRight, Shield, Star } from 'lucide-react';
// import Orb from '../components/Orb';
/*
  If Orb.tsx exists in a different location, update the path below.
  Otherwise, create the Orb component in ../components/Orb.tsx.
*/
import Orb from '../components/Orb'; // <-- Ensure this file exists or update the path accordingly

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoggedIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination (from ProtectedRoute) or default to dashboard
  const from ='/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await userApi.login({ email, password });
      if (result && result.token) {
        toast.success('Signed in successfully!');
        localStorage.setItem('token', result.token);
        
        // Get user profile and update AuthContext
        try {
          const userData = await userApi.getProfile();
          login(userData); // Update AuthContext with user data
          
          // Navigate immediately after successful login
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 500); // Short delay to allow toast to be visible
          
        } catch (profileError) {
          console.error('Failed to fetch user profile after login:', profileError);
          // Even if profile fetch fails, we have the token, so navigate anyway
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 500);
        }
      } else {
        setError(result?.message || 'Sign in failed');
        toast.error(result?.message || 'Sign in failed');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden relative">
      {/* Animated Orb Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/6 w-96 h-96 opacity-40">
          <Orb hue={280} hoverIntensity={0.4} rotateOnHover={true} />
        </div>
        <div className="absolute top-1/3 right-1/6 w-80 h-80 opacity-30">
          <Orb hue={200} hoverIntensity={0.3} rotateOnHover={true} />
        </div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 opacity-25">
          <Orb hue={320} hoverIntensity={0.3} rotateOnHover={true} />
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm animate-pulse border border-white/10" />
      <div className="absolute bottom-20 left-20 w-24 h-24 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-sm animate-pulse delay-1000 border border-white/10" />
      <div className="absolute top-1/2 right-10 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm animate-pulse delay-500 border border-white/10" />

      <Toaster 
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Side - Welcome Content */}
          <div className="hidden lg:flex flex-col justify-center items-center text-center p-8">
            <div className="relative">
              {/* Glowing Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 text-purple-300 text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                Secure Platform
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Welcome Back to
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  TaskFlow
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto leading-relaxed">
                Stay organized, boost productivity, and achieve your goals with smart task management
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                <div className="flex items-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="p-2 bg-purple-500/20 rounded-lg mr-4">
                    <Shield className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Secure Data</p>
                    <p className="text-gray-400 text-sm">Your tasks are protected</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="p-2 bg-blue-500/20 rounded-lg mr-4">
                    <Star className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Smart Organization</p>
                    <p className="text-gray-400 text-sm">AI-powered task sorting</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Glass Card Container */}
              <div className="bg-black/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/5 pointer-events-none" />
                
                {/* Logo */}
                <div className="relative z-10 text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20  mb-4 shadow-lg backdrop-blur-sm">
                    <img 
                      src="/Flow.svg" 
                      alt="TaskFlow Logo" 
                      className="h-12 w-12 brightness-0 invert opacity-90" 
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Sign In to TaskFlow</h2>
                  <p className="text-gray-400">Welcome back! Let's get you organized</p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                          error ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 hover:border-white/30'
                        }`}
                        placeholder="name@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-12 pr-12 py-4 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                          error ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 hover:border-white/30'
                        }`}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4 h-5 w-5 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <label className="inline-flex items-center gap-2 text-gray-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-0" 
                        />
                        Remember me
                      </label>
                      <a href="/forgot" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                        Forgot Password?
                      </a>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full overflow-hidden"
                  >
                    <div className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-gray-600 to-pink-100 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/25 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-[1.02]">
                      {isLoading ? (
                        <>
                          <Loader className="h-5 w-5 mr-2 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                  </button>

                  <div className="text-center">
                    <p className="text-gray-400">
                      Don't have an account?{' '}
                      <a href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline transition-colors">
                        Sign up
                      </a>
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    By signing in, you agree to our{' '}
                    <a className="underline hover:text-gray-400 transition-colors" href="/terms">Terms of Service</a> and{' '}
                    <a className="underline hover:text-gray-400 transition-colors" href="/privacy">Privacy Policy</a>.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

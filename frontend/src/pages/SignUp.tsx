import { useEffect, useMemo, useState } from 'react';
import { Mail, Lock, User, Phone, Home, Check, Eye, EyeOff, Loader, ArrowRight, Shield, Star, Zap } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
// Make sure the Orb component exists at the specified path, or update the path if needed.
import Orb from '../components/Orb';
import { userApi, type RegisterUserData } from '../api/userApi';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

const initialFormData: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
};

export default function SignupForm() {
  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  // Debounced email existence check
  useEffect(() => {
    const checkEmail = async () => {
      if (formData.email && /\S+@\S+\.\S+/.test(formData.email)) {
        setEmailCheckLoading(true);
        setEmailExists(null);
        try {
          const result = await userApi.checkEmail(formData.email);
          setEmailExists(result.exists);
          if (result.exists) {
            setErrors((prev) => ({
              ...prev,
              email: 'This email is already registered. Please use a different email or try logging in.',
            }));
          } else {
            setErrors((prev) => {
              const ne = { ...prev };
              if (
                ne.email === 'This email is already registered. Please use a different email or try logging in.' ||
                ne.email === 'Email is already registered'
              ) {
                delete ne.email;
              }
              return ne;
            });
          }
        } catch {
          // silent for probe errors
        } finally {
          setEmailCheckLoading(false);
        }
      } else {
        setEmailExists(null);
      }
    };
    const t = setTimeout(checkEmail, 800);
    return () => clearTimeout(t);
  }, [formData.email]);

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((p) => ({ ...p, [field]: value as any }));
    if (errors[field as string]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Per-step validation (pure)
  const getStepErrors = (step: number): Record<string, string> => {
    const ne: Record<string, string> = {};
    if (step === 1) {
      if (!formData.email) ne.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) ne.email = 'Email is invalid';
      if (emailExists === true) ne.email = 'Email is already registered';

      if (!formData.password) ne.password = 'Password is required';
      else if (formData.password.length < 6) ne.password = '⚠️ Password must have at least 6 characters. Currently: ' + formData.password.length;
      else if (formData.password.length === 6) ne.password = '⚠️ Password must be more than 6 characters for security';
      else if (formData.password.length < 8) ne.password = '⚠️ Recommendation: Consider using at least 8 characters for better security';

      if (!formData.confirmPassword) ne.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) ne.confirmPassword = 'Passwords do not match';
    }
    if (step === 2) {
      if (!formData.firstName) ne.firstName = 'First name is required';
      if (!formData.lastName) ne.lastName = 'Last name is required';
      if (!formData.phone) ne.phone = 'Phone number is required';
      else {
        const clean = formData.phone.replace(/\D/g, '');
        if (!/^94\d{9}$/.test(clean)) {
          ne.phone = 'Phone must start with 94 and be exactly 11 digits (e.g., 94712345678)';
        }
      }
    }
    // Step 3 is now the review step, no validation needed
    return ne;
  };

  const validateStepAndTouch = (step: number) => {
    const ne = getStepErrors(step);
    setErrors(ne);
    return Object.keys(ne).length === 0;
  };

  const canProceed = useMemo(
    () => Object.keys(getStepErrors(currentStep)).length === 0,
    [formData, emailExists, currentStep]
  );

  const nextStep = () => {
    if (validateStepAndTouch(currentStep)) setCurrentStep((s) => Math.min(totalSteps, s + 1));
  };
  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!validateStepAndTouch(currentStep)) return;
    setIsLoading(true);
    try {
      const payload: RegisterUserData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        phone: formData.phone.replace(/\D/g, ''),
        address: formData.address || undefined,
      };
      await userApi.register(payload);
      toast.success('🎉 Account created successfully! Welcome aboard!');
      setTimeout(() => {
        window.location.href = '/signin';
      }, 1000);
    } catch (e: any) {
      toast.error(e?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Small, fixed-height sections per step (no scroll on desktop)
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={`w-full pl-12 pr-12 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                    errors.email ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 hover:border-white/30'
                  }`}
                  placeholder="name@email.com"
                />
                <div className="absolute right-4 top-3 h-4 w-4 flex items-center justify-center">
                  {emailCheckLoading ? (
                    <Loader className="h-3 w-3 animate-spin text-gray-400" />
                  ) : emailExists === false ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : emailExists === true ? (
                    <span className="h-2 w-2 bg-red-400 rounded-full" />
                  ) : null}
                </div>
              </div>
              {errors.email && (
                <div className="mt-2 p-2 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-xs">{errors.email}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className={`w-full pl-12 pr-12 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                    errors.password ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 hover:border-white/30'
                  }`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-3 h-4 w-4 text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 backdrop-blur-sm"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password feedback */}
              {formData.password && (
                <div className="mt-1 text-xs text-gray-400">
                  Characters: {formData.password.length} {formData.password.length < 6 ? '(Need at least 6)' : ''}
                </div>
              )}
              {errors.password && (
                <div className={`mt-2 p-2 border-l-4 rounded-lg backdrop-blur-sm ${
                  formData.password && formData.password.length < 6 
                    ? 'bg-red-500/20 border-red-500' 
                    : 'bg-red-500/10 border-red-400'
                }`}>
                  <p className={`text-xs font-semibold flex items-center ${
                    formData.password && formData.password.length < 6 
                      ? 'text-red-300' 
                      : 'text-red-400'
                  }`}>
                    <span className="mr-1 text-sm">
                      {formData.password && formData.password.length < 6 ? '🚨' : '⚠️'}
                    </span>
                    {errors.password}
                  </p>
                </div>
              )}
              {!errors.password && formData.password && formData.password.length > 6 && (
                <div className="mt-2 p-2 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl">
                  <p className="text-green-400 text-xs font-medium flex items-center">
                    <span className="mr-1">✅</span>
                    Password is strong enough
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className={`w-full pl-12 pr-12 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                    errors.confirmPassword ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 hover:border-white/30'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4 top-3 h-4 w-4 text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 backdrop-blur-sm"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="absolute right-12 top-3">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                )}
              </div>
              {errors.confirmPassword && (
                <div className="mt-2 p-2 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-xs">{errors.confirmPassword}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      errors.firstName ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 hover:border-white/30'
                    }`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <div className="mt-2 p-2 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-xs">{errors.firstName}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                    errors.lastName ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 hover:border-white/30'
                  }`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <div className="mt-2 p-2 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-xs">{errors.lastName}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 0 && !value.startsWith('94')) value = '94' + value;
                    if (value.length > 11) value = value.slice(0, 11);
                    if (value.length > 2) value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
                    updateFormData('phone', value);
                  }}
                  className={`w-full pl-12 pr-12 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                    errors.phone ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 hover:border-white/30'
                  }`}
                  placeholder="94 712 345 678"
                />
                {formData.phone && formData.phone.replace(/\D/g, '').length === 11 && formData.phone.replace(/\D/g, '').startsWith('94') && (
                  <div className="absolute right-4 top-3">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                )}
              </div>
              {errors.phone && (
                <div className="mt-2 p-2 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-xs">{errors.phone}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="rounded-xl p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30">
              <div className="flex items-center">
                <div className="p-2 bg-green-500 rounded-full mr-3">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-medium text-green-300 text-sm">Almost done!</h3>
              </div>
              <p className="text-xs text-green-200 mt-1">
                Review your information and use the button below to create your account.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-400">Email:</span> <span className="font-medium text-white">{formData.email || '-'}</span></div>
              <div><span className="text-gray-400">Name:</span> <span className="font-medium text-white">{formData.firstName} {formData.lastName}</span></div>
              <div><span className="text-gray-400">Phone:</span> <span className="font-medium text-white">{formData.phone || '-'}</span></div>
              {formData.address && (
                <div className="col-span-2"><span className="text-gray-400">Address:</span> <span className="font-medium text-white">{formData.address}</span></div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Address (Optional)</label>
              <div className="relative">
                <Home className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/30 rounded-xl text-white placeholder-gray-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Street address (optional)"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden relative">
      {/* Animated Orb Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/6 w-72 h-72 opacity-40">
          <Orb hue={280} hoverIntensity={0.4} rotateOnHover={true} />
        </div>
        <div className="absolute top-1/3 right-1/6 w-64 h-64 opacity-30">
          <Orb hue={200} hoverIntensity={0.3} rotateOnHover={true} />
        </div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 opacity-25">
          <Orb hue={320} hoverIntensity={0.3} rotateOnHover={true} />
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-16 right-16 w-24 h-24 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm animate-pulse border border-white/10" />
      <div className="absolute bottom-16 left-16 w-20 h-20 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-sm animate-pulse delay-1000 border border-white/10" />
      <div className="absolute top-1/2 right-8 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm animate-pulse delay-500 border border-white/10" />

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

      <div className="relative z-10 h-screen flex items-center justify-center p-2 lg:p-4">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 h-full max-h-screen items-center">
          
          {/* Left Side - Form */}
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-md">
              {/* Glass Card Container */}
              <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-4 lg:p-6 shadow-2xl border border-white/10 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/5 pointer-events-none" />
                
                {/* Logo */}
                <div className="relative z-10 text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20  mb-4 shadow-lg backdrop-blur-sm">
                    <img 
                      src="/Flow.svg" 
                      alt="TaskFlow Logo" 
                      className="h-10 w-10 brightness-0 invert opacity-90" 
                    />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {['Create Account', 'Personal Info', 'Review & Finish'][currentStep - 1]}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {['Join TaskFlow today', 'Tell us about yourself', 'Almost done!'][currentStep - 1]}
                  </p>
                </div>

                <div className="relative z-10">
                  {renderStep()}
                </div>

                {/* Footer link */}
                <div className="relative z-10 pt-4 text-center">
                  <p className="text-gray-400 text-sm">
                    Already have an account?{' '}
                    <a href="/signin" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline transition-colors px-2 py-1 rounded-md hover:bg-white/10 backdrop-blur-sm">
                      Sign in
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Interactive Welcome Panel */}
          <div className="hidden lg:flex flex-col justify-center items-center text-center p-4 h-full max-h-screen overflow-y-auto">
            <div className="w-full max-w-lg space-y-6">
              
              {/* Welcome Header */}
              <div className="relative">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 text-purple-300 text-xs font-medium mb-4">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  Join Our Community
                </div>

                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3 leading-tight">
                  Welcome to
                  <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    TaskFlow
                  </span>
                </h1>

                <p className="text-base text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">
                  Organize your tasks, boost productivity, and achieve your goals with our intelligent task management platform
                </p>
              </div>

              {/* Interactive Feature Cards */}
              <div className="grid grid-cols-1 gap-3">
                <div className="group p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                      <Shield className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-white font-semibold mb-1 text-sm">Smart Organization</h3>
                      <p className="text-gray-400 text-xs">AI-powered task categorization and priority management</p>
                    </div>
                  </div>
                </div>
                
                <div className="group p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                      <Star className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-white font-semibold mb-1 text-sm">Progress Tracking</h3>
                      <p className="text-gray-400 text-xs">Visual progress indicators and achievement milestones</p>
                    </div>
                  </div>
                </div>

                <div className="group p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                      <Zap className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-white font-semibold mb-1 text-sm">Lightning Fast</h3>
                      <p className="text-gray-400 text-xs">Quick task creation and instant synchronization</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Navigation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Step {currentStep} of {totalSteps}</span>
                  <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
                </div>
                
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`bg-gradient-to-r from-gray-500 to-pink-100 h-2 rounded-full transition-all duration-500 ease-out ${
                      currentStep === 1 ? 'w-1/3' :
                      currentStep === 2 ? 'w-2/3' : 'w-full'
                    }`}
                  ></div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1 || isLoading}
                    className={`flex items-center px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 backdrop-blur-sm border ${
                      currentStep === 1 || isLoading
                        ? 'text-gray-500 cursor-not-allowed bg-white/5 border-white/10'
                        : 'text-white hover:bg-white/20 hover:text-purple-300 bg-white/10 border-white/20 hover:border-purple-300/50'
                    }`}
                  >
                    <ArrowRight className="h-3 w-3 mr-1 rotate-180" />
                    Back
                  </button>

                  {currentStep < totalSteps ? (
                    <button
                      onClick={nextStep}
                      disabled={!canProceed || isLoading}
                      className={`group relative overflow-hidden flex items-center px-6 py-3 rounded-lg font-semibold text-xs transition-all duration-300 backdrop-blur-sm border ${
                        !canProceed || isLoading
                          ? 'bg-white/10 text-white/60 cursor-not-allowed border-white/20'
                          : 'bg-white/20 border-white/30 text-white hover:scale-105 shadow-lg hover:shadow-purple-500/25 hover:bg-white/30 hover:border-purple-500/50'
                      }`}
                    >
                      {!canProceed || isLoading ? (
                        <>
                          Next
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600/30 to-blue-600/30 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!canProceed || isLoading}
                      className={`group relative overflow-hidden flex items-center px-6 py-3 rounded-lg font-semibold text-xs transition-all duration-300 backdrop-blur-sm border ${
                        !canProceed || isLoading
                          ? 'bg-white/10 text-white/60 cursor-not-allowed border-white/20'
                          : 'bg-white/20 border-white/30 text-white hover:scale-105 shadow-lg hover:shadow-purple-500/25 hover:bg-white/30 hover:border-purple-500/50'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader className="h-3 w-3 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : !canProceed ? (
                        <>
                          Create Account
                          <Check className="h-3 w-3 ml-1" />
                        </>
                      ) : (
                        <>
                          Create Account
                          <Check className="h-3 w-3 ml-1 group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600/30 to-blue-600/30 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Floating Accents */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm animate-pulse" />
              <div className="absolute -bottom-6 -left-6 w-12 h-12 rounded-full bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm animate-pulse delay-1000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

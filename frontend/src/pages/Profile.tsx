import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi, type UpdateUserData } from '../api/userApi';
import { User, Mail, Phone, Home, Save, Edit3, X, ArrowLeft } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || '',
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updateData: UpdateUserData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
      };

      const updatedUser = await userApi.updateProfile(updateData);
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
            <p className="text-gray-300">Manage your TaskFlow account</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
              
              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    placeholder="Your email address"
                    className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg text-white ${
                      isEditing 
                        ? 'bg-white/5 border-white/20 hover:border-white/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' 
                        : 'bg-gray-700/30 border-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="Enter your first name"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg text-white ${
                      isEditing 
                        ? 'bg-white/5 border-white/20 hover:border-white/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' 
                        : 'bg-gray-700/30 border-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg text-white ${
                      isEditing 
                        ? 'bg-white/5 border-white/20 hover:border-white/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' 
                        : 'bg-gray-700/30 border-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </div>

            {/* Task Preferences & Additional Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Task Preferences</h2>
              
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Address (Optional)</label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg text-white ${
                      isEditing 
                        ? 'bg-white/5 border-white/20 hover:border-white/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' 
                        : 'bg-gray-700/30 border-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg text-white resize-none ${
                    isEditing 
                      ? 'bg-white/5 border-white/20 hover:border-white/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' 
                      : 'bg-gray-700/30 border-gray-600 cursor-not-allowed'
                  }`}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Account Status */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Account Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`text-sm ${user?.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email Verified:</span>
                    <span className={`text-sm ${user?.isEmailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                      {user?.isEmailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Member Since:</span>
                    <span className="text-gray-300 text-sm">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
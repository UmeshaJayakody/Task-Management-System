import apiClient from './axios';

// Types for user registration
export interface RegisterUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  phone?: string;
  location?: string;
  address?: string;
  bio?: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  address?: string;
  bio?: string;
  imageUrl?: string;
}

// User profile type
export interface UserProfile {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  address?: string;
  bio?: string;
  imageUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: UserProfile;
}

export interface RegisterResponse {
  message: string;
  user: UserProfile;
}

export interface EmailCheckResponse {
  exists: boolean;
  message: string;
}

export const userApi = {
  // Register a new user
  register: async (userData: RegisterUserData): Promise<RegisterResponse> => {
    try {
      console.log('Sending registration data:', userData); // Debug log
      const response = await apiClient.post('/users/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data); // Debug log
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Registration failed';
      throw new Error(errorMessage);
    }
  },

  // Login user
  login: async (credentials: LoginUserData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/users/login', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Get current user profile
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  // Update user profile
  updateProfile: async (userData: UpdateUserData): Promise<UserProfile> => {
    try {
      const response = await apiClient.put('/users/profile', userData);
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // Delete user profile
  deleteProfile: async (): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete('/users/profile');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete profile');
    }
  },

  // Check if email exists
  checkEmail: async (email: string): Promise<EmailCheckResponse> => {
    try {
      const response = await apiClient.get(`/users/check-email?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check email');
    }
  },

  // Get user by ID
  getUserById: async (id: string): Promise<UserProfile> => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  },

  // Search users by email for team member invitation
  searchUsers: async (email: string): Promise<{ users: UserProfile[] }> => {
    try {
      console.log('🔍 Frontend: Searching users with email:', email);
      // Try the new endpoint first, fallback to old one
      const response = await apiClient.get(`/users/find-users?email=${encodeURIComponent(email)}`);
      console.log('✅ Frontend: Search response:', response.data);
      
      // Handle both old and new response formats
      if (response.data.success !== undefined) {
        return { users: response.data.users || [] };
      } else {
        return response.data;
      }
    } catch (error: any) {
      console.error('❌ Frontend: Search error:', error);
      console.error('❌ Frontend: Error response:', error.response?.data);
      
      // Return empty array instead of throwing error for better UX
      if (error.response?.status === 500) {
        console.log('🔧 Returning empty array due to server error');
        return { users: [] };
      }
      
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  },
};
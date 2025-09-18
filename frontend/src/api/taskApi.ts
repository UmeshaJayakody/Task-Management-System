import apiClient from './axios';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
  };
  assignments: Array<{
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
    };
  }>;
  _count: {
    comments: number;
    dependencies: number;
    dependentOn: number;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date | string; // Allow both Date and string for flexibility
  teamId?: string;
  assigneeIds?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  teamId?: string;
  createdById?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const taskApi = {
  // Get tasks with filters
  getTasks: async (filters: TaskFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  // Get task by ID
  getTask: async (taskId: string) => {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Create new task
  createTask: async (taskData: CreateTaskData) => {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  },

  // Update task
  updateTask: async (taskId: string, updateData: UpdateTaskData) => {
    const response = await apiClient.put(`/tasks/${taskId}`, updateData);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId: string) => {
    const response = await apiClient.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // Assign users to task
  assignTask: async (taskId: string, userIds: string[]) => {
    const response = await apiClient.post(`/tasks/${taskId}/assign`, { userIds });
    return response.data;
  },

  // Get task statistics
  getStatistics: async (teamId?: string) => {
    const params = teamId ? `?teamId=${teamId}` : '';
    const response = await apiClient.get(`/tasks/statistics${params}`);
    return response.data;
  }
};
import apiClient from './axios';

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export interface CreateCommentData {
  content: string;
  taskId: string;
}

export interface UpdateCommentData {
  content: string;
}

export const commentApi = {
  // Get comments for a task
  getTaskComments: async (taskId: string) => {
    const response = await apiClient.get(`/comments/task/${taskId}`);
    return response.data;
  },

  // Create new comment
  createComment: async (commentData: CreateCommentData) => {
    const response = await apiClient.post('/comments', commentData);
    return response.data;
  },

  // Update comment
  updateComment: async (commentId: string, updateData: UpdateCommentData) => {
    const response = await apiClient.put(`/comments/${commentId}`, updateData);
    return response.data;
  },

  // Delete comment
  deleteComment: async (commentId: string) => {
    const response = await apiClient.delete(`/comments/${commentId}`);
    return response.data;
  }
};
import apiClient from './axios';

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    joinedAt: string;
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
    };
  }>;
  _count: {
    tasks: number;
  };
}

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
}

export const teamApi = {
  // Get all teams for current user
  getTeams: async () => {
    const response = await apiClient.get('/teams');
    return response.data;
  },

  // Get team by ID
  getTeam: async (teamId: string) => {
    const response = await apiClient.get(`/teams/${teamId}`);
    return response.data;
  },

  // Create new team
  createTeam: async (teamData: CreateTeamData) => {
    const response = await apiClient.post('/teams', teamData);
    return response.data;
  },

  // Update team
  updateTeam: async (teamId: string, updateData: UpdateTeamData) => {
    const response = await apiClient.put(`/teams/${teamId}`, updateData);
    return response.data;
  },

  // Delete team
  deleteTeam: async (teamId: string) => {
    const response = await apiClient.delete(`/teams/${teamId}`);
    return response.data;
  },

  // Add member to team
  addMember: async (teamId: string, userId: string, role?: 'ADMIN' | 'MEMBER') => {
    const response = await apiClient.post(`/teams/${teamId}/members`, { userId, role });
    return response.data;
  },

  // Remove member from team
  removeMember: async (teamId: string, memberId: string) => {
    const response = await apiClient.delete(`/teams/${teamId}/members/${memberId}`);
    return response.data;
  },

  // Update member role
  updateMemberRole: async (teamId: string, memberId: string, role: 'ADMIN' | 'MEMBER') => {
    const response = await apiClient.put(`/teams/${teamId}/members/${memberId}/role`, { role });
    return response.data;
  },

  // Leave team
  leaveTeam: async (teamId: string) => {
    const response = await apiClient.post(`/teams/${teamId}/leave`);
    return response.data;
  }
};
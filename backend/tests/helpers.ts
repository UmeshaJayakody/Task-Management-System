import { User, Team, Task, TaskStatus, TaskPriority, TeamRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './setup';

export const createTestUser = async (userData?: Partial<User>): Promise<User> => {
  const hashedPassword = await bcrypt.hash('testPassword123', 10);
  
  return await prisma.user.create({
    data: {
      email: userData?.email || `test${Date.now()}@example.com`,
      password: hashedPassword,
      firstName: userData?.firstName || 'Test',
      lastName: userData?.lastName || 'User',
      ...userData,
    },
  });
};

export const createTestTeam = async (creatorId: string, teamData?: Partial<Team>): Promise<Team> => {
  const team = await prisma.team.create({
    data: {
      name: teamData?.name || `Test Team ${Date.now()}`,
      description: teamData?.description || 'A test team',
    },
  });

  // Add creator as team owner
  await prisma.teamMember.create({
    data: {
      userId: creatorId,
      teamId: team.id,
      role: TeamRole.OWNER,
    },
  });

  return team;
};

export const createTestTask = async (assigneeId: string, taskData?: Partial<Task>): Promise<Task> => {
  const task = await prisma.task.create({
    data: {
      title: taskData?.title || `Test Task ${Date.now()}`,
      description: taskData?.description || 'A test task',
      status: taskData?.status || TaskStatus.TODO,
      priority: taskData?.priority || TaskPriority.MEDIUM,
      dueDate: taskData?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdById: assigneeId,
      teamId: taskData?.teamId,
    },
  });

  // Create task assignment
  await prisma.taskAssignment.create({
    data: {
      userId: assigneeId,
      taskId: task.id,
    },
  });

  return task;
};

export const generateAuthToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

export const createAuthHeaders = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
  };
};
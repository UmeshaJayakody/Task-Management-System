import { Request, Response, NextFunction } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignUsersToTask,
  getTaskStatistics,
  TaskFilters
} from '../services/task.service';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    console.log('Creating task for user:', userId); // Debug log
    console.log('Task data received:', req.body); // Debug log
    
    const task = await createTask(userId, req.body);
    console.log('Task created successfully:', task.id); // Debug log
    
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Error in createTaskController:', error); // Debug log
    next(error);
  }
};

export const getTasksController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const {
      status,
      priority,
      assigneeId,
      teamId,
      createdById,
      dueDateBefore,
      dueDateAfter,
      search,
      page = '1',
      limit = '10'
    } = req.query;

    const filters: TaskFilters = {};
    if (status) filters.status = status as TaskStatus;
    if (priority) filters.priority = priority as TaskPriority;
    if (assigneeId) filters.assigneeId = assigneeId as string;
    if (teamId) filters.teamId = teamId as string;
    if (createdById) filters.createdById = createdById as string;
    if (dueDateBefore) filters.dueDateBefore = new Date(dueDateBefore as string);
    if (dueDateAfter) filters.dueDateAfter = new Date(dueDateAfter as string);
    if (search) filters.search = search as string;

    const result = await getTasks(userId, filters, parseInt(page as string), parseInt(limit as string));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTaskByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { taskId } = req.params;
    
    if (!taskId) {
      res.status(400).json({ message: 'Task ID is required' });
      return;
    }

    const task = await getTaskById(taskId, userId);
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateTaskController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { taskId } = req.params;
    
    if (!taskId) {
      res.status(400).json({ message: 'Task ID is required' });
      return;
    }

    const task = await updateTask(taskId, userId, req.body);
    res.status(200).json({ message: 'Task updated successfully', task });
  } catch (error) {
    next(error);
  }
};

export const deleteTaskController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { taskId } = req.params;
    
    if (!taskId) {
      res.status(400).json({ message: 'Task ID is required' });
      return;
    }

    const result = await deleteTask(taskId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const assignTaskController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { taskId } = req.params;
    const { userIds } = req.body;
    
    if (!taskId) {
      res.status(400).json({ message: 'Task ID is required' });
      return;
    }

    if (!Array.isArray(userIds)) {
      res.status(400).json({ message: 'userIds must be an array' });
      return;
    }

    const result = await assignUsersToTask(taskId, userIds, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTaskStatisticsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { teamId } = req.query;

    const statistics = await getTaskStatistics(userId, teamId as string);
    res.status(200).json({ statistics });
  } catch (error) {
    next(error);
  }
};
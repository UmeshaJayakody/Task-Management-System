import { Request, Response, NextFunction } from 'express';
import {
  addTaskDependency,
  removeTaskDependency,
  getTaskDependencies,
  validateTaskCanBeCompleted,
  getDependencyGraph
} from '../services/dependency.service';

export const addTaskDependencyController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const dependency = await addTaskDependency(userId, req.body);
    res.status(201).json({ message: 'Dependency added successfully', dependency });
  } catch (error) {
    next(error);
  }
};

export const removeTaskDependencyController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { dependencyId } = req.params;
    
    if (!dependencyId) {
      res.status(400).json({ message: 'Dependency ID is required' });
      return;
    }

    const result = await removeTaskDependency(userId, dependencyId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTaskDependenciesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { taskId } = req.params;
    
    if (!taskId) {
      res.status(400).json({ message: 'Task ID is required' });
      return;
    }

    const dependencies = await getTaskDependencies(taskId, userId);
    res.status(200).json(dependencies);
  } catch (error) {
    next(error);
  }
};

export const validateTaskCompletionController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { taskId } = req.params;
    
    if (!taskId) {
      res.status(400).json({ message: 'Task ID is required' });
      return;
    }

    const validation = await validateTaskCanBeCompleted(taskId, userId);
    res.status(200).json(validation);
  } catch (error) {
    next(error);
  }
};

export const getDependencyGraphController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { teamId } = req.query;

    const graph = await getDependencyGraph(userId, teamId as string);
    res.status(200).json(graph);
  } catch (error) {
    next(error);
  }
};
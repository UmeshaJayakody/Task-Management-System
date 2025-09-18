import { Request, Response, NextFunction } from 'express';
import {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment
} from '../services/comment.service';

export const createCommentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const comment = await createComment(userId, req.body);
    res.status(201).json({ message: 'Comment created successfully', comment });
  } catch (error) {
    next(error);
  }
};

export const getTaskCommentsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { taskId } = req.params;
    const { page = '1', limit = '10' } = req.query;
    
    if (!taskId) {
      res.status(400).json({ message: 'Task ID is required' });
      return;
    }

    const result = await getTaskComments(taskId, userId, parseInt(page as string), parseInt(limit as string));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateCommentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { commentId } = req.params;
    
    if (!commentId) {
      res.status(400).json({ message: 'Comment ID is required' });
      return;
    }

    const comment = await updateComment(commentId, userId, req.body);
    res.status(200).json({ message: 'Comment updated successfully', comment });
  } catch (error) {
    next(error);
  }
};

export const deleteCommentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { commentId } = req.params;
    
    if (!commentId) {
      res.status(400).json({ message: 'Comment ID is required' });
      return;
    }

    const result = await deleteComment(commentId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
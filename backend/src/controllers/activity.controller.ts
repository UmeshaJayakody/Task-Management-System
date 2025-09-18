import { Request, Response, NextFunction } from 'express';
import { getActivities } from '../services/activity.service';
import { EntityType } from '@prisma/client';

export const getActivitiesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { teamId, entityType, limit } = req.query;

    const filters: any = {};
    if (teamId) filters.teamId = teamId as string;
    if (entityType) filters.entityType = entityType as EntityType;
    if (limit) filters.limit = parseInt(limit as string);

    const activities = await getActivities(userId, filters);
    res.status(200).json({ activities });
  } catch (error) {
    next(error);
  }
};
import { prisma } from '../utils/database';
import { ActivityType, EntityType } from '@prisma/client';

export interface CreateActivityData {
  type: ActivityType;
  description: string;
  entityType: EntityType;
  entityId: string;
  userId?: string;
  teamId?: string;
  metadata?: Record<string, any>;
}

// Global socket service instance (will be set from the main app)
let socketService: any = null;

export const setSocketService = (service: any) => {
  socketService = service;
};

export const createActivity = async (activityData: CreateActivityData) => {
  const activity = await prisma.activity.create({
    data: activityData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      team: {
        select: {
          id: true,
          name: true
        }
      },
      task: {
        select: {
          id: true,
          title: true,
          status: true
        }
      }
    }
  });

  // Broadcast activity in real-time
  if (socketService) {
    socketService.broadcastActivity(activity);
  }

  return activity;
};

export const getActivities = async (
  userId: string,
  filters: {
    teamId?: string;
    entityType?: EntityType;
    limit?: number;
  } = {}
) => {
  const { teamId, entityType, limit = 50 } = filters;
  
  const where: any = {};
  
  if (teamId) {
    where.teamId = teamId;
  } else {
    // Get activities for tasks/teams user is involved in
    where.OR = [
      { userId },
      { teamId: { in: await getUserTeamIds(userId) } },
      {
        AND: [
          { entityType: EntityType.TASK },
          {
            task: {
              OR: [
                { createdById: userId },
                { assignments: { some: { userId } } },
                { team: { members: { some: { userId } } } }
              ]
            }
          }
        ]
      }
    ];
  }
  
  if (entityType) {
    where.entityType = entityType;
  }

  return await prisma.activity.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      team: {
        select: {
          id: true,
          name: true
        }
      },
      task: {
        select: {
          id: true,
          title: true,
          status: true
        }
      }
    }
  });
};

const getUserTeamIds = async (userId: string): Promise<string[]> => {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true }
  });
  
  return memberships.map(m => m.teamId);
};
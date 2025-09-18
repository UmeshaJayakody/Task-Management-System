import { prisma } from '../utils/database';
import { ActivityType, EntityType } from '@prisma/client';
import { createActivity } from './activity.service';

export interface CreateCommentData {
  content: string;
  taskId: string;
}

export interface UpdateCommentData {
  content: string;
}

export const createComment = async (userId: string, commentData: CreateCommentData) => {
  // Check if user has access to the task
  const task = await prisma.task.findFirst({
    where: {
      id: commentData.taskId,
      OR: [
        { createdById: userId },
        { assignments: { some: { userId } } },
        { team: { members: { some: { userId } } } }
      ]
    },
    select: {
      id: true,
      title: true,
      teamId: true
    }
  });

  if (!task) {
    throw new Error('Task not found or access denied');
  }

  const comment = await prisma.comment.create({
    data: {
      content: commentData.content,
      taskId: commentData.taskId,
      userId
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      task: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  // Create activity
  await createActivity({
    type: ActivityType.TASK_COMMENTED,
    description: `Comment added to task "${task.title}"`,
    entityType: EntityType.TASK,
    entityId: task.id,
    userId,
    teamId: task.teamId || undefined,
    metadata: {
      taskTitle: task.title,
      commentId: comment.id
    }
  });

  return comment;
};

export const getTaskComments = async (taskId: string, userId: string, page = 1, limit = 10) => {
  // Check if user has access to the task
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: userId },
        { assignments: { some: { userId } } },
        { team: { members: { some: { userId } } } }
      ]
    }
  });

  if (!task) {
    throw new Error('Task not found or access denied');
  }

  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { taskId },
      skip,
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
        }
      }
    }),
    prisma.comment.count({ where: { taskId } })
  ]);

  return {
    comments,
    pagination: {
      current: page,
      total: Math.ceil(total / limit),
      count: comments.length,
      totalCount: total
    }
  };
};

export const updateComment = async (commentId: string, userId: string, updateData: UpdateCommentData) => {
  // Check if user owns the comment
  const existingComment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      userId
    }
  });

  if (!existingComment) {
    throw new Error('Comment not found or access denied');
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      task: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  return comment;
};

export const deleteComment = async (commentId: string, userId: string) => {
  // Check if user owns the comment or has admin permissions on the task's team
  const comment = await prisma.comment.findFirst({
    where: { id: commentId },
    include: {
      task: {
        include: {
          team: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      }
    }
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  // User can delete if they own the comment or are team admin/owner
  const canDelete = comment.userId === userId || 
    (comment.task.team && 
     comment.task.team.members.length > 0 && 
     comment.task.team.members[0] &&
     ['OWNER', 'ADMIN'].includes(comment.task.team.members[0].role));

  if (!canDelete) {
    throw new Error('Access denied');
  }

  await prisma.comment.delete({
    where: { id: commentId }
  });

  return { message: 'Comment deleted successfully' };
};
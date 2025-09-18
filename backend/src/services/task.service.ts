import { prisma } from '../utils/database';
import { TaskStatus, TaskPriority, ActivityType, EntityType } from '@prisma/client';
import { createActivity } from './activity.service';

// Global socket service instance (will be set from the main app)
let socketService: any = null;

export const setTaskSocketService = (service: any) => {
  socketService = service;
};

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  teamId?: string;
  assigneeIds?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  teamId?: string;
  createdById?: string;
  dueDateBefore?: Date;
  dueDateAfter?: Date;
  search?: string;
}

export const createTask = async (userId: string, taskData: CreateTaskData) => {
  const { assigneeIds, ...taskDetails } = taskData;
  
  const task = await prisma.task.create({
    data: {
      ...taskDetails,
      createdById: userId,
      assignments: assigneeIds ? {
        create: assigneeIds.map(assigneeId => ({
          userId: assigneeId,
          assignedById: userId
        }))
      } : undefined
    },
    include: {
      createdBy: {
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
      assignments: {
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
      },
      _count: {
        select: {
          comments: true,
          dependencies: true,
          dependentOn: true
        }
      }
    }
  });

  // Create activity
  await createActivity({
    type: ActivityType.TASK_CREATED,
    description: `Task "${task.title}" was created`,
    entityType: EntityType.TASK,
    entityId: task.id,
    userId,
    teamId: task.teamId || undefined,
    metadata: {
      taskTitle: task.title,
      priority: task.priority
    }
  });

  return task;
};

export const getTasks = async (userId: string, filters: TaskFilters = {}, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const filterConditions: any = {};
  
  // Apply filters
  if (filters.status) filterConditions.status = filters.status;
  if (filters.priority) filterConditions.priority = filters.priority;
  if (filters.teamId) filterConditions.teamId = filters.teamId;
  if (filters.createdById) filterConditions.createdById = filters.createdById;
  if (filters.dueDateBefore || filters.dueDateAfter) {
    filterConditions.dueDate = {};
    if (filters.dueDateBefore) filterConditions.dueDate.lte = filters.dueDateBefore;
    if (filters.dueDateAfter) filterConditions.dueDate.gte = filters.dueDateAfter;
  }
  
  // Search filter
  if (filters.search) {
    filterConditions.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
    ];
  }
  
  // Filter by assignment
  if (filters.assigneeId) {
    filterConditions.assignments = {
      some: {
        userId: filters.assigneeId
      }
    };
  }
  
  // Base security filter: user can only see tasks they're involved with
  const userInvolvementFilter = {
    OR: [
      { createdById: userId },
      { assignments: { some: { userId } } },
      { team: { members: { some: { userId } } } }
    ]
  };
  
  // Combine all conditions
  const where = {
    AND: [
      filterConditions,
      userInvolvementFilter
    ]
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        createdBy: {
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
        assignments: {
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
        },
        _count: {
          select: {
            comments: true,
            dependencies: true,
            dependentOn: true
          }
        }
      }
    }),
    prisma.task.count({ where })
  ]);

  return {
    tasks,
    pagination: {
      current: page,
      total: Math.ceil(total / limit),
      count: tasks.length,
      totalCount: total
    }
  };
};

export const getTaskById = async (taskId: string, userId: string) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: userId },
        { assignments: { some: { userId } } },
        { team: { members: { some: { userId } } } }
      ]
    },
    include: {
      createdBy: {
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
          name: true,
          description: true
        }
      },
      assignments: {
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
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      dependencies: {
        include: {
          dependsOnTask: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      },
      dependentOn: {
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      }
    }
  });

  if (!task) {
    throw new Error('Task not found or access denied');
  }

  return task;
};

export const updateTask = async (taskId: string, userId: string, updateData: UpdateTaskData) => {
  // Check if task exists
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId }
  });

  if (!existingTask) {
    throw new Error('Task not found');
  }

  // If trying to mark as DONE, check dependencies
  if (updateData.status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE) {
    const dependencies = await prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    const incompleteDependencies = dependencies.filter(
      d => d.dependsOnTask.status !== TaskStatus.DONE
    );

    if (incompleteDependencies.length > 0) {
      const blockedByTitles = incompleteDependencies.map(d => d.dependsOnTask.title).join(', ');
      throw new Error(`Cannot complete task. Blocked by incomplete dependencies: ${blockedByTitles}`);
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...updateData,
      completedAt: updateData.status === TaskStatus.DONE ? new Date() : null
    },
    include: {
      createdBy: {
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
      assignments: {
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
      }
    }
  });

  // Create activity
  await createActivity({
    type: ActivityType.TASK_UPDATED,
    description: `Task "${task.title}" was updated`,
    entityType: EntityType.TASK,
    entityId: task.id,
    userId,
    teamId: task.teamId || undefined,
    metadata: {
      taskTitle: task.title,
      changes: updateData
    }
  });

  // Broadcast task update in real-time
  if (socketService) {
    socketService.broadcastTaskUpdate(task);
  }

  return task;
};

export const deleteTask = async (taskId: string, userId: string) => {
  // First check if user has permission to delete this task
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: userId },
        { team: { members: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } }
      ]
    }
  });

  if (!existingTask) {
    throw new Error('Task not found or insufficient permissions');
  }

  await prisma.task.delete({
    where: { id: taskId }
  });

  return { message: 'Task deleted successfully' };
};

export const assignUsersToTask = async (taskId: string, userIds: string[], assignedById: string) => {
  // Check if task exists and user has permission
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: assignedById },
        { team: { members: { some: { userId: assignedById, role: { in: ['OWNER', 'ADMIN'] } } } } }
      ]
    }
  });

  if (!task) {
    throw new Error('Task not found or insufficient permissions');
  }

  // Remove existing assignments
  await prisma.taskAssignment.deleteMany({
    where: { taskId }
  });

  // Create new assignments
  if (userIds.length > 0) {
    await prisma.taskAssignment.createMany({
      data: userIds.map(userId => ({
        taskId,
        userId,
        assignedById
      }))
    });

    // Create activity
    await createActivity({
      type: ActivityType.TASK_ASSIGNED,
      description: `Task "${task.title}" was assigned to ${userIds.length} user(s)`,
      entityType: EntityType.TASK,
      entityId: taskId,
      userId: assignedById,
      teamId: task.teamId || undefined,
      metadata: {
        taskTitle: task.title,
        assigneeIds: userIds
      }
    });
  }

  return { message: 'Task assignments updated successfully' };
};

export const getTaskStatistics = async (userId: string, teamId?: string) => {
  const where: any = {};
  
  if (teamId) {
    where.teamId = teamId;
  } else {
    where.OR = [
      { createdById: userId },
      { assignments: { some: { userId } } },
      { team: { members: { some: { userId } } } }
    ];
  }

  const [total, todo, inProgress, inReview, done, overdue] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: TaskStatus.TODO } }),
    prisma.task.count({ where: { ...where, status: TaskStatus.IN_PROGRESS } }),
    prisma.task.count({ where: { ...where, status: TaskStatus.IN_REVIEW } }),
    prisma.task.count({ where: { ...where, status: TaskStatus.DONE } }),
    prisma.task.count({
      where: {
        ...where,
        dueDate: { lt: new Date() },
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
      }
    })
  ]);

  return {
    total,
    byStatus: {
      todo,
      inProgress,
      inReview,
      done
    },
    overdue
  };
};
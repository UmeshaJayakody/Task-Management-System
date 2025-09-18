import { prisma } from '../utils/database';
import { ActivityType, EntityType } from '@prisma/client';
import { createActivity } from './activity.service';

export interface CreateDependencyData {
  taskId: string;
  dependsOnTaskId: string;
}

export const addTaskDependency = async (userId: string, dependencyData: CreateDependencyData) => {
  const { taskId, dependsOnTaskId } = dependencyData;

  if (taskId === dependsOnTaskId) {
    throw new Error('A task cannot depend on itself');
  }

  // Check if user has permission to modify the task
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: userId },
        { team: { members: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } }
      ]
    }
  });

  if (!task) {
    throw new Error('Task not found or insufficient permissions');
  }

  // Check if dependency task exists and user has access
  const dependencyTask = await prisma.task.findFirst({
    where: {
      id: dependsOnTaskId,
      OR: [
        { createdById: userId },
        { assignments: { some: { userId } } },
        { team: { members: { some: { userId } } } }
      ]
    }
  });

  if (!dependencyTask) {
    throw new Error('Dependency task not found or access denied');
  }

  // Check if dependency already exists
  const existingDependency = await prisma.taskDependency.findFirst({
    where: {
      taskId,
      dependsOnTaskId
    }
  });

  if (existingDependency) {
    throw new Error('Dependency already exists');
  }

  // Check for circular dependencies
  const wouldCreateCircularDependency = await checkCircularDependency(dependsOnTaskId, taskId);
  if (wouldCreateCircularDependency) {
    throw new Error('This dependency would create a circular dependency');
  }

  // Create the dependency
  const dependency = await prisma.taskDependency.create({
    data: {
      taskId,
      dependsOnTaskId
    },
    include: {
      task: {
        select: {
          id: true,
          title: true
        }
      },
      dependsOnTask: {
        select: {
          id: true,
          title: true,
          status: true
        }
      }
    }
  });

  // Create activity
  await createActivity({
    type: ActivityType.TASK_UPDATED,
    description: `Task "${task.title}" now depends on "${dependencyTask.title}"`,
    entityType: EntityType.TASK,
    entityId: taskId,
    userId,
    teamId: task.teamId || undefined,
    metadata: {
      action: 'dependency_added',
      dependencyTaskId: dependsOnTaskId,
      dependencyTaskTitle: dependencyTask.title
    }
  });

  return dependency;
};

export const removeTaskDependency = async (userId: string, dependencyId: string) => {
  // Find the dependency and check permissions
  const dependency = await prisma.taskDependency.findFirst({
    where: { id: dependencyId },
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

  if (!dependency) {
    throw new Error('Dependency not found');
  }

  // Check permissions
  const hasPermission = dependency.task.createdById === userId ||
    (dependency.task.team && 
     dependency.task.team.members.length > 0 && 
     dependency.task.team.members[0] &&
     ['OWNER', 'ADMIN'].includes(dependency.task.team.members[0].role));

  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }

  await prisma.taskDependency.delete({
    where: { id: dependencyId }
  });

  // Create activity
  await createActivity({
    type: ActivityType.TASK_UPDATED,
    description: `Task dependency removed from "${dependency.task.title}"`,
    entityType: EntityType.TASK,
    entityId: dependency.task.id,
    userId,
    teamId: dependency.task.teamId || undefined,
    metadata: {
      action: 'dependency_removed',
      dependencyId
    }
  });

  return { message: 'Dependency removed successfully' };
};

export const getTaskDependencies = async (taskId: string, userId: string) => {
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

  const [dependencies, dependents] = await Promise.all([
    // Tasks this task depends on
    prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          }
        }
      }
    }),
    // Tasks that depend on this task
    prisma.taskDependency.findMany({
      where: { dependsOnTaskId: taskId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          }
        }
      }
    })
  ]);

  return {
    dependencies: dependencies.map(d => d.dependsOnTask),
    dependents: dependents.map(d => d.task)
  };
};

export const validateTaskCanBeCompleted = async (taskId: string, userId: string) => {
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

  // Get all dependencies
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

  // Check if all dependencies are completed
  const incompleteDependencies = dependencies.filter(
    d => d.dependsOnTask.status !== 'DONE'
  );

  if (incompleteDependencies.length > 0) {
    return {
      canComplete: false,
      blockedBy: incompleteDependencies.map(d => ({
        id: d.dependsOnTask.id,
        title: d.dependsOnTask.title,
        status: d.dependsOnTask.status
      }))
    };
  }

  return {
    canComplete: true,
    blockedBy: []
  };
};

// Helper function to check for circular dependencies using DFS
const checkCircularDependency = async (startTaskId: string, targetTaskId: string): Promise<boolean> => {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = async (taskId: string): Promise<boolean> => {
    if (recursionStack.has(taskId)) {
      return taskId === targetTaskId;
    }

    if (visited.has(taskId)) {
      return false;
    }

    visited.add(taskId);
    recursionStack.add(taskId);

    // Get all tasks that this task depends on
    const dependencies = await prisma.taskDependency.findMany({
      where: { taskId },
      select: { dependsOnTaskId: true }
    });

    for (const dep of dependencies) {
      if (await hasCycle(dep.dependsOnTaskId)) {
        return true;
      }
    }

    recursionStack.delete(taskId);
    return false;
  };

  return await hasCycle(startTaskId);
};

export const getDependencyGraph = async (userId: string, teamId?: string) => {
  const whereClause: any = {
    OR: [
      { createdById: userId },
      { assignments: { some: { userId } } },
      { team: { members: { some: { userId } } } }
    ]
  };

  if (teamId) {
    whereClause.teamId = teamId;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true
    }
  });

  const dependencies = await prisma.taskDependency.findMany({
    where: {
      task: whereClause
    },
    select: {
      taskId: true,
      dependsOnTaskId: true
    }
  });

  return {
    tasks,
    dependencies
  };
};
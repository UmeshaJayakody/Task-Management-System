import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

class SocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.initializeSocketHandlers();
  }

  private initializeSocketHandlers() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        socket.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);
      
      // Add socket to user's socket list
      if (socket.userId) {
        const userSockets = this.userSockets.get(socket.userId) || [];
        userSockets.push(socket.id);
        this.userSockets.set(socket.userId, userSockets);

        // Join user to their personal room
        socket.join(`user:${socket.userId}`);

        // Join user to their team rooms
        this.joinUserTeams(socket);
      }

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        
        // Remove socket from user's socket list
        if (socket.userId) {
          const userSockets = this.userSockets.get(socket.userId) || [];
          const updatedSockets = userSockets.filter(id => id !== socket.id);
          
          if (updatedSockets.length === 0) {
            this.userSockets.delete(socket.userId);
          } else {
            this.userSockets.set(socket.userId, updatedSockets);
          }
        }
      });

      // Handle joining specific rooms
      socket.on('join-team', (teamId: string) => {
        if (socket.userId) {
          this.joinTeamRoom(socket, teamId);
        }
      });

      socket.on('leave-team', (teamId: string) => {
        socket.leave(`team:${teamId}`);
      });

      // Handle activity requests
      socket.on('request-activities', async (filters: any) => {
        if (socket.userId) {
          try {
            const activities = await this.getActivitiesForUser(socket.userId, filters);
            socket.emit('activities', activities);
          } catch (error) {
            socket.emit('error', { message: 'Failed to fetch activities' });
          }
        }
      });
    });
  }

  private async joinUserTeams(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    try {
      const teams = await prisma.teamMember.findMany({
        where: { userId: socket.userId },
        select: { teamId: true }
      });

      teams.forEach((team: { teamId: string }) => {
        socket.join(`team:${team.teamId}`);
      });
    } catch (error) {
      console.error('Error joining user teams:', error);
    }
  }

  private async joinTeamRoom(socket: AuthenticatedSocket, teamId: string) {
    if (!socket.userId) return;

    try {
      // Verify user is member of the team
      const membership = await prisma.teamMember.findFirst({
        where: {
          userId: socket.userId,
          teamId
        }
      });

      if (membership) {
        socket.join(`team:${teamId}`);
        socket.emit('joined-team', teamId);
      } else {
        socket.emit('error', { message: 'Access denied to team' });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to join team' });
    }
  }

  private async getActivitiesForUser(userId: string, filters: any = {}) {
    const { teamId, entityType, limit = 50 } = filters;
    
    const where: any = {};
    
    if (teamId) {
      where.teamId = teamId;
    } else {
      // Get activities for tasks/teams user is involved in
      const userTeamIds = await this.getUserTeamIds(userId);
      
      where.OR = [
        { userId },
        { teamId: { in: userTeamIds } },
        {
          AND: [
            { entityType: 'TASK' },
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
        }
      }
    });
  }

  private async getUserTeamIds(userId: string): Promise<string[]> {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true }
    });
    
    return memberships.map((m: { teamId: string }) => m.teamId);
  }

  // Public methods for emitting events
  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToTeam(teamId: string, event: string, data: any) {
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  public emitToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Activity broadcasting methods
  public broadcastActivity(activity: any) {
    // Emit to the user who created the activity
    if (activity.userId) {
      this.emitToUser(activity.userId, 'new-activity', activity);
    }

    // Emit to team members if it's a team activity
    if (activity.teamId) {
      this.emitToTeam(activity.teamId, 'new-activity', activity);
    }

    // For task activities, emit to task assignees and team members
    if (activity.entityType === 'TASK' && activity.task) {
      // This could be enhanced to get task assignees and emit to them specifically
      if (activity.teamId) {
        this.emitToTeam(activity.teamId, 'new-activity', activity);
      }
    }
  }

  public broadcastTaskUpdate(task: any) {
    // Emit to task creator
    if (task.createdById) {
      this.emitToUser(task.createdById, 'task-updated', task);
    }

    // Emit to task assignees
    if (task.assignments) {
      task.assignments.forEach((assignment: any) => {
        this.emitToUser(assignment.userId, 'task-updated', task);
      });
    }

    // Emit to team members
    if (task.teamId) {
      this.emitToTeam(task.teamId, 'task-updated', task);
    }
  }

  public broadcastTeamUpdate(team: any) {
    if (team.id) {
      this.emitToTeam(team.id, 'team-updated', team);
    }
  }

  public broadcastCommentAdded(comment: any) {
    // Emit to task creator
    if (comment.task && comment.task.createdById) {
      this.emitToUser(comment.task.createdById, 'comment-added', comment);
    }

    // Emit to team members if task has a team
    if (comment.task && comment.task.teamId) {
      this.emitToTeam(comment.task.teamId, 'comment-added', comment);
    }
  }

  public getIO() {
    return this.io;
  }
}

export default SocketService;
import { ActivityType, EntityType } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middlewares/error.middleware';
import activityRoutes from '../src/routes/activity.routes';
import { createAuthHeaders, createTestTask, createTestTeam, createTestUser, generateAuthToken } from './helpers';
import { prisma } from './setup';

const app = express();
app.use(express.json());
app.use('/api/activities', activityRoutes);
app.use(errorHandler);

describe('Activity Tracking', () => {
  let user: any;
  let token: string;
  let team: any;
  let task: any;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateAuthToken(user.id);
    team = await createTestTeam(user.id);
    task = await createTestTask(user.id, { teamId: team.id });
  });

  describe('Activity Logging', () => {
    it('should log task creation activity', async () => {
      // Check if activity was automatically logged when task was created
      const activities = await prisma.activity.findMany({
        where: {
          type: ActivityType.TASK_CREATED,
          entityType: EntityType.TASK,
          entityId: task.id,
        },
      });

      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].userId).toBe(user.id);
      expect(activities[0].teamId).toBe(team.id);
    });

    it('should log task assignment activity', async () => {
      const assignee = await createTestUser({ email: 'assignee@example.com' });

      await request(app)
        .post(`/api/tasks/${task.id}/assign/${assignee.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      const activities = await prisma.activity.findMany({
        where: {
          type: ActivityType.TASK_ASSIGNED,
          entityType: EntityType.TASK,
          entityId: task.id,
        },
      });

      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].userId).toBe(user.id); // User who performed the assignment
    });

    it('should log task completion activity', async () => {
      await request(app)
        .put(`/api/tasks/${task.id}/status`)
        .set(createAuthHeaders(token))
        .send({ status: 'DONE' })
        .expect(200);

      const activities = await prisma.activity.findMany({
        where: {
          type: ActivityType.TASK_COMPLETED,
          entityType: EntityType.TASK,
          entityId: task.id,
        },
      });

      expect(activities.length).toBeGreaterThan(0);
    });

    it('should log team creation activity', async () => {
      const teamData = {
        name: 'New Activity Test Team',
        description: 'Team for activity testing',
      };

      const response = await request(app)
        .post('/api/teams')
        .set(createAuthHeaders(token))
        .send(teamData)
        .expect(201);

      const activities = await prisma.activity.findMany({
        where: {
          type: ActivityType.TEAM_CREATED,
          entityType: EntityType.TEAM,
          entityId: response.body.data.id,
        },
      });

      expect(activities.length).toBeGreaterThan(0);
    });

    it('should log comment creation activity', async () => {
      const commentData = {
        content: 'Test comment for activity logging',
      };

      const response = await request(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set(createAuthHeaders(token))
        .send(commentData)
        .expect(201);

      const activities = await prisma.activity.findMany({
        where: {
          type: ActivityType.TASK_COMMENTED,
          entityType: EntityType.COMMENT,
        },
      });

      expect(activities.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/activities', () => {
    beforeEach(async () => {
      // Create some test activities
      await prisma.activity.createMany({
        data: [
          {
            type: ActivityType.TASK_CREATED,
            description: 'Created a new task',
            entityType: EntityType.TASK,
            entityId: task.id,
            userId: user.id,
            teamId: team.id,
          },
          {
            type: ActivityType.TASK_UPDATED,
            description: 'Updated task details',
            entityType: EntityType.TASK,
            entityId: task.id,
            userId: user.id,
            teamId: team.id,
          },
          {
            type: ActivityType.TEAM_CREATED,
            description: 'Created a new team',
            entityType: EntityType.TEAM,
            entityId: team.id,
            userId: user.id,
          },
        ],
      });
    });

    it('should get user activities with pagination', async () => {
      const response = await request(app)
        .get('/api/activities')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter activities by type', async () => {
      const response = await request(app)
        .get('/api/activities')
        .query({ type: ActivityType.TASK_CREATED })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((activity: any) =>
        activity.type === ActivityType.TASK_CREATED
      )).toBe(true);
    });

    it('should filter activities by entity type', async () => {
      const response = await request(app)
        .get('/api/activities')
        .query({ entityType: EntityType.TASK })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((activity: any) =>
        activity.entityType === EntityType.TASK
      )).toBe(true);
    });

    it('should filter activities by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const response = await request(app)
        .get('/api/activities')
        .query({
          startDate: yesterday.toISOString(),
          endDate: tomorrow.toISOString()
        })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should sort activities by creation date', async () => {
      const response = await request(app)
        .get('/api/activities')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);

      if (response.body.data.length > 1) {
        const activities = response.body.data;
        for (let i = 0; i < activities.length - 1; i++) {
          const current = new Date(activities[i].createdAt);
          const next = new Date(activities[i + 1].createdAt);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });
  });

  describe('GET /api/activities/team/:teamId', () => {
    it('should get team activities', async () => {
      const response = await request(app)
        .get(`/api/activities/team/${team.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every((activity: any) =>
        activity.teamId === team.id
      )).toBe(true);
    });

    it('should require team membership to view team activities', async () => {
      const outsider = await createTestUser({ email: 'outsider@example.com' });
      const outsiderToken = generateAuthToken(outsider.id);

      const response = await request(app)
        .get(`/api/activities/team/${team.id}`)
        .set(createAuthHeaders(outsiderToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/activities/task/:taskId', () => {
    it('should get task-specific activities', async () => {
      const response = await request(app)
        .get(`/api/activities/task/${task.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every((activity: any) =>
        activity.entityId === task.id || activity.entityType === EntityType.TASK
      )).toBe(true);
    });

    it('should include related activities (comments, assignments)', async () => {
      // Create a comment on the task
      await prisma.comment.create({
        data: {
          content: 'Test comment',
          taskId: task.id,
          userId: user.id,
        },
      });

      // Log comment activity
      await prisma.activity.create({
        data: {
          type: ActivityType.TASK_COMMENTED,
          description: 'Added a comment',
          entityType: EntityType.COMMENT,
          entityId: 'comment-id',
          userId: user.id,
          teamId: team.id,
          metadata: { taskId: task.id },
        },
      });

      const response = await request(app)
        .get(`/api/activities/task/${task.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.some((activity: any) =>
        activity.type === ActivityType.TASK_COMMENTED
      )).toBe(true);
    });
  });

  describe('Activity Metadata and Context', () => {
    it('should include metadata in activities', async () => {
      const activityWithMetadata = await prisma.activity.create({
        data: {
          type: ActivityType.TASK_UPDATED,
          description: 'Updated task priority',
          entityType: EntityType.TASK,
          entityId: task.id,
          userId: user.id,
          teamId: team.id,
          metadata: {
            previousPriority: 'MEDIUM',
            newPriority: 'HIGH',
            field: 'priority',
          },
        },
      });

      const response = await request(app)
        .get('/api/activities')
        .set(createAuthHeaders(token))
        .expect(200);

      const activity = response.body.data.find((a: any) => a.id === activityWithMetadata.id);
      expect(activity.metadata).toBeDefined();
      expect(activity.metadata.previousPriority).toBe('MEDIUM');
      expect(activity.metadata.newPriority).toBe('HIGH');
    });

    it('should include user information in activities', async () => {
      const response = await request(app)
        .get('/api/activities')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        const activity = response.body.data[0];
        expect(activity.user).toBeDefined();
        expect(activity.user.firstName).toBeDefined();
        expect(activity.user.lastName).toBeDefined();
        expect(activity.user.password).toBeUndefined(); // Should not include password
      }
    });
  });

  describe('Activity Aggregation and Analytics', () => {
    beforeEach(async () => {
      // Create various activities for analytics
      const activities = [
        { type: ActivityType.TASK_CREATED, entityType: EntityType.TASK },
        { type: ActivityType.TASK_CREATED, entityType: EntityType.TASK },
        { type: ActivityType.TASK_COMPLETED, entityType: EntityType.TASK },
        { type: ActivityType.TEAM_CREATED, entityType: EntityType.TEAM },
        { type: ActivityType.TASK_COMMENTED, entityType: EntityType.COMMENT },
        { type: ActivityType.TASK_COMMENTED, entityType: EntityType.COMMENT },
      ];

      await prisma.activity.createMany({
        data: activities.map(activity => ({
          ...activity,
          description: `Test ${activity.type}`,
          entityId: 'test-entity',
          userId: user.id,
          teamId: team.id,
        })),
      });
    });

    it('should get activity statistics', async () => {
      const response = await request(app)
        .get('/api/activities/stats')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalActivities).toBeDefined();
      expect(response.body.data.byType).toBeDefined();
      expect(response.body.data.byType[ActivityType.TASK_CREATED]).toBe(2);
      expect(response.body.data.byType[ActivityType.TASK_COMPLETED]).toBe(1);
    });

    it('should get team activity statistics', async () => {
      const response = await request(app)
        .get(`/api/activities/stats/team/${team.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teamId).toBe(team.id);
      expect(response.body.data.totalActivities).toBeGreaterThan(0);
    });

    it('should get activity timeline', async () => {
      const response = await request(app)
        .get('/api/activities/timeline')
        .query({ groupBy: 'day' })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        expect(response.body.data[0].date).toBeDefined();
        expect(response.body.data[0].count).toBeDefined();
      }
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large activity datasets efficiently', async () => {
      // Create a large number of activities
      const activities = Array.from({ length: 100 }, (_, i) => ({
        type: ActivityType.TASK_CREATED,
        description: `Bulk activity ${i}`,
        entityType: EntityType.TASK,
        entityId: `task-${i}`,
        userId: user.id,
        teamId: team.id,
      }));

      await prisma.activity.createMany({ data: activities });

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/activities')
        .query({ limit: 50 })
        .set(createAuthHeaders(token))
        .expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(response.body.data.length).toBeLessThanOrEqual(50);
    });

    it('should implement proper pagination for activities', async () => {
      const response1 = await request(app)
        .get('/api/activities')
        .query({ page: 1, limit: 5 })
        .set(createAuthHeaders(token))
        .expect(200);

      const response2 = await request(app)
        .get('/api/activities')
        .query({ page: 2, limit: 5 })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response1.body.data.length).toBeLessThanOrEqual(5);
      expect(response2.body.data.length).toBeLessThanOrEqual(5);

      // Should have different data (if enough activities exist)
      if (response1.body.data.length === 5 && response2.body.data.length > 0) {
        expect(response1.body.data[0].id).not.toBe(response2.body.data[0].id);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid activity type filters', async () => {
      const response = await request(app)
        .get('/api/activities')
        .query({ type: 'INVALID_TYPE' })
        .set(createAuthHeaders(token))
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid date ranges', async () => {
      const response = await request(app)
        .get('/api/activities')
        .query({
          startDate: 'invalid-date',
          endDate: 'also-invalid'
        })
        .set(createAuthHeaders(token))
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle non-existent team activities', async () => {
      const response = await request(app)
        .get('/api/activities/team/non-existent-team-id')
        .set(createAuthHeaders(token))
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle non-existent task activities', async () => {
      const response = await request(app)
        .get('/api/activities/task/non-existent-task-id')
        .set(createAuthHeaders(token))
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
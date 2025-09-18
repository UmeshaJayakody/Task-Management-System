import request from 'supertest';
import express from 'express';
import { TaskStatus, TaskPriority } from '@prisma/client';
import taskRoutes from '../src/routes/task.routes';
import { errorHandler } from '../src/middlewares/error.middleware';
import { prisma } from './setup';
import { createTestUser, createTestTask, createTestTeam, generateAuthToken, createAuthHeaders } from './helpers';

const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);
app.use(errorHandler);

describe('Task Management', () => {
  let user: any;
  let token: string;
  let team: any;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateAuthToken(user.id);
    team = await createTestTeam(user.id);
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        teamId: team.id,
        assigneeIds: [user.id],
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeaders(token))
        .send(taskData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: TaskStatus.TODO,
          createdById: user.id,
          teamId: team.id,
        },
      });

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.assignments).toHaveLength(1);
    });

    it('should validate required fields', async () => {
      const invalidTaskData = {
        description: 'Missing title',
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeaders(token))
        .send(invalidTaskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should require authentication', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    it('should get user tasks with default pagination', async () => {
      // Create test tasks
      await createTestTask(user.id, { title: 'Task 1' });
      await createTestTask(user.id, { title: 'Task 2' });

      const response = await request(app)
        .get('/api/tasks')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tasks: expect.any(Array),
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
      });

      expect(response.body.data.tasks).toHaveLength(2);
    });

    it('should filter tasks by status', async () => {
      await createTestTask(user.id, { title: 'Todo Task', status: TaskStatus.TODO });
      await createTestTask(user.id, { title: 'In Progress Task', status: TaskStatus.IN_PROGRESS });

      const response = await request(app)
        .get('/api/tasks?status=TODO')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].status).toBe(TaskStatus.TODO);
    });

    it('should filter tasks by priority', async () => {
      await createTestTask(user.id, { title: 'High Priority', priority: TaskPriority.HIGH });
      await createTestTask(user.id, { title: 'Low Priority', priority: TaskPriority.LOW });

      const response = await request(app)
        .get('/api/tasks?priority=HIGH')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].priority).toBe(TaskPriority.HIGH);
    });

    it('should search tasks by title', async () => {
      await createTestTask(user.id, { title: 'Important Task' });
      await createTestTask(user.id, { title: 'Regular Task' });

      const response = await request(app)
        .get('/api/tasks?search=Important')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].title).toContain('Important');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get task by id', async () => {
      const task = await createTestTask(user.id);

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: task.id,
          title: task.title,
          description: task.description,
        },
      });
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/non-existent-id')
        .set(createAuthHeaders(token))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task successfully', async () => {
      const task = await createTestTask(user.id);
      const updateData = {
        title: 'Updated Task Title',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
      };

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set(createAuthHeaders(token))
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: task.id,
          ...updateData,
        },
      });

      // Verify update in database
      const updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(updatedTask).toMatchObject(updateData);
    });

    it('should validate update data', async () => {
      const task = await createTestTask(user.id);
      const invalidData = {
        status: 'INVALID_STATUS',
        priority: 'INVALID_PRIORITY',
      };

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set(createAuthHeaders(token))
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task successfully', async () => {
      const task = await createTestTask(user.id);

      const response = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task deleted successfully',
      });

      // Verify deletion in database
      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(deletedTask).toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/non-existent-id')
        .set(createAuthHeaders(token))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/tasks/:id/assign', () => {
    it('should assign task to users', async () => {
      const task = await createTestTask(user.id);
      const assignee = await createTestUser({ email: 'assignee@example.com' });

      const response = await request(app)
        .post(`/api/tasks/${task.id}/assign`)
        .set(createAuthHeaders(token))
        .send({ userIds: [assignee.id] })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify assignment in database
      const assignments = await prisma.taskAssignment.findMany({
        where: { taskId: task.id },
      });

      expect(assignments).toHaveLength(2); // Original assignee + new assignee
    });
  });

  describe('DELETE /api/tasks/:id/assign/:userId', () => {
    it('should unassign user from task', async () => {
      const task = await createTestTask(user.id);

      const response = await request(app)
        .delete(`/api/tasks/${task.id}/assign/${user.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify unassignment in database
      const assignment = await prisma.taskAssignment.findFirst({
        where: { taskId: task.id, userId: user.id },
      });

      expect(assignment).toBeNull();
    });
  });
});
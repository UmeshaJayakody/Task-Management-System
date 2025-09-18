import request from 'supertest';
import express from 'express';
import dependencyRoutes from '../src/routes/dependency.routes';
import { errorHandler } from '../src/middlewares/error.middleware';
import { prisma } from './setup';
import { createTestUser, createTestTask, generateAuthToken, createAuthHeaders } from './helpers';

const app = express();
app.use(express.json());
app.use('/api/dependencies', dependencyRoutes);
app.use(errorHandler);

describe('Task Dependencies', () => {
  let user: any;
  let token: string;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateAuthToken(user.id);
  });

  describe('POST /api/dependencies', () => {
    it('should create task dependency successfully', async () => {
      const task1 = await createTestTask(user.id, { title: 'Task 1' });
      const task2 = await createTestTask(user.id, { title: 'Task 2' });

      const response = await request(app)
        .post('/api/dependencies')
        .set(createAuthHeaders(token))
        .send({
          taskId: task2.id,
          dependsOnTaskId: task1.id,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          taskId: task2.id,
          dependsOnTaskId: task1.id,
        },
      });

      // Verify dependency in database
      const dependency = await prisma.taskDependency.findFirst({
        where: { taskId: task2.id, dependsOnTaskId: task1.id },
      });

      expect(dependency).toBeTruthy();
    });

    it('should prevent circular dependencies', async () => {
      const task1 = await createTestTask(user.id, { title: 'Task 1' });
      const task2 = await createTestTask(user.id, { title: 'Task 2' });
      const task3 = await createTestTask(user.id, { title: 'Task 3' });

      // Create dependency chain: task1 -> task2 -> task3
      await prisma.taskDependency.create({
        data: { taskId: task2.id, dependsOnTaskId: task1.id },
      });
      await prisma.taskDependency.create({
        data: { taskId: task3.id, dependsOnTaskId: task2.id },
      });

      // Try to create circular dependency: task1 -> task3 (would create cycle)
      const response = await request(app)
        .post('/api/dependencies')
        .set(createAuthHeaders(token))
        .send({
          taskId: task1.id,
          dependsOnTaskId: task3.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('circular dependency');
    });

    it('should prevent self-dependency', async () => {
      const task = await createTestTask(user.id);

      const response = await request(app)
        .post('/api/dependencies')
        .set(createAuthHeaders(token))
        .send({
          taskId: task.id,
          dependsOnTaskId: task.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot depend on itself');
    });

    it('should prevent duplicate dependencies', async () => {
      const task1 = await createTestTask(user.id, { title: 'Task 1' });
      const task2 = await createTestTask(user.id, { title: 'Task 2' });

      // Create dependency first time
      await request(app)
        .post('/api/dependencies')
        .set(createAuthHeaders(token))
        .send({
          taskId: task2.id,
          dependsOnTaskId: task1.id,
        })
        .expect(201);

      // Try to create same dependency again
      const response = await request(app)
        .post('/api/dependencies')
        .set(createAuthHeaders(token))
        .send({
          taskId: task2.id,
          dependsOnTaskId: task1.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate that both tasks exist', async () => {
      const task = await createTestTask(user.id);

      const response = await request(app)
        .post('/api/dependencies')
        .set(createAuthHeaders(token))
        .send({
          taskId: task.id,
          dependsOnTaskId: 'non-existent-task-id',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should require authentication', async () => {
      const task1 = await createTestTask(user.id);
      const task2 = await createTestTask(user.id);

      const response = await request(app)
        .post('/api/dependencies')
        .send({
          taskId: task2.id,
          dependsOnTaskId: task1.id,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/dependencies/task/:taskId', () => {
    it('should get task dependencies successfully', async () => {
      const task1 = await createTestTask(user.id, { title: 'Dependency 1' });
      const task2 = await createTestTask(user.id, { title: 'Dependency 2' });
      const mainTask = await createTestTask(user.id, { title: 'Main Task' });

      // Create dependencies
      await prisma.taskDependency.create({
        data: { taskId: mainTask.id, dependsOnTaskId: task1.id },
      });
      await prisma.taskDependency.create({
        data: { taskId: mainTask.id, dependsOnTaskId: task2.id },
      });

      const response = await request(app)
        .get(`/api/dependencies/task/${mainTask.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          dependencies: expect.any(Array),
          dependents: expect.any(Array),
        },
      });

      expect(response.body.data.dependencies).toHaveLength(2);
      expect(response.body.data.dependencies.map((d: any) => d.dependsOnTask.title))
        .toContain('Dependency 1');
      expect(response.body.data.dependencies.map((d: any) => d.dependsOnTask.title))
        .toContain('Dependency 2');
    });

    it('should get task dependents successfully', async () => {
      const baseTask = await createTestTask(user.id, { title: 'Base Task' });
      const dependent1 = await createTestTask(user.id, { title: 'Dependent 1' });
      const dependent2 = await createTestTask(user.id, { title: 'Dependent 2' });

      // Create dependencies
      await prisma.taskDependency.create({
        data: { taskId: dependent1.id, dependsOnTaskId: baseTask.id },
      });
      await prisma.taskDependency.create({
        data: { taskId: dependent2.id, dependsOnTaskId: baseTask.id },
      });

      const response = await request(app)
        .get(`/api/dependencies/task/${baseTask.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.data.dependents).toHaveLength(2);
      expect(response.body.data.dependents.map((d: any) => d.task.title))
        .toContain('Dependent 1');
      expect(response.body.data.dependents.map((d: any) => d.task.title))
        .toContain('Dependent 2');
    });

    it('should return empty arrays for task with no dependencies', async () => {
      const task = await createTestTask(user.id);

      const response = await request(app)
        .get(`/api/dependencies/task/${task.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          dependencies: [],
          dependents: [],
        },
      });
    });
  });

  describe('DELETE /api/dependencies/:id', () => {
    it('should delete dependency successfully', async () => {
      const task1 = await createTestTask(user.id);
      const task2 = await createTestTask(user.id);

      const dependency = await prisma.taskDependency.create({
        data: { taskId: task2.id, dependsOnTaskId: task1.id },
      });

      const response = await request(app)
        .delete(`/api/dependencies/${dependency.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Dependency deleted successfully',
      });

      // Verify deletion in database
      const deletedDependency = await prisma.taskDependency.findUnique({
        where: { id: dependency.id },
      });

      expect(deletedDependency).toBeNull();
    });

    it('should return 404 for non-existent dependency', async () => {
      const response = await request(app)
        .delete('/api/dependencies/non-existent-id')
        .set(createAuthHeaders(token))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should require authentication', async () => {
      const task1 = await createTestTask(user.id);
      const task2 = await createTestTask(user.id);

      const dependency = await prisma.taskDependency.create({
        data: { taskId: task2.id, dependsOnTaskId: task1.id },
      });

      const response = await request(app)
        .delete(`/api/dependencies/${dependency.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/dependencies/validate-circular', () => {
    it('should detect circular dependency correctly', async () => {
      const task1 = await createTestTask(user.id, { title: 'Task 1' });
      const task2 = await createTestTask(user.id, { title: 'Task 2' });
      const task3 = await createTestTask(user.id, { title: 'Task 3' });

      // Create dependency chain: task1 -> task2 -> task3
      await prisma.taskDependency.create({
        data: { taskId: task2.id, dependsOnTaskId: task1.id },
      });
      await prisma.taskDependency.create({
        data: { taskId: task3.id, dependsOnTaskId: task2.id },
      });

      // Check if task1 -> task3 would create circular dependency
      const response = await request(app)
        .get('/api/dependencies/validate-circular')
        .query({
          taskId: task1.id,
          dependsOnTaskId: task3.id,
        })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          wouldCreateCircular: true,
        },
      });
    });

    it('should confirm valid dependency', async () => {
      const task1 = await createTestTask(user.id, { title: 'Task 1' });
      const task2 = await createTestTask(user.id, { title: 'Task 2' });

      const response = await request(app)
        .get('/api/dependencies/validate-circular')
        .query({
          taskId: task2.id,
          dependsOnTaskId: task1.id,
        })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          wouldCreateCircular: false,
        },
      });
    });
  });
});
import { TaskPriority, TaskStatus, TeamRole } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middlewares/error.middleware';
import taskRoutes from '../src/routes/task.routes';
import { createAuthHeaders, createTestTask, createTestTeam, createTestUser, generateAuthToken } from './helpers';
import { prisma } from './setup';

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

  describe('Task Status Management', () => {
    it('should update task status', async () => {
      const task = await createTestTask(user.id);

      const response = await request(app)
        .put(`/api/tasks/${task.id}/status`)
        .set(createAuthHeaders(token))
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(TaskStatus.IN_PROGRESS);

      // Verify status update in database
      const updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(updatedTask?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should track completion time when status changes to DONE', async () => {
      const task = await createTestTask(user.id);

      const response = await request(app)
        .put(`/api/tasks/${task.id}/status`)
        .set(createAuthHeaders(token))
        .send({ status: TaskStatus.DONE })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.completedAt).toBeDefined();

      // Verify completion time in database
      const updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(updatedTask?.completedAt).toBeDefined();
    });

    it('should validate status transitions', async () => {
      const task = await createTestTask(user.id);

      const response = await request(app)
        .put(`/api/tasks/${task.id}/status`)
        .set(createAuthHeaders(token))
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('Task Priority Management', () => {
    it('should update task priority', async () => {
      const task = await createTestTask(user.id, { priority: TaskPriority.LOW });

      const response = await request(app)
        .put(`/api/tasks/${task.id}/priority`)
        .set(createAuthHeaders(token))
        .send({ priority: TaskPriority.URGENT })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.priority).toBe(TaskPriority.URGENT);
    });

    it('should validate priority values', async () => {
      const task = await createTestTask(user.id);

      const response = await request(app)
        .put(`/api/tasks/${task.id}/priority`)
        .set(createAuthHeaders(token))
        .send({ priority: 'INVALID_PRIORITY' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Task Filtering and Searching', () => {
    beforeEach(async () => {
      // Create tasks with different attributes for filtering
      await createTestTask(user.id, {
        title: 'High Priority Task',
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO
      });
      await createTestTask(user.id, {
        title: 'Urgent Bug Fix',
        priority: TaskPriority.URGENT,
        status: TaskStatus.IN_PROGRESS
      });
      await createTestTask(user.id, {
        title: 'Low Priority Feature',
        priority: TaskPriority.LOW,
        status: TaskStatus.DONE
      });
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ status: TaskStatus.IN_PROGRESS })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Urgent Bug Fix');
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ priority: TaskPriority.URGENT })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].priority).toBe(TaskPriority.URGENT);
    });

    it('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/tasks/search')
        .query({ q: 'Bug' })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toContain('Bug');
    });

    it('should filter tasks by due date range', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      await createTestTask(user.id, {
        title: 'Future Task',
        dueDate: futureDate
      });

      const response = await request(app)
        .get('/api/tasks')
        .query({
          dueBefore: futureDate.toISOString(),
          dueAfter: new Date().toISOString()
        })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.some((task: any) => task.title === 'Future Task')).toBe(true);
    });
  });

  describe('Task Sorting', () => {
    beforeEach(async () => {
      // Create tasks with different creation times and priorities
      await createTestTask(user.id, {
        title: 'First Task',
        priority: TaskPriority.LOW
      });
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await createTestTask(user.id, {
        title: 'Second Task',
        priority: TaskPriority.HIGH
      });
    });

    it('should sort tasks by creation date', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].title).toBe('Second Task');
    });

    it('should sort tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ sortBy: 'priority', sortOrder: 'desc' })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].priority).toBe(TaskPriority.HIGH);
    });
  });

  describe('Team Task Management', () => {
    let teamMember: any;
    let otherTeam: any;

    beforeEach(async () => {
      teamMember = await createTestUser();
      await prisma.teamMember.create({
        data: {
          userId: teamMember.id,
          teamId: team.id,
          role: TeamRole.MEMBER,
        },
      });

      // Create another team for permission testing
      otherTeam = await createTestTeam(teamMember.id);
    });

    it('should allow team members to view team tasks', async () => {
      const teamTask = await createTestTask(user.id, { teamId: team.id });
      const memberToken = generateAuthToken(teamMember.id);

      const response = await request(app)
        .get(`/api/tasks/${teamTask.id}`)
        .set(createAuthHeaders(memberToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(teamTask.id);
    });

    it('should prevent non-team members from viewing team tasks', async () => {
      const teamTask = await createTestTask(user.id, { teamId: team.id });
      const outsider = await createTestUser();
      const outsiderToken = generateAuthToken(outsider.id);

      const response = await request(app)
        .get(`/api/tasks/${teamTask.id}`)
        .set(createAuthHeaders(outsiderToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow task creation within team', async () => {
      const memberToken = generateAuthToken(teamMember.id);

      const taskData = {
        title: 'Team Member Task',
        description: 'Task created by team member',
        teamId: team.id,
        assigneeIds: [teamMember.id],
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeaders(memberToken))
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teamId).toBe(team.id);
    });
  });

  describe('Task Validation and Error Handling', () => {
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

    it('should validate due date format', async () => {
      const taskData = {
        title: 'Test Task',
        dueDate: 'invalid-date-format',
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeaders(token))
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent assigning to non-existent users', async () => {
      const taskData = {
        title: 'Test Task',
        assigneeIds: ['non-existent-user-id'],
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeaders(token))
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very long task titles and descriptions', async () => {
      const longTitle = 'a'.repeat(1000);
      const longDescription = 'b'.repeat(5000);

      const taskData = {
        title: longTitle,
        description: longDescription,
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeaders(token))
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('Task Analytics and Reporting', () => {
    beforeEach(async () => {
      // Create tasks with different statuses for analytics
      await createTestTask(user.id, { status: TaskStatus.TODO });
      await createTestTask(user.id, { status: TaskStatus.IN_PROGRESS });
      await createTestTask(user.id, { status: TaskStatus.DONE });
      await createTestTask(user.id, { status: TaskStatus.DONE });
    });

    it('should get task statistics', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        total: 4,
        byStatus: {
          [TaskStatus.TODO]: 1,
          [TaskStatus.IN_PROGRESS]: 1,
          [TaskStatus.DONE]: 2,
        },
      });
    });

    it('should get overdue tasks', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      await createTestTask(user.id, {
        title: 'Overdue Task',
        dueDate: pastDate,
        status: TaskStatus.TODO
      });

      const response = await request(app)
        .get('/api/tasks/overdue')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Overdue Task');
    });
  });
});
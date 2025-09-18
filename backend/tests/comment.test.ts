import request from 'supertest';
import express from 'express';
import commentRoutes from '../src/routes/comment.routes';
import { errorHandler } from '../src/middlewares/error.middleware';
import { prisma } from './setup';
import { createTestUser, createTestTask, generateAuthToken, createAuthHeaders } from './helpers';

const app = express();
app.use(express.json());
app.use('/api/comments', commentRoutes);
app.use(errorHandler);

describe('Comment Management', () => {
  let user: any;
  let otherUser: any;
  let token: string;
  let otherToken: string;
  let task: any;

  beforeEach(async () => {
    user = await createTestUser();
    otherUser = await createTestUser({ email: 'other@example.com' });
    token = generateAuthToken(user.id);
    otherToken = generateAuthToken(otherUser.id);
    task = await createTestTask(user.id);
  });

  describe('POST /api/comments', () => {
    it('should create a comment successfully', async () => {
      const commentData = {
        content: 'This is a test comment',
        taskId: task.id,
      };

      const response = await request(app)
        .post('/api/comments')
        .set(createAuthHeaders(token))
        .send(commentData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          content: commentData.content,
          taskId: task.id,
          authorId: user.id,
        },
      });

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidCommentData = {
        taskId: task.id,
        // Missing content
      };

      const response = await request(app)
        .post('/api/comments')
        .set(createAuthHeaders(token))
        .send(invalidCommentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should validate task exists', async () => {
      const commentData = {
        content: 'This is a test comment',
        taskId: 'non-existent-task-id',
      };

      const response = await request(app)
        .post('/api/comments')
        .set(createAuthHeaders(token))
        .send(commentData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should require authentication', async () => {
      const commentData = {
        content: 'This is a test comment',
        taskId: task.id,
      };

      const response = await request(app)
        .post('/api/comments')
        .send(commentData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/comments/task/:taskId', () => {
    it('should get task comments successfully', async () => {
      // Create test comments
      const comment1 = await prisma.comment.create({
        data: {
          content: 'First comment',
          taskId: task.id,
          authorId: user.id,
        },
      });

      const comment2 = await prisma.comment.create({
        data: {
          content: 'Second comment',
          taskId: task.id,
          authorId: otherUser.id,
        },
      });

      const response = await request(app)
        .get(`/api/comments/task/${task.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      expect(response.body.data).toHaveLength(2);
      
      // Check comments include author information
      const comments = response.body.data;
      expect(comments[0].author).toBeDefined();
      expect(comments[0].author.firstName).toBeDefined();
      expect(comments[0].author.password).toBeUndefined();
    });

    it('should return empty array for task with no comments', async () => {
      const newTask = await createTestTask(user.id, { title: 'No Comments Task' });

      const response = await request(app)
        .get(`/api/comments/task/${newTask.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
      });
    });

    it('should support pagination', async () => {
      // Create multiple comments
      for (let i = 1; i <= 15; i++) {
        await prisma.comment.create({
          data: {
            content: `Comment ${i}`,
            taskId: task.id,
            authorId: user.id,
          },
        });
      }

      const response = await request(app)
        .get(`/api/comments/task/${task.id}?page=1&limit=10`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.data).toHaveLength(10);
    });

    it('should order comments by creation date (newest first)', async () => {
      // Create comments with delays to ensure different timestamps
      const comment1 = await prisma.comment.create({
        data: {
          content: 'First comment',
          taskId: task.id,
          authorId: user.id,
        },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const comment2 = await prisma.comment.create({
        data: {
          content: 'Second comment',
          taskId: task.id,
          authorId: user.id,
        },
      });

      const response = await request(app)
        .get(`/api/comments/task/${task.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      const comments = response.body.data;
      expect(new Date(comments[0].createdAt).getTime())
        .toBeGreaterThan(new Date(comments[1].createdAt).getTime());
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('should update comment successfully', async () => {
      const comment = await prisma.comment.create({
        data: {
          content: 'Original content',
          taskId: task.id,
          authorId: user.id,
        },
      });

      const updateData = {
        content: 'Updated content',
      };

      const response = await request(app)
        .put(`/api/comments/${comment.id}`)
        .set(createAuthHeaders(token))
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: comment.id,
          content: updateData.content,
          updatedAt: expect.any(String),
        },
      });

      // Verify update in database
      const updatedComment = await prisma.comment.findUnique({
        where: { id: comment.id },
      });

      expect(updatedComment?.content).toBe(updateData.content);
      expect(updatedComment?.updatedAt.getTime()).toBeGreaterThan(comment.createdAt.getTime());
    });

    it('should deny access to non-author', async () => {
      const comment = await prisma.comment.create({
        data: {
          content: 'Original content',
          taskId: task.id,
          authorId: user.id,
        },
      });

      const updateData = {
        content: 'Hacked content',
      };

      const response = await request(app)
        .put(`/api/comments/${comment.id}`)
        .set(createAuthHeaders(otherToken))
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });

    it('should validate updated content', async () => {
      const comment = await prisma.comment.create({
        data: {
          content: 'Original content',
          taskId: task.id,
          authorId: user.id,
        },
      });

      const invalidData = {
        content: '', // Empty content
      };

      const response = await request(app)
        .put(`/api/comments/${comment.id}`)
        .set(createAuthHeaders(token))
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should return 404 for non-existent comment', async () => {
      const updateData = {
        content: 'Updated content',
      };

      const response = await request(app)
        .put('/api/comments/non-existent-id')
        .set(createAuthHeaders(token))
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('should delete comment successfully', async () => {
      const comment = await prisma.comment.create({
        data: {
          content: 'Comment to delete',
          taskId: task.id,
          authorId: user.id,
        },
      });

      const response = await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Comment deleted successfully',
      });

      // Verify deletion in database
      const deletedComment = await prisma.comment.findUnique({
        where: { id: comment.id },
      });

      expect(deletedComment).toBeNull();
    });

    it('should deny access to non-author', async () => {
      const comment = await prisma.comment.create({
        data: {
          content: 'Comment to delete',
          taskId: task.id,
          authorId: user.id,
        },
      });

      const response = await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set(createAuthHeaders(otherToken))
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');

      // Verify comment still exists
      const existingComment = await prisma.comment.findUnique({
        where: { id: comment.id },
      });

      expect(existingComment).toBeTruthy();
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .delete('/api/comments/non-existent-id')
        .set(createAuthHeaders(token))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should require authentication', async () => {
      const comment = await prisma.comment.create({
        data: {
          content: 'Comment to delete',
          taskId: task.id,
          authorId: user.id,
        },
      });

      const response = await request(app)
        .delete(`/api/comments/${comment.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
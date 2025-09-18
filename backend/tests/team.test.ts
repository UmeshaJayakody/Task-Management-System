import request from 'supertest';
import express from 'express';
import { TeamRole } from '@prisma/client';
import teamRoutes from '../src/routes/team.routes';
import { errorHandler } from '../src/middlewares/error.middleware';
import { prisma } from './setup';
import { createTestUser, createTestTeam, generateAuthToken, createAuthHeaders } from './helpers';

const app = express();
app.use(express.json());
app.use('/api/teams', teamRoutes);
app.use(errorHandler);

describe('Team Management', () => {
  let user: any;
  let token: string;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateAuthToken(user.id);
  });

  describe('POST /api/teams', () => {
    it('should create a new team successfully', async () => {
      const teamData = {
        name: 'Test Team',
        description: 'Test team description',
      };

      const response = await request(app)
        .post('/api/teams')
        .set(createAuthHeaders(token))
        .send(teamData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          name: teamData.name,
          description: teamData.description,
        },
      });

      expect(response.body.data.id).toBeDefined();

      // Verify creator is team owner
      const membership = await prisma.teamMember.findFirst({
        where: { teamId: response.body.data.id, userId: user.id },
      });

      expect(membership?.role).toBe(TeamRole.OWNER);
    });

    it('should validate required fields', async () => {
      const invalidTeamData = {
        description: 'Missing name',
      };

      const response = await request(app)
        .post('/api/teams')
        .set(createAuthHeaders(token))
        .send(invalidTeamData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should require authentication', async () => {
      const teamData = {
        name: 'Test Team',
        description: 'Test team description',
      };

      const response = await request(app)
        .post('/api/teams')
        .send(teamData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/teams', () => {
    it('should get user teams', async () => {
      const team1 = await createTestTeam(user.id, { name: 'Team 1' });
      const team2 = await createTestTeam(user.id, { name: 'Team 2' });

      const response = await request(app)
        .get('/api/teams')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((t: any) => t.name)).toContain('Team 1');
      expect(response.body.data.map((t: any) => t.name)).toContain('Team 2');
    });

    it('should return empty array for user with no teams', async () => {
      const response = await request(app)
        .get('/api/teams')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
      });
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should get team by id with members', async () => {
      const team = await createTestTeam(user.id);

      const response = await request(app)
        .get(`/api/teams/${team.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: team.id,
          name: team.name,
          description: team.description,
          members: expect.any(Array),
        },
      });

      expect(response.body.data.members).toHaveLength(1);
      expect(response.body.data.members[0].role).toBe(TeamRole.OWNER);
    });

    it('should return 404 for non-existent team', async () => {
      const response = await request(app)
        .get('/api/teams/non-existent-id')
        .set(createAuthHeaders(token))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should deny access to non-member', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const team = await createTestTeam(otherUser.id);

      const response = await request(app)
        .get(`/api/teams/${team.id}`)
        .set(createAuthHeaders(token))
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update team successfully', async () => {
      const team = await createTestTeam(user.id);
      const updateData = {
        name: 'Updated Team Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/teams/${team.id}`)
        .set(createAuthHeaders(token))
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: team.id,
          ...updateData,
        },
      });

      // Verify update in database
      const updatedTeam = await prisma.team.findUnique({
        where: { id: team.id },
      });

      expect(updatedTeam).toMatchObject(updateData);
    });

    it('should deny access to non-owner', async () => {
      const owner = await createTestUser({ email: 'owner@example.com' });
      const team = await createTestTeam(owner.id);

      // Add current user as member (not owner)
      await prisma.teamMember.create({
        data: {
          userId: user.id,
          teamId: team.id,
          role: TeamRole.MEMBER,
        },
      });

      const updateData = {
        name: 'Updated Team Name',
      };

      const response = await request(app)
        .put(`/api/teams/${team.id}`)
        .set(createAuthHeaders(token))
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should delete team successfully', async () => {
      const team = await createTestTeam(user.id);

      const response = await request(app)
        .delete(`/api/teams/${team.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Team deleted successfully',
      });

      // Verify deletion in database
      const deletedTeam = await prisma.team.findUnique({
        where: { id: team.id },
      });

      expect(deletedTeam).toBeNull();
    });

    it('should deny access to non-owner', async () => {
      const owner = await createTestUser({ email: 'owner@example.com' });
      const team = await createTestTeam(owner.id);

      // Add current user as member (not owner)
      await prisma.teamMember.create({
        data: {
          userId: user.id,
          teamId: team.id,
          role: TeamRole.MEMBER,
        },
      });

      const response = await request(app)
        .delete(`/api/teams/${team.id}`)
        .set(createAuthHeaders(token))
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('POST /api/teams/:id/members', () => {
    it('should add member to team successfully', async () => {
      const team = await createTestTeam(user.id);
      const newMember = await createTestUser({ email: 'member@example.com' });

      const response = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set(createAuthHeaders(token))
        .send({ userId: newMember.id, role: TeamRole.MEMBER })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify membership in database
      const membership = await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: newMember.id },
      });

      expect(membership).toBeTruthy();
      expect(membership?.role).toBe(TeamRole.MEMBER);
    });

    it('should prevent duplicate membership', async () => {
      const team = await createTestTeam(user.id);

      const response = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set(createAuthHeaders(token))
        .send({ userId: user.id, role: TeamRole.MEMBER })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already a member');
    });

    it('should deny access to non-admin', async () => {
      const owner = await createTestUser({ email: 'owner@example.com' });
      const team = await createTestTeam(owner.id);
      const newMember = await createTestUser({ email: 'member@example.com' });

      // Add current user as member (not admin)
      await prisma.teamMember.create({
        data: {
          userId: user.id,
          teamId: team.id,
          role: TeamRole.MEMBER,
        },
      });

      const response = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set(createAuthHeaders(token))
        .send({ userId: newMember.id, role: TeamRole.MEMBER })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('PUT /api/teams/:id/members/:userId', () => {
    it('should update member role successfully', async () => {
      const team = await createTestTeam(user.id);
      const member = await createTestUser({ email: 'member@example.com' });

      // Add member to team
      await prisma.teamMember.create({
        data: {
          userId: member.id,
          teamId: team.id,
          role: TeamRole.MEMBER,
        },
      });

      const response = await request(app)
        .put(`/api/teams/${team.id}/members/${member.id}`)
        .set(createAuthHeaders(token))
        .send({ role: TeamRole.ADMIN })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify role update in database
      const membership = await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: member.id },
      });

      expect(membership?.role).toBe(TeamRole.ADMIN);
    });
  });

  describe('DELETE /api/teams/:id/members/:userId', () => {
    it('should remove member from team successfully', async () => {
      const team = await createTestTeam(user.id);
      const member = await createTestUser({ email: 'member@example.com' });

      // Add member to team
      await prisma.teamMember.create({
        data: {
          userId: member.id,
          teamId: team.id,
          role: TeamRole.MEMBER,
        },
      });

      const response = await request(app)
        .delete(`/api/teams/${team.id}/members/${member.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify removal in database
      const membership = await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: member.id },
      });

      expect(membership).toBeNull();
    });

    it('should prevent owner from removing themselves', async () => {
      const team = await createTestTeam(user.id);

      const response = await request(app)
        .delete(`/api/teams/${team.id}/members/${user.id}`)
        .set(createAuthHeaders(token))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot remove owner');
    });
  });
});
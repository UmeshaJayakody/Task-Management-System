import { TeamRole } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middlewares/error.middleware';
import teamRoutes from '../src/routes/team.routes';
import { createAuthHeaders, createTestTeam, createTestUser, generateAuthToken } from './helpers';
import { prisma } from './setup';

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

  describe('Team Permissions and Authorization', () => {
    let team: any;
    let admin: any;
    let member: any;
    let outsider: any;
    let adminToken: string;
    let memberToken: string;
    let outsiderToken: string;

    beforeEach(async () => {
      team = await createTestTeam(user.id);
      admin = await createTestUser({ email: 'admin@example.com' });
      member = await createTestUser({ email: 'member@example.com' });
      outsider = await createTestUser({ email: 'outsider@example.com' });

      adminToken = generateAuthToken(admin.id);
      memberToken = generateAuthToken(member.id);
      outsiderToken = generateAuthToken(outsider.id);

      // Add admin and member to team
      await prisma.teamMember.create({
        data: { userId: admin.id, teamId: team.id, role: TeamRole.ADMIN },
      });
      await prisma.teamMember.create({
        data: { userId: member.id, teamId: team.id, role: TeamRole.MEMBER },
      });
    });

    it('should allow owners to add members', async () => {
      const newMember = await createTestUser({ email: 'newmember@example.com' });

      const response = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set(createAuthHeaders(token))
        .send({ userId: newMember.id, role: TeamRole.MEMBER })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow admins to add members', async () => {
      const newMember = await createTestUser({ email: 'newmember2@example.com' });

      const response = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set(createAuthHeaders(adminToken))
        .send({ userId: newMember.id, role: TeamRole.MEMBER })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should prevent members from adding other members', async () => {
      const newMember = await createTestUser({ email: 'newmember3@example.com' });

      const response = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set(createAuthHeaders(memberToken))
        .send({ userId: newMember.id, role: TeamRole.MEMBER })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should prevent outsiders from accessing team', async () => {
      const response = await request(app)
        .get(`/api/teams/${team.id}`)
        .set(createAuthHeaders(outsiderToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow members to view team details', async () => {
      const response = await request(app)
        .get(`/api/teams/${team.id}`)
        .set(createAuthHeaders(memberToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(team.id);
    });

    it('should prevent members from updating team settings', async () => {
      const response = await request(app)
        .put(`/api/teams/${team.id}`)
        .set(createAuthHeaders(memberToken))
        .send({ name: 'Updated Team Name' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admins to update team settings', async () => {
      const response = await request(app)
        .put(`/api/teams/${team.id}`)
        .set(createAuthHeaders(adminToken))
        .send({ name: 'Updated by Admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated by Admin');
    });
  });

  describe('Team Role Management', () => {
    let team: any;
    let member: any;

    beforeEach(async () => {
      team = await createTestTeam(user.id);
      member = await createTestUser({ email: 'roletest@example.com' });

      await prisma.teamMember.create({
        data: { userId: member.id, teamId: team.id, role: TeamRole.MEMBER },
      });
    });

    it('should promote member to admin', async () => {
      const response = await request(app)
        .put(`/api/teams/${team.id}/members/${member.id}/role`)
        .set(createAuthHeaders(token))
        .send({ role: TeamRole.ADMIN })
        .expect(200);

      expect(response.body.success).toBe(true);

      const membership = await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: member.id },
      });

      expect(membership?.role).toBe(TeamRole.ADMIN);
    });

    it('should demote admin to member', async () => {
      // First promote to admin
      await prisma.teamMember.update({
        where: { userId_teamId: { userId: member.id, teamId: team.id } },
        data: { role: TeamRole.ADMIN },
      });

      const response = await request(app)
        .put(`/api/teams/${team.id}/members/${member.id}/role`)
        .set(createAuthHeaders(token))
        .send({ role: TeamRole.MEMBER })
        .expect(200);

      expect(response.body.success).toBe(true);

      const membership = await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: member.id },
      });

      expect(membership?.role).toBe(TeamRole.MEMBER);
    });

    it('should prevent changing owner role', async () => {
      const response = await request(app)
        .put(`/api/teams/${team.id}/members/${user.id}/role`)
        .set(createAuthHeaders(token))
        .send({ role: TeamRole.MEMBER })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('owner');
    });

    it('should validate role values', async () => {
      const response = await request(app)
        .put(`/api/teams/${team.id}/members/${member.id}/role`)
        .set(createAuthHeaders(token))
        .send({ role: 'INVALID_ROLE' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Team Statistics and Analytics', () => {
    let team: any;

    beforeEach(async () => {
      team = await createTestTeam(user.id);

      // Add multiple members
      for (let i = 0; i < 3; i++) {
        const member = await createTestUser({ email: `member${i}@example.com` });
        await prisma.teamMember.create({
          data: { userId: member.id, teamId: team.id, role: TeamRole.MEMBER },
        });
      }

      // Add an admin
      const admin = await createTestUser({ email: 'admin@example.com' });
      await prisma.teamMember.create({
        data: { userId: admin.id, teamId: team.id, role: TeamRole.ADMIN },
      });
    });

    it('should get team statistics', async () => {
      const response = await request(app)
        .get(`/api/teams/${team.id}/stats`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        memberCount: 5, // owner + 3 members + 1 admin
        roleDistribution: {
          [TeamRole.OWNER]: 1,
          [TeamRole.ADMIN]: 1,
          [TeamRole.MEMBER]: 3,
        },
      });
    });

    it('should get team activity summary', async () => {
      // Create some team tasks first
      await prisma.task.create({
        data: {
          title: 'Team Task 1',
          createdById: user.id,
          teamId: team.id,
        },
      });

      const response = await request(app)
        .get(`/api/teams/${team.id}/activity`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.taskCount).toBe(1);
    });
  });

  describe('Team Search and Discovery', () => {
    beforeEach(async () => {
      await createTestTeam(user.id, {
        name: 'Engineering Team',
        description: 'Software development team'
      });
      await createTestTeam(user.id, {
        name: 'Marketing Team',
        description: 'Product marketing and promotion'
      });
      await createTestTeam(user.id, {
        name: 'Sales Engineering',
        description: 'Technical sales support'
      });
    });

    it('should search teams by name', async () => {
      const response = await request(app)
        .get('/api/teams/search')
        .query({ q: 'Engineering' })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every((team: any) =>
        team.name.includes('Engineering')
      )).toBe(true);
    });

    it('should search teams by description', async () => {
      const response = await request(app)
        .get('/api/teams/search')
        .query({ q: 'marketing' })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Marketing Team');
    });
  });

  describe('Team Deletion and Cleanup', () => {
    it('should delete team and clean up related data', async () => {
      const team = await createTestTeam(user.id);

      // Create some team data
      const task = await prisma.task.create({
        data: {
          title: 'Team Task',
          createdById: user.id,
          teamId: team.id,
        },
      });

      const response = await request(app)
        .delete(`/api/teams/${team.id}`)
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify team is deleted
      const deletedTeam = await prisma.team.findUnique({
        where: { id: team.id },
      });
      expect(deletedTeam).toBeNull();

      // Verify team members are cleaned up
      const members = await prisma.teamMember.findMany({
        where: { teamId: team.id },
      });
      expect(members).toHaveLength(0);

      // Verify tasks are handled appropriately (likely set teamId to null)
      const orphanedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(orphanedTask?.teamId).toBeNull();
    });

    it('should only allow owner to delete team', async () => {
      const team = await createTestTeam(user.id);
      const member = await createTestUser({ email: 'member@example.com' });
      const memberToken = generateAuthToken(member.id);

      await prisma.teamMember.create({
        data: { userId: member.id, teamId: team.id, role: TeamRole.ADMIN },
      });

      const response = await request(app)
        .delete(`/api/teams/${team.id}`)
        .set(createAuthHeaders(memberToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle team name conflicts', async () => {
      const teamName = 'Duplicate Team Name';

      await createTestTeam(user.id, { name: teamName });

      const response = await request(app)
        .post('/api/teams')
        .set(createAuthHeaders(token))
        .send({ name: teamName, description: 'Another team' })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should handle adding non-existent user to team', async () => {
      const team = await createTestTeam(user.id);

      const response = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set(createAuthHeaders(token))
        .send({ userId: 'non-existent-id', role: TeamRole.MEMBER })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should handle adding already existing member', async () => {
      const team = await createTestTeam(user.id);
      const member = await createTestUser({ email: 'existing@example.com' });

      // Add member first time
      await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set(createAuthHeaders(token))
        .send({ userId: member.id, role: TeamRole.MEMBER })
        .expect(200);

      // Try to add same member again
      const response = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set(createAuthHeaders(token))
        .send({ userId: member.id, role: TeamRole.MEMBER })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already a member');
    });

    it('should validate team name length', async () => {
      const longName = 'a'.repeat(256);

      const response = await request(app)
        .post('/api/teams')
        .set(createAuthHeaders(token))
        .send({ name: longName, description: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });
});
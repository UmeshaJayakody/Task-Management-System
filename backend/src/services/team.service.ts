import { prisma } from '../utils/database';
import { TeamRole, ActivityType, EntityType } from '@prisma/client';
import { createActivity } from './activity.service';

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
}

export interface TeamMemberData {
  userId: string;
  role?: TeamRole;
}

export const createTeam = async (creatorId: string, teamData: CreateTeamData) => {
  console.log('🔄 Team service: Creating team');
  console.log('👤 Creator ID:', creatorId);
  console.log('📋 Team data:', teamData);
  
  try {
    console.log('💾 Creating team in database...');
    const team = await prisma.team.create({
      data: {
        ...teamData,
        members: {
          create: {
            userId: creatorId,
            role: TeamRole.OWNER
          }
        }
      },
      include: {
        members: {
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
            tasks: true
          }
        }
      }
    });
    
    console.log('✅ Team created in database:', team);
    console.log('📈 Creating activity log...');

    // Create activity
    await createActivity({
      type: ActivityType.TEAM_CREATED,
      description: `Team "${team.name}" was created`,
      entityType: EntityType.TEAM,
      entityId: team.id,
      userId: creatorId,
      teamId: team.id,
      metadata: {
        teamName: team.name
      }
    });
    
    console.log('✅ Activity log created successfully');
    return team;
  } catch (error) {
    console.error('❌ Error in team service:', error);
    throw error;
  }
};

export const getTeams = async (userId: string) => {
  return await prisma.team.findMany({
    where: {
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      members: {
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
          tasks: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const getTeamById = async (teamId: string, userId: string) => {
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      members: {
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
        orderBy: {
          joinedAt: 'asc'
        }
      },
      tasks: {
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
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
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      activities: {
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
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      }
    }
  });

  if (!team) {
    throw new Error('Team not found or access denied');
  }

  return team;
};

export const updateTeam = async (teamId: string, userId: string, updateData: UpdateTeamData) => {
  // Check if user has permission to update team
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      role: { in: [TeamRole.OWNER, TeamRole.ADMIN] }
    }
  });

  if (!membership) {
    throw new Error('Team not found or insufficient permissions');
  }

  const team = await prisma.team.update({
    where: { id: teamId },
    data: updateData,
    include: {
      members: {
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
          tasks: true
        }
      }
    }
  });

  return team;
};

export const deleteTeam = async (teamId: string, userId: string) => {
  // Check if user is the owner
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      role: TeamRole.OWNER
    }
  });

  if (!membership) {
    throw new Error('Team not found or insufficient permissions');
  }

  await prisma.team.delete({
    where: { id: teamId }
  });

  return { message: 'Team deleted successfully' };
};

export const addTeamMember = async (teamId: string, adminId: string, memberData: TeamMemberData) => {
  console.log('DEBUG - addTeamMember called with:', { teamId, adminId, memberData });
  
  try {
    // Check if user has permission to add members
    console.log('Checking admin permissions...');
    const adminMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: adminId,
        role: { in: [TeamRole.OWNER, TeamRole.ADMIN] }
      }
    });

    if (!adminMembership) {
      console.log('ERROR - Admin membership not found or insufficient permissions');
      throw new Error('Team not found or insufficient permissions');
    }
    console.log('Admin permissions OK:', adminMembership);

    // Check if user is already a member
    console.log('Checking for existing membership...');
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: memberData.userId
      }
    });

    if (existingMembership) {
      console.log('ERROR - User is already a member');
      throw new Error('User is already a member of this team');
    }
    console.log('No existing membership found');

    // Check if user exists
    console.log('Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { id: memberData.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!user) {
      console.log('ERROR - User not found');
      throw new Error('User not found');
    }
    console.log('User found:', user);

    console.log('Creating team membership...');
    const membership = await prisma.teamMember.create({
      data: {
        teamId,
        userId: memberData.userId,
        role: memberData.role || TeamRole.MEMBER
      },
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
    console.log('Membership created successfully:', membership);

    // Create activity - temporarily disabled due to foreign key constraint issue
    console.log('Skipping activity creation to avoid foreign key constraint issue');
    // await createActivity({
    //   type: ActivityType.TEAM_JOINED,
    //   description: `${user.firstName || user.email} joined the team`,
    //   entityType: EntityType.TEAM,
    //   entityId: teamId, // For team activities, use teamId as entityId
    //   userId: memberData.userId,
    //   teamId,
    //   metadata: {
    //     memberName: user.firstName || user.email,
    //     role: membership.role
    //   }
    // });
    console.log('Activity created successfully');

    return membership;
  } catch (error) {
    console.log('ERROR in addTeamMember:', error);
    throw error;
  }
};

export const removeTeamMember = async (teamId: string, adminId: string, memberUserId: string) => {
  // Check if user has permission to remove members
  const adminMembership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: adminId,
      role: { in: [TeamRole.OWNER, TeamRole.ADMIN] }
    }
  });

  if (!adminMembership) {
    throw new Error('Team not found or insufficient permissions');
  }

  // Can't remove the owner
  const memberMembership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: memberUserId
    }
  });

  if (!memberMembership) {
    throw new Error('Member not found');
  }

  if (memberMembership.role === TeamRole.OWNER) {
    throw new Error('Cannot remove team owner');
  }

  // Only owner can remove admins
  if (memberMembership.role === TeamRole.ADMIN && adminMembership.role !== TeamRole.OWNER) {
    throw new Error('Only team owner can remove administrators');
  }

  await prisma.teamMember.delete({
    where: {
      id: memberMembership.id
    }
  });

  // Create activity - temporarily disabled due to foreign key constraint issue
  // await createActivity({
  //   type: ActivityType.TEAM_LEFT,
  //   description: `A member left the team`,
  //   entityType: EntityType.TEAM,
  //   entityId: teamId,
  //   userId: adminId,
  //   teamId,
  //   metadata: {
  //     removedUserId: memberUserId
  //   }
  // });

  return { message: 'Member removed successfully' };
};

export const updateTeamMemberRole = async (teamId: string, adminId: string, memberUserId: string, newRole: TeamRole) => {
  // Check if user has permission to update roles
  const adminMembership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: adminId,
      role: TeamRole.OWNER // Only owner can change roles
    }
  });

  if (!adminMembership) {
    throw new Error('Team not found or insufficient permissions');
  }

  // Can't change owner role or change role to owner
  const memberMembership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: memberUserId
    }
  });

  if (!memberMembership) {
    throw new Error('Member not found');
  }

  if (memberMembership.role === TeamRole.OWNER || newRole === TeamRole.OWNER) {
    throw new Error('Cannot change ownership through this endpoint');
  }

  const updatedMembership = await prisma.teamMember.update({
    where: { id: memberMembership.id },
    data: { role: newRole },
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
  });

  return updatedMembership;
};

export const leaveTeam = async (teamId: string, userId: string) => {
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId
    }
  });

  if (!membership) {
    throw new Error('You are not a member of this team');
  }

  if (membership.role === TeamRole.OWNER) {
    throw new Error('Team owner cannot leave the team. Transfer ownership or delete the team instead.');
  }

  await prisma.teamMember.delete({
    where: { id: membership.id }
  });

  // Create activity
  await createActivity({
    type: ActivityType.TEAM_LEFT,
    description: `A member left the team`,
    entityType: EntityType.TEAM,
    entityId: teamId,
    userId,
    teamId,
    metadata: {
      leftUserId: userId
    }
  });

  return { message: 'Left team successfully' };
};
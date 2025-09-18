import { Request, Response, NextFunction } from 'express';
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  leaveTeam
} from '../services/team.service';
import { TeamRole } from '@prisma/client';

export const createTeamController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔄 Team creation request received');
    console.log('👤 User ID:', (req as any).user.id);
    console.log('📋 Request body:', req.body);
    
    const userId = (req as any).user.id;
    console.log('📤 Calling team service...');
    const team = await createTeam(userId, req.body);
    console.log('✅ Team created successfully:', team);
    
    res.status(201).json({ message: 'Team created successfully', team });
  } catch (error) {
    console.error('❌ Error in team controller:', error);
    next(error);
  }
};

export const getTeamsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const teams = await getTeams(userId);
    res.status(200).json({ teams });
  } catch (error) {
    next(error);
  }
};

export const getTeamByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { teamId } = req.params;
    
    if (!teamId) {
      res.status(400).json({ message: 'Team ID is required' });
      return;
    }

    const team = await getTeamById(teamId, userId);
    res.status(200).json({ team });
  } catch (error) {
    next(error);
  }
};

export const updateTeamController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { teamId } = req.params;
    
    if (!teamId) {
      res.status(400).json({ message: 'Team ID is required' });
      return;
    }

    const team = await updateTeam(teamId, userId, req.body);
    res.status(200).json({ message: 'Team updated successfully', team });
  } catch (error) {
    next(error);
  }
};

export const deleteTeamController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { teamId } = req.params;
    
    if (!teamId) {
      res.status(400).json({ message: 'Team ID is required' });
      return;
    }

    const result = await deleteTeam(teamId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const addTeamMemberController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { teamId } = req.params;
    const { userId: memberUserId, role } = req.body;
    
    console.log('DEBUG - Add Team Member Request:');
    console.log('- teamId:', teamId);
    console.log('- requester userId:', userId);
    console.log('- request body:', req.body);
    console.log('- memberUserId:', memberUserId);
    console.log('- role:', role);
    
    if (!teamId) {
      console.log('ERROR - Team ID is missing');
      res.status(400).json({ message: 'Team ID is required' });
      return;
    }

    if (!memberUserId) {
      console.log('ERROR - Member User ID is missing');
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    try {
      const membership = await addTeamMember(teamId, userId, { userId: memberUserId, role });
      console.log('SUCCESS - Member added:', membership);
      res.status(201).json({ 
        success: true,
        message: 'Member added successfully', 
        membership 
      });
    } catch (serviceError: any) {
      console.log('Service Error:', serviceError.message);
      if (serviceError.message.includes('already a member')) {
        res.status(409).json({ 
          success: false,
          message: 'User is already a member of this team' 
        });
        return;
      }
      if (serviceError.message.includes('not found')) {
        res.status(404).json({ 
          success: false,
          message: serviceError.message 
        });
        return;
      }
      if (serviceError.message.includes('insufficient permissions')) {
        res.status(403).json({ 
          success: false,
          message: 'You do not have permission to add members to this team' 
        });
        return;
      }
      throw serviceError; // Re-throw unexpected errors
    }
  } catch (error) {
    console.log('ERROR in addTeamMemberController:', error);
    next(error);
  }
};

export const removeTeamMemberController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { teamId, memberId } = req.params;
    
    if (!teamId || !memberId) {
      res.status(400).json({ message: 'Team ID and Member ID are required' });
      return;
    }

    const result = await removeTeamMember(teamId, userId, memberId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateTeamMemberRoleController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { teamId, memberId } = req.params;
    const { role } = req.body;
    
    if (!teamId || !memberId) {
      res.status(400).json({ message: 'Team ID and Member ID are required' });
      return;
    }

    if (!role || !Object.values(TeamRole).includes(role)) {
      res.status(400).json({ message: 'Valid role is required' });
      return;
    }

    const membership = await updateTeamMemberRole(teamId, userId, memberId, role);
    res.status(200).json({ message: 'Role updated successfully', membership });
  } catch (error) {
    next(error);
  }
};

export const leaveTeamController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { teamId } = req.params;
    
    if (!teamId) {
      res.status(400).json({ message: 'Team ID is required' });
      return;
    }

    const result = await leaveTeam(teamId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
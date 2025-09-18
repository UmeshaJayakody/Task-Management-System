import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activities: Activity[];
}

interface Activity {
  id: string;
  type: string;
  description: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
    status: string;
  };
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io('http://localhost:3000', {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        
        // Request initial activities
        newSocket.emit('request-activities', { limit: 50 });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('activities', (data: Activity[]) => {
        setActivities(data);
      });

      newSocket.on('new-activity', (activity: Activity) => {
        setActivities(prev => [activity, ...prev.slice(0, 49)]);
      });

      newSocket.on('task-updated', (task: any) => {
        // Handle task updates in real-time
        console.log('Task updated:', task);
        // You can dispatch events here to update task lists
      });

      newSocket.on('team-updated', (team: any) => {
        // Handle team updates in real-time
        console.log('Team updated:', team);
      });

      newSocket.on('comment-added', (comment: any) => {
        // Handle new comments in real-time
        console.log('Comment added:', comment);
      });

      newSocket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setActivities([]);
      }
    }
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, activities }}>
      {children}
    </SocketContext.Provider>
  );
};
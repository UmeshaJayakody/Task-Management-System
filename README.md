# Task Management System

A comprehensive full-stack task management application built with modern web technologies. This system supports user authentication, team collaboration, task management with dependencies, real-time updates, and comprehensive testing infrastructure.

## Features

### Core Functionality
- **User Management**: Complete user registration, authentication, and profile management
- **Task Management**: Create, update, delete, and assign tasks with status tracking
- **Team Collaboration**: Create teams, manage members, and assign roles
- **Task Dependencies**: Create and manage task dependencies with circular dependency prevention
- **Real-time Updates**: WebSocket integration for live updates across the application
- **Comment System**: Add comments to tasks for better collaboration
- **Activity Tracking**: Comprehensive activity logging for all user actions

### Advanced Features
- **Priority Management**: Set task priorities (Low, Medium, High, Urgent)
- **Status Tracking**: Track task progress (To Do, In Progress, In Review, Done, Cancelled)
- **Due Date Management**: Set and track task deadlines
- **Team Roles**: Support for Owner, Admin, and Member roles with appropriate permissions
- **Search and Filtering**: Advanced filtering and search capabilities
- **Analytics Dashboard**: Task statistics and progress tracking
- **Gantt Chart View**: Visual project timeline representation

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Joi schema validation
- **Real-time**: Socket.IO for WebSocket communication

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for modern, responsive design
- **Routing**: React Router DOM for client-side routing
- **HTTP Client**: Axios for API communication
- **Forms**: React Hook Form with Zod validation
- **Real-time**: Socket.IO client for live updates
- **Icons**: Lucide React for consistent iconography
- **Notifications**: React Hot Toast for user feedback

### Development Tools
- **Type Safety**: Full TypeScript implementation
- **Code Quality**: ESLint for code linting
- **Database Migrations**: Prisma for database schema management
- **Environment Management**: dotenv for configuration
- **Development**: Nodemon for auto-restart during development

## Project Structure

```
Task Management System/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── assets/          # Static assets
│   │   ├── components/      # Reusable React components
│   │   │   └── ui/          # UI component library
│   │   ├── contexts/        # React context providers
│   │   ├── pages/           # Page components
│   │   └── styles/          # CSS stylesheets
│   ├── public/              # Public assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── eslint.config.js
├── backend/                  # Node.js backend application
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middlewares/     # Express middlewares
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── validators/      # Request validation schemas
│   ├              
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma    # Database schema definition
│   │   └── migrations/      # Database migration files
│   ├── dist/                # Compiled JavaScript (generated)
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
└── README.md
```

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (version 18.0.0 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** (version 12.0 or higher)
- **Git** (for version control)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Task Management System"
```

### 2. Database Setup

Create a PostgreSQL database for the application:

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE taskmanagement;
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables in .env
DATABASE_URL="postgresql://username:password@localhost:5432/taskmanagement"
JWT_SECRET="your-super-secret-jwt-key"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Build TypeScript
npm run build
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Build the project
npm run build
```

## Running the Application

### Development Mode

Start both backend and frontend in development mode for the best development experience:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend server will start on: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend application will start on: `http://localhost:5173`

### Production Mode

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## API Documentation

The backend provides a comprehensive REST API with the following endpoints:

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password

### Task Management
- `GET /api/tasks` - Get all tasks (with filtering)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assign` - Assign user to task
- `DELETE /api/tasks/:id/assign/:userId` - Remove user assignment

### Team Management
- `GET /api/teams` - Get user teams
- `POST /api/teams` - Create new team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add team member
- `PUT /api/teams/:id/members/:userId` - Update member role
- `DELETE /api/teams/:id/members/:userId` - Remove team member

### Comments
- `GET /api/comments/task/:taskId` - Get task comments
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Dependencies
- `POST /api/dependencies` - Create task dependency
- `DELETE /api/dependencies/:id` - Remove dependency
- `GET /api/dependencies/task/:taskId` - Get task dependencies
- `GET /api/dependencies/graph` - Get dependency graph

### Activities
- `GET /api/activities` - Get activity feed
- `GET /api/activities/team/:teamId` - Get team activities

### Health Check
- `GET /` - API status
- `GET /api/health` - Server health check

## Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/taskmanagement"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
```

### Database Configuration

The application uses PostgreSQL with Prisma ORM. The schema includes:

- **Users**: Authentication and profile management
- **Teams**: Team organization and member management
- **Tasks**: Task creation and management
- **Task Assignments**: User-task relationships
- **Task Dependencies**: Task dependency relationships
- **Comments**: Task discussion system
- **Activities**: Activity logging and tracking

## Architecture

### Backend Architecture
- **Controller Layer**: Handles HTTP requests and responses
- **Service Layer**: Contains business logic and data operations
- **Middleware Layer**: Authentication, validation, and error handling
- **Database Layer**: Prisma ORM with PostgreSQL

### Frontend Architecture
- **Component-Based**: Modular React components with TypeScript
- **Context API**: State management for user authentication and global state
- **Custom Hooks**: Reusable logic for API calls and data management
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Security Features
- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation with Joi schemas
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **CORS Protection**: Configured cross-origin resource sharing

---

**Author**: Umesha J.A.U.C.  
**Version**: 1.0.0  
**Last Updated**: September 2025

## 🛠 Installation & Setup

### 1. Clone or Download the Project

If using Git:
```bash
git clone <repository-url>
cd "Task Management System"
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

## 🏃‍♂️ Running the Application

### Development Mode (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on: `http://localhost:5173`

### Production Mode

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Tech Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **CORS** - Cross-origin resource sharing
- **ts-node** - TypeScript execution
- **Nodemon** - Development auto-restart

## Author

**Umesha J.A.U.C.**

---


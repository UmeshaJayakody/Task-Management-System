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
- **Testing**: Jest with comprehensive test coverage

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
- **Testing**: Jest for unit and integration testing
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
│   ├── tests/               # Test files
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma    # Database schema definition
│   │   └── migrations/      # Database migration files
│   ├── dist/                # Compiled JavaScript (generated)
│   ├── coverage/            # Test coverage reports (generated)
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── nodemon.json
│   └── .env.example
├── .github/                  # GitHub workflows
│   └── workflows/
│       └── test.yml         # CI/CD pipeline
├── .vscode/                  # VS Code configuration
│   ├── launch.json          # Debug configurations
│   └── settings.json        # Workspace settings
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
CREATE DATABASE taskmanagement_test; -- For testing

-- Create user (optional)
CREATE USER taskmanager WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE taskmanagement TO taskmanager;
GRANT ALL PRIVILEGES ON DATABASE taskmanagement_test TO taskmanager;
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
PORT=3000
NODE_ENV=development

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

## Available Scripts

### Backend Scripts

```bash
# Development
npm run dev                    # Start development server
npm run dev:watch             # Start with auto-restart on changes

# Building
npm run build                 # Build TypeScript to JavaScript
npm run clean                 # Clean build directory

# Production
npm start                     # Start production server

# Testing
npm test                      # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate coverage report
npm run test:ci              # Run tests for CI/CD
npm run test:validate        # Validate test setup

# Database
npm run test:db:setup        # Setup test database
npm run test:db:reset        # Reset test database
```

### Frontend Scripts

```bash
# Development
npm run dev                   # Start development server with hot reload

# Building
npm run build                 # Build for production
npm run preview              # Preview production build

# Code Quality
npm run lint                  # Run ESLint
```

## Testing

The project includes comprehensive testing infrastructure:

### Backend Testing
- **Unit Tests**: Service layer testing with isolated business logic
- **Integration Tests**: API endpoint testing with database integration
- **Test Coverage**: Automated coverage reporting with minimum thresholds
- **Test Database**: Separate test database with automatic cleanup

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch

# Validate test setup
npm run test:validate
```

### Test Structure
```
tests/
├── setup.ts                 # Test configuration and setup
├── helpers.ts               # Test utilities and factories
├── user.test.ts            # User authentication tests
├── task.test.ts            # Task management tests
├── team.test.ts            # Team collaboration tests
├── activity.test.ts        # Activity tracking tests
├── comment.test.ts         # Comment system tests
├── dependency.test.ts      # Dependency management tests
└── services/               # Service layer unit tests
```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/taskmanagement"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
NODE_ENV=development

# Password Hashing
BCRYPT_ROUNDS=12
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

## Deployment

### Using Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

### Manual Deployment

1. **Prepare the environment**:
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export DATABASE_URL="your-production-database-url"
   export JWT_SECRET="your-production-jwt-secret"
   ```

2. **Deploy backend**:
   ```bash
   cd backend
   npm install --production
   npm run build
   npx prisma migrate deploy
   npm start
   ```

3. **Deploy frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   # Serve the dist folder with your preferred web server
   ```

## Troubleshooting

### Common Issues

**Database Connection Issues**:
```bash
# Check PostgreSQL service
sudo systemctl status postgresql    # Linux
brew services list postgresql       # macOS

# Test connection
psql -h localhost -U username -d taskmanagement
```

**Port Conflicts**:
```bash
# Find process using port 3000
netstat -tulpn | grep 3000         # Linux
lsof -i :3000                      # macOS
netstat -ano | findstr :3000       # Windows

# Kill process (replace PID)
kill -9 PID                        # Linux/macOS
taskkill /PID PID /F               # Windows
```

**TypeScript Compilation Errors**:
```bash
# Clean and rebuild
cd backend
npm run clean
npm run build

# Check for type errors
npx tsc --noEmit
```

**Test Failures**:
```bash
# Ensure test database exists
createdb taskmanagement_test

# Reset test database
npm run test:db:reset

# Validate test setup
npm run test:validate
```

### Performance Optimization

- **Database Indexing**: The schema includes optimized indexes for common queries
- **Connection Pooling**: Prisma handles database connection pooling automatically
- **Caching**: Consider implementing Redis for session caching in production
- **Static Assets**: Use a CDN for serving static frontend assets

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Maintain test coverage above 90%
- Use conventional commit messages
- Update documentation for new features
- Ensure all tests pass before submitting PRs

## License

This project is licensed under the ISC License. See the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the comprehensive test documentation in `backend/TESTING.md`

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

# Build the TypeScript project
npm run build
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

## 🌐 API Endpoints

The backend provides the following endpoints:

- **GET /** - Hello World message
  ```
  http://localhost:3000/
  ```

- **GET /api/health** - Health check with server uptime
  ```
  http://localhost:3000/api/health
  ```

- **GET /api/hello?name=YourName** - Personalized greeting
  ```
  http://localhost:3000/api/hello?name=John
  ```

## 📁 Available Scripts

### Backend Scripts

- `npm run dev` - Start development server with ts-node
- `npm run dev:watch` - Start development server with auto-restart on file changes
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run compiled JavaScript (production)
- `npm run clean` - Clean the dist folder

### Frontend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## 🔧 Configuration

### Backend Configuration

- **Port**: Default is 3000, can be changed via `PORT` environment variable
- **TypeScript Config**: `tsconfig.json`
- **Nodemon Config**: `nodemon.json`

### Frontend Configuration

- **Vite Config**: `vite.config.ts`
- **TypeScript Config**: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- **Tailwind CSS**: `tailwind.config.js`, `postcss.config.js`
- **ESLint**: `eslint.config.js`

## 🚨 Troubleshooting

### Common Issues

1. **Port 3000 already in use:**
   ```bash
   # Kill process using port 3000 (Windows)
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Or change port in backend/src/index.ts
   ```

2. **Frontend can't connect to backend:**
   - Ensure backend is running on port 3000
   - Check CORS configuration in backend
   - Verify API URLs in frontend code

3. **TypeScript compilation errors:**
   ```bash
   # Clean and rebuild
   cd backend
   npm run clean
   npm run build
   ```

## 🏗 Development Workflow

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Make Changes**:
   - Backend changes auto-restart the server
   - Frontend changes trigger hot reload

4. **Build for Production**:
   ```bash
   # Backend
   cd backend
   npm run build

   # Frontend
   cd frontend
   npm run build
   ```

## 🎯 Next Steps

- Add authentication and user management
- Implement task CRUD operations
- Add database integration (MongoDB/PostgreSQL)
- Create more comprehensive UI components
- Add testing (Jest, React Testing Library)
- Deploy to cloud platforms

## 📝 Tech Stack

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

## 👤 Author

**Umesha J.A.U.C.**

---

## 📄 License

ISC License

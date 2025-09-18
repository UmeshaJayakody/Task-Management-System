# Task Management System - User Management

A full-stack user management system built with React, TypeScript, Node.js, Express, and PostgreSQL.

## ✨ Features

### Backend
- **User Authentication**: Registration, login, and JWT-based authentication
- **User Management**: Complete CRUD operations for user profiles
- **Security**: Password hashing with bcryptjs, JWT token validation
- **Validation**: Comprehensive input validation with Joi
- **Database**: PostgreSQL with Prisma ORM

### Frontend
- **Modern React**: Built with React 18, TypeScript, and Vite
- **Responsive Design**: Tailwind CSS for beautiful, mobile-first UI
- **Authentication Flow**: Complete sign-in/sign-up with form validation
- **Protected Routes**: Secure dashboard and profile pages
- **User Profile Management**: View and edit user information

## 🛠 Tech Stack

### Backend
- Node.js with TypeScript
- Express.js framework
- PostgreSQL database
- Prisma ORM
- JWT authentication
- bcryptjs for password hashing
- Joi for validation

### Frontend
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS
- React Router DOM
- Axios for API calls
- React Hook Form with Zod validation
- Lucide React icons

## 🚀 Project Structure

```
Task Management System/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
├── backend/                  # Node.js + Express + TypeScript
│   ├── src/
│   │   └── index.ts
│   ├── dist/                 # Compiled JavaScript
│   ├── package.json
│   ├── tsconfig.json
│   └── nodemon.json
└── README.md
```

## 📋 Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

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

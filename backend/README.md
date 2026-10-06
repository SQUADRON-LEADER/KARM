# KRAM Backend API

A high-performance, secure REST API backend for the **KRAM** project and task management application, built with Node.js, Express, TypeScript, and MongoDB (Mongoose).

---

## 🏗️ Architecture Overview

The backend is structured into modular layers following clean code principles:

```
backend/
├── src/
│   ├── config/          # Environment & MongoDB connection configurations
│   ├── controllers/     # Request handlers & HTTP responses
│   ├── middleware/      # Auth, Validation, Rate Limiting, Central Error Handling
│   ├── models/          # Mongoose schemas (User, Project, Task, Activity)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic & Database operations
│   ├── utils/           # JWT, Password hashing, Response helpers
│   ├── validators/      # Zod validation schemas
│   ├── app.ts           # Express app setup with Helmet, CORS, Middleware
│   └── server.ts        # Server entry point with graceful shutdown
├── tests/               # Automated unit, integration, and security tests (Vitest)
├── .env.example         # Environment template
├── package.json
└── tsconfig.json
```

---

## 📋 Prerequisites & Setup

- **Node.js**: `v18.x` or later (tested on `v20+` / `v24+`)
- **NPM**: `v9.x` or later
- **MongoDB**: MongoDB Atlas Cluster OR local MongoDB Community Server (`mongodb://127.0.0.1:27017/kram`)

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

```bash
# Server Port & Mode
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB Connection String
MONGODB_URI=mongodb://127.0.0.1:27017/kram

# JWT Secrets & Expirations
JWT_ACCESS_SECRET=your_super_secret_access_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_change_in_production
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### MongoDB Setup Options:
1. **Local MongoDB**:
   - Install MongoDB Community Edition.
   - Start the service (`mongod`).
   - Use `MONGODB_URI=mongodb://127.0.0.1:27017/kram`.
2. **MongoDB Atlas (Cloud)**:
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
   - Create a database user and whitelist your IP (or allow all `0.0.0.0/0`).
   - Copy connection string: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/kram?retryWrites=true&w=majority`.

---

## 🚀 Running the Server

### Development
```bash
cd backend
npm install
npm run dev
```

### Production Build & Start
```bash
npm run build
npm start
```

### Running Tests
```bash
npm test
```

---

## 🔐 Authentication & Authorization Flow

1. **Registration** (`POST /api/auth/register`):
   - Validates user input via Zod.
   - Hashes password using `bcrypt` (12 rounds).
   - Generates a short-lived Access Token (`15m`) and a long-lived Refresh Token (`7d`).
   - Sets the Refresh Token in an **HttpOnly, Secure cookie** (`refreshToken`).
   - Returns user profile and Access Token.

2. **Login** (`POST /api/auth/login`):
   - Validates email and compares password hash.
   - Sets secure Refresh Token cookie and returns Access Token.

3. **Token Refresh** (`POST /api/auth/refresh`):
   - Automatically reads the HttpOnly `refreshToken` cookie.
   - Issues a fresh Access Token and rotates the Refresh Token.

4. **Logout** (`POST /api/auth/logout`):
   - Clears the `refreshToken` cookie.

5. **Multi-Tenant User Isolation**:
   - The authenticated user's ID is extracted exclusively from the verified JWT (`req.user.userId`).
   - All Project, Task, Activity, and Dashboard operations are strictly scoped to the authenticated user.
   - Cross-user data access returns `404 Not Found` or `403 Forbidden`.

---

## 📡 API Endpoint Reference

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| `GET` | `/api/health` | No | Health check & database connection status |
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Authenticate user & get JWT tokens |
| `POST` | `/api/auth/refresh` | Cookie | Refresh access token via HttpOnly cookie |
| `POST` | `/api/auth/logout` | No | Clear session and cookies |
| `GET` | `/api/auth/me` | Yes (Bearer) | Get current authenticated user profile |
| `PUT` | `/api/users/me` | Yes (Bearer) | Update current user's profile (name, email, avatar) |
| `GET` | `/api/projects` | Yes (Bearer) | List projects with search, status filter & sorting |
| `POST` | `/api/projects` | Yes (Bearer) | Create a new project |
| `GET` | `/api/projects/:id` | Yes (Bearer) | Get project details by ID |
| `PUT` | `/api/projects/:id` | Yes (Bearer) | Update project details & status |
| `DELETE` | `/api/projects/:id` | Yes (Bearer) | Delete project (cascades task deletions) |
| `GET` | `/api/tasks` | Yes (Bearer) | List tasks with search, project, status, priority filters |
| `POST` | `/api/tasks` | Yes (Bearer) | Create a new task under a project |
| `GET` | `/api/tasks/:id` | Yes (Bearer) | Get task details by ID |
| `PUT` | `/api/tasks/:id` | Yes (Bearer) | Update task details, priority, or status |
| `PATCH`| `/api/tasks/:id/complete` | Yes (Bearer) | Mark task as completed |
| `DELETE` | `/api/tasks/:id` | Yes (Bearer) | Delete a task |
| `GET` | `/api/dashboard` | Yes (Bearer) | Aggregated statistics, metrics & charts data |
| `GET` | `/api/activities` | Yes (Bearer) | Paginated recent user activities & audit trail |

---

## 📦 Request & Response Examples

### Register
`POST /api/auth/register`
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "6704b1234567890abcdef123",
      "fullName": "Jane Doe",
      "email": "jane@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Dashboard Aggregation
`GET /api/dashboard`
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "statistics": {
      "totalProjects": 4,
      "totalTasks": 18,
      "completedTasks": 12,
      "pendingTasks": 6,
      "projectsInProgress": 2,
      "completionRate": 67
    },
    "taskCompletion": [
      {
        "name": "Design",
        "projectId": "6704b1234567890abcdef123",
        "Completed": 5,
        "Remaining": 1
      }
    ],
    "tasksByStatus": [
      { "name": "Pending", "status": "pending", "value": 3 },
      { "name": "In Progress", "status": "in_progress", "value": 3 },
      { "name": "Completed", "status": "completed", "value": 12 }
    ],
    "projectsByStatus": [
      { "name": "Not Started", "status": "not_started", "value": 1 },
      { "name": "In Progress", "status": "in_progress", "value": 2 },
      { "name": "Completed", "status": "completed", "value": 1 }
    ],
    "tasksByPriority": [
      { "name": "High", "priority": "high", "Open": 2, "Done": 4 },
      { "name": "Medium", "priority": "medium", "Open": 3, "Done": 6 },
      { "name": "Low", "priority": "low", "Open": 1, "Done": 2 }
    ],
    "upcomingTasks": [],
    "recentActivities": []
  }
}
```

---

## 🔒 Security Features

- **Helmet**: Secures HTTP response headers against clickjacking, MIME sniffing, and XSS.
- **CORS**: Scoped explicitly to `FRONTEND_URL` with credentials support.
- **Rate Limiting**:
  - `authRateLimiter`: 30 requests / 15 mins for login/register/refresh to block brute force.
  - `apiRateLimiter`: 1000 requests / 15 mins for authenticated operations.
- **Password Hashing**: Bcrypt with 12 salt rounds.
- **Zod Validation**: Validates all incoming request bodies and query parameters.
- **ObjectId Validation**: Rejects invalid MongoDB IDs with clean `400 Bad Request` before querying database.
- **Safe Error Responses**: Never exposes stack traces or sensitive credentials.

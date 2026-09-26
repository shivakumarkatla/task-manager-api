# Task Manager REST API

A production-ready Task Manager REST API built with Node.js, Express, MongoDB (Mongoose), and JWT authentication.

## Folder Structure

```
task-manager-api/
├── src/
│   ├── config/
│   │   ├── env.js             # Loads dotenv — must be first import in server.js
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js            # User schema (bcrypt hashing + whitespace validation)
│   │   └── Task.js            # Task schema (linked to a User, compound index)
│   ├── controllers/
│   │   ├── authController.js  # register / login / getMe
│   │   └── taskController.js  # Full CRUD + pagination + enum validation
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── taskRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification (split verify/lookup)
│   │   └── errorMiddleware.js # 404 handler + centralized error handler
│   ├── utils/
│   │   ├── generateToken.js   # JWT signing helper
│   │   └── asyncHandler.js    # Wraps async controllers, forwards errors to Express
│   └── app.js                 # Express app (restricted CORS, body limit, routes)
├── server.js                  # Entry point
├── .env.example               # Template for all required environment variables
├── .gitignore
├── package.json
└── README.md
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in real values:

| Variable          | Description                                           |
|-------------------|-------------------------------------------------------|
| `PORT`            | Port the server listens on (default `5000`)           |
| `MONGO_URI`       | MongoDB connection string                             |
| `JWT_SECRET`      | Long random secret (min 32 chars) used to sign JWTs  |
| `JWT_EXPIRES_IN`  | Token lifetime, e.g. `7d`, `1h`                      |
| `NODE_ENV`        | `development` or `production`                        |
| `ALLOWED_ORIGIN`  | Frontend URL allowed by CORS (e.g. `http://localhost:3000`) |

### 3. Start MongoDB

Make sure MongoDB is running locally, or point `MONGO_URI` at a hosted cluster (e.g. MongoDB Atlas):

```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/task-manager
```

### 4. Run the server

```bash
npm run dev    # development — auto-restarts on file changes (nodemon)
npm start      # production — plain node
```

Server starts at `http://localhost:5000`.

---

## Authentication Flow

1. `POST /api/auth/register` or `POST /api/auth/login` → returns a JWT.
2. Send the token on every protected request:
   ```
   Authorization: Bearer <your_token_here>
   ```
3. Tasks are always scoped to the authenticated user — users can never read or modify each other's tasks.

---

## API Reference

### Health Check

| Method | Endpoint       | Access | Description        |
|--------|----------------|--------|--------------------|
| GET    | `/api/health`  | Public | Server liveness check |

**Response:**
```json
{ "success": true, "message": "API is running" }
```

---

### Auth — `/api/auth`

| Method | Endpoint     | Access  | Description                    |
|--------|--------------|---------|-------------------------------- |
| POST   | `/register`  | Public  | Create a new user, returns JWT  |
| POST   | `/login`     | Public  | Authenticate, returns JWT       |
| GET    | `/me`        | Private | Get logged-in user's profile    |

**Register body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

**Login body:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

**Success response (register / login):**
```json
{
  "success": true,
  "data": {
    "_id": "665f1c2e8f1b2c0012a3b456",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Tasks — `/api/tasks` (all routes require JWT)

| Method | Endpoint   | Description                                   |
|--------|------------|-----------------------------------------------|
| GET    | `/`        | List the user's tasks (filterable, paginated) |
| GET    | `/:id`     | Get a single task by ID                       |
| POST   | `/`        | Create a new task                             |
| PUT    | `/:id`     | Update a task (partial body supported)        |
| DELETE | `/:id`     | Delete a task → `204 No Content`              |

**Query params for `GET /api/tasks`:**

| Param      | Values                              | Default |
|------------|-------------------------------------|---------|
| `status`   | `pending`, `in-progress`, `completed` | —     |
| `priority` | `low`, `medium`, `high`             | —       |
| `page`     | integer                             | `1`     |
| `limit`    | integer                             | `10`    |

**Create / Update task body:**
```json
{
  "title": "Finish API documentation",
  "description": "Write README and Postman collection",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-07-10T00:00:00.000Z"
}
```
Only `title` is required on creation. `PUT` accepts partial bodies — only provided fields are updated.

**Task response:**
```json
{
  "success": true,
  "data": {
    "_id": "665f1d4a8f1b2c0012a3b457",
    "title": "Finish API documentation",
    "description": "Write README and Postman collection",
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2026-07-10T00:00:00.000Z",
    "user": "665f1c2e8f1b2c0012a3b456",
    "createdAt": "2026-07-04T10:15:00.000Z",
    "updatedAt": "2026-07-04T10:20:00.000Z"
  }
}
```

**Paginated list response:**
```json
{
  "success": true,
  "count": 5,
  "total": 23,
  "page": 1,
  "pages": 3,
  "data": [ ... ]
}
```

---

## Error Response Format

All errors follow the same shape:
```json
{
  "success": false,
  "message": "Task not found"
}
```
In non-production environments a `stack` field is also included to aid debugging.

---

## Security Notes

- Passwords are hashed with `bcrypt` (salt rounds: 10) and never returned in responses (`select: false`).
- JWTs are signed with `HS256` and expire after `JWT_EXPIRES_IN`.
- CORS is restricted to `ALLOWED_ORIGIN` — not open to all origins.
- Request bodies are limited to `10kb` to prevent large-payload attacks.
- All task queries are scoped by `user` ObjectId — no cross-user data leakage possible.

# Student Management System

Full-stack Student Management System for Gujarat Government Exam Guidance Academy.

## Architecture

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT

## Features

- Admin/Staff login with JWT token
- Student CRUD (name, mobile, email, exam type, course, batch, photo)
- Course and batch management
- Fee payment records and pending fee tracker
- Exam/mock-test tracking
- Dashboard metrics:
  - Total students
  - Total batches
  - Monthly fees collected
  - Upcoming exams (next 30 days)
- Route-based pages:
  - `/dashboard`
  - `/students`
  - `/students/add`
  - `/batches`
  - `/fees`
  - `/exams`

## Default Credentials

- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`

## Project Structure

- `frontend/` -> React + Vite frontend
- `backend/` -> Express + MongoDB API

## Setup

1. Install frontend dependencies

```bash
cd frontend
npm install
```

2. Install backend dependencies

```bash
cd backend
npm install
cp .env.example .env
```

3. Update `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_academy
JWT_SECRET=change_this_secret
```

4. Start backend

```bash
cd ..
npm run dev:server
```

5. Start frontend (new terminal)

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and uses backend API at `http://localhost:5000/api`.

## Backend API Endpoints

- `POST /api/auth/login`
- `GET|POST /api/students`
- `PUT|DELETE /api/students/:id`
- `GET|POST /api/courses`
- `GET|POST /api/batches`
- `GET|POST /api/fees`
- `GET|POST /api/exams`
- `GET /api/dashboard/stats`

All endpoints except login require `Authorization: Bearer <token>`.

Admin-only endpoints:

- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
- `POST /api/courses`
- `POST /api/batches`

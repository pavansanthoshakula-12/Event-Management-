# College Event Management System (MERN)

A web app where college administrators create and manage events and review student registrations, and students sign up, browse upcoming events, register, and track their registrations.

**Stack:** React 19 + Vite, React Router, Axios, plain CSS | Node.js + Express | MongoDB + Mongoose | JWT + bcrypt

---

## 1. Features

**Students**
- Create an account (name, email, password, roll number, department, year), log in and out
- Browse events with search (title), filters (category, status, date range) and pagination
- Event details page, one-click Register (with optional remarks)
- My Registrations: search, status filter, pagination, status badges, edit remarks, cancel
- Profile page

**Admins**
- Dashboard: total events, registrations, upcoming and completed events, recent registrations
- Full event CRUD with validation, search, filters and pagination
- Registration management: search, filter, approve / reject / cancel, edit remarks and admin note, delete
- Deleting needs confirmation; the deletion policy is explicit (see section 6)

**Security**
- Passwords hashed with bcrypt (cost 12); JWT authentication; role-based access control
- Public sign-up can only ever create students; the first admin is created by a one-time command, never by an endpoint
- Ownership checks on student operations; input validated on the backend; Helmet, CORS allow-list and rate limiting
- MongoDB unique index on (student, event); atomic seat reservation prevents overbooking under concurrent requests

---

## 2. Folder structure

```
college-event-management/
├── README.md
├── backend/
│   ├── config/db.js                  MongoDB connection
│   ├── controllers/                  authController, eventController, registrationController
│   ├── middleware/                   authMiddleware (protect, authorize), validate, errorMiddleware
│   ├── models/                       User, Event, Registration
│   ├── routes/                       authRoutes, eventRoutes, registrationRoutes
│   ├── utils/                        validators, constants, helpers, generateToken, seedAdmin, AppError, asyncHandler
│   ├── tests/api.test.js             automated API test (36 checks)
│   ├── .env.example
│   └── server.js                     app entry point
└── frontend/
    ├── index.html, vite.config.js, .env.example
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── components/               Navbar, Sidebar, EventCard, DataTable, FilterBar, Pagination, Modal,
        │                             ConfirmDialog, Loader, ErrorMessage, EmptyState, StatusBadge, FormField,
        │                             EventForm, RegisterButton, SeatMeter, ProtectedRoute, PageHeader, Brand
        ├── pages/                    Landing, Login, Register, EventDetails, NotFound
        │   ├── admin/                AdminDashboard, ManageEvents, AddEvent, EditEvent, ManageRegistrations
        │   └── student/              StudentDashboard, BrowseEvents, MyRegistrations, Profile
        ├── layouts/                  AdminLayout, StudentLayout
        ├── services/                 api.js (Axios), authService, eventService, registrationService
        ├── context/                  AuthContext, ToastContext
        ├── hooks/                    useAuth, useToast, useDebounce
        └── utils/                    constants, format (dates, errors, registration rules)
```

---

## 3. Setup

### Prerequisites
- Node.js 20 or newer (`node -v`)
- MongoDB: **either** local MongoDB Community Server **or** a free MongoDB Atlas cluster

### MongoDB option A: local
Install MongoDB Community Server from https://www.mongodb.com/try/download/community and make sure it is running (default port 27017). Use:
`MONGO_URI=mongodb://127.0.0.1:27017/college_events`

### MongoDB option B: Atlas (cloud)
1. Create a free cluster at https://cloud.mongodb.com
2. Database Access: create a database user (username + password)
3. Network Access: add your IP address (or `0.0.0.0/0` for development only)
4. Connect, Drivers: copy the connection string and add the database name:
   `MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/college_events?retryWrites=true&w=majority`

### Backend
```bash
cd backend
npm install
cp .env.example .env          # Windows: copy .env.example .env
```
Edit `backend/.env`:
- `MONGO_URI`: from above
- `JWT_SECRET`: generate one with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (min 8 characters), `ADMIN_NAME`: your first admin account

Create the first admin (one time):
```bash
npm run seed:admin
# Admin account created for admin@college.edu. You can now log in.
```
Start the API:
```bash
npm run dev
# MongoDB connected: 127.0.0.1/college_events
# Server running in development mode on port 5000
```
Check: http://localhost:5000/api/health returns `{"success":true,...}`

### Frontend
In a second terminal:
```bash
cd frontend
npm install
cp .env.example .env          # optional; default is http://localhost:5000/api
npm run dev
```
Open http://localhost:5173

> The API URL lives in `frontend/.env` as `VITE_API_URL` (must end with `/api`). Restart `npm run dev` after changing it. `CLIENT_URL` in `backend/.env` must match the address of the frontend.

### Production build
```bash
cd frontend && npm run build      # outputs frontend/dist
cd ../backend && NODE_ENV=production npm start
```

---

## 4. First use

1. Log in at `/login` with the admin email and password from `backend/.env`.
2. Add an event (Admin, Add event). Keep the status **Upcoming** so students can register.
3. Log out, create a student account at `/register`, browse events and register.
4. Log back in as admin, open **Registrations** and approve the request.

---

## 5. API reference

Base URL: `http://localhost:5000/api`. Send `Authorization: Bearer <token>` on every protected route.

Success: `{ "success": true, "message"?: "...", "data": ..., "pagination"?: { page, limit, total, pages } }`
Error: `{ "success": false, "message": "...", "errors"?: [{ "field": "...", "message": "..." }] }`

Status codes: 200 OK, 201 Created, 400 validation / bad id, 401 not logged in, 403 forbidden, 404 not found, 409 conflict (duplicate, full event, has registrations).

### Auth
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/auth/register` | public | name, email, password, rollNumber, department, yearOfStudy. Always creates a student |
| POST | `/auth/login` | public | email, password. Returns `{ token, user }` |
| GET | `/auth/me` | logged in | current user |
| PUT | `/auth/me` | logged in | update name, department, yearOfStudy |

### Events
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/events` | logged in | query: `search, category, status, dateFrom, dateTo, sort (asc/desc), page, limit`. For students each event includes `myRegistration` |
| GET | `/events/stats` | admin | dashboard numbers |
| GET | `/events/:id` | logged in | |
| POST | `/events` | admin | title, description, category, eventDate (YYYY-MM-DD), startTime, endTime (HH:MM), venue, organizer, registrationDeadline (ISO), maxParticipants, status |
| PUT | `/events/:id` | admin | same body as POST (full update). Capacity cannot drop below seats taken |
| DELETE | `/events/:id` | admin | blocked (409) if any registration record exists |

### Registrations
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/registrations` | student | body `{ eventId, remarks? }` |
| GET | `/registrations` | admin | query: `search, status, eventId, page, limit` |
| GET | `/registrations/my` | student | query: `search (event title), status, page, limit` |
| GET | `/registrations/:id` | admin or owner | |
| PUT | `/registrations/:id` | admin or owner | admin: `status, remarks, adminNote`. Student: only `remarks` (anything else gives 403) |
| PATCH | `/registrations/:id/cancel` | owner student | withdraw while the event is not Ongoing/Completed |
| DELETE | `/registrations/:id` | admin | permanent delete; frees the seat if it held one |

**Design adjustments:** `/events/stats` was added for the dashboard. Students withdraw with `PATCH /:id/cancel`, while `DELETE` is admin-only. `GET /registrations/my` is declared before `/:id` so "my" is not read as an id.

---

## 6. Data model and business rules

**Relationships:** `User (1) ---< Registration >--- (1) Event`. Registration holds `student` (User id) and `event` (Event id), so students and events are many-to-many.

```jsonc
// users
{ "_id": "66f1...a1", "name": "Aarav Sharma", "email": "aarav@college.edu", "password": "<bcrypt hash>",
  "role": "student", "rollNumber": "22CS100", "department": "CSE", "yearOfStudy": 3 }

// events
{ "_id": "66f1...b2", "title": "Full-Stack Web Dev Workshop", "category": "Workshop",
  "eventDate": "2026-11-07T00:00:00.000Z", "startTime": "10:00", "endTime": "16:00",
  "venue": "Computer Lab 2", "organizer": "CSE Department",
  "registrationDeadline": "2026-11-04T10:00:00.000Z", "maxParticipants": 40,
  "registeredCount": 4, "status": "Upcoming", "createdBy": "66f1...a0" }

// registrations  (unique index on student + event)
{ "_id": "66f1...c3", "student": "66f1...a1", "event": "66f1...b2",
  "status": "Pending", "remarks": "Looking forward", "adminNote": "", "registeredAt": "2026-10-29T12:42:00.000Z" }
```

**Rules**
- **Seats:** Pending and Approved registrations hold a seat; Rejected and Cancelled release it. `registeredCount` changes only through atomic MongoDB updates, so simultaneous requests cannot exceed `maxParticipants`.
- **Duplicates:** blocked by the unique (student, event) index. A student who cancelled earlier re-registers on the same record. A rejected student cannot re-register.
- **Registering is rejected** when the event is Cancelled, not Upcoming, past its deadline, or full.
- **Event deletion policy:** an event with any registration record (even cancelled or rejected) cannot be deleted; the API returns 409 explaining why and the admin is told to set the event to **Cancelled** instead. Events with no registrations can be deleted. No registration data is ever removed silently.
- **Cancelling an event** keeps its registrations untouched.
- **Registration deadline** is a date-time stored in UTC and shown in the viewer's local time. Event dates are calendar days.

---

## 7. Testing

### Automated API test (needs MongoDB, a seeded admin and the server running)
```bash
cd backend
npm run seed:admin
npm run dev            # terminal 1
npm run test:api       # terminal 2
# 36 passed, 0 failed
```
It covers all 15 required scenarios: event CRUD, register, duplicate prevention, own-registrations only, admin status changes, cross-student access (403), unauthenticated access (401), student on admin routes (403), invalid ids and bad input (400/404), full and cancelled events, 12 simultaneous registrations for 3 seats (exactly 3 succeed), and the deletion policy. Test data is prefixed "TEST".

### Manual checklist
- [ ] Admin creates, views, edits, deletes an event (confirmation dialog appears)
- [ ] Deleting an event that has registrations is refused with an explanation
- [ ] Student registers; a second attempt shows "already registered"
- [ ] Registering for a full, cancelled or past-deadline event is refused
- [ ] Student sees only their own registrations; can edit remarks and cancel
- [ ] Admin approves / rejects; seat counts on the event update
- [ ] Student visiting `/admin` is redirected to `/student`
- [ ] Logged-out visit to `/student` redirects to `/login`
- [ ] Layout works on phone, tablet and desktop widths

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| `Missing JWT_SECRET` or `MONGO_URI` | Create `backend/.env` from `.env.example` |
| `MongoDB connection error` / `ECONNREFUSED` | Start MongoDB, or check the Atlas string, user, password and IP allow-list |
| Atlas `bad auth` | Wrong password; special characters in it must be URL-encoded |
| `EADDRINUSE :5000` | Change `PORT` in `backend/.env` and `VITE_API_URL` in `frontend/.env` |
| Browser shows "Cannot reach the server" | Backend is not running, or `VITE_API_URL` is wrong (restart Vite after editing) |
| CORS error in the console | `CLIENT_URL` in `backend/.env` must equal the frontend address, then restart the backend |
| Cannot log in as admin | Run `npm run seed:admin`. If the email already exists as a student, use another `ADMIN_EMAIL` |
| Too many attempts message | Login/register are rate limited; wait a few minutes |
| `Cannot use import statement outside a module` | `"type": "module"` must be in `package.json` |

---

## 9. Notes for going live
- Use a long random `JWT_SECRET`, `NODE_ENV=production`, HTTPS, and a restricted Atlas IP list.
- The token is kept in `localStorage` for simplicity; for stricter setups switch to httpOnly cookies.
- Never commit `.env` files.
"# Event-Management-" 

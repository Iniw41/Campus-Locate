# Campus Locate

Campus navigation, events/announcements and lost-and-found for CIT-U. **This first version contains only the login page and dashboard** for students and admins; everything else is scaffolded so features can be added later.

Stack: HTML, CSS, JavaScript, React (Vite), Tailwind CSS, Express.

## Run it
```bash
npm install
npm run dev:api     # backend   http://localhost:4000
npm run dev:user    # students  http://localhost:5173
npm run dev:admin   # admins    http://localhost:5174
# or everything at once: npm run dev
```
Demo accounts (in-memory, see `apps/backend/src/models/User.js`):

| Portal  | ID / email      | Password   |
|---------|-----------------|------------|
| Student | 25-0001-001     | student123 |
| Admin   | admin@cit.edu   | admin123   |

## Structure
```
campuslocate/
├── apps/
│   ├── admin-frontend/   # Staff/admin UI (its own index.html, port 5174)
│   ├── backend/          # One API serving both frontends (port 4000)
│   └── user-frontend/    # Student/faculty/staff UI (port 5173)
├── packages/shared/      # Logo, login backdrop, default profile picture, Tailwind tokens, constants
├── package.json          # npm workspaces
└── turbo.json            # Turborepo task runner
```
Both frontends share the same layout:
```
src/
├── api/         # fetch client (adds the JWT)
├── assets/      # app-specific media
├── components/  # Sidebar, Topbar, DashboardLayout
├── config/      # portalConfig.js: title, login endpoint, sidebar items (the main difference between portals)
├── context/     # AuthContext (login, logout, session restore)
├── pages/       # Login, Dashboard, ComingSoon
├── styles/      # Tailwind entry + shared classes
├── App.jsx      # routes
└── main.jsx     # mount
```
Backend (`apps/backend/src`): `config/`, `middleware/` (`auth`, `adminAuth`, `errorHandler`), `models/`, `routes/{user,admin}`, `controllers/{user,admin}`, `services/`, `app.js`, `server.js`.

Routing in `routes/index.js`:
- `POST /api/v1/user/auth/login` is public; `/api/v1/user/*` needs a token
- `POST /api/v1/admin/auth/login` is public; `/api/v1/admin/*` goes through `adminAuth` (admin role only)

Student and admin logins are separate: each portal has its own login endpoint, accepted roles and token key, so a student account cannot sign in to the admin portal.

## Adding a feature (e.g. Lost and Found)
1. **Sidebar:** the item already exists in `config/portalConfig.js` (`nav`). Add more there.
2. **Page:** create `src/pages/LostAndFound.jsx`, then register it in `App.jsx` under `pages` (`'/lost-and-found': LostAndFound`). Items without a page show `ComingSoon`.
3. **API:** add `routes/user/lostFound.routes.js` + a controller, and mount it in `routes/user/index.js`. Admin side: same under `routes/admin/`.
4. **Data:** replace the in-memory `models/User.js` with a real database before going live.

## Notes
- Set `JWT_SECRET` in `apps/backend/.env` before deploying.
- Frontend API URL is `VITE_API_URL` (see `.env.example`).

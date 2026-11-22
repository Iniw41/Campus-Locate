// Admin portal config (same shape as user-frontend's). Staff manage announcements, events, lost-and-found and users.
export const portal = {
  key: 'admin',
  title: 'Admin Portal',
  tagline: 'Manage campus announcements, events, posts and lost-and-found tickets for CIT-U.',
  idLabel: 'Staff Email Address:',
  idPlaceholder: 'name@cit.edu',
  loginEndpoint: '/admin/auth/login',   // public route; every other /admin route needs an admin token
  meEndpoint: '/admin/me',
  tokenKey: 'campuslocate_admin_token',
  switchPortal: { text: 'Are you a student, faculty or staff member looking for the campus portal?', label: 'Student login', url: 'http://localhost:5173' },
  nav: [
    { label: 'Dashboard', path: '/', icon: 'home' },
    { label: 'Announcements and Posts', path: '/announcements', icon: 'megaphone' },
    { label: 'Events', path: '/events', icon: 'calendar' },
    { label: 'Lost and Found Tickets', path: '/lost-and-found', icon: 'tickets' },
    { label: 'User Management', path: '/users', icon: 'users' },
  ],
};

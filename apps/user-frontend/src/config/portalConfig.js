// Portal config. The admin-frontend has the same file with different values.
// To add a feature: (1) add an item to `nav`, (2) build its page, (3) register it in App.jsx `pages`.
export const portal = {
  key: 'student',
  title: 'Student Portal',
  tagline: 'Find your way around campus, stay up to date with events and announcements, and report or recover lost items.',
  idLabel: 'Email Address/ID Number:',
  idPlaceholder: '00-0000-000',
  loginEndpoint: '/user/auth/login',
  meEndpoint: '/user/profile',
  tokenKey: 'campuslocate_user_token',
  switchPortal: { text: 'Are you a staff member or administrator?', label: 'Admin login', url: 'http://localhost:5174' },
  // icon names map to lucide icons in components/Sidebar.jsx
  nav: [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Campus Navigation', path: '/navigation', icon: 'map' },
    { label: 'Lost and Found', path: '/lost-and-found', icon: 'search' },
    { label: 'Announcements', path: '/announcements', icon: 'megaphone' },
    { label: 'Events', path: '/events', icon: 'calendar' },
  ],
};

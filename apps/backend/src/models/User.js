// TEMPORARY in-memory users so login works today. Replace with a real DB model (MongoDB/Postgres) later.
// Demo accounts: student 25-0001-001 / student123, admin admin@cit.edu / admin123
import bcrypt from 'bcryptjs';

export const users = [
  { id: 1, loginId: '25-0001-001', name: 'Dela Cruz, Juan A.', role: 'student', passwordHash: bcrypt.hashSync('student123', 8) },
  { id: 2, loginId: 'admin@cit.edu', name: 'Campus Admin', role: 'admin', passwordHash: bcrypt.hashSync('admin123', 8) },
];
export const findByLoginId = (loginId) => users.find((u) => u.loginId.toLowerCase() === loginId.toLowerCase());
export const findById = (id) => users.find((u) => u.id === id);
export const toPublic = ({ passwordHash, ...rest }) => rest;

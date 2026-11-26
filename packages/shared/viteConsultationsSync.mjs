// Dev-only Vite middleware that syncs consultation bookings between user-frontend (5173)
// and admin-frontend (5174) via a temporary file in OS temp dir, without touching apps/backend.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const STORE_FILE = path.join(os.tmpdir(), 'campuslocate-consultations-dev.json');

export function consultationsSyncPlugin() {
  return {
    name: 'campuslocate-consultations-dev-sync',
    configureServer(server) {
      server.middlewares.use('/__consultations', (req, res, next) => {
        if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) return next();

        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'GET') {
          try {
            if (!fs.existsSync(STORE_FILE)) {
              res.end(JSON.stringify({ consultations: null }));
              return;
            }
            const raw = fs.readFileSync(STORE_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            res.end(JSON.stringify({ consultations: Array.isArray(parsed) ? parsed : null }));
          } catch {
            res.end(JSON.stringify({ consultations: null }));
          }
          return;
        }

        if (req.method === 'DELETE') {
          try {
            if (fs.existsSync(STORE_FILE)) fs.unlinkSync(STORE_FILE);
          } catch {
            /* ignore */
          }
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            if (Array.isArray(parsed.consultations)) {
              fs.writeFileSync(STORE_FILE, JSON.stringify(parsed.consultations), 'utf8');
            }
            res.end(JSON.stringify({ ok: true }));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false }));
          }
        });
      });
    },
  };
}

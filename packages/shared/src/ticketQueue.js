// Hardcoded teller queue for the dashboard (demo data, no backend).
//
// How it works: the whole day's tickets are generated from a seeded random generator (seed = today's date),
// then replayed against the wall clock. Because both portals run the same code on the same clock, the student
// dashboard (5173) and the admin dashboard (5174) always show exactly the same queue - no API, no shared storage.
//
// Rules: 6 tellers, each teller handles up to 5 tickets at the same time (30 "seats" in total).
// Tickets are served first come, first served. When all 30 seats are busy, new tickets wait in the queue
// until a seat frees up.

export const QUEUE_CONFIG = {
  tellers: 6,
  seatsPerTeller: 5,
  // Service hours (24h clock). 0-24 keeps the demo alive at any time of day;
  // use 8 and 17 for realistic hours (the board then shows a "closed" notice outside them).
  openHour: 0,
  closeHour: 24,
};

// Transaction types shown on the tickets. `minutes` = [fastest, slowest] service time, `weight` = how common it is.
export const TRANSACTIONS = [
  { code: 'P', label: 'Tuition Payment', weight: 40, minutes: [3, 6] },
  { code: 'A', label: 'Assessment / Enrollment', weight: 20, minutes: [5, 10] },
  { code: 'D', label: 'Document Fee', weight: 20, minutes: [4, 8] },
  { code: 'S', label: 'Scholarship / Voucher', weight: 10, minutes: [6, 11] },
  { code: 'R', label: 'Refund', weight: 10, minutes: [7, 12] },
];

// How busy the school is at a given moment, as a share of what the 6 tellers can handle
// (1 = every seat busy, above 1 = a line forms). Rush hours are heavier, and a slow wave on top
// makes the line build up and drain a few times an hour so the board is never static.
const WAVE_MINUTES = 40;
function demand(ms, hour) {
  const rush = (hour >= 8 && hour < 11) || (hour >= 13 && hour < 15);
  return (rush ? 0.95 : 0.8) + 0.4 * Math.sin((2 * Math.PI * ms) / (WAVE_MINUTES * 60 * 1000));
}

const MIN = 60 * 1000;
const SEATS = QUEUE_CONFIG.tellers * QUEUE_CONFIG.seatsPerTeller;
const TOTAL_WEIGHT = TRANSACTIONS.reduce((sum, t) => sum + t.weight, 0);
const AVG_SERVICE_MIN = TRANSACTIONS.reduce((sum, t) => sum + (t.weight / TOTAL_WEIGHT) * ((t.minutes[0] + t.minutes[1]) / 2), 0);
const NUMBER_WRAP = 99; // ticket numbers go 001-099, then start over (like a real queue machine)

// Small seeded PRNG (mulberry32) so the same date always produces the same day.
function seededRandom(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rand, [lo, hi]) => lo + rand() * (hi - lo);

function pickTransaction(rand) {
  let roll = rand() * TOTAL_WEIGHT;
  for (const t of TRANSACTIONS) {
    roll -= t.weight;
    if (roll < 0) return t;
  }
  return TRANSACTIONS[0];
}

function buildDay(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const openAt = new Date(y, m, d, QUEUE_CONFIG.openHour).getTime();
  const closeAt = new Date(y, m, d, QUEUE_CONFIG.closeHour).getTime();
  const rand = seededRandom(`campuslocate-queue-${y}-${m + 1}-${d}`);

  const counters = {};
  const freeAt = new Array(SEATS).fill(openAt); // when each seat becomes free
  const tickets = [];

  let arrival = openAt;
  for (;;) {
    // Average gap that keeps the tellers at the current demand level; exponential spacing gives natural bursts.
    const meanGapMs = (AVG_SERVICE_MIN * MIN) / SEATS / Math.max(0.15, demand(arrival, new Date(arrival).getHours()));
    arrival += Math.min(-Math.log(1 - rand()) * meanGapMs, 90 * 1000);
    if (arrival >= closeAt) break;

    const tx = pickTransaction(rand);
    counters[tx.code] = (counters[tx.code] || 0) + 1;
    const duration = between(rand, tx.minutes) * MIN;

    // Seats that are free right now: pick the one on the least busy teller.
    // If every seat is taken, the ticket waits for the seat that frees up first.
    let seat = -1;
    let bestLoad = Infinity;
    for (let s = 0; s < SEATS; s++) {
      if (freeAt[s] > arrival) continue;
      const teller = Math.floor(s / QUEUE_CONFIG.seatsPerTeller);
      let load = 0;
      for (let k = 0; k < QUEUE_CONFIG.seatsPerTeller; k++) {
        if (freeAt[teller * QUEUE_CONFIG.seatsPerTeller + k] > arrival) load++;
      }
      if (load < bestLoad) {
        bestLoad = load;
        seat = s;
      }
    }
    if (seat === -1) seat = freeAt.indexOf(Math.min(...freeAt));

    const start = Math.max(arrival, freeAt[seat]);
    const end = start + duration;
    freeAt[seat] = end;

    tickets.push({
      id: `${tx.code}${counters[tx.code]}`,
      number: `${tx.code}-${String(((counters[tx.code] - 1) % NUMBER_WRAP) + 1).padStart(3, '0')}`,
      type: tx.label,
      seat,
      teller: Math.floor(seat / QUEUE_CONFIG.seatsPerTeller) + 1,
      arrival,
      start,
      end,
    });
  }

  return { openAt, closeAt, tickets };
}

let cachedDay = null;
function dayFor(now) {
  const date = new Date(now);
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  if (!cachedDay || cachedDay.key !== key) cachedDay = { key, ...buildDay(date) };
  return cachedDay;
}

const hourLabel = (h) => {
  const hh = h % 24;
  return `${hh % 12 === 0 ? 12 : hh % 12}:00 ${hh < 12 ? 'AM' : 'PM'}`;
};

/**
 * What the queue looks like at `now` (ms timestamp).
 * - tellers[i].seats: always 5 entries, a ticket being processed or null for an open seat
 * - waiting: tickets in line, first in line first, each with `position` and `waitMs` (estimated wait)
 */
export function getQueueSnapshot(now = Date.now()) {
  const day = dayFor(now);
  const { tellers: tellerCount, seatsPerTeller } = QUEUE_CONFIG;

  const seats = new Array(SEATS).fill(null);
  const waiting = [];
  let served = 0;

  for (const t of day.tickets) {
    if (t.arrival > now) break; // tickets are sorted by arrival time
    if (t.end <= now) {
      served++;
    } else if (t.start <= now) {
      seats[t.seat] = {
        ...t,
        progress: (now - t.start) / (t.end - t.start),
        remainingMs: t.end - now,
      };
    } else {
      waiting.push({ ...t, position: waiting.length + 1, waitMs: t.start - now });
    }
  }

  const tellers = Array.from({ length: tellerCount }, (_, i) => {
    const mine = seats.slice(i * seatsPerTeller, (i + 1) * seatsPerTeller);
    return { id: i + 1, name: `Teller ${i + 1}`, seats: mine, busy: mine.filter(Boolean).length };
  });

  const processing = seats.filter(Boolean).length;
  return {
    open: now >= day.openAt && now < day.closeAt,
    hoursLabel: `${hourLabel(QUEUE_CONFIG.openHour)} – ${hourLabel(QUEUE_CONFIG.closeHour)}`,
    capacity: SEATS,
    tellers,
    waiting,
    stats: { waiting: waiting.length, processing, served, nextUp: waiting[0]?.number || null },
  };
}

export function formatWait(ms) {
  if (ms < MIN) return '< 1 min';
  return `~${Math.ceil(ms / MIN)} min`;
}

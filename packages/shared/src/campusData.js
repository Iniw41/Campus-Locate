// Campus buildings, floors, rooms and search. Shared by both frontends.
//
// Room numbering: BUILDING + floor + room, e.g. "GLE 604" = GLE, 6th floor, room 4.
// The 1st floor of every building holds facilities only, so numbered rooms start on the 2nd floor (201, 202, ...).
//
// To correct a building later, edit its entry below:
//   floors         total number of floors
//   roomsPerFloor  rooms on each numbered floor (floors 2 and up)
//   facilities     named spaces on the 1st floor
//   estimated      true while the floor count is a guess (shows an "Estimated" badge in the UI)

const DEFAULT_FACILITIES = ['Lobby', 'Restrooms', 'Utility room'];

export const BUILDINGS = [
  { id: 'GLE', name: 'GLE Building', floors: 8, roomsPerFloor: 7, facilities: DEFAULT_FACILITIES },
  { id: 'RTL', name: 'RTL Building', floors: 4, roomsPerFloor: 8, facilities: DEFAULT_FACILITIES },
  { id: 'ALLIED', name: 'Allied Building', floors: 2, roomsPerFloor: 6, facilities: DEFAULT_FACILITIES },
  {
    id: 'LRAC', name: 'Library', floors: 1, roomsPerFloor: 0,
    aliases: ['LIBRARY'],
    facilities: ['Library', 'Reading area', 'Circulation desk'],
  },
  {
    id: 'GPHYS', name: 'G-Phys', floors: 1, roomsPerFloor: 0,
    aliases: ['G-PHYS', 'CLINIC', 'MEDICAL'],
    facilities: ['Clinic', 'Medical examination room', 'Medical records'],
  },
  {
    id: 'PE', name: 'Physical Education Area', floors: 1, roomsPerFloor: 0,
    aliases: ['PHYSICAL EDUCATION'],
    facilities: ['Activity court', 'PE faculty office', 'Equipment storage'],
  },
  { id: 'LINK', name: 'Link Building', floors: 3, roomsPerFloor: 6, estimated: false, facilities: DEFAULT_FACILITIES },
  { id: 'SAL', name: 'SAL Building', floors: 3, roomsPerFloor: 6, estimated: false, facilities: DEFAULT_FACILITIES },
  { id: 'ELEM', name: 'Elementary Building', floors: 3, roomsPerFloor: 6, aliases: ['ELEMENTARY'], facilities: DEFAULT_FACILITIES },
  { id: 'ACAD', name: 'Academic Building', floors: 4, roomsPerFloor: 8, aliases: ['ACADEMIC'], facilities: DEFAULT_FACILITIES },
  { id: 'NGE', name: 'NGE Building', floors: 4, roomsPerFloor: 8, facilities: DEFAULT_FACILITIES },
  // Floor counts below are estimates until exact info is available.
  { id: 'GYM', name: 'Gymnasium', floors: 2, roomsPerFloor: 4, estimated: true, aliases: ['GYMNASIUM'], facilities: ['Gym court', 'Locker rooms', 'Equipment storage'] },
  { id: 'FAO', name: 'FAO Building', floors: 2, roomsPerFloor: 4, estimated: true, facilities: DEFAULT_FACILITIES },
];

export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Compact form used for matching: uppercase, no spaces/dashes ("G-Phys" -> "GPHYS").
const compact = (s) => String(s).toUpperCase().replace(/[\s\-_.]/g, '');

// Every space in a building: { id, buildingId, floor, kind: 'room' | 'facility', code, number, label }
export function spacesOf(building) {
  const out = [];
  building.facilities.forEach((label, i) => {
    out.push({ id: `${building.id}-F${i}`, buildingId: building.id, floor: 1, kind: 'facility', code: null, number: null, label });
  });
  for (let floor = 2; floor <= building.floors; floor++) {
    for (let n = 1; n <= building.roomsPerFloor; n++) {
      const number = String(floor * 100 + n);
      out.push({ id: `${building.id}-${number}`, buildingId: building.id, floor, kind: 'room', code: `${building.id} ${number}`, number, label: `Room ${number}` });
    }
  }
  return out;
}

export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
const SPACES = BUILDINGS.flatMap(spacesOf);
const SPACES_BY_BUILDING = Object.fromEntries(BUILDINGS.map((b) => [b.id, SPACES.filter((s) => s.buildingId === b.id)]));
const KEYS = Object.fromEntries(BUILDINGS.map((b) => [b.id, [b.id, ...(b.aliases || [])].map(compact)]));

export const floorsOf = (buildingId) => Array.from({ length: BUILDING_BY_ID[buildingId].floors }, (_, i) => i + 1);
export const spacesOnFloor = (buildingId, floor) => SPACES_BY_BUILDING[buildingId].filter((s) => s.floor === floor);
export const countsOf = (buildingId) => {
  const all = SPACES_BY_BUILDING[buildingId];
  return { rooms: all.filter((s) => s.kind === 'room').length, facilities: all.filter((s) => s.kind === 'facility').length };
};

// Search: "GLE" -> GLE spaces, "201" -> GLE 201, NGE 201, ..., "gle 6" -> GLE 601..607,
// "clinic" / "activity court" -> matching facilities. Returns { results, total }.
export function searchSpaces(query, limit = 60) {
  const raw = String(query || '').trim();
  if (!raw) return { results: [], total: 0 };
  const q = compact(raw);
  const normal = q.match(/^([A-Z]*)(\d*)$/);
  const swapped = normal ? null : q.match(/^(\d+)([A-Z]+)$/);
  const m = normal || swapped;
  const letters = normal ? normal[1] : swapped ? swapped[2] : '';
  const digits = normal ? normal[2] : swapped ? swapped[1] : '';

  const order = Object.fromEntries(BUILDINGS.map((b, i) => [b.id, i]));
  const byCode = m
    ? SPACES.filter((s) => {
        if (letters && !KEYS[s.buildingId].some((k) => k.startsWith(letters))) return false;
        if (digits) return s.kind === 'room' && s.number.startsWith(digits);
        return true;
      })
    : [];

  // Free-text match on facility names and building names ("pe faculty", "library").
  const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
  const byText = SPACES.filter((s) => {
    if (s.kind !== 'facility') return false;
    const hay = `${s.label} ${BUILDING_BY_ID[s.buildingId].name} ${s.buildingId}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });

  const seen = new Set();
  const merged = [...byCode, ...byText].filter((s) => (seen.has(s.id) ? false : seen.add(s.id)));
  const sorted = merged.sort((a, b) => {
    if (digits) return Number(a.number) - Number(b.number) || order[a.buildingId] - order[b.buildingId];
    return order[a.buildingId] - order[b.buildingId] || a.floor - b.floor || (a.number || '').localeCompare(b.number || '') ;
  });
  return { results: sorted.slice(0, limit), total: sorted.length };
}

// Campus Navigation: interactive vicinity map + building/floor/room browser + room search.
// Building data (floors, rooms, search) lives in packages/shared/src/campusData.js.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, MapPin, ChevronRight } from 'lucide-react';
import {
  BUILDINGS, BUILDING_BY_ID, floorsOf, spacesOnFloor, countsOf, searchSpaces, ordinal,
} from '@shared/src/campusData.js';

// Map geometry (SVG units, viewBox 680 x 606). Each building is a polygon of [x, y] corners.
const GEOMETRY = {
  GYM: [[152, 31], [237, 49], [223, 141], [146, 127]],
  ELEM: [[287, 56], [521, 152], [488, 191], [256, 92]],
  SAL: [[168, 135], [212, 146], [186, 271], [148, 265]],
  PE: [[224, 158], [455, 189], [427, 297], [203, 284]],
  ALLIED: [[70, 233], [134, 233], [130, 449], [50, 442]],
  LINK: [[143, 267], [187, 277], [174, 369], [130, 369]],
  GPHYS: [[202, 286], [395, 304], [390, 334], [189, 321]],
  LRAC: [[179, 323], [407, 338], [400, 381], [164, 363]],
  GLE: [[432, 273], [488, 281], [462, 424], [409, 419]],
  ACAD: [[488, 268], [624, 329], [594, 369], [473, 309]],
  RTL: [[161, 376], [382, 392], [378, 447], [146, 446]],
  FAO: [[269, 442], [401, 449], [401, 477], [261, 472]],
  NGE: [[315, 473], [392, 476], [382, 556], [304, 554]],
};
const BOUNDARY = '130,19 530,41 632,261 576,442 405,579 105,524 48,289';
const ENTRY = { x: 406, y: 558 };
// The map shows the short building code; long codes use a smaller label so they fit.
const LABELS = { GPHYS: 'GPHYS' };

const centroid = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
const toPoints = (pts) => pts.map((p) => p.join(',')).join(' ');

const FILL = { base: '#2a2f2b', lit: '#5d665f', selected: '#e4e5da' };

export default function CampusNavigation() {
  const [buildingId, setBuildingId] = useState(null);
  const [floor, setFloor] = useState(1);
  const [spaceId, setSpaceId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const searchRef = useRef(null);

  const building = buildingId ? BUILDING_BY_ID[buildingId] : null;
  const { results: allResults, total } = useMemo(() => searchSpaces(query, 10000), [query]);
  const results = allResults.slice(0, 60);
  const matchedIds = useMemo(() => new Set(allResults.map((s) => s.buildingId)), [allResults]);

  // Search preview: the highlighted result's building, or the only building the results belong to.
  const previewId = results[activeIdx]?.buildingId || (matchedIds.size === 1 ? [...matchedIds][0] : null);

  useEffect(() => setActiveIdx(-1), [query]);
  useEffect(() => {
    const onDown = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const clearSelection = () => {
    setBuildingId(null); setFloor(1); setSpaceId(null); setQuery(''); setOpen(false);
  };
  const clickBuilding = (id) => {
    if (id === buildingId) return clearSelection();
    setBuildingId(id); setFloor(1); setSpaceId(null); setQuery(''); setOpen(false);
  };
  const pickFloor = (f) => { setFloor(f); setSpaceId(null); };
  const pickResult = (s) => {
    setBuildingId(s.buildingId); setFloor(s.floor); setSpaceId(s.id);
    setQuery(s.code || `${s.buildingId} ${s.label}`); setOpen(false);
  };

  const onSearchKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results.length) { e.preventDefault(); pickResult(results[Math.max(activeIdx, 0)]); }
    else if (e.key === 'Escape') { open ? setOpen(false) : setQuery(''); }
  };
  useEffect(() => {
    if (activeIdx < 0) return;
    document.getElementById(`search-opt-${activeIdx}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const floorSpaces = building ? spacesOnFloor(building.id, floor) : [];
  const counts = building ? countsOf(building.id) : null;
  const selectedSpace = floorSpaces.find((s) => s.id === spaceId);

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* ---------- Map + search ---------- */}
      <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-maroon">Campus overview</p>
            <h2 className="font-display text-2xl font-bold text-gray-900">Interactive vicinity map</h2>
          </div>
          <p className="text-xs text-gray-600">Hover or tap a building</p>
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative z-20 mt-5">
          <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 focus-within:border-maroon focus-within:ring-2 focus-within:ring-maroon/20">
            <Search size={17} className="shrink-0 text-gray-600" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={onSearchKey}
              placeholder="Search a room or building, e.g. GLE, 201, GLE 604, clinic"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              role="combobox"
              aria-expanded={open && results.length > 0}
              aria-controls="search-listbox"
              aria-activedescendant={activeIdx >= 0 ? `search-opt-${activeIdx}` : undefined}
              aria-label="Search rooms and buildings"
              autoComplete="off"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setOpen(false); }} className="rounded-full p-1 text-gray-600 hover:bg-gray-100" aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </div>

          {open && query.trim() && (
            <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              {results.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-600">No rooms match "{query.trim()}". Try a building code like GLE or a room number like 201.</p>
              ) : (
                <>
                  <ul id="search-listbox" role="listbox" className="max-h-72 overflow-y-auto py-1">
                    {results.map((s, i) => (
                      <li
                        key={s.id}
                        id={`search-opt-${i}`}
                        role="option"
                        aria-selected={i === activeIdx}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickResult(s)}
                        onMouseEnter={() => setActiveIdx(i)}
                        className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm ${i === activeIdx ? 'bg-maroon-light' : ''}`}
                      >
                        <span className="font-semibold text-gray-900">{s.code || s.label}</span>
                        <span className="truncate text-xs text-gray-600">
                          {s.kind === 'facility' ? `${s.buildingId}, ` : ''}{ordinal(s.floor)} floor, {BUILDING_BY_ID[s.buildingId].name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {total > results.length && (
                    <p className="border-t border-gray-200 px-4 py-2 text-xs text-gray-600">Showing {results.length} of {total}. Keep typing to narrow the list.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="mx-auto mt-5 max-w-[680px] overflow-hidden rounded-3xl bg-[#111410] shadow-lg">
          <svg viewBox="0 0 680 606" className="block w-full" role="group" aria-label="Campus map">
            <polygon points={BOUNDARY} fill="none" stroke="#3a403b" strokeWidth="3" strokeLinejoin="round" />
            <path d="M115 14 C122 120 104 330 90 530" stroke="#080908" strokeWidth="30" strokeLinecap="round" fill="none" />
            <path d="M545 39 C495 92 470 200 440 330 S418 500 418 590" stroke="#080908" strokeWidth="30" strokeLinecap="round" fill="none" />

            {BUILDINGS.map((b) => {
              const pts = GEOMETRY[b.id];
              if (!pts) return null;
              const [cx, cy] = centroid(pts);
              const selected = b.id === buildingId;
              const lit = !selected && (b.id === hoverId || b.id === previewId);
              const matched = !selected && !lit && query.trim() && matchedIds.has(b.id);
              return (
                <g
                  key={b.id}
                  className="group cursor-pointer outline-none"
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`${b.name}, ${b.floors} ${b.floors === 1 ? 'floor' : 'floors'}`}
                  onMouseEnter={() => setHoverId(b.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => clickBuilding(b.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickBuilding(b.id); } }}
                >
                  <polygon
                    points={toPoints(pts)}
                    className="transition-[fill,stroke] duration-150 group-focus-visible:stroke-gold-light"
                    style={{
                      fill: selected ? FILL.selected : lit ? FILL.lit : FILL.base,
                      stroke: selected ? '#8B353D' : matched ? '#D9BC4A' : '#4b524c',
                      strokeWidth: selected || matched ? 2.5 : 1,
                      filter: selected ? 'drop-shadow(0 0 16px rgba(228,229,218,0.35))' : undefined,
                    }}
                    strokeLinejoin="round"
                  />
                  <text
                    x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                    className="pointer-events-none select-none transition-[fill] duration-150"
                    style={{ fill: selected ? '#1b1d1b' : lit ? '#ffffff' : '#c9cfc8', fontSize: 14, fontWeight: 700 }}
                  >
                    {LABELS[b.id] || b.id}
                  </text>
                </g>
              );
            })}

            <circle cx={ENTRY.x} cy={ENTRY.y} r="10" fill="#8B353D" />
            <text x={ENTRY.x + 18} y={ENTRY.y + 4} style={{ fill: '#a4aaa3', fontSize: 11, fontWeight: 600 }}>MAIN ENTRY</text>

            <g transform="translate(576 79)" aria-hidden="true">
              <circle r="30" fill="none" stroke="#6b726c" strokeWidth="2" />
              <path d="M0 -26 L7 6 L0 0 L-7 6 Z" fill="#c9cfc8" />
              <path d="M-38 0 H38 M0 -38 V38" stroke="#6b726c" strokeWidth="1.5" />
              <text y="-42" textAnchor="middle" style={{ fill: '#c9cfc8', fontSize: 12, fontWeight: 700 }}>N</text>
            </g>
          </svg>
        </div>
        <p className="mt-3 text-center text-xs text-gray-600">
          Buildings brighten on hover and stay highlighted when selected. Select the building again, or use Deselect, to clear it.
        </p>
      </div>

      {/* ---------- Details panel ---------- */}
      <aside className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-6 lg:self-start" aria-live="polite">
        {!building ? (
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-light text-maroon"><MapPin size={20} /></span>
              <div>
                <p className="text-xs font-semibold text-maroon">No building selected</p>
                <h3 className="font-display text-xl font-bold text-gray-900">Pick a building</h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">Select a building on the map, or search for a room, to see its floors and rooms.</p>
            <ul className="mt-5 grid grid-cols-2 gap-2">
              {BUILDINGS.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => clickBuilding(b.id)}
                    onMouseEnter={() => setHoverId(b.id)}
                    onMouseLeave={() => setHoverId(null)}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-left text-sm transition-colors hover:bg-maroon-light"
                  >
                    <span className="font-semibold text-gray-900">{b.id}</span>
                    <span className="text-xs text-gray-600">{b.floors} {b.floors === 1 ? 'floor' : 'floors'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-3">
              <span className="flex h-12 min-w-12 items-center justify-center rounded-2xl bg-maroon-light px-2 text-sm font-bold text-maroon">{building.id}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-maroon">Selected building</p>
                <h3 className="font-display text-xl font-bold leading-tight text-gray-900">{building.name}</h3>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-maroon-light"
              >
                <X size={13} /> Deselect
              </button>
            </div>

            {building.estimated && (
              <p className="mt-3 rounded-lg bg-gold-soft px-3 py-2 text-xs text-gold dark:bg-transparent">Floor count is an estimate until the exact details are confirmed.</p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-200 px-4 py-3">
                <p className="font-display text-xl font-bold text-gray-900">{building.floors}</p>
                <p className="text-xs text-gray-600">{building.floors === 1 ? 'floor' : 'floors'}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 px-4 py-3">
                <p className="font-display text-xl font-bold text-gray-900">{counts.rooms || counts.facilities}</p>
                <p className="text-xs text-gray-600">{counts.rooms ? 'rooms' : 'facility spaces'}</p>
              </div>
            </div>

            <div className="mt-6 flex items-baseline justify-between">
              <h4 className="font-display text-base font-bold text-gray-900">Select a floor</h4>
              <span className="text-xs text-gray-600">Floor {floor} of {building.floors}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {floorsOf(building.id).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => pickFloor(f)}
                  aria-pressed={f === floor}
                  aria-label={`${ordinal(f)} floor`}
                  className={`h-10 w-10 rounded-xl text-sm font-bold transition-colors ${f === floor ? 'bg-maroon text-white' : 'border border-gray-300 text-gray-700 hover:bg-maroon-light'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-5">
              <div className="flex items-baseline justify-between">
                <h4 className="font-display text-base font-bold text-gray-900">{floor === 1 ? 'Facilities' : 'Rooms'}</h4>
                <span className="text-xs text-gray-600">{floorSpaces.length} {floor === 1 ? 'spaces' : 'rooms'}</span>
              </div>

              {floor === 1 ? (
                <ul className="mt-3 space-y-2">
                  {floorSpaces.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSpaceId(s.id === spaceId ? null : s.id)}
                        aria-pressed={s.id === spaceId}
                        className={`w-full rounded-xl border border-l-4 px-4 py-2.5 text-left transition-colors ${s.id === spaceId ? 'border-maroon bg-maroon text-white' : 'border-gray-200 border-l-gold hover:bg-maroon-light'}`}
                      >
                        <span className="block text-sm font-semibold">{s.label}</span>
                        <span className={`block text-xs ${s.id === spaceId ? 'text-white/80' : 'text-gray-600'}`}>1st floor, {building.id}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                  {floorSpaces.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSpaceId(s.id === spaceId ? null : s.id)}
                        aria-pressed={s.id === spaceId}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${s.id === spaceId ? 'border-maroon bg-maroon text-white' : 'border-gray-200 text-gray-900 hover:bg-maroon-light'}`}
                      >
                        {s.code}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selectedSpace && (
                <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-600">
                  <ChevronRight size={13} className="text-maroon" />
                  {selectedSpace.code || selectedSpace.label} is on the {ordinal(floor)} floor of {building.name}.
                </p>
              )}
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}

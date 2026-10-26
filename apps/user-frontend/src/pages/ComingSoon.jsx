// Placeholder for features that are planned but not built yet.
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import CampusMapArt from '../components/CampusMapArt.jsx';

export default function ComingSoon({ title }) {
  return (
    <section className="roads relative flex min-h-[420px] items-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-maroon to-maroon-dark p-8 text-white shadow-xl sm:p-12">
      <CampusMapArt className="pointer-events-none absolute -right-24 top-1/2 w-[110%] max-w-none -translate-y-1/2 opacity-50 sm:w-[70%]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-maroon-dark via-maroon/70 to-transparent" />
      <div className="relative z-10 max-w-md">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-light backdrop-blur">
          <Compass size={13} /> Route in progress
        </p>
        <h2 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/80">This stop is not on the map yet. It is part of an upcoming sprint.</p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-maroon shadow-lg transition-all hover:-translate-y-0.5"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    </section>
  );
}

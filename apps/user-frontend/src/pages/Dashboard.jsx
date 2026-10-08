// Home dashboard, modeled on the WITS home screen. Replace the centre card with widgets later.
import backdrop from '@shared/assets/login-backdrop.png';
import { portal } from '../config/portalConfig.js';

export default function Dashboard() {
  const admin = portal.key === 'admin';
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-4xl font-normal">WELCOME!</h1>
      <div className="relative flex flex-1 items-center justify-center py-16">
        <img src={backdrop} alt="" className="absolute h-[420px] max-w-full object-contain opacity-30" />
        <div className="relative rounded-[28px] bg-white px-10 py-12 text-center shadow-xl md:px-24">
          <p className="text-4xl text-gold">CAMPUS LOCATE</p>
          <p className="text-3xl text-maroon md:text-5xl">{admin ? 'ADMIN DASHBOARD' : 'CIT UNIVERSITY CAMPUS PORTAL'}</p>
        </div>
      </div>
    </div>
  );
}

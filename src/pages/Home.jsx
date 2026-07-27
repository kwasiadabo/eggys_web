import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Droplets, Truck, Egg } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import FarmHorizon from '../components/farm/FarmHorizon';
import SectionWave from '../components/farm/SectionWave';

const FEATURES = [
  { icon: Sprout, title: 'Pasture-Raised', desc: 'Hens roam free on local Ghanaian farms, not cages.' },
  { icon: Droplets, title: 'Washed & Graded', desc: 'Every egg is cleaned, checked and sized by hand.' },
  { icon: Truck, title: 'Delivered Fresh', desc: 'From the coop to your door, often within the same day.' },
];

export default function Home() {
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    api.get('/products/recommendations')
      .then((res) => setRecommended(res.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-farm-fade text-white">
        {/* soft sunrise glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-green/25 blur-3xl sm:right-16 sm:translate-x-0"
        />

        <div className="relative w-full mx-auto max-w-6xl px-4 pt-20 pb-40 sm:pt-24 sm:pb-48 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-green-light">
            <Egg size={13} strokeWidth={2} fill="currentColor" />
            Farm-Fresh Eggs
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 leading-tight text-balance">
            Fresh From the Farm, To Your Door
          </h1>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Farm-fresh eggs from Ghana's best local producers, delivered to your door.
          </p>
          <Link
            to="/products"
            className="inline-block mt-8 px-8 py-3 rounded-full bg-green text-white text-sm tracking-wide hover:bg-green-light transition-colors"
          >
            Order Your Eggs
          </Link>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/50">
            {FEATURES.map(({ icon: Icon, title }) => (
              <li key={title} className="flex items-center gap-1.5">
                <Icon size={15} strokeWidth={2} className="text-green-light" />
                {title}
              </li>
            ))}
          </ul>
        </div>

        {/* farm horizon silhouette */}
        <FarmHorizon className="absolute inset-x-0 bottom-0 h-28 sm:h-36 w-full text-green-light" />

        {/* transition into cream content below */}
        <SectionWave className="absolute inset-x-0 -bottom-px text-cream" />
      </section>

      <section className="w-full mx-auto max-w-6xl px-4 pt-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-black/5 bg-white px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-light/25 text-green">
                <Icon size={18} strokeWidth={2} />
              </span>
              <p className="mt-4 font-display text-lg">{title}</p>
              <p className="mt-1 text-sm text-black/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl text-center">Recommended for You</h2>
        {recommended.length ? (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommended.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-2 text-black/40">
            <Egg size={22} strokeWidth={1.5} />
            <p className="text-sm">Our collection is being stocked — check back soon.</p>
          </div>
        )}
      </section>
    </div>
  );
}

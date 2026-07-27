import { Link } from 'react-router-dom';
import { Bird } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24 text-center">
      <div>
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-light/25 text-green">
          <Bird size={28} strokeWidth={1.5} />
        </span>
        <p className="mt-5 text-xs uppercase tracking-[0.3em] text-green">404</p>
        <h1 className="font-display text-4xl mt-4">This hen has wandered off</h1>
        <p className="mt-3 text-black/50 max-w-sm mx-auto">
          The page you're looking for doesn't exist or may have moved back to the coop.
        </p>
        <Link
          to="/"
          className="inline-block mt-8 px-8 py-3 rounded-full bg-ink text-white text-sm hover:bg-green transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

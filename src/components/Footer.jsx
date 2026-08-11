import { Link } from 'react-router-dom';
import { Phone, MessageCircle, Wheat } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import SectionWave from './farm/SectionWave';

export default function Footer() {
	const cartCount = useCartStore((s) =>
		s.items.reduce((sum, i) => sum + i.quantity, 0),
	);
	return (
		<footer className="relative bg-ink-deep text-white/70 mt-auto pt-10 sm:pt-14">
			<SectionWave className="absolute inset-x-0 top-0 text-ink-deep pointer-events-none" />

			{/* Full footer — sm and up */}
			<div className="hidden sm:grid w-full mx-auto max-w-6xl px-4 py-10 gap-8 md:grid-cols-3">
				<div>
					<p className="flex items-center gap-2 font-display text-xl tracking-widest text-white">
						<Wheat size={18} strokeWidth={2} className="text-green" />
						EGG<span className="text-green">YS</span>
					</p>
					<p className="mt-2.5 text-sm leading-relaxed">
						Farm-fresh eggs from our organically raised chickens, delivered to
						your doorstep at Balloon Gate. We prioritize quality,
						sustainability, and customer satisfaction.
					</p>
				</div>

				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-green">
						Contact Us
					</p>
					<ul className="mt-3 space-y-2 text-sm">
						<li>
							<a
								href="tel:+233509746580"
								className="hover:text-green transition-colors"
							>
								Phone: +233 50 974 6580
							</a>
						</li>
						<li>
							<a
								href="https://wa.me/233509746580"
								target="_blank"
								rel="noreferrer"
								className="hover:text-green transition-colors"
							>
								WhatsApp: +233 50 974 6580
							</a>
						</li>
						<li>
							<a
								href="mailto:info@eggys.store"
								className="hover:text-green transition-colors break-all"
							>
								Email: eggysgh@gmail.com
							</a>
						</li>
					</ul>
				</div>

				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-green">
						Quick Links
					</p>
					<ul className="mt-3 space-y-2 text-sm">
						<li>
							<Link
								to="/products"
								className="hover:text-green transition-colors"
							>
								Shop the Collection
							</Link>
						</li>
						<li>
							<Link
								to="/favorites"
								className="hover:text-green transition-colors"
							>
								Favourites
							</Link>
						</li>
						{cartCount > 0 && (
							<li>
								<Link to="/cart" className="hover:text-green transition-colors">
									Cart
								</Link>
							</li>
						)}
						<li>
							<Link
								to="/account"
								className="hover:text-green transition-colors"
							>
								My Account
							</Link>
						</li>
						<li>
							<Link
								to="/track-order"
								className="hover:text-green transition-colors"
							>
								Track Order
							</Link>
						</li>
						<li>
							<Link to="/rider" className="hover:text-green transition-colors">
								Rider Portal
							</Link>
						</li>
					</ul>
				</div>
			</div>

			{/* Condensed footer — phone screens only */}
			<div className="sm:hidden w-full mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
				<p className="font-display text-base tracking-widest text-white">
					EGG<span className="text-green">YS</span>
				</p>
				<div className="flex items-center gap-1">
					<a
						href="tel:050 974 6580"
						aria-label="Call us"
						className="flex h-11 w-11 items-center justify-center text-white/70 hover:text-green transition-colors"
					>
						<Phone size={18} />
					</a>
					<a
						href="https://wa.me/050 974 6580"
						target="_blank"
						rel="noreferrer"
						aria-label="Message us on WhatsApp"
						className="flex h-11 w-11 items-center justify-center text-white/70 hover:text-green transition-colors"
					>
						<MessageCircle size={18} />
					</a>
				</div>
			</div>

			<div className="border-t border-white/10">
				<p className="w-full mx-auto max-w-6xl px-4 py-2 sm:py-4 text-center text-[11px] sm:text-xs text-white/40">
					© {new Date().getFullYear()} Eggys · Farm-Fresh Eggs · Secured
					payments
				</p>
			</div>
		</footer>
	);
}

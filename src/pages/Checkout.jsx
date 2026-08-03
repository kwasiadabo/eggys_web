import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { money } from '../lib/format';

export default function Checkout() {
	const { items, clear } = useCartStore();
	const user = useAuthStore((s) => s.user);
	const toast = useToastStore((s) => s.show);
	const navigate = useNavigate();
	const [checkingOutAsGuest, setCheckingOutAsGuest] = useState(false);
	const [guest, setGuest] = useState({ name: '', email: '', phone: '' });
	const [delivery, setDelivery] = useState({ area: '' });
	const [fees, setFees] = useState([]);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	// Asked once at checkout: if the buyer is standing at the delivery spot,
	// grabbing coordinates here is the most reliable way to get the rider an
	// accurate pin — free-text addresses alone are often ambiguous.
	const [atDeliveryLocation, setAtDeliveryLocation] = useState(null); // null | true | false
	const [coords, setCoords] = useState(null); // { lat, lng } | null
	const [locating, setLocating] = useState(false);
	const [locationError, setLocationError] = useState('');

	const answerAtDeliveryLocation = (value) => {
		setAtDeliveryLocation(value);
		setLocationError('');
		if (!value) {
			setCoords(null);
			return;
		}
		if (!navigator.geolocation) {
			setLocationError(
				"Your browser doesn't support sharing location — no problem, you can still check out.",
			);
			return;
		}
		setLocating(true);
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
				setLocating(false);
			},
			() => {
				setLocationError(
					"Couldn't get your location — no problem, you can still check out.",
				);
				setLocating(false);
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	};

	useEffect(() => {
		api
			.get('/delivery-fees')
			.then((res) => setFees(res.data))
			.catch(() => {});
	}, []);

	// If the browser already has geolocation permission granted for this site
	// (from an earlier visit), pick up the location right away instead of
	// making the buyer click "Yes" again to re-trigger a prompt that won't show.
	useEffect(() => {
		if (!navigator.permissions?.query) return;
		let permissionStatus;
		const handleChange = () => {
			if (permissionStatus.state === 'granted') answerAtDeliveryLocation(true);
		};
		navigator.permissions
			.query({ name: 'geolocation' })
			.then((status) => {
				permissionStatus = status;
				handleChange();
				status.addEventListener('change', handleChange);
			})
			.catch(() => {});
		return () => permissionStatus?.removeEventListener('change', handleChange);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const setField = (key) => (e) =>
		setDelivery({ ...delivery, [key]: e.target.value });

	const shippingCost = Number(fees[0]?.fee ?? 20);

	const subtotal = items.reduce(
		(sum, i) => sum + Number(i.product.price) * i.quantity,
		0,
	);
	const total = subtotal + shippingCost;

	if (!user && !checkingOutAsGuest) {
		return (
			<div className="text-center py-24">
				<h1 className="font-display text-3xl">Checkout</h1>
				<p className="mt-3 text-black/50 text-sm">
					Sign in for order history and faster checkout next time, or continue
					without an account.
				</p>
				<div className="mt-8 flex flex-col items-center gap-3">
					<button
						onClick={() => navigate('/login')}
						className="px-8 py-3 rounded-full bg-ink text-white text-sm hover:bg-green transition-colors"
					>
						Sign in
					</button>
					<button
						onClick={() => setCheckingOutAsGuest(true)}
						className="text-sm text-black/60 hover:text-green underline underline-offset-2"
					>
						Continue as guest
					</button>
				</div>
			</div>
		);
	}

	const placeOrder = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		setError('');
		try {
			let data;
			const locationFields = coords
				? { latitude: coords.lat, longitude: coords.lng }
				: {};
			if (user) {
				// Sync local cart to the server cart, then create the order
				await api.delete('/cart').catch(() => {});
				for (const item of items) {
					await api.post('/cart/items', {
						productId: item.product.id,
						quantity: item.quantity,
					});
				}
				({ data } = await api.post('/orders', {
					...delivery,
					shippingCost,
					...locationFields,
				}));
			} else {
				// Guest checkout — no server-side cart to build from, so the local
				// cart items are sent directly alongside the guest's contact info.
				({ data } = await api.post('/orders', {
					...delivery,
					shippingCost,
					...locationFields,
					guestName: guest.name,
					guestEmail: guest.email,
					guestPhone: guest.phone,
					items: items.map((i) => ({
						productId: i.product.id,
						quantity: i.quantity,
					})),
				}));
			}
			clear();
			window.location.href = data.paymentUrl; // hand off to Paystack
		} catch (err) {
			if (err.response?.status === 401) {
				// the api client already cleared the stale session; explain the bounce
				// back to the sign-in gate instead of leaving it unexplained
				toast(
					'Your session expired — please sign in again or continue as guest.',
					'error',
				);
			} else {
				setError(
					err.response?.data?.error ||
						'Could not place order. Please try again.',
				);
			}
			setSubmitting(false);
		}
	};

	const inputClass =
		'w-full px-4 py-3 border border-black/15 rounded-lg bg-white text-sm focus:outline-none focus:border-green';
	const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

	return (
		<div className="w-full mx-auto max-w-lg px-4 py-12">
			<h1 className="font-display text-4xl">Checkout</h1>
			<form onSubmit={placeOrder} className="mt-8 space-y-4">
				{!user && (
					<div className="bg-white border border-black/5 rounded-lg p-4 space-y-3">
						<p className="text-xs uppercase tracking-[0.2em] text-green">
							Contact Details
						</p>
						<label className={labelClass}>
							Full name *
							<input
								required
								value={guest.name}
								onChange={(e) => setGuest({ ...guest, name: e.target.value })}
								className={inputClass}
							/>
						</label>
						<div className="grid grid-cols-2 gap-3">
							<label className={labelClass}>
								Email
								<input
									type="email"
									value={guest.email}
									onChange={(e) =>
										setGuest({ ...guest, email: e.target.value })
									}
									className={inputClass}
								/>
							</label>
							<label className={labelClass}>
								Phone *
								<input
									required
									type="tel"
									value={guest.phone}
									onChange={(e) =>
										setGuest({ ...guest, phone: e.target.value })
									}
									className={inputClass}
								/>
							</label>
						</div>
						<p className="text-xs text-black/40">
							We'll text order updates to this number — keep your order number
							and these details to track it later.
						</p>
					</div>
				)}
				<div className="bg-white border border-black/5 rounded-lg p-4 space-y-3">
					<p className="text-xs uppercase tracking-[0.2em] text-green">
						Delivery Details
					</p>
					<label className={labelClass}>
						RGMC Link/Block, Flat/House No. *
						<input
							required
							value={delivery.area}
							onChange={setField('area')}
							className={inputClass}
						/>
					</label>
					<div className="pt-1">
						<p className={labelClass}>
							Are you checking out from where this should be delivered?
						</p>
						<div className="mt-1.5 flex gap-2">
							<button
								type="button"
								onClick={() => answerAtDeliveryLocation(true)}
								className={`px-4 py-2 rounded-full text-sm border transition-colors ${
									atDeliveryLocation === true
										? 'bg-green text-white border-green'
										: 'border-black/15 hover:border-green hover:text-green'
								}`}
							>
								Yes
							</button>
							<button
								type="button"
								onClick={() => answerAtDeliveryLocation(false)}
								className={`px-4 py-2 rounded-full text-sm border transition-colors ${
									atDeliveryLocation === false
										? 'bg-ink text-white border-ink'
										: 'border-black/15 hover:border-black'
								}`}
							>
								No
							</button>
						</div>
						{locating && (
							<p className="mt-1.5 text-xs text-black/40">
								Getting your location…
							</p>
						)}
						{coords && (
							<p className="mt-1.5 flex items-center gap-1 text-xs text-green">
								<MapPin size={12} strokeWidth={2} /> Location shared — this
								helps your rider find you faster.
							</p>
						)}
						{locationError && (
							<p className="mt-1.5 text-xs text-black/40">{locationError}</p>
						)}
					</div>
				</div>
				<div className="bg-white border border-black/5 rounded-lg p-4 text-sm space-y-1">
					<div className="flex justify-between">
						<span>Subtotal</span>
						<span>GHS {money(subtotal)}</span>
					</div>
					<div className="flex justify-between">
						<span>Delivery</span>
						<span>GHS {money(shippingCost)}</span>
					</div>
					<div className="flex justify-between font-medium text-base pt-2 border-t border-black/10">
						<span>Total</span>
						<span>GHS {money(total)}</span>
					</div>
				</div>
				{error && <p className="text-red-600 text-sm">{error}</p>}
				<button
					type="submit"
					disabled={submitting || !items.length}
					className="w-full py-3 rounded-full bg-ink text-white text-sm hover:bg-green transition-colors disabled:opacity-40"
				>
					{submitting
						? 'Redirecting to Payment Portal…'
						: `Pay GHS ${money(total)}`}
				</button>
				<p className="text-xs text-black/40 text-center">
					Secured by Variable-X · Card & Mobile Money accepted · SMS
					confirmation VX
				</p>
			</form>
		</div>
	);
}

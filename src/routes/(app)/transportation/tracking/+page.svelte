<script lang="ts">
	import { onMount } from 'svelte';

	let title = 'Vehicle & Driver Schedule';

	// Calendar state
	let currentDate = new Date();
	let viewMode: 'vehicles' | 'drivers' = 'vehicles';
	let selectedResource = 'all';

	const COLORS = ['#667eea','#48bb78','#f6ad55','#ed64a6','#4299e1','#9f7aea','#f56565','#38b2ac'];

	interface CalendarVehicle { id: string; name: string; type: string; licensePlate: string; color: string; }
	interface CalendarDriver  { id: string; name: string; licenseNumber: string; color: string; }
	interface CalendarBooking { id: string; vehicleId: string; driverId: string; requestor: string; startTime: Date; endTime: Date; fromLocation: string; toLocation: string; status: string; }

	let vehicles: CalendarVehicle[] = [];
	let drivers: CalendarDriver[] = [];
	let bookings: CalendarBooking[] = [];

	onMount(async () => {
		const [vRes, dRes, bRes] = await Promise.allSettled([
			fetch('/api/v1/vehicles?limit=1000').then(r => r.json()),
			fetch('/api/v1/users?role=driver&limit=1000').then(r => r.json()),
			fetch('/api/v1/transport/requests?limit=1000').then(r => r.json()),
		]);

		if (vRes.status === 'fulfilled' && vRes.value.success) {
			const mapped = (vRes.value.data ?? []).map((v: any, i: number) => ({
				id: v._id,
				name: `${v.brand} ${v.model}`,
				type: v.vehicleType,
				licensePlate: v.licensePlate,
				color: COLORS[i % COLORS.length]
			}));
			vehicles = [...mapped, { id: 'unassigned', name: 'Unassigned', type: '', licensePlate: '—', color: '#aaa' }];
		}
		if (dRes.status === 'fulfilled' && dRes.value.success) {
			const mapped = (dRes.value.data ?? []).map((d: any, i: number) => ({
				id: d._id,
				name: `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || d.email || d.userId,
				licenseNumber: d.licenseNumber ?? '',
				color: COLORS[i % COLORS.length]
			}));
			drivers = [...mapped, { id: 'unassigned', name: 'Unassigned', licenseNumber: '', color: '#aaa' }];
		}
		if (bRes.status === 'fulfilled' && bRes.value.success) {
			bookings = (bRes.value.data ?? [])
				.filter((b: any) => !['cancelled', 'rejected', 'pending'].includes(b.status))
				.map((b: any) => {
					const start = new Date(b.scheduledTime);
					const end = b.returnTime
						? new Date(b.returnTime)
						: new Date(start.getTime() + 60 * 60 * 1000); // default 1h
					return {
						id: b._id,
						vehicleId: b.vehicleId || '',
						driverId: b.driverId || '',
						requestor: b.userName || b.userEmail || b.requestNumber,
						startTime: start,
						endTime: end,
						fromLocation: b.pickup?.address ?? '',
						toLocation: b.destination?.address ?? '',
						status: b.status
					};
				});
		}
	});

	$: resources = viewMode === 'vehicles' ? vehicles : drivers;
	$: filteredBookings = selectedResource === 'all'
		? bookings
		: bookings.filter(b => {
			const id = viewMode === 'vehicles' ? b.vehicleId : b.driverId;
			const resolved = (id && resources.some(r => r.id === id)) ? id : 'unassigned';
			return resolved === selectedResource;
		});

	$: timeSlots = generateTimeSlots();
	$: weekDays = getWeekDays(currentDate);

	function generateTimeSlots() {
		const slots = [];
		for (let hour = 7; hour <= 20; hour++) {
			slots.push(`${hour.toString().padStart(2, '0')}:00`);
		}
		return slots;
	}

	function getWeekDays(date: Date) {
		const days = [];
		const startOfWeek = new Date(date);
		const day = startOfWeek.getDay();
		const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
		startOfWeek.setDate(diff);

		for (let i = 0; i < 7; i++) {
			const dayDate = new Date(startOfWeek);
			dayDate.setDate(startOfWeek.getDate() + i);
			days.push(dayDate);
		}
		return days;
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
	}

	function previousWeek() {
		currentDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
	}

	function nextWeek() {
		currentDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
	}

	function today() {
		currentDate = new Date();
	}

	function resolveResourceId(booking: CalendarBooking): string {
		const id = viewMode === 'vehicles' ? booking.vehicleId : booking.driverId;
		return (id && resources.some(r => r.id === id)) ? id : 'unassigned';
	}

	function getBookingsForTimeSlot(time: string, dayDate: Date, resourceId: string) {
		const [hour] = time.split(':').map(Number);
		return filteredBookings.filter(booking => {
			if (resolveResourceId(booking) !== resourceId) return false;
			if (booking.startTime.toDateString() !== dayDate.toDateString()) return false;
			return booking.startTime.getHours() <= hour && hour < booking.endTime.getHours();
		});
	}

	function getResourceColor(resourceId: string): string {
		if (viewMode === 'vehicles') {
			return vehicles.find(v => v.id === resourceId)?.color || '#999';
		} else {
			return drivers.find(d => d.id === resourceId)?.color || '#999';
		}
	}

	function getBookingDuration(booking: any): number {
		return (booking.endTime - booking.startTime) / (1000 * 60 * 60);
	}

	function getResourceName(id: string, type: 'vehicle' | 'driver'): string {
		if (type === 'vehicle') {
			const vehicle = vehicles.find(v => v.id === id);
			return vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : 'Unknown Vehicle';
		} else {
			const driver = drivers.find(d => d.id === id);
			return driver?.name || 'Unknown Driver';
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="calendar-page">
	<div class="header">
		<div>
			<h1>Vehicle & Driver Schedule</h1>
			<p class="subtitle">View transportation bookings and availability</p>
		</div>
		<a href="/transportation/request" class="btn-primary">Request Transport</a>
	</div>

	<!-- Controls -->
	<div class="controls">
		<div class="view-controls">
			<button class="btn-nav" on:click={previousWeek}>← Previous</button>
			<button class="btn-today" on:click={today}>Today</button>
			<button class="btn-nav" on:click={nextWeek}>Next →</button>
		</div>

		<div class="filter-controls">
			<div class="toggle-group">
				<button
					class="toggle-btn {viewMode === 'vehicles' ? 'active' : ''}"
					on:click={() => { viewMode = 'vehicles'; selectedResource = 'all'; }}
				>
					🚗 Vehicles
				</button>
				<button
					class="toggle-btn {viewMode === 'drivers' ? 'active' : ''}"
					on:click={() => { viewMode = 'drivers'; selectedResource = 'all'; }}
				>
					👨‍✈️ Drivers
				</button>
			</div>

			<select bind:value={selectedResource} class="resource-filter">
				<option value="all">All {viewMode === 'vehicles' ? 'Vehicles' : 'Drivers'}</option>
				{#each resources as resource}
					<option value={resource.id}>
						{viewMode === 'vehicles' ? `${resource.name} - ${resource.licensePlate}` : resource.name}
					</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Calendar View -->
	<div class="calendar-container">
		<div class="week-view">
			<!-- Header with days -->
			<div class="calendar-header">
				<div class="time-column-header">Time</div>
				{#each weekDays as day}
					<div class="day-header {day.toDateString() === new Date().toDateString() ? 'today' : ''}">
						<div class="day-name">{formatDate(day)}</div>
					</div>
				{/each}
			</div>

			<!-- Time slots -->
			<div class="calendar-body">
				{#each timeSlots as timeSlot}
					<div class="time-row">
						<div class="time-label">{timeSlot}</div>
						{#each weekDays as day}
							<div class="time-cell">
								{#if selectedResource === 'all'}
									<!-- Show all resources' bookings -->
									{#each resources as resource}
										{@const cellBookings = getBookingsForTimeSlot(timeSlot, day, resource.id)}
										{#each cellBookings as booking}
											{@const isStart = booking.startTime.getHours() === parseInt(timeSlot.split(':')[0])}
											{#if isStart}
												<div
													class="booking-block {booking.status}"
													style="background: {getResourceColor(viewMode === 'vehicles' ? booking.vehicleId : booking.driverId)}; height: {getBookingDuration(booking) * 60}px;"
													title="{booking.requestor} - {booking.fromLocation} to {booking.toLocation}"
												>
													<div class="booking-title">{booking.requestor}</div>
													<div class="booking-resource">
														{viewMode === 'vehicles' ? getResourceName(booking.vehicleId, 'vehicle') : getResourceName(booking.driverId, 'driver')}
													</div>
													<div class="booking-route">{booking.fromLocation} → {booking.toLocation}</div>
													<div class="booking-time">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
												</div>
											{/if}
										{/each}
									{/each}
								{:else}
									<!-- Show selected resource's bookings -->
									{@const cellBookings = getBookingsForTimeSlot(timeSlot, day, selectedResource)}
									{#each cellBookings as booking}
										{@const isStart = booking.startTime.getHours() === parseInt(timeSlot.split(':')[0])}
										{#if isStart}
											<div
												class="booking-block {booking.status}"
												style="background: {getResourceColor(selectedResource)}; height: {getBookingDuration(booking) * 60}px;"
												title="{booking.requestor}"
											>
												<div class="booking-title">{booking.requestor}</div>
												<div class="booking-route">{booking.fromLocation} → {booking.toLocation}</div>
												<div class="booking-time">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
												<div class="booking-status">{booking.status === 'in_progress' ? '🚗 In Progress' : booking.status === 'assigned' ? '✅ Driver Assigned' : booking.status === 'approved' ? '⏳ Awaiting Assignment' : booking.status === 'completed' ? '☑️ Done' : booking.status}</div>
											</div>
										{/if}
									{/each}
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Legend -->
	<div class="legend">
		<h3>{viewMode === 'vehicles' ? 'Vehicles' : 'Drivers'}</h3>
		<div class="legend-items">
			{#each resources as resource}
				<div class="legend-item">
					<span class="legend-color" style="background: {resource.color}"></span>
					<span>
						{#if viewMode === 'vehicles'}
							{resource.name} ({resource.licensePlate})
						{:else}
							{resource.name}
						{/if}
					</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.calendar-page {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
	}

	.header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin: 0.5rem 0 0 0;
	}

	.btn-primary {
		padding: 0.75rem 2rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		gap: 1rem;
	}

	.view-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.filter-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.toggle-group {
		display: flex;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		overflow: hidden;
	}

	.toggle-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		background: white;
		color: #666;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle-btn.active {
		background: #667eea;
		color: white;
	}

	.btn-nav, .btn-today {
		padding: 0.75rem 1.5rem;
		border: 2px solid #667eea;
		border-radius: 8px;
		background: white;
		color: #667eea;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-today {
		background: #667eea;
		color: white;
	}

	.btn-nav:hover, .btn-today:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}

	.resource-filter {
		padding: 0.75rem 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		min-width: 250px;
	}

	.calendar-container {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		overflow-x: auto;
		margin-bottom: 2rem;
	}

	.week-view {
		min-width: 1000px;
	}

	.calendar-header {
		display: grid;
		grid-template-columns: 80px repeat(7, 1fr);
		border-bottom: 2px solid #e2e8f0;
		background: #f9f9f9;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.time-column-header {
		padding: 1rem;
		font-weight: 600;
		color: #333;
		border-right: 1px solid #e2e8f0;
	}

	.day-header {
		padding: 1rem;
		text-align: center;
		border-right: 1px solid #e2e8f0;
	}

	.day-header.today {
		background: #e6fffa;
		font-weight: 600;
	}

	.day-name {
		font-size: 0.95rem;
		color: #333;
	}

	.calendar-body {
		position: relative;
	}

	.time-row {
		display: grid;
		grid-template-columns: 80px repeat(7, 1fr);
		min-height: 60px;
		border-bottom: 1px solid #e2e8f0;
	}

	.time-label {
		padding: 0.5rem;
		font-size: 0.85rem;
		color: #666;
		border-right: 1px solid #e2e8f0;
		background: #f9f9f9;
	}

	.time-cell {
		position: relative;
		border-right: 1px solid #e2e8f0;
		padding: 0.25rem;
	}

	.booking-block {
		position: absolute;
		left: 0.25rem;
		right: 0.25rem;
		padding: 0.5rem;
		border-radius: 6px;
		color: white;
		font-size: 0.8rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s;
		z-index: 1;
	}

	/* approved — waiting for driver/vehicle, slightly muted */
	.booking-block.approved {
		opacity: 0.75;
		border: 2px dashed rgba(255,255,255,0.6);
	}

	/* assigned — driver assigned, ready to go */
	.booking-block.assigned {
		border: 2px solid rgba(255,255,255,0.8);
	}

	/* in_progress — trip ongoing, pulse to indicate live */
	.booking-block.in_progress {
		border: 2px solid rgba(255,255,255,0.9);
		animation: pulse 2s infinite;
	}

	/* completed — dimmed */
	.booking-block.completed {
		opacity: 0.45;
		filter: grayscale(40%);
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.8; }
	}

	.booking-block:hover {
		transform: scale(1.02);
		box-shadow: 0 4px 12px rgba(0,0,0,0.2);
		z-index: 2;
	}

	.booking-title {
		font-weight: 600;
		margin-bottom: 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.booking-resource,
	.booking-route,
	.booking-time,
	.booking-status {
		font-size: 0.75rem;
		opacity: 0.9;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.legend {
		padding: 1.5rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}

	.legend h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #333;
	}

	.legend-items {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-color {
		width: 20px;
		height: 20px;
		border-radius: 4px;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
		}

		.controls {
			flex-direction: column;
			gap: 1rem;
		}

		.view-controls, .filter-controls {
			width: 100%;
		}

		.resource-filter {
			width: 100%;
		}
	}
</style>

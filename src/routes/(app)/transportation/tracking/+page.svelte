<script lang="ts">
	let title = 'Vehicle & Driver Schedule';

	// Calendar state
	let currentDate = new Date();
	let viewMode: 'vehicles' | 'drivers' = 'vehicles';
	let selectedResource = 'all';

	// Mock vehicles
	let vehicles = [
		{ id: 'VEH-SUV-001', name: 'Toyota Fortuner', type: 'SUV', licensePlate: 'B 1234 ABC', color: '#667eea' },
		{ id: 'VEH-SED-001', name: 'Honda Accord', type: 'Sedan', licensePlate: 'B 5678 DEF', color: '#48bb78' },
		{ id: 'VEH-MPV-001', name: 'Toyota Alphard', type: 'MPV', licensePlate: 'B 9012 GHI', color: '#f6ad55' },
		{ id: 'VEH-EV-001', name: 'BYD Atto 3', type: 'EV', licensePlate: 'B 3456 JKL', color: '#ed64a6' }
	];

	// Mock drivers
	let drivers = [
		{ id: 'DRV-001', name: 'Budi Santoso', licenseNumber: 'SIM-12345678', color: '#4299e1' },
		{ id: 'DRV-002', name: 'Ahmad Wijaya', licenseNumber: 'SIM-87654321', color: '#9f7aea' }
	];

	// Mock bookings
	let bookings = [
		{
			id: 'TRP-001',
			vehicleId: 'VEH-SUV-001',
			driverId: 'DRV-001',
			requestor: 'John Doe',
			startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 15, 30),
			endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 17, 0),
			fromLocation: 'Office Jakarta',
			toLocation: 'Airport',
			status: 'scheduled'
		},
		{
			id: 'TRP-002',
			vehicleId: 'VEH-SED-001',
			driverId: 'DRV-002',
			requestor: 'Jane Smith',
			startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 9, 0),
			endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 10, 30),
			fromLocation: 'Home',
			toLocation: 'Office Jakarta',
			status: 'in-progress'
		},
		{
			id: 'TRP-003',
			vehicleId: 'VEH-MPV-001',
			driverId: 'DRV-001',
			requestor: 'Bob Wilson',
			startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 13, 0),
			endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 15, 0),
			fromLocation: 'Office',
			toLocation: 'Client Site',
			status: 'scheduled'
		}
	];

	$: resources = viewMode === 'vehicles' ? vehicles : drivers;
	$: filteredBookings = selectedResource === 'all'
		? bookings
		: bookings.filter(b => viewMode === 'vehicles' ? b.vehicleId === selectedResource : b.driverId === selectedResource);

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

	function getBookingsForTimeSlot(time: string, dayDate: Date, resourceId: string) {
		const [hour] = time.split(':').map(Number);
		return filteredBookings.filter(booking => {
			const idField = viewMode === 'vehicles' ? 'vehicleId' : 'driverId';
			if (resourceId !== 'all' && booking[idField] !== resourceId) return false;
			if (selectedResource !== 'all' && booking[idField] !== selectedResource) return false;

			const bookingDate = booking.startTime.toDateString();
			const slotDate = dayDate.toDateString();

			if (bookingDate !== slotDate) return false;

			const bookingHour = booking.startTime.getHours();
			const bookingEndHour = booking.endTime.getHours();

			return bookingHour <= hour && hour < bookingEndHour;
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
												<div class="booking-status">Status: {booking.status}</div>
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

	.booking-block.in-progress {
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.85; }
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

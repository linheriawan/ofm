<script lang="ts">
	import type { Room, MeetingBooking } from '$lib/types';

	let title = 'Meeting Room Management';

	// State
	let rooms: Room[] = $state([]);
	let bookings: MeetingBooking[] = $state([]);
	let loading = $state(true);

	// Statistics
	let roomStats = $state({
		total: 0,
		available: 0,
		occupied: 0,
		maintenance: 0
	});

	let todayStats = $state({
		total: 0,
		ongoing: 0,
		upcoming: 0,
		completed: 0
	});

	async function fetchData() {
		loading = true;
		try {
			// Fetch rooms
			const roomsRes = await fetch('/api/rooms?limit=100');
			const roomsData = await roomsRes.json();
			if (roomsData.success) {
				rooms = roomsData.data;
				roomStats.total = rooms.length;
				roomStats.available = rooms.filter((r) => r.status === 'available').length;
				roomStats.occupied = rooms.filter((r) => r.status === 'occupied').length;
				roomStats.maintenance = rooms.filter((r) => r.status === 'maintenance').length;
			}

			// Fetch bookings (today's and upcoming)
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			const bookingsRes = await fetch(
				`/api/meeting-bookings?fromDate=${today.toISOString()}&limit=20`
			);
			const bookingsData = await bookingsRes.json();
			if (bookingsData.success) {
				bookings = bookingsData.data;

				// Calculate today's stats
				const now = new Date();
				const todayBookings = bookings.filter((b) => {
					const start = new Date(b.startTime);
					return start >= today && start < tomorrow;
				});

				todayStats.total = todayBookings.length;
				todayStats.ongoing = todayBookings.filter((b) => {
					const start = new Date(b.startTime);
					const end = new Date(b.endTime);
					return start <= now && end >= now && b.status === 'ongoing';
				}).length;
				todayStats.upcoming = todayBookings.filter((b) => {
					const start = new Date(b.startTime);
					return start > now && b.status === 'scheduled';
				}).length;
				todayStats.completed = todayBookings.filter((b) => b.status === 'completed').length;
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			loading = false;
		}
	}

	function formatTime(date: Date | string) {
		const d = new Date(date);
		return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
	}

	function formatTimeRange(startTime: Date | string, endTime: Date | string) {
		return `${formatTime(startTime)} - ${formatTime(endTime)}`;
	}

	// Load data on mount
	fetchData();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="meeting">
	<div class="header">
		<h1>Meeting Room Management</h1>
		<p class="subtitle">Book rooms, manage facilities, and track meetings</p>
	</div>

	<div class="actions-bar">
		<a href="/meeting/book" class="btn-primary">
			📅 New Booking
		</a>
		<a href="/meeting/bookings" class="btn-secondary">
			📋 All Bookings
		</a>
		<a href="/meeting/calendar" class="btn-secondary">
			📆 Calendar
		</a>
	</div>

	<div class="content-grid">
		<!-- Room Availability -->
		<div class="card">
			<h2>Room Availability</h2>
			{#if loading}
				<div class="loading-small">Loading...</div>
			{:else}
				<div class="info-grid">
					<div class="info-item">
						<span class="label">Total Rooms</span>
						<span class="value">{roomStats.total}</span>
					</div>
					<div class="info-item">
						<span class="label">Available Now</span>
						<span class="value success">{roomStats.available}</span>
					</div>
					<div class="info-item">
						<span class="label">Occupied</span>
						<span class="value warning">{roomStats.occupied}</span>
					</div>
					<div class="info-item">
						<span class="label">Maintenance</span>
						<span class="value danger">{roomStats.maintenance}</span>
					</div>
				</div>
			{/if}
			<a href="/admin/rooms" class="link-btn">View All Rooms →</a>
		</div>

		<!-- Meeting Statistics -->
		<div class="card">
			<h2>Today's Statistics</h2>
			{#if loading}
				<div class="loading-small">Loading...</div>
			{:else}
				<div class="info-grid">
					<div class="info-item">
						<span class="label">Total Bookings</span>
						<span class="value">{todayStats.total}</span>
					</div>
					<div class="info-item">
						<span class="label">Ongoing</span>
						<span class="value success">{todayStats.ongoing}</span>
					</div>
					<div class="info-item">
						<span class="label">Upcoming</span>
						<span class="value">{todayStats.upcoming}</span>
					</div>
					<div class="info-item">
						<span class="label">Completed</span>
						<span class="value">{todayStats.completed}</span>
					</div>
				</div>
			{/if}
			<a href="/meeting/bookings" class="link-btn">View All Bookings →</a>
		</div>

		<!-- License Status -->
		<div class="card">
			<h2>License Status</h2>
			<div class="license-stats">
				<div class="license-item">
					<span class="platform">Zoom</span>
					<div class="license-bar">
						<div class="usage" style="width: 60%"></div>
					</div>
					<span class="usage-text">6 / 10 in use</span>
				</div>
				<div class="license-item">
					<span class="platform">Google Meet</span>
					<div class="license-bar">
						<div class="usage" style="width: 30%"></div>
					</div>
					<span class="usage-text">3 / 10 in use</span>
				</div>
				<div class="license-item">
					<span class="platform">MS Teams</span>
					<div class="license-bar">
						<div class="usage" style="width: 50%"></div>
					</div>
					<span class="usage-text">5 / 10 in use</span>
				</div>
			</div>
			<a href="/meeting/licenses" class="link-btn">Manage Licenses →</a>
		</div>

		<!-- Meeting Type Distribution -->
		<div class="card">
			<h2>Meeting Types Today</h2>
			{#if loading}
				<div class="loading-small">Loading...</div>
			{:else}
				<div class="info-grid">
					<div class="info-item">
						<span class="label">Onsite</span>
						<span class="value"
							>{bookings.filter((b) => b.meetingType === 'onsite').length}</span
						>
					</div>
					<div class="info-item">
						<span class="label">Online</span>
						<span class="value"
							>{bookings.filter((b) => b.meetingType === 'online').length}</span
						>
					</div>
					<div class="info-item">
						<span class="label">Hybrid</span>
						<span class="value"
							>{bookings.filter((b) => b.meetingType === 'hybrid').length}</span
						>
					</div>
					<div class="info-item">
						<span class="label">Total</span>
						<span class="value">{bookings.length}</span>
					</div>
				</div>
			{/if}
			<a href="/meeting/bookings" class="link-btn">View All Bookings →</a>
		</div>

		<!-- Quick Room Status -->
		<div class="card wide">
			<h2>Room Status Overview</h2>
			{#if loading}
				<div class="loading-small">Loading...</div>
			{:else if rooms.length === 0}
				<p class="no-data-small">No rooms available</p>
			{:else}
				<div class="room-grid">
					{#each rooms.slice(0, 6) as room}
						<div class="room-card {room.status}">
							<div class="room-name">{room.roomName || room.roomId}</div>
							<div class="room-status">{room.status}</div>
							{#if room.status === 'available'}
								<div class="room-capacity">Capacity: {room.capacity}</div>
							{:else if room.status === 'maintenance'}
								<div class="room-info">Under maintenance</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.meeting {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.header {
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

	.actions-bar {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.btn-primary, .btn-secondary {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	.btn-primary {
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
		color: white;
	}

	.btn-secondary {
		background: white;
		color: #48bb78;
		border: 2px solid #48bb78;
	}

	.btn-primary:hover, .btn-secondary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}

	.content-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}

	.card.wide {
		grid-column: 1 / -1;
	}

	.card h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.25rem;
		color: #333;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-item .label {
		font-size: 0.85rem;
		color: #666;
	}

	.info-item .value {
		font-size: 1.75rem;
		font-weight: 700;
		color: #333;
	}

	.info-item .value.success {
		color: #48bb78;
	}

	.info-item .value.warning {
		color: #f6ad55;
	}

	.info-item .value.danger {
		color: #f56565;
	}

	.license-stats {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.license-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.license-item .platform {
		font-weight: 600;
		color: #333;
	}

	.license-bar {
		height: 8px;
		background: #e2e8f0;
		border-radius: 4px;
		overflow: hidden;
	}

	.license-bar .usage {
		height: 100%;
		background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
		transition: width 0.3s ease;
	}

	.usage-text {
		font-size: 0.85rem;
		color: #666;
	}

	.link-btn {
		display: inline-block;
		color: #48bb78;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s;
	}

	.link-btn:hover {
		color: #38a169;
	}

	.table-container {
		overflow-x: auto;
		margin-bottom: 1.5rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: #f9f9f9;
	}

	th {
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
		color: #333;
		font-size: 0.9rem;
	}

	td {
		padding: 0.75rem;
		border-bottom: 1px solid #e2e8f0;
		color: #666;
	}

	tbody tr:hover {
		background: #f9f9f9;
	}

	.meeting-type {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.meeting-type.online {
		background: #bee3f8;
		color: #2c5282;
	}

	.meeting-type.offline {
		background: #c6f6d5;
		color: #22543d;
	}

	.meeting-type.hybrid {
		background: #feebc8;
		color: #7c2d12;
	}

	.status {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.status.scheduled {
		background: #bee3f8;
		color: #2c5282;
	}

	.status.ongoing {
		background: #c6f6d5;
		color: #22543d;
	}

	.room-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.room-card {
		padding: 1rem;
		border-radius: 8px;
		border: 2px solid;
		text-align: center;
	}

	.room-card.available {
		border-color: #48bb78;
		background: #f0fff4;
	}

	.room-card.occupied {
		border-color: #f6ad55;
		background: #fffaf0;
	}

	.room-card.maintenance {
		border-color: #f56565;
		background: #fff5f5;
	}

	.room-name {
		font-weight: 700;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.room-status {
		font-size: 0.85rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	.room-card.available .room-status {
		color: #48bb78;
	}

	.room-card.occupied .room-status {
		color: #f6ad55;
	}

	.room-card.maintenance .room-status {
		color: #f56565;
	}

	.room-capacity, .room-info {
		font-size: 0.8rem;
		color: #666;
	}

	.loading-small {
		padding: 2rem;
		text-align: center;
		color: #666;
	}

	.no-data-small {
		padding: 2rem;
		text-align: center;
		color: #999;
		margin: 0;
	}

	.quick-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.action-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f9f9f9;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
		border: 2px solid transparent;
	}

	.action-card:hover {
		background: #f0f0f0;
		border-color: #48bb78;
		transform: translateX(4px);
	}

	.action-icon {
		font-size: 2rem;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.action-title {
		font-weight: 600;
		font-size: 1rem;
		color: #333;
		margin-bottom: 0.25rem;
	}

	.action-desc {
		font-size: 0.85rem;
		color: #666;
	}

	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
		}

		.actions-bar {
			flex-direction: column;
		}

		.room-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>

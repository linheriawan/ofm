<script lang="ts">
	let title = 'Dashboard - OFM';

	// Mock data for dashboard
	let stats = {
		transportation: {
			activeVehicles: 12,
			totalVehicles: 15,
			onDutyDrivers: 10,
			pendingRequests: 5,
			vouchersAvailable: 45
		},
		meeting: {
			availableRooms: 8,
			totalRooms: 12,
			todayBookings: 15,
			ongoingMeetings: 3,
			activeLicenses: 10
		}
	};

	let recentActivities = [
		{ type: 'transport', message: 'Car booking requested by John Doe', time: '5 min ago' },
		{ type: 'meeting', message: 'Meeting room A-301 booked for 2:00 PM', time: '12 min ago' },
		{ type: 'transport', message: 'Voucher allocated to Jane Smith', time: '23 min ago' },
		{ type: 'meeting', message: 'Hybrid meeting started in B-205', time: '35 min ago' },
		{ type: 'transport', message: 'Vehicle maintenance completed - Car #7', time: '1 hour ago' }
	];

	let upcomingBookings = [
		{ type: 'Meeting', title: 'Board Meeting', room: 'A-301', time: '14:00 - 16:00' },
		{ type: 'Transport', title: 'Airport Transfer', vehicle: 'SUV-001', time: '15:30' },
		{ type: 'Meeting', title: 'Team Sync', room: 'B-102', time: '16:00 - 17:00' }
	];
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="dashboard">
	<div class="header">
		<h1>Dashboard</h1>
		<p class="subtitle">Overview of your facility management system</p>
	</div>

	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card transport">
			<div class="stat-icon">🚗</div>
			<div class="stat-content">
				<h3>Active Vehicles</h3>
				<div class="stat-value">{stats.transportation.activeVehicles}/{stats.transportation.totalVehicles}</div>
				<p class="stat-label">Currently available</p>
			</div>
		</div>

		<div class="stat-card transport">
			<div class="stat-icon">👨‍✈️</div>
			<div class="stat-content">
				<h3>On-Duty Drivers</h3>
				<div class="stat-value">{stats.transportation.onDutyDrivers}</div>
				<p class="stat-label">Ready to serve</p>
			</div>
		</div>

		<div class="stat-card meeting">
			<div class="stat-icon">🏢</div>
			<div class="stat-content">
				<h3>Available Rooms</h3>
				<div class="stat-value">{stats.meeting.availableRooms}/{stats.meeting.totalRooms}</div>
				<p class="stat-label">Ready to book</p>
			</div>
		</div>

		<div class="stat-card meeting">
			<div class="stat-icon">📅</div>
			<div class="stat-content">
				<h3>Today's Bookings</h3>
				<div class="stat-value">{stats.meeting.todayBookings}</div>
				<p class="stat-label">{stats.meeting.ongoingMeetings} ongoing</p>
			</div>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="content-grid">
		<!-- Quick Actions -->
		<div class="card quick-actions">
			<h2>Quick Actions</h2>
			<div class="actions-grid">
				<a href="/transportation/request" class="action-btn transport">
					<span class="action-icon">🚗</span>
					<span>Request Transport</span>
				</a>
				<a href="/meeting/calendar" class="action-btn transport">
					<span class="action-icon">📅</span>
					<span>Meeting Calendar</span>
				</a>
				<a href="/meeting/book" class="action-btn meeting">
					<span class="action-icon">🎫</span>
					<span>Book Meeting Room</span>
				</a>
				<a href="/transportation/tracking" class="action-btn admin">
					<span class="action-icon">📊</span>
					<span>Track Vehicles</span>
				</a>
			</div>
		</div>

		<!-- Recent Activities -->
		<div class="card activities">
			<h2>Recent Activities</h2>
			<div class="activity-list">
				{#each recentActivities as activity}
					<div class="activity-item {activity.type}">
						<div class="activity-icon">
							{activity.type === 'transport' ? '🚗' : '🏢'}
						</div>
						<div class="activity-content">
							<p class="activity-message">{activity.message}</p>
							<span class="activity-time">{activity.time}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Upcoming Bookings -->
		<div class="card bookings">
			<h2>Upcoming Bookings</h2>
			<div class="booking-list">
				{#each upcomingBookings as booking}
					<div class="booking-item">
						<div class="booking-type {booking.type.toLowerCase()}">{booking.type}</div>
						<div class="booking-details">
							<h4>{booking.title}</h4>
							<p>{booking.room || booking.vehicle}</p>
							<span class="booking-time">⏰ {booking.time}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
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

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		gap: 1rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		transition: transform 0.2s, box-shadow 0.2s;
		border-left: 4px solid;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.12);
	}

	.stat-card.transport {
		border-color: #667eea;
	}

	.stat-card.meeting {
		border-color: #48bb78;
	}

	.stat-icon {
		font-size: 2.5rem;
	}

	.stat-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 0.9rem;
		color: #666;
		font-weight: 500;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #333;
	}

	.stat-label {
		margin: 0.25rem 0 0 0;
		font-size: 0.85rem;
		color: #888;
	}

	.content-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}

	.card h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.25rem;
		color: #333;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		color: white;
		font-weight: 500;
		transition: all 0.2s;
	}

	.action-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}

	.action-btn.transport {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.action-btn.meeting {
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
	}

	.action-btn.admin {
		background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
	}

	.action-icon {
		font-size: 2rem;
	}

	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.activity-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		border-radius: 8px;
		background: #f9f9f9;
	}

	.activity-icon {
		font-size: 1.5rem;
	}

	.activity-content {
		flex: 1;
	}

	.activity-message {
		margin: 0 0 0.25rem 0;
		color: #333;
	}

	.activity-time {
		font-size: 0.85rem;
		color: #888;
	}

	.booking-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.booking-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}

	.booking-type {
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 500;
		height: fit-content;
		color: white;
	}

	.booking-type.meeting {
		background: #48bb78;
	}

	.booking-type.transport {
		background: #667eea;
	}

	.booking-details {
		flex: 1;
	}

	.booking-details h4 {
		margin: 0 0 0.25rem 0;
		color: #333;
	}

	.booking-details p {
		margin: 0 0 0.5rem 0;
		color: #666;
		font-size: 0.9rem;
	}

	.booking-time {
		font-size: 0.85rem;
		color: #888;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.content-grid {
			grid-template-columns: 1fr;
		}

		.actions-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

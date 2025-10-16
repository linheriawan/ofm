<script lang="ts">
	import { page } from '$app/stores';

	let title = 'Dashboard - OFM';

	const user = $page.data.user;

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

{#if !user}
<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
	<div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">Office Facility Management</h1>
			<p class="text-gray-600">Transportation & Meeting Room Booking System</p>
		</div>

		<div class="space-y-4">
			<a
				href="/auth/login"
				class="block w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition text-center font-semibold"
			>
				Sign in with Aksara SSO
			</a>
		</div>

		<div class="mt-8 pt-6 border-t border-gray-200">
			<h2 class="text-sm font-semibold text-gray-700 mb-3">Features:</h2>
			<ul class="space-y-2 text-sm text-gray-600">
				<li class="flex items-center">
					<svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Transportation booking & voucher allocation
				</li>
				<li class="flex items-center">
					<svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Meeting room scheduling
				</li>
				<li class="flex items-center">
					<svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Online meeting integration
				</li>
				<li class="flex items-center">
					<svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Real-time tracking & analytics
				</li>
			</ul>
		</div>
	</div>
</div>
{:else}
<div class="dashboard">
	<div class="header">
		<div class="flex justify-between items-center">
			<div>
				<h1>Dashboard</h1>
				<p class="subtitle">Welcome back, {user.name || user.email}!</p>
			</div>
			<form method="POST" action="/auth/logout">
				<button
					type="submit"
					class="text-sm text-gray-500 hover:text-gray-700 underline"
				>
					Logout
				</button>
			</form>
		</div>
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
{/if}

<style>
	.min-h-screen {
		min-height: 100vh;
	}

	.flex {
		display: flex;
	}

	.items-center {
		align-items: center;
	}

	.justify-center {
		justify-content: center;
	}

	.justify-between {
		justify-content: space-between;
	}

	.bg-gradient-to-br {
		background: linear-gradient(to bottom right, #eff6ff, #e0e7ff);
	}

	.bg-white {
		background: white;
	}

	.p-8 {
		padding: 2rem;
	}

	.rounded-lg {
		border-radius: 0.5rem;
	}

	.shadow-lg {
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	.max-w-md {
		max-width: 28rem;
	}

	.w-full {
		width: 100%;
	}

	.text-center {
		text-align: center;
	}

	.text-3xl {
		font-size: 1.875rem;
		line-height: 2.25rem;
	}

	.text-sm {
		font-size: 0.875rem;
		line-height: 1.25rem;
	}

	.font-bold {
		font-weight: 700;
	}

	.font-semibold {
		font-weight: 600;
	}

	.text-gray-800 {
		color: #1f2937;
	}

	.text-gray-700 {
		color: #374151;
	}

	.text-gray-600 {
		color: #4b5563;
	}

	.text-gray-500 {
		color: #6b7280;
	}

	.text-green-500 {
		color: #10b981;
	}

	.mb-2 {
		margin-bottom: 0.5rem;
	}

	.mb-3 {
		margin-bottom: 0.75rem;
	}

	.mb-8 {
		margin-bottom: 2rem;
	}

	.mt-8 {
		margin-top: 2rem;
	}

	.pt-6 {
		padding-top: 1.5rem;
	}

	.space-y-4 > * + * {
		margin-top: 1rem;
	}

	.space-y-2 > * + * {
		margin-top: 0.5rem;
	}

	.border-t {
		border-top-width: 1px;
	}

	.border-gray-200 {
		border-color: #e5e7eb;
	}

	.block {
		display: block;
	}

	.bg-indigo-600 {
		background-color: #4f46e5;
	}

	.bg-indigo-600:hover {
		background-color: #4338ca;
	}

	.text-white {
		color: white;
	}

	.px-6 {
		padding-left: 1.5rem;
		padding-right: 1.5rem;
	}

	.py-3 {
		padding-top: 0.75rem;
		padding-bottom: 0.75rem;
	}

	.transition {
		transition: all 0.2s;
	}

	.underline {
		text-decoration: underline;
	}

	a {
		text-decoration: none;
	}

	.w-4 {
		width: 1rem;
	}

	.h-4 {
		height: 1rem;
	}

	.mr-2 {
		margin-right: 0.5rem;
	}

	button {
		cursor: pointer;
		border: none;
		background: none;
	}

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

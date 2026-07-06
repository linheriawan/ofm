<script lang="ts">
import './dashboard.css';
interface Props {
	stats?: any;
	user: any;
	departmentName:String;
	teammates:any[];
	upcomingBookings:any;
	recentActivities:any;
}
let { stats = $bindable(), user,departmentName,teammates,upcomingBookings,recentActivities }: Props = $props();

</script>
<div class="dashboard">
	<div class="header">
		<h1>Dashboard</h1>
		<p class="subtitle">Welcome back, {user.name || user.email}!</p>
	</div>
	<!-- Main Content Grid -->
	<div class="content-grid">
        <!-- Teammates -->
    	{#if user?.orgUnitId}
    	<div class="card teammates">
    		<h2>👥 My Team {#if departmentName}<span class="dept-label">{departmentName}</span>{/if}</h2>
    		{#if teammates.length === 0}
    			<p class="empty-hint">No teammates found in your department.</p>
    		{:else}
    			<div class="teammate-list">
    				{#each teammates as t}
    					<div class="teammate-row">
    						<div class="teammate-avatar">{(t.firstName?.[0] ?? '?').toUpperCase()}{(t.lastName?.[0] ?? '').toUpperCase()}</div>
    						<div class="teammate-info">
    							<span class="teammate-name">{t.firstName} {t.lastName}</span>
    							<span class="teammate-email">{t.email}</span>
    						</div>
    						{#if t.roleNames?.length}
    							<span class="teammate-role">{t.roleNames[0]}</span>
    						{/if}
    					</div>
    				{/each}
    			</div>
    		{/if}
    	</div>
    	{/if}

		<!-- Upcoming Bookings -->
		<div class="card bookings">
			<h2>Upcoming Bookings</h2>
			<div class="booking-list">
				{#each upcomingBookings as booking}
					<div class="booking-item">
						<div class="booking-type {booking.type.toLowerCase()}">{booking.type}</div>
						<div class="booking-details">
							<h4>{booking.title}</h4>
							<p>{booking.location}</p>
							<span class="booking-time">⏰ {booking.time}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
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
	</div>
	<!-- Transportation Overview Section -->
	<div class="section-header mt-8">
		<h2>🚗 Transportation</h2>
		<a href="/transportation/request" class="section-link">Request Transport →</a>
	</div>
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

		<div class="stat-card transport">
			<div class="stat-icon">🎫</div>
			<div class="stat-content">
				<h3>Pending Requests</h3>
				<div class="stat-value">{stats.transportation.pendingRequests}</div>
				<p class="stat-label">Awaiting approval</p>
			</div>
		</div>

		<div class="stat-card transport">
			<div class="stat-icon">🎟️</div>
			<div class="stat-content">
				<h3>Vouchers Available</h3>
				<div class="stat-value">{stats.transportation.vouchersAvailable}</div>
				<p class="stat-label">Gojek, Grab</p>
			</div>
		</div>
	</div>

	<!-- Meeting Rooms Overview Section -->
	<div class="section-header mt-8">
		<h2>🏢 Meeting Rooms</h2>
		<a href="/meeting/book" class="section-link">Book Room →</a>
	</div>
	<div class="stats-grid">
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

		<div class="stat-card meeting">
			<div class="stat-icon">🎥</div>
			<div class="stat-content">
				<h3>Active Licenses</h3>
				<div class="stat-value">{stats.meeting.activeLicenses}</div>
				<p class="stat-label">Zoom, Meet, Teams</p>
			</div>
		</div>

		<div class="stat-card meeting">
			<div class="stat-icon">✅</div>
			<div class="stat-content">
				<h3>Ongoing Meetings</h3>
				<div class="stat-value">{stats.meeting.ongoingMeetings}</div>
				<p class="stat-label">In progress now</p>
			</div>
		</div>
	</div>

	<!-- Reports & Analytics Section -->
	<div class="section-header mt-8">
		<h2>📊 Reports & Analytics</h2>
	</div>
	<div class="stats-grid">
		<div class="stat-card report unavailable">
			<div class="stat-icon">📈</div>
			<div class="stat-content">
				<h3>Transport Reports</h3>
				<p class="report-description">Utilization and cost analytics</p>
			</div>
			<div class="coming-soon-badge">Coming Soon</div>
		</div>

		<a href="/reports/meeting-cancellations" class="stat-card report report-link">
			<div class="stat-icon">📊</div>
			<div class="stat-content">
				<h3>Meeting Reports</h3>
				<p class="report-description">Cancellations by department</p>
			</div>
		</a>

		<div class="stat-card report unavailable">
			<div class="stat-icon">💰</div>
			<div class="stat-content">
				<h3>Financial Reports</h3>
				<p class="report-description">Cost tracking and budget analysis</p>
			</div>
			<div class="coming-soon-badge">Coming Soon</div>
		</div>
	</div>
</div>

<script lang="ts">
	let title = 'Meeting Room Management';
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
			📅 Book Meeting Room
		</a>
		<a href="/meeting/online" class="btn-secondary">
			💻 Create Online Meeting
		</a>
		<a href="/meeting/calendar" class="btn-secondary">
			📆 View Calendar
		</a>
	</div>

	<div class="content-grid">
		<!-- Room Availability -->
		<div class="card">
			<h2>Room Availability</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="label">Total Rooms</span>
					<span class="value">12</span>
				</div>
				<div class="info-item">
					<span class="label">Available Now</span>
					<span class="value success">8</span>
				</div>
				<div class="info-item">
					<span class="label">Occupied</span>
					<span class="value warning">3</span>
				</div>
				<div class="info-item">
					<span class="label">Maintenance</span>
					<span class="value danger">1</span>
				</div>
			</div>
			<a href="/meeting/rooms" class="link-btn">View All Rooms →</a>
		</div>

		<!-- Meeting Statistics -->
		<div class="card">
			<h2>Today's Statistics</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="label">Total Bookings</span>
					<span class="value">15</span>
				</div>
				<div class="info-item">
					<span class="label">Ongoing</span>
					<span class="value success">3</span>
				</div>
				<div class="info-item">
					<span class="label">Upcoming</span>
					<span class="value">8</span>
				</div>
				<div class="info-item">
					<span class="label">Completed</span>
					<span class="value">4</span>
				</div>
			</div>
			<a href="/meeting/reports" class="link-btn">View Reports →</a>
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

		<!-- Upcoming Meetings -->
		<div class="card wide">
			<h2>Upcoming Meetings</h2>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Time</th>
							<th>Meeting Title</th>
							<th>Type</th>
							<th>Room/Link</th>
							<th>Organizer</th>
							<th>Participants</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>14:00 - 16:00</td>
							<td>Board Meeting</td>
							<td><span class="meeting-type offline">Offline</span></td>
							<td>Room A-301</td>
							<td>John Smith</td>
							<td>8</td>
							<td><span class="status scheduled">Scheduled</span></td>
						</tr>
						<tr>
							<td>13:00 - 14:00</td>
							<td>Project Kickoff</td>
							<td><span class="meeting-type online">Online</span></td>
							<td>Zoom Meeting</td>
							<td>Jane Doe</td>
							<td>15</td>
							<td><span class="status ongoing">Ongoing</span></td>
						</tr>
						<tr>
							<td>16:00 - 17:00</td>
							<td>Team Sync</td>
							<td><span class="meeting-type hybrid">Hybrid</span></td>
							<td>Room B-102</td>
							<td>Bob Wilson</td>
							<td>12</td>
							<td><span class="status scheduled">Scheduled</span></td>
						</tr>
					</tbody>
				</table>
			</div>
			<a href="/meeting/bookings" class="link-btn">View All Bookings →</a>
		</div>

		<!-- Quick Room Status -->
		<div class="card wide">
			<h2>Room Status Overview</h2>
			<div class="room-grid">
				<div class="room-card available">
					<div class="room-name">A-301</div>
					<div class="room-status">Available</div>
					<div class="room-capacity">Capacity: 20</div>
				</div>
				<div class="room-card occupied">
					<div class="room-name">A-302</div>
					<div class="room-status">Occupied</div>
					<div class="room-info">Until 15:00</div>
				</div>
				<div class="room-card available">
					<div class="room-name">B-101</div>
					<div class="room-status">Available</div>
					<div class="room-capacity">Capacity: 10</div>
				</div>
				<div class="room-card available">
					<div class="room-name">B-102</div>
					<div class="room-status">Available</div>
					<div class="room-capacity">Capacity: 8</div>
				</div>
				<div class="room-card occupied">
					<div class="room-name">B-205</div>
					<div class="room-status">Occupied</div>
					<div class="room-info">Until 16:30</div>
				</div>
				<div class="room-card maintenance">
					<div class="room-name">C-101</div>
					<div class="room-status">Maintenance</div>
					<div class="room-info">Back Tomorrow</div>
				</div>
			</div>
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

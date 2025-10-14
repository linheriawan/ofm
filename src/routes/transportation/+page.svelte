<script lang="ts">
	let title = 'Transportation Management';
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="transportation">
	<div class="header">
		<h1>Transportation Management</h1>
		<p class="subtitle">Manage vehicles, drivers, bookings, and vouchers</p>
	</div>

	<div class="actions-bar">
		<a href="/transportation/request" class="btn-primary">
			🚗 Request Transport
		</a>
		<a href="/transportation/voucher" class="btn-secondary">
			🎫 Request Voucher
		</a>
		<a href="/transportation/tracking" class="btn-secondary">
			📍 Track Vehicles
		</a>
	</div>

	<div class="content-grid">
		<!-- Vehicle Fleet -->
		<div class="card">
			<h2>Vehicle Fleet</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="label">Total Vehicles</span>
					<span class="value">15</span>
				</div>
				<div class="info-item">
					<span class="label">Available</span>
					<span class="value success">12</span>
				</div>
				<div class="info-item">
					<span class="label">In Use</span>
					<span class="value warning">2</span>
				</div>
				<div class="info-item">
					<span class="label">Maintenance</span>
					<span class="value danger">1</span>
				</div>
			</div>
			<a href="/transportation/vehicles" class="link-btn">View All Vehicles →</a>
		</div>

		<!-- Drivers -->
		<div class="card">
			<h2>Drivers</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="label">Total Drivers</span>
					<span class="value">12</span>
				</div>
				<div class="info-item">
					<span class="label">On Duty</span>
					<span class="value success">10</span>
				</div>
				<div class="info-item">
					<span class="label">Off Duty</span>
					<span class="value">2</span>
				</div>
				<div class="info-item">
					<span class="label">On Leave</span>
					<span class="value">0</span>
				</div>
			</div>
			<a href="/transportation/drivers" class="link-btn">View All Drivers →</a>
		</div>

		<!-- Voucher Pool -->
		<div class="card">
			<h2>Voucher Pool</h2>
			<div class="voucher-stats">
				<div class="voucher-item">
					<span class="provider">Gojek</span>
					<span class="count">15 available</span>
				</div>
				<div class="voucher-item">
					<span class="provider">Grab</span>
					<span class="count">30 available</span>
				</div>
				<div class="voucher-item">
					<span class="provider">Other</span>
					<span class="count">0 available</span>
				</div>
			</div>
			<a href="/transportation/vouchers" class="link-btn">Manage Vouchers →</a>
		</div>

		<!-- Bookings -->
		<div class="card wide">
			<h2>Recent Bookings</h2>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Requestor</th>
							<th>Vehicle</th>
							<th>Schedule</th>
							<th>From → To</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>#TRP-001</td>
							<td>John Doe</td>
							<td>SUV-001</td>
							<td>15:30 Today</td>
							<td>Office → Airport</td>
							<td><span class="status scheduled">Scheduled</span></td>
						</tr>
						<tr>
							<td>#TRP-002</td>
							<td>Jane Smith</td>
							<td>Sedan-003</td>
							<td>09:00 Tomorrow</td>
							<td>Home → Office</td>
							<td><span class="status scheduled">Scheduled</span></td>
						</tr>
						<tr>
							<td>#TRP-003</td>
							<td>Bob Wilson</td>
							<td>MPV-002</td>
							<td>13:00 Today</td>
							<td>Office → Client Site</td>
							<td><span class="status in-progress">In Progress</span></td>
						</tr>
					</tbody>
				</table>
			</div>
			<a href="/transportation/bookings" class="link-btn">View All Bookings →</a>
		</div>
	</div>
</div>

<style>
	.transportation {
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-secondary {
		background: white;
		color: #667eea;
		border: 2px solid #667eea;
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

	.voucher-stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.voucher-item {
		display: flex;
		justify-content: space-between;
		padding: 1rem;
		background: #f9f9f9;
		border-radius: 8px;
	}

	.voucher-item .provider {
		font-weight: 600;
		color: #333;
	}

	.voucher-item .count {
		color: #666;
	}

	.link-btn {
		display: inline-block;
		color: #667eea;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s;
	}

	.link-btn:hover {
		color: #764ba2;
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

	.status.in-progress {
		background: #feebc8;
		color: #7c2d12;
	}

	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
		}

		.actions-bar {
			flex-direction: column;
		}
	}
</style>

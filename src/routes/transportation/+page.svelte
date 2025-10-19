<script lang="ts">
	import type { Vehicle, Driver, TransportationBooking } from '$lib/types';

	let title = 'Transportation Management';

	// State
	let vehicles: Vehicle[] = $state([]);
	let drivers: Driver[] = $state([]);
	let bookings: TransportationBooking[] = $state([]);
	let loading = $state(true);

	// Statistics
	let vehicleStats = $state({
		total: 0,
		available: 0,
		inUse: 0,
		maintenance: 0
	});

	let driverStats = $state({
		total: 0,
		onDuty: 0,
		offDuty: 0,
		onLeave: 0
	});

	async function fetchData() {
		loading = true;
		try {
			// Fetch vehicles
			const vehiclesRes = await fetch('/api/v1/vehicles?limit=100');
			const vehiclesData = await vehiclesRes.json();
			if (vehiclesData.success) {
				vehicles = vehiclesData.data;
				vehicleStats.total = vehicles.length;
				vehicleStats.available = vehicles.filter((v) => v.status === 'available').length;
				vehicleStats.inUse = vehicles.filter((v) => v.status === 'in-use').length;
				vehicleStats.maintenance = vehicles.filter((v) => v.status === 'maintenance').length;
			}

			// Fetch drivers
			const driversRes = await fetch('/api/v1/drivers?limit=100');
			const driversData = await driversRes.json();
			if (driversData.success) {
				drivers = driversData.data;
				driverStats.total = drivers.length;
				driverStats.onDuty = drivers.filter((d) => d.status === 'on-duty').length;
				driverStats.offDuty = drivers.filter((d) => d.status === 'off-duty').length;
				driverStats.onLeave = drivers.filter((d) => d.status === 'on-leave').length;
			}

			// Fetch recent requests
			const bookingsRes = await fetch('/api/v1/transport/requests?limit=5');
			const bookingsData = await bookingsRes.json();
			if (bookingsData.success) {
				bookings = bookingsData.data;
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			loading = false;
		}
	}

	function formatDateTime(date: Date | string) {
		const d = new Date(date);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

		if (d >= today && d < tomorrow) {
			return `${time} Today`;
		} else if (d >= tomorrow && d < new Date(tomorrow.getTime() + 86400000)) {
			return `${time} Tomorrow`;
		} else {
			return d.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		}
	}

	// Load data on mount
	fetchData();
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
			🚗 New Request
		</a>
		<a href="/transportation/bookings" class="btn-secondary">
			📋 All Requests
		</a>
		<a href="/transportation/tracking" class="btn-secondary">
			📍 Track Vehicles
		</a>
	</div>

	<div class="content-grid">
		<!-- Vehicle Fleet -->
		<div class="card">
			<h2>Vehicle Fleet</h2>
			{#if loading}
				<div class="loading-small">Loading...</div>
			{:else}
				<div class="info-grid">
					<div class="info-item">
						<span class="label">Total Vehicles</span>
						<span class="value">{vehicleStats.total}</span>
					</div>
					<div class="info-item">
						<span class="label">Available</span>
						<span class="value success">{vehicleStats.available}</span>
					</div>
					<div class="info-item">
						<span class="label">In Use</span>
						<span class="value warning">{vehicleStats.inUse}</span>
					</div>
					<div class="info-item">
						<span class="label">Maintenance</span>
						<span class="value danger">{vehicleStats.maintenance}</span>
					</div>
				</div>
			{/if}
			<a href="/admin/vehicles" class="link-btn">View All Vehicles →</a>
		</div>

		<!-- Drivers -->
		<div class="card">
			<h2>Drivers</h2>
			{#if loading}
				<div class="loading-small">Loading...</div>
			{:else}
				<div class="info-grid">
					<div class="info-item">
						<span class="label">Total Drivers</span>
						<span class="value">{driverStats.total}</span>
					</div>
					<div class="info-item">
						<span class="label">On Duty</span>
						<span class="value success">{driverStats.onDuty}</span>
					</div>
					<div class="info-item">
						<span class="label">Off Duty</span>
						<span class="value">{driverStats.offDuty}</span>
					</div>
					<div class="info-item">
						<span class="label">On Leave</span>
						<span class="value">{driverStats.onLeave}</span>
					</div>
				</div>
			{/if}
			<a href="/admin/drivers" class="link-btn">View All Drivers →</a>
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

		<!-- Today's Bookings Summary -->
		<div class="card">
			<h2>Today's Requests</h2>
			{#if loading}
				<div class="loading-small">Loading...</div>
			{:else}
				<div class="info-grid">
					<div class="info-item">
						<span class="label">Total Today</span>
						<span class="value">{bookings.length}</span>
					</div>
					<div class="info-item">
						<span class="label">Scheduled</span>
						<span class="value"
							>{bookings.filter((b) => b.status === 'scheduled').length}</span
						>
					</div>
					<div class="info-item">
						<span class="label">Ongoing</span>
						<span class="value success"
							>{bookings.filter((b) => b.status === 'ongoing').length}</span
						>
					</div>
					<div class="info-item">
						<span class="label">Completed</span>
						<span class="value"
							>{bookings.filter((b) => b.status === 'completed').length}</span
						>
					</div>
				</div>
			{/if}
			<a href="/transportation/bookings" class="link-btn">View All Requests →</a>
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
		border-color: #667eea;
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
	}
</style>

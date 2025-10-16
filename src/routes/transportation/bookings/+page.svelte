<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { TransportationBooking } from '$lib/types';

	let title = 'My Transportation Bookings - OFM';
	let bookings: TransportationBooking[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	let limit = $state(10);

	// Filters
	let statusFilter = $state('');
	let fromDateFilter = $state('');
	let toDateFilter = $state('');

	// Modal
	let isModalOpen = $state(false);
	let selectedBooking: TransportationBooking | null = $state(null);
	let editMode = $state(false);

	onMount(() => {
		fetchBookings();
	});

	async function fetchBookings() {
		loading = true;
		error = '';

		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: limit.toString()
			});

			if (statusFilter) params.append('status', statusFilter);
			if (fromDateFilter) params.append('fromDate', fromDateFilter);
			if (toDateFilter) params.append('toDate', toDateFilter);

			const response = await fetch(`/api/v1/transport/requests?${params}`);
			const result = await response.json();

			if (result.success) {
				bookings = result.data;
				total = result.meta?.total || result.data.length;
				totalPages = Math.ceil(total / limit);
			} else {
				error = result.error?.message || 'Failed to fetch bookings';
			}
		} catch (err) {
			error = 'Failed to connect to server';
			console.error('Error fetching bookings:', err);
		} finally {
			loading = false;
		}
	}

	function applyFilters() {
		currentPage = 1;
		fetchBookings();
	}

	function clearFilters() {
		statusFilter = '';
		fromDateFilter = '';
		toDateFilter = '';
		currentPage = 1;
		fetchBookings();
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			fetchBookings();
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			fetchBookings();
		}
	}

	function viewDetails(booking: TransportationBooking) {
		selectedBooking = booking;
		editMode = false;
		isModalOpen = true;
	}

	function openEditModal(booking: TransportationBooking) {
		selectedBooking = booking;
		editMode = true;
		isModalOpen = true;
	}

	async function updateBookingStatus(status: string) {
		if (!selectedBooking) return;

		try {
			const response = await fetch(`/api/v1/transport/requests/${selectedBooking._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});

			const result = await response.json();
			if (result.success) {
				isModalOpen = false;
				fetchBookings();
			} else {
				alert(result.error?.message || 'Failed to update booking');
			}
		} catch (error) {
			alert('Failed to update booking');
		}
	}

	function closeModal() {
		isModalOpen = false;
		selectedBooking = null;
		editMode = false;
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(date: Date | string): string {
		return new Date(date).toLocaleTimeString('id-ID', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			pending: 'blue',
			approved: 'green',
			rejected: 'red',
			completed: 'gray',
			cancelled: 'red'
		};
		return colors[status] || 'gray';
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="bookings-page">
	<div class="page-header">
		<h1>Transportation Requests</h1>
		<a href="/transportation/request" class="btn-primary">New Request</a>
	</div>

	<!-- Filters -->
	<div class="filters-card">
		<h3>Filters</h3>
		<div class="filters-grid">
			<div class="filter-group">
				<label for="status">Status</label>
				<select id="status" bind:value={statusFilter}>
					<option value="">All</option>
					<option value="pending">Pending</option>
					<option value="approved">Approved</option>
					<option value="rejected">Rejected</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="fromDate">From Date</label>
				<input type="date" id="fromDate" bind:value={fromDateFilter} />
			</div>

			<div class="filter-group">
				<label for="toDate">To Date</label>
				<input type="date" id="toDate" bind:value={toDateFilter} />
			</div>

			<div class="filter-actions">
				<button onclick={applyFilters} class="btn-apply">Apply</button>
				<button onclick={clearFilters} class="btn-clear">Clear</button>
			</div>
		</div>
	</div>

	<!-- Bookings Table -->
	<div class="table-card">
		{#if loading}
			<div class="loading">Loading bookings...</div>
		{:else if error}
			<div class="error">{error}</div>
		{:else if bookings.length === 0}
			<div class="no-data">No bookings found</div>
		{:else}
			<div class="table-responsive">
				<table>
					<thead>
						<tr>
							<th>Booking ID</th>
							<th>Date & Time</th>
							<th>From</th>
							<th>To</th>
							<th>Vehicle</th>
							<th>Driver</th>
							<th>Passengers</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each bookings as booking}
							<tr>
								<td class="booking-id">{booking.requestNumber}</td>
								<td>
									<div class="date-time">
										<div>{formatDate(booking.scheduledTime)}</div>
										<div class="time">{formatTime(booking.scheduledTime)}</div>
									</div>
								</td>
								<td>{booking.pickup?.address || '-'}</td>
								<td>{booking.destination?.address || '-'}</td>
								<td>
									{#if booking.type === 'voucher'}
										<span class="badge-type">Voucher</span>
										{#if booking.voucherCode}
											<br /><small>{booking.voucherCode}</small>
										{/if}
									{:else}
										{booking.vehicleId || '-'}
									{/if}
								</td>
								<td>
									{#if booking.type === 'voucher'}
										-
									{:else if booking.driverId}
										{booking.driverId}
									{:else}
										Self-Drive
									{/if}
								</td>
								<td class="center">{booking.passengerCount}</td>
								<td>
									<span class="status-badge {getStatusColor(booking.status)}">
										{booking.status}
									</span>
								</td>
								<td class="actions">
									<button onclick={() => viewDetails(booking)} class="btn-view">
										View
									</button>
									{#if booking.status === 'pending'}
										<button
											onclick={() => openEditModal(booking)}
											class="btn-edit"
										>
											Edit
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			<div class="pagination">
				<div class="pagination-info">
					Showing {(currentPage - 1) * limit + 1} to {Math.min(
						currentPage * limit,
						total
					)} of {total} bookings
				</div>
				<div class="pagination-controls">
					<button onclick={prevPage} disabled={currentPage === 1}>Previous</button>
					<span class="page-number">Page {currentPage} of {totalPages}</span>
					<button onclick={nextPage} disabled={currentPage === totalPages}>Next</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Booking Details Modal -->
<Modal
	bind:isOpen={isModalOpen}
	title={editMode ? 'Edit Booking' : 'Booking Details'}
	onClose={closeModal}
>
	{#if selectedBooking}
		<div class="booking-details">
			<div class="detail-group">
				<label>Request Number:</label>
				<span>{selectedBooking.requestNumber}</span>
			</div>

			<div class="detail-group">
				<label>Type:</label>
				<span>{selectedBooking.type === 'company_car' ? 'Company Car' : 'Voucher'}</span>
			</div>

			<div class="detail-group">
				<label>Scheduled Time:</label>
				<span>
					{formatDate(selectedBooking.scheduledTime)} at {formatTime(
						selectedBooking.scheduledTime
					)}
				</span>
			</div>

			{#if selectedBooking.isRoundTrip && selectedBooking.returnTime}
				<div class="detail-group">
					<label>Return Time:</label>
					<span>
						{formatDate(selectedBooking.returnTime)} at {formatTime(selectedBooking.returnTime)}
					</span>
				</div>
			{/if}

			<div class="detail-group">
				<label>From:</label>
				<span>{selectedBooking.pickup?.address || '-'}</span>
			</div>

			<div class="detail-group">
				<label>To:</label>
				<span>{selectedBooking.destination?.address || '-'}</span>
			</div>

			<div class="detail-group">
				<label>Passengers:</label>
				<span>{selectedBooking.passengerCount}</span>
			</div>

			{#if selectedBooking.type === 'company_car'}
				<div class="detail-group">
					<label>Vehicle:</label>
					<span>{selectedBooking.vehicleId || 'Not assigned'}</span>
				</div>

				<div class="detail-group">
					<label>Driver:</label>
					<span>
						{#if selectedBooking.driverId}
							{selectedBooking.driverId}
							{#if selectedBooking.driverType}
								<small>({selectedBooking.driverType})</small>
							{/if}
						{:else}
							Self-Drive
						{/if}
					</span>
				</div>
			{:else if selectedBooking.type === 'voucher'}
				<div class="detail-group">
					<label>Provider:</label>
					<span>{selectedBooking.voucherProvider || '-'}</span>
				</div>

				<div class="detail-group">
					<label>Voucher Code:</label>
					<span>{selectedBooking.voucherCode || 'Not assigned yet'}</span>
				</div>
			{/if}

			<div class="detail-group">
				<label>Priority:</label>
				<span>{selectedBooking.priority}</span>
			</div>

			<div class="detail-group">
				<label>Status:</label>
				<span class="status-badge {getStatusColor(selectedBooking.status)}">
					{selectedBooking.status}
				</span>
			</div>

			<div class="detail-group full-width">
				<label>Purpose:</label>
				<span>{selectedBooking.purpose}</span>
			</div>

			{#if selectedBooking.specialRequirements}
				<div class="detail-group full-width">
					<label>Special Requirements:</label>
					<span>{selectedBooking.specialRequirements}</span>
				</div>
			{/if}

			{#if selectedBooking.approvedBy}
				<div class="detail-group">
					<label>Approved By:</label>
					<span>{selectedBooking.approvedBy}</span>
				</div>
			{/if}

			{#if editMode && selectedBooking.status === 'pending'}
				<div class="modal-actions">
					<button
						onclick={() => updateBookingStatus('cancelled')}
						class="btn-danger"
					>
						Cancel Request
					</button>
				</div>
			{/if}
		</div>
	{/if}
</Modal>

<style>
	.bookings-page {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 500;
		transition: transform 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
	}

	.filters-card,
	.table-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		margin-bottom: 1.5rem;
	}

	.filters-card h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #333;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #555;
	}

	.filter-group select,
	.filter-group input {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
	}

	.filter-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-apply,
	.btn-clear {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-apply {
		background: #667eea;
		color: white;
	}

	.btn-clear {
		background: #f3f4f6;
		color: #333;
	}

	.btn-apply:hover,
	.btn-clear:hover {
		transform: translateY(-2px);
	}

	.loading,
	.error,
	.no-data {
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	.error {
		color: #e53e3e;
	}

	.table-responsive {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: #f9fafb;
	}

	th {
		text-align: left;
		padding: 1rem;
		font-weight: 600;
		color: #333;
		border-bottom: 2px solid #e2e8f0;
	}

	td {
		padding: 1rem;
		border-bottom: 1px solid #e2e8f0;
		color: #555;
	}

	tbody tr:hover {
		background: #f9fafb;
	}

	.booking-id {
		font-weight: 600;
		color: #667eea;
	}

	.date-time {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.time {
		font-size: 0.875rem;
		color: #888;
	}

	.center {
		text-align: center;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.status-badge.blue {
		background: #dbeafe;
		color: #1e40af;
	}

	.status-badge.orange {
		background: #fed7aa;
		color: #9a3412;
	}

	.status-badge.green {
		background: #d1fae5;
		color: #065f46;
	}

	.status-badge.red {
		background: #fee2e2;
		color: #991b1b;
	}

	.badge-type {
		background: #e0e7ff;
		color: #3730a3;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-view,
	.btn-edit {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-view {
		background: #48bb78;
		color: white;
	}

	.btn-edit {
		background: #667eea;
		color: white;
	}

	.btn-view:hover,
	.btn-edit:hover {
		transform: translateY(-2px);
	}

	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.pagination-info {
		color: #666;
		font-size: 0.875rem;
	}

	.pagination-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.pagination-controls button {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.pagination-controls button:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #667eea;
	}

	.pagination-controls button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-number {
		font-weight: 500;
		color: #333;
	}

	.booking-details {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.detail-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-group.full-width {
		grid-column: 1 / -1;
	}

	.detail-group label {
		font-weight: 600;
		color: #555;
		font-size: 0.9rem;
	}

	.detail-group span {
		color: #333;
	}

	.modal-actions {
		grid-column: 1 / -1;
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-danger {
		padding: 0.75rem 1.5rem;
		background: #e53e3e;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-danger:hover {
		background: #c53030;
		transform: translateY(-2px);
	}

	@media (max-width: 768px) {
		.filters-grid {
			grid-template-columns: 1fr;
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.table-responsive {
			font-size: 0.875rem;
		}

		.pagination {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.booking-details {
			grid-template-columns: 1fr;
		}
	}
</style>

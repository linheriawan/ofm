<script lang="ts">
	import type { MeetingBooking } from '$lib/types';
	import Modal from '$lib/components/Modal.svelte';

	let bookings: MeetingBooking[] = $state([]);
	let loading = $state(false);
	let error = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	const limit = 10;

	// Filters
	let statusFilter = $state('');
	let fromDateFilter = $state('');
	let toDateFilter = $state('');
	let meetingTypeFilter = $state('');

	// Modal state
	let showDetailsModal = $state(false);
	let showEditModal = $state(false);
	let selectedBooking: MeetingBooking | null = $state(null);

	// Edit form state
	let editForm = $state({
		meetingTitle: '',
		meetingType: '',
		startTime: '',
		endTime: '',
		participants: [] as string[],
		cateringNeeded: false,
		notes: ''
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
			if (meetingTypeFilter) params.append('meetingType', meetingTypeFilter);

			const response = await fetch(`/api/v1/meeting/requests?${params}`);
			const result = await response.json();

			if (result.success) {
				bookings = result.data;
				total = result.meta?.total || result.data.length;
				totalPages = Math.ceil(total / limit);
			} else {
				error = result.error?.message || 'Failed to load bookings';
			}
		} catch (err) {
			error = 'An error occurred while loading bookings';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function handlePageChange(page: number) {
		currentPage = page;
		fetchBookings();
	}

	function handleFilterChange() {
		currentPage = 1;
		fetchBookings();
	}

	function clearFilters() {
		statusFilter = '';
		fromDateFilter = '';
		toDateFilter = '';
		meetingTypeFilter = '';
		currentPage = 1;
		fetchBookings();
	}

	function viewDetails(booking: MeetingBooking) {
		selectedBooking = booking;
		showDetailsModal = true;
	}

	function openEditModal(booking: MeetingBooking) {
		selectedBooking = booking;
		editForm = {
			meetingTitle: booking.meetingTitle,
			meetingType: booking.meetingType,
			startTime: new Date(booking.startTime).toISOString().slice(0, 16),
			endTime: new Date(booking.endTime).toISOString().slice(0, 16),
			participants: booking.participants || [],
			cateringNeeded: booking.cateringNeeded || false,
			notes: booking.notes || ''
		};
		showEditModal = true;
	}

	async function handleEdit() {
		if (!selectedBooking) return;

		try {
			const response = await fetch(`/api/v1/meeting/requests/${selectedBooking._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: editForm.meetingTitle,
					type: editForm.meetingType,
					startTime: editForm.startTime,
					endTime: editForm.endTime,
					participants: editForm.participants,
					cateringRequired: editForm.cateringNeeded,
					notes: editForm.notes
				})
			});

			const result = await response.json();
			if (result.success) {
				showEditModal = false;
				fetchBookings();
			} else {
				alert(result.error?.message || 'Failed to update booking');
			}
		} catch (err) {
			alert('An error occurred while updating the booking');
			console.error(err);
		}
	}

	async function handleCancel(booking: MeetingBooking) {
		if (!confirm('Are you sure you want to cancel this booking?')) return;

		try {
			const response = await fetch(`/api/v1/meeting/requests/${booking._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'cancelled' })
			});

			const result = await response.json();
			if (result.success) {
				fetchBookings();
			} else {
				alert(result.error?.message || 'Failed to cancel booking');
			}
		} catch (err) {
			alert('An error occurred while canceling the booking');
			console.error(err);
		}
	}

	function getStatusClass(status: string) {
		switch (status) {
			case 'pending':
				return 'badge-scheduled';
			case 'approved':
				return 'badge-ongoing';
			case 'completed':
				return 'badge-completed';
			case 'cancelled':
			case 'rejected':
				return 'badge-cancelled';
			default:
				return '';
		}
	}

	function formatDateTime(date: Date | string) {
		return new Date(date).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Load bookings on mount
	fetchBookings();
</script>

<div class="bookings-container">
	<div class="header">
		<h1>Meeting Bookings</h1>
		<a href="/meeting/book" class="btn-primary">Booking</a>
	</div>

	<!-- Filters -->
	<div class="filters-panel">
		<div class="filter-group">
			<label for="status">Status</label>
			<select id="status" bind:value={statusFilter} onchange={handleFilterChange}>
				<option value="">All</option>
				<option value="pending">Pending</option>
				<option value="approved">Approved</option>
				<option value="rejected">Rejected</option>
				<option value="completed">Completed</option>
				<option value="cancelled">Cancelled</option>
			</select>
		</div>

		<div class="filter-group">
			<label for="meetingType">Meeting Type</label>
			<select id="meetingType" bind:value={meetingTypeFilter} onchange={handleFilterChange}>
				<option value="">All</option>
				<option value="onsite">Onsite</option>
				<option value="online">Online</option>
				<option value="hybrid">Hybrid</option>
			</select>
		</div>

		<div class="filter-group">
			<label for="fromDate">From Date</label>
			<input
				type="date"
				id="fromDate"
				bind:value={fromDateFilter}
				onchange={handleFilterChange}
			/>
		</div>

		<div class="filter-group">
			<label for="toDate">To Date</label>
			<input type="date" id="toDate" bind:value={toDateFilter} onchange={handleFilterChange} />
		</div>

		<button class="btn-clear" onclick={clearFilters}>Clear Filters</button>
	</div>

	{#if loading}
		<div class="loading">Loading bookings...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if bookings.length === 0}
		<div class="no-data">No bookings found</div>
	{:else}
		<!-- Table -->
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Booking ID</th>
						<th>Meeting Title</th>
						<th>Room</th>
						<th>Type</th>
						<th>Start Time</th>
						<th>End Time</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each bookings as booking}
						<tr>
							<td>{booking.bookingId}</td>
							<td>{booking.meetingTitle}</td>
							<td>{booking.roomId}</td>
							<td>
								<span class="badge badge-type">{booking.meetingType}</span>
							</td>
							<td>{formatDateTime(booking.startTime)}</td>
							<td>{formatDateTime(booking.endTime)}</td>
							<td>
								<span class="badge {getStatusClass(booking.status)}">{booking.status}</span>
							</td>
							<td>
								<div class="actions">
									<button class="btn-view" onclick={() => viewDetails(booking)}>View</button>
									{#if booking.status === 'pending' || booking.status === 'approved'}
										<button class="btn-edit" onclick={() => openEditModal(booking)}>Edit</button>
										<button class="btn-cancel" onclick={() => handleCancel(booking)}
											>Cancel</button
										>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		<div class="pagination">
			<div class="pagination-info">
				Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total}
				bookings
			</div>
			<div class="pagination-controls">
				<button onclick={() => handlePageChange(1)} disabled={currentPage === 1}>First</button>
				<button onclick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
					>Previous</button
				>
				<span>Page {currentPage} of {totalPages}</span>
				<button
					onclick={() => handlePageChange(currentPage + 1)}
					disabled={currentPage === totalPages}>Next</button
				>
				<button onclick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}
					>Last</button
				>
			</div>
		</div>
	{/if}
</div>

<!-- Details Modal -->
{#if showDetailsModal && selectedBooking}
	<Modal onclose={() => (showDetailsModal = false)}>
		<h2>Booking Details</h2>
		<div class="details-grid">
			<div class="detail-item">
				<strong>Booking ID:</strong>
				<span>{selectedBooking.bookingId}</span>
			</div>
			<div class="detail-item">
				<strong>Meeting Title:</strong>
				<span>{selectedBooking.meetingTitle}</span>
			</div>
			<div class="detail-item">
				<strong>Room:</strong>
				<span>{selectedBooking.roomId}</span>
			</div>
			<div class="detail-item">
				<strong>Type:</strong>
				<span>{selectedBooking.meetingType}</span>
			</div>
			<div class="detail-item">
				<strong>Organizer:</strong>
				<span>{selectedBooking.organizerId}</span>
			</div>
			<div class="detail-item">
				<strong>Start Time:</strong>
				<span>{formatDateTime(selectedBooking.startTime)}</span>
			</div>
			<div class="detail-item">
				<strong>End Time:</strong>
				<span>{formatDateTime(selectedBooking.endTime)}</span>
			</div>
			<div class="detail-item">
				<strong>Duration:</strong>
				<span>{selectedBooking.duration} minutes</span>
			</div>
			<div class="detail-item">
				<strong>Status:</strong>
				<span class="badge {getStatusClass(selectedBooking.status)}"
					>{selectedBooking.status}</span
				>
			</div>
			<div class="detail-item">
				<strong>Participants:</strong>
				<span>{selectedBooking.participants?.join(', ') || 'None'}</span>
			</div>
			<div class="detail-item">
				<strong>Catering Needed:</strong>
				<span>{selectedBooking.cateringNeeded ? 'Yes' : 'No'}</span>
			</div>
			<div class="detail-item">
				<strong>Recurring:</strong>
				<span>{selectedBooking.isRecurring ? 'Yes' : 'No'}</span>
			</div>
			{#if selectedBooking.notes}
				<div class="detail-item full-width">
					<strong>Notes:</strong>
					<span>{selectedBooking.notes}</span>
				</div>
			{/if}
		</div>
		<div class="modal-actions">
			<button class="btn-secondary" onclick={() => (showDetailsModal = false)}>Close</button>
		</div>
	</Modal>
{/if}

<!-- Edit Modal -->
{#if showEditModal && selectedBooking}
	<Modal onclose={() => (showEditModal = false)}>
		<h2>Edit Booking</h2>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleEdit();
			}}
		>
			<div class="form-group">
				<label for="edit-title">Meeting Title</label>
				<input type="text" id="edit-title" bind:value={editForm.meetingTitle} required />
			</div>

			<div class="form-group">
				<label for="edit-type">Meeting Type</label>
				<select id="edit-type" bind:value={editForm.meetingType} required>
					<option value="onsite">Onsite</option>
					<option value="online">Online</option>
					<option value="hybrid">Hybrid</option>
				</select>
			</div>

			<div class="form-group">
				<label for="edit-start">Start Time</label>
				<input type="datetime-local" id="edit-start" bind:value={editForm.startTime} required />
			</div>

			<div class="form-group">
				<label for="edit-end">End Time</label>
				<input type="datetime-local" id="edit-end" bind:value={editForm.endTime} required />
			</div>

			<div class="form-group">
				<label for="edit-catering">
					<input type="checkbox" id="edit-catering" bind:checked={editForm.cateringNeeded} />
					Catering Needed
				</label>
			</div>

			<div class="form-group">
				<label for="edit-notes">Notes</label>
				<textarea id="edit-notes" bind:value={editForm.notes} rows="3"></textarea>
			</div>

			<div class="modal-actions">
				<button type="button" class="btn-secondary" onclick={() => (showEditModal = false)}
					>Cancel</button
				>
				<button type="submit" class="btn-primary">Save Changes</button>
			</div>
		</form>
	</Modal>
{/if}

<style>
	.bookings-container {
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
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 2rem;
		color: #1a1a1a;
		margin: 0;
	}

	.filters-panel {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 150px;
	}

	.filter-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #555;
	}

	.filter-group select,
	.filter-group input {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.btn-clear {
		padding: 0.5rem 1rem;
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		height: fit-content;
	}

	.btn-clear:hover {
		background: #5a6268;
	}

	.table-container {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: #f8f9fa;
	}

	th {
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		color: #555;
		border-bottom: 2px solid #dee2e6;
		white-space: nowrap;
	}

	td {
		padding: 1rem;
		border-bottom: 1px solid #dee2e6;
	}

	tbody tr:hover {
		background: #f8f9fa;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.badge-scheduled {
		background: #cfe2ff;
		color: #084298;
	}

	.badge-ongoing {
		background: #fff3cd;
		color: #997404;
	}

	.badge-completed {
		background: #d1e7dd;
		color: #0f5132;
	}

	.badge-cancelled {
		background: #f8d7da;
		color: #842029;
	}

	.badge-type {
		background: #e7e7e7;
		color: #333;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.actions button {
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.813rem;
		transition: all 0.2s;
	}

	.btn-view {
		background: #0d6efd;
		color: white;
	}

	.btn-view:hover {
		background: #0b5ed7;
	}

	.btn-edit {
		background: #198754;
		color: white;
	}

	.btn-edit:hover {
		background: #157347;
	}

	.btn-cancel {
		background: #dc3545;
		color: white;
	}

	.btn-cancel:hover {
		background: #bb2d3b;
	}

	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 2rem;
		padding: 1rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.pagination-info {
		font-size: 0.875rem;
		color: #555;
	}

	.pagination-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.pagination-controls button {
		padding: 0.5rem 1rem;
		background: #0d6efd;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.pagination-controls button:hover:not(:disabled) {
		background: #0b5ed7;
	}

	.pagination-controls button:disabled {
		background: #e9ecef;
		color: #6c757d;
		cursor: not-allowed;
	}

	.pagination-controls span {
		font-size: 0.875rem;
		color: #555;
	}

	.loading,
	.error,
	.no-data {
		padding: 3rem;
		text-align: center;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.error {
		color: #dc3545;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin: 1.5rem 0;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-item.full-width {
		grid-column: 1 / -1;
	}

	.detail-item strong {
		font-size: 0.813rem;
		color: #666;
	}

	.detail-item span {
		font-size: 0.938rem;
		color: #1a1a1a;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #dee2e6;
	}

	.modal-actions button {
		padding: 0.5rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.938rem;
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

	.btn-secondary {
		background: #6c757d;
		color: white;
	}

	.btn-secondary:hover {
		background: #5a6268;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #555;
	}

	.form-group input[type='text'],
	.form-group input[type='datetime-local'],
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.938rem;
	}

	.form-group input[type='checkbox'] {
		margin-right: 0.5rem;
	}

	.form-group textarea {
		resize: vertical;
	}
</style>

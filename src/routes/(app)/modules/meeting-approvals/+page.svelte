<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	let title = 'Approve Meeting Requests - Admin';
	let isLoading = true;
	let meetingRequests: any[] = [];
	let filteredRequests: any[] = [];

	// Filters
	let statusFilter = 'pending'; // Show pending by default
	let typeFilter = 'all';
	let searchQuery = '';

	// Modal state
	let showApprovalModal = false;
	let selectedRequest: any = null;
	let approvalAction: 'approve' | 'reject' = 'approve';
	let rejectionReason = '';
	let approvalNotes = '';

	// Assignment data (for offline/hybrid meetings)
	let selectedRoomId = '';
	let rooms: any[] = [];

	// Assignment data (for online/hybrid meetings)
	let selectedLicenseId = '';
	let meetingLink = '';
	let licenses: any[] = [];

	// Pagination
	let currentPage = 1;
	let totalPages = 1;
	let totalRequests = 0;
	const itemsPerPage = 10;

	onMount(async () => {
		await Promise.all([loadRequests(), loadRooms(), loadLicenses()]);
	});

	async function loadRequests() {
		try {
			isLoading = true;
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString()
			});

			if (statusFilter !== 'all') params.set('status', statusFilter);
			if (typeFilter !== 'all') params.set('type', typeFilter);

			const response = await fetch(`/api/v1/meeting/requests?${params.toString()}`);
			const result = await response.json();

			if (result.success) {
				meetingRequests = result.data || [];
				totalRequests = result.meta?.total || 0;
				totalPages = Math.ceil(totalRequests / itemsPerPage);
				applyFilters();
			}
		} catch (error) {
			console.error('Failed to load requests:', error);
		} finally {
			isLoading = false;
		}
	}

	async function loadRooms() {
		try {
			const response = await fetch('/api/v1/rooms');
			const result = await response.json();
			if (result.success) {
				rooms = result.data || [];
			}
		} catch (error) {
			console.error('Failed to load rooms:', error);
		}
	}

	async function loadLicenses() {
		try {
			const response = await fetch('/api/v1/licenses');
			const result = await response.json();
			if (result.success) {
				licenses = result.data || [];
			}
		} catch (error) {
			console.error('Failed to load licenses:', error);
		}
	}

	function applyFilters() {
		filteredRequests = meetingRequests.filter((req) => {
			const matchesSearch =
				searchQuery === '' ||
				req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				req.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				req.title.toLowerCase().includes(searchQuery.toLowerCase());

			return matchesSearch;
		});
	}

	function openApprovalModal(request: any, action: 'approve' | 'reject') {
		selectedRequest = request;
		approvalAction = action;
		rejectionReason = '';
		approvalNotes = '';
		selectedRoomId = '';
		selectedLicenseId = '';
		meetingLink = '';
		showApprovalModal = true;
	}

	function closeModal() {
		showApprovalModal = false;
		selectedRequest = null;
	}

	async function handleApproveReject() {
		if (!selectedRequest) return;

		try {
			const body: any = {
				action: approvalAction
			};

			if (approvalAction === 'reject') {
				body.rejectionReason = rejectionReason;
			} else if (approvalAction === 'approve') {
				body.notes = approvalNotes;
			}

			const response = await fetch(`/api/v1/meeting/requests/${selectedRequest._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const result = await response.json();

			if (result.success) {
				alert(
					approvalAction === 'approve'
						? `Request ${selectedRequest.requestNumber} approved successfully!`
						: `Request ${selectedRequest.requestNumber} rejected.`
				);
				closeModal();
				await loadRequests();
			} else {
				alert(`Failed: ${result.error?.message || 'Unknown error'}`);
			}
		} catch (error: any) {
			alert(`Error: ${error.message}`);
		}
	}

	async function handleAssignRoom() {
		if (!selectedRequest || !selectedRoomId) {
			alert('Please select a room');
			return;
		}

		try {
			const selectedRoom = rooms.find((r) => r._id === selectedRoomId);

			const response = await fetch(`/api/v1/meeting/requests/${selectedRequest._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'assign_room',
					roomId: selectedRoomId,
					roomName: selectedRoom?.roomName || ''
				})
			});

			const result = await response.json();

			if (result.success) {
				alert(`Room assigned to request ${selectedRequest.requestNumber}!`);
				closeModal();
				await loadRequests();
			} else {
				alert(`Failed: ${result.error?.message || 'Unknown error'}`);
			}
		} catch (error: any) {
			alert(`Error: ${error.message}`);
		}
	}

	async function handleAssignLicense() {
		if (!selectedRequest || !selectedLicenseId || !meetingLink) {
			alert('Please select a license and provide meeting link');
			return;
		}

		try {
			const selectedLicense = licenses.find((l) => l._id === selectedLicenseId);

			const response = await fetch(`/api/v1/meeting/requests/${selectedRequest._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'assign_license',
					licenseId: selectedLicenseId,
					platform: selectedLicense?.platform || selectedRequest.platform,
					meetingLink
				})
			});

			const result = await response.json();

			if (result.success) {
				alert(`Meeting license assigned to request ${selectedRequest.requestNumber}!`);
				closeModal();
				await loadRequests();
			} else {
				alert(`Failed: ${result.error?.message || 'Unknown error'}`);
			}
		} catch (error: any) {
			alert(`Error: ${error.message}`);
		}
	}

	function getStatusBadgeClass(status: string) {
		const classes: Record<string, string> = {
			pending: 'badge-warning',
			approved: 'badge-success',
			rejected: 'badge-danger',
			assigned: 'badge-info',
			in_progress: 'badge-primary',
			completed: 'badge-success',
			cancelled: 'badge-secondary'
		};
		return classes[status] || 'badge-secondary';
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Re-apply filters when search changes
	$: searchQuery, applyFilters();

	// Reload when filters or page changes
	$: statusFilter, typeFilter, currentPage, loadRequests();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="approvals-page">
	<div class="header">
		<h1>Meeting Requests Approval</h1>
		<p class="subtitle">Review and approve employee meeting room booking requests</p>
	</div>

	<!-- Filters -->
	<div class="card filters-card">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="statusFilter">Status</label>
				<select id="statusFilter" bind:value={statusFilter}>
					<option value="all">All Statuses</option>
					<option value="pending">Pending</option>
					<option value="approved">Approved</option>
					<option value="rejected">Rejected</option>
					<option value="assigned">Assigned</option>
					<option value="in_progress">In Progress</option>
					<option value="completed">Completed</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="typeFilter">Type</label>
				<select id="typeFilter" bind:value={typeFilter}>
					<option value="all">All Types</option>
					<option value="online">Online</option>
					<option value="offline">Offline</option>
					<option value="hybrid">Hybrid</option>
				</select>
			</div>

			<div class="filter-group search-group">
				<label for="search">Search</label>
				<input
					type="text"
					id="search"
					bind:value={searchQuery}
					placeholder="Request #, organizer name, title..."
				/>
			</div>
		</div>
	</div>

	<!-- Requests List -->
	<div class="card requests-card">
		{#if isLoading}
			<div class="loading">
				<p>Loading requests...</p>
			</div>
		{:else if filteredRequests.length === 0}
			<div class="empty-state">
				<p>📋 No requests found</p>
				<span>Try adjusting your filters</span>
			</div>
		{:else}
			<div class="requests-list">
				{#each filteredRequests as request}
					<div class="request-item" transition:slide={{ duration: 200 }}>
						<div class="request-header">
							<div class="request-meta">
								<h3>{request.requestNumber}</h3>
								<span class="badge {getStatusBadgeClass(request.status)}">
									{request.status.replace('_', ' ')}
								</span>
								<span class="badge badge-outline">
									{request.type === 'online' ? '💻 Online' : request.type === 'offline' ? '🏢 Offline' : '🔀 Hybrid'}
								</span>
							</div>
						</div>

						<div class="request-body">
							<div class="info-grid">
								<div class="info-item">
									<span class="label">Organizer:</span>
									<span class="value">{request.userName}</span>
								</div>
								<div class="info-item">
									<span class="label">Start:</span>
									<span class="value">{formatDate(request.startTime)}</span>
								</div>
								<div class="info-item full-width">
									<span class="label">Title:</span>
									<span class="value">{request.title}</span>
								</div>
								<div class="info-item">
									<span class="label">Duration:</span>
									<span class="value">{request.duration} minutes</span>
								</div>
								<div class="info-item">
									<span class="label">Participants:</span>
									<span class="value">{request.participantCount || request.participants.length}</span>
								</div>
								{#if request.platform}
									<div class="info-item">
										<span class="label">Platform:</span>
										<span class="value">{request.platform}</span>
									</div>
								{/if}
								{#if request.cateringRequired}
									<div class="info-item">
										<span class="label">Catering:</span>
										<span class="value">✓ Required</span>
									</div>
								{/if}
							</div>

							{#if request.description}
								<div class="special-requirements">
									<span class="label">Description:</span>
									<span class="value">{request.description}</span>
								</div>
							{/if}
						</div>

						<div class="request-actions">
							{#if request.status === 'pending'}
								<button class="btn btn-success" onclick={() => openApprovalModal(request, 'approve')}>
									✓ Approve
								</button>
								<button class="btn btn-danger" onclick={() => openApprovalModal(request, 'reject')}>
									✕ Reject
								</button>
							{/if}

							{#if request.status === 'approved'}
								{#if request.type === 'offline' || request.type === 'hybrid'}
									<button class="btn btn-primary" onclick={() => openApprovalModal(request, 'approve')}>
										🏢 Assign Room
									</button>
								{/if}
								{#if request.type === 'online' || request.type === 'hybrid'}
									<button class="btn btn-primary" onclick={() => openApprovalModal(request, 'approve')}>
										💻 Assign License
									</button>
								{/if}
							{/if}

							{#if request.status === 'assigned'}
								<div class="assigned-info">
									{#if request.roomName}
										<span>✓ Room: {request.roomName}</span>
									{/if}
									{#if request.meetingLink}
										<span>✓ Link: {request.meetingLink}</span>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="pagination">
					<button
						class="btn btn-secondary"
						disabled={currentPage === 1}
						onclick={() => {
							currentPage--;
						}}
					>
						Previous
					</button>
					<span>
						Page {currentPage} of {totalPages} ({totalRequests} total)
					</span>
					<button
						class="btn btn-secondary"
						disabled={currentPage === totalPages}
						onclick={() => {
							currentPage++;
						}}
					>
						Next
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Approval/Rejection Modal -->
{#if showApprovalModal && selectedRequest}
	<div class="modal-overlay" onclick={closeModal}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>
					{approvalAction === 'approve' ? '✓ Approve Request' : '✕ Reject Request'}
				</h2>
				<button class="btn-close" onclick={closeModal}>✕</button>
			</div>

			<div class="modal-body">
				<div class="request-summary">
					<h3>{selectedRequest.requestNumber}</h3>
					<p><strong>Organizer:</strong> {selectedRequest.userName}</p>
					<p><strong>Type:</strong> {selectedRequest.type}</p>
					<p><strong>Title:</strong> {selectedRequest.title}</p>
					<p><strong>Start:</strong> {formatDate(selectedRequest.startTime)}</p>
					<p><strong>End:</strong> {formatDate(selectedRequest.endTime)}</p>
					<p><strong>Participants:</strong> {selectedRequest.participantCount || selectedRequest.participants.length}</p>
				</div>

				{#if approvalAction === 'reject'}
					<div class="form-group">
						<label for="rejectionReason">Rejection Reason <span class="required">*</span></label>
						<textarea
							id="rejectionReason"
							bind:value={rejectionReason}
							rows="3"
							placeholder="Please provide a reason for rejection..."
							required
						></textarea>
					</div>
				{:else if selectedRequest.status === 'pending'}
					<div class="form-group">
						<label for="approvalNotes">Notes (Optional)</label>
						<textarea
							id="approvalNotes"
							bind:value={approvalNotes}
							rows="2"
							placeholder="Add any notes..."
						></textarea>
					</div>
				{:else if selectedRequest.status === 'approved'}
					{#if selectedRequest.type === 'offline' || selectedRequest.type === 'hybrid'}
						<div class="assignment-section">
							<h4>Assign Meeting Room</h4>

							<div class="form-group">
								<label for="room">Select Room <span class="required">*</span></label>
								<select id="room" bind:value={selectedRoomId} required>
									<option value="">-- Choose Room --</option>
									{#each rooms as room}
										<option value={room._id}>
											{room.roomName} - {room.locationName} (Capacity: {room.capacity})
										</option>
									{/each}
								</select>
							</div>
						</div>
					{/if}

					{#if selectedRequest.type === 'online' || selectedRequest.type === 'hybrid'}
						<div class="assignment-section">
							<h4>Assign Meeting License</h4>

							<div class="form-group">
								<label for="license">Select License <span class="required">*</span></label>
								<select id="license" bind:value={selectedLicenseId} required>
									<option value="">-- Choose License --</option>
									{#each licenses as license}
										<option value={license._id}>
											{license.platform} - {license.licenseKey}
										</option>
									{/each}
								</select>
							</div>

							<div class="form-group">
								<label for="meetingLink">Meeting Link <span class="required">*</span></label>
								<input
									type="url"
									id="meetingLink"
									bind:value={meetingLink}
									placeholder="https://zoom.us/j/..."
									required
								/>
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<div class="modal-footer">
				<button class="btn btn-secondary" onclick={closeModal}>Cancel</button>

				{#if approvalAction === 'reject'}
					<button
						class="btn btn-danger"
						onclick={handleApproveReject}
						disabled={!rejectionReason.trim()}
					>
						Reject Request
					</button>
				{:else if selectedRequest.status === 'pending'}
					<button class="btn btn-success" onclick={handleApproveReject}>Approve Request</button>
				{:else if selectedRequest.type === 'offline'}
					<button
						class="btn btn-primary"
						onclick={handleAssignRoom}
						disabled={!selectedRoomId}
					>
						Assign Room
					</button>
				{:else if selectedRequest.type === 'online'}
					<button
						class="btn btn-primary"
						onclick={handleAssignLicense}
						disabled={!selectedLicenseId || !meetingLink.trim()}
					>
						Assign License
					</button>
				{:else if selectedRequest.type === 'hybrid'}
					<button
						class="btn btn-primary"
						onclick={() => {
							if (selectedRoomId) handleAssignRoom();
							else if (selectedLicenseId && meetingLink) handleAssignLicense();
						}}
						disabled={!selectedRoomId && (!selectedLicenseId || !meetingLink.trim())}
					>
						Assign Resources
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Reuse the exact same styles from transport approvals */
	.approvals-page {
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

	.card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		margin-bottom: 1.5rem;
	}

	/* Filters */
	.filters-grid {
		display: grid;
		grid-template-columns: 200px 200px 1fr;
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
	}

	select,
	input[type='text'],
	input[type='url'] {
		padding: 0.5rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
	}

	select:focus,
	input:focus {
		outline: none;
		border-color: #667eea;
	}

	/* Requests List */
	.requests-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.request-item {
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.2s;
	}

	.request-item:hover {
		border-color: #667eea;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.request-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.request-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.request-meta h3 {
		margin: 0;
		font-size: 1.2rem;
		color: #333;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.badge-warning {
		background: #fef3c7;
		color: #92400e;
	}

	.badge-success {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-danger {
		background: #fee2e2;
		color: #991b1b;
	}

	.badge-info {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-primary {
		background: #e0e7ff;
		color: #3730a3;
	}

	.badge-secondary {
		background: #f3f4f6;
		color: #4b5563;
	}

	.badge-outline {
		background: transparent;
		border: 2px solid #e2e8f0;
		color: #666;
	}

	.request-body {
		margin-bottom: 1rem;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.info-item {
		display: flex;
		gap: 0.5rem;
	}

	.info-item.full-width {
		grid-column: 1 / -1;
	}

	.info-item .label {
		font-weight: 500;
		color: #666;
		min-width: 100px;
	}

	.info-item .value {
		color: #333;
	}

	.special-requirements {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #f8f9fa;
		border-radius: 8px;
		display: flex;
		gap: 0.5rem;
	}

	.request-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn {
		padding: 0.5rem 1.5rem;
		border-radius: 8px;
		border: none;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.95rem;
	}

	.btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-success {
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
		color: white;
	}

	.btn-danger {
		background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
		color: white;
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

	.assigned-info {
		color: #38a169;
		font-weight: 500;
	}

	.loading,
	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	.empty-state p {
		font-size: 1.2rem;
		margin: 0 0 0.5rem 0;
	}

	.empty-state span {
		font-size: 0.9rem;
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.btn-close:hover {
		background: #f0f0f0;
		color: #333;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.request-summary {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.request-summary h3 {
		margin: 0 0 0.75rem 0;
		color: #333;
	}

	.request-summary p {
		margin: 0.25rem 0;
		color: #666;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #333;
	}

	.required {
		color: #f56565;
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		resize: vertical;
	}

	textarea:focus {
		outline: none;
		border-color: #667eea;
	}

	.assignment-section {
		border-top: 2px solid #e2e8f0;
		padding-top: 1rem;
		margin-top: 1rem;
	}

	.assignment-section h4 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 2px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	@media (max-width: 768px) {
		.filters-grid {
			grid-template-columns: 1fr;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}

		.request-actions {
			flex-direction: column;
		}

		.btn {
			width: 100%;
		}
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let title = 'Assign Device to Room - OFM';
	let deviceId = $derived($page.url.searchParams.get('deviceId') || '');
	let rooms: any[] = $state([]);
	let selectedRoomId = $state('');
	let loading = $state(true);
	let submitting = $state(false);
	let error = $state('');
	let success = $state(false);

	onMount(async () => {
		if (!deviceId) {
			error = 'Device ID is required';
			loading = false;
			return;
		}

		await fetchRooms();
	});

	async function fetchRooms() {
		try {
			const response = await fetch('/api/v1/rooms?limit=100');
			const result = await response.json();

			if (result.success) {
				rooms = result.data;
			} else {
				error = result.error || 'Failed to fetch rooms';
			}
		} catch (err) {
			error = 'Failed to connect to server';
			console.error('Error fetching rooms:', err);
		} finally {
			loading = false;
		}
	}

	async function handleAssign() {
		if (!selectedRoomId) {
			error = 'Please select a room';
			return;
		}

		submitting = true;
		error = '';

		try {
			const response = await fetch(`/api/v1/devices/${deviceId}/assignment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					roomId: selectedRoomId,
					assignedBy: 'admin' // TODO: Get actual admin user ID from session
				})
			});

			const result = await response.json();

			if (result.success) {
				success = true;
				setTimeout(() => {
					goto('/admin/devices');
				}, 2000);
			} else {
				error = result.error || 'Failed to assign device';
			}
		} catch (err) {
			error = 'Failed to assign device';
			console.error('Error assigning device:', err);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="assign-device-page">
	<div class="page-header">
		<h1>Assign Device to Room</h1>
		<p class="subtitle">Link this display device to a meeting room</p>
	</div>

	{#if loading}
		<div class="loading">Loading rooms...</div>
	{:else if success}
		<div class="success-message">
			<div class="success-icon">✓</div>
			<h2>Device Assigned Successfully!</h2>
			<p>The display will automatically switch to the assigned room.</p>
			<p class="redirect-hint">Redirecting to devices list...</p>
		</div>
	{:else}
		<div class="assign-card">
			<div class="device-info-section">
				<label>Device ID:</label>
				<div class="device-id-display">{deviceId}</div>
			</div>

			{#if error}
				<div class="alert alert-error">
					<span class="alert-icon">⚠️</span>
					<span>{error}</span>
				</div>
			{/if}

			<div class="form-section">
				<label for="roomSelect">Select Meeting Room: *</label>
				<select id="roomSelect" bind:value={selectedRoomId} class="room-select" disabled={submitting}>
					<option value="">-- Select a room --</option>
					{#each rooms as room}
						<option value={room.roomId}>
							{room.roomName} {room.roomNumber ? `(${room.roomNumber})` : ''} - Floor {room.floor || 'N/A'}
						</option>
					{/each}
				</select>

				{#if selectedRoomId}
					{@const selectedRoom = rooms.find(r => r.roomId === selectedRoomId)}
					{#if selectedRoom}
						<div class="room-preview">
							<h3>Selected Room:</h3>
							<div class="room-details">
								<div class="detail-row">
									<span class="label">Name:</span>
									<span class="value">{selectedRoom.roomName}</span>
								</div>
								<div class="detail-row">
									<span class="label">Capacity:</span>
									<span class="value">{selectedRoom.capacity} people</span>
								</div>
								<div class="detail-row">
									<span class="label">Floor:</span>
									<span class="value">{selectedRoom.floor || 'N/A'}</span>
								</div>
								<div class="detail-row">
									<span class="label">Type:</span>
									<span class="value">{selectedRoom.roomType}</span>
								</div>
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<div class="form-actions">
				<a href="/admin/devices" class="btn-secondary">Cancel</a>
				<button
					class="btn-primary"
					onclick={handleAssign}
					disabled={submitting || !selectedRoomId}
				>
					{submitting ? 'Assigning...' : 'Assign Device'}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.assign-device-page {
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
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin: 0.5rem 0 0 0;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		background: white;
		border-radius: 12px;
		color: #666;
	}

	.success-message {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.success-icon {
		width: 100px;
		height: 100px;
		margin: 0 auto 2rem;
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4rem;
		font-weight: bold;
	}

	.success-message h2 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.success-message p {
		color: #666;
		margin: 0.5rem 0;
	}

	.redirect-hint {
		margin-top: 2rem;
		font-style: italic;
		color: #999;
	}

	.assign-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		max-width: 600px;
		margin: 0 auto;
	}

	.device-info-section {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.device-info-section label {
		display: block;
		font-size: 0.9rem;
		color: #666;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.device-id-display {
		font-size: 1.3rem;
		font-family: 'Courier New', monospace;
		color: #667eea;
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.alert-icon {
		font-size: 1.5rem;
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.form-section label {
		display: block;
		font-weight: 600;
		color: #333;
		margin-bottom: 0.75rem;
		font-size: 1rem;
	}

	.room-select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
		background: white;
	}

	.room-select:focus {
		outline: none;
		border-color: #667eea;
	}

	.room-select:disabled {
		background: #f9fafb;
		cursor: not-allowed;
	}

	.room-preview {
		margin-top: 1.5rem;
		padding: 1.5rem;
		background: #f0f4ff;
		border-radius: 12px;
		border: 2px solid #667eea;
	}

	.room-preview h3 {
		margin: 0 0 1rem 0;
		color: #667eea;
		font-size: 1.1rem;
	}

	.room-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.detail-row .label {
		color: #666;
		font-weight: 600;
	}

	.detail-row .value {
		color: #333;
		font-weight: 500;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.75rem 2rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-block;
		text-align: center;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:disabled {
		background: #d1d5db;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #333;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	@media (max-width: 768px) {
		.assign-card {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}
	}
</style>

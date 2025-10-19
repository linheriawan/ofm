<script lang="ts">
	import { onMount } from 'svelte';
	import type { MeetingRoom } from '$lib/types';

	let title = 'Room Display Management - OFM';
	let rooms: MeetingRoom[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let baseUrl = $state('');

	onMount(() => {
		baseUrl = window.location.origin;
		fetchRooms();
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

	function getDisplayUrl(roomId: string) {
		return `${baseUrl}/display/room/${roomId}`;
	}

	function getQRCodeUrl(url: string) {
		// Using a free QR code API
		return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		alert('URL copied to clipboard!');
	}

	function printQRCodes() {
		window.print();
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="room-displays-page">
	<div class="page-header">
		<div>
			<h1>Room Display Management</h1>
			<p class="subtitle">Generate QR codes and URLs for room display tablets</p>
		</div>
		<button class="btn-print" onclick={printQRCodes}>
			🖨️ Print All QR Codes
		</button>
	</div>

	{#if loading}
		<div class="loading">Loading rooms...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if rooms.length === 0}
		<div class="no-data">No rooms found. Please add rooms first.</div>
	{:else}
		<div class="rooms-grid">
			{#each rooms as room}
				{@const displayUrl = getDisplayUrl(room._id?.toString() || '')}
				{@const qrUrl = getQRCodeUrl(displayUrl)}

				<div class="room-card">
					<div class="room-header">
						<h3>{room.roomName}</h3>
						<span class="room-number">{room.roomNumber}</span>
					</div>

					<div class="qr-section">
						<img src={qrUrl} alt="QR Code for {room.roomName}" class="qr-code" />
						<p class="qr-hint">Scan to access room display</p>
					</div>

					<div class="url-section">
						<label>Display URL:</label>
						<div class="url-input-group">
							<input
								type="text"
								value={displayUrl}
								readonly
								class="url-input"
							/>
							<button
								class="btn-copy"
								onclick={() => copyToClipboard(displayUrl)}
								title="Copy URL"
							>
								📋
							</button>
						</div>
					</div>

					<div class="actions">
						<a href={displayUrl} target="_blank" class="btn-preview">
							Preview Display
						</a>
					</div>

					<div class="room-info">
						<span>Floor: {room.floor || 'N/A'}</span>
						<span>Capacity: {room.capacity}</span>
						<span class="status {room.status}">{room.status}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.room-displays-page {
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
		align-items: flex-start;
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

	.btn-print {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.btn-print:hover {
		transform: translateY(-2px);
	}

	.loading,
	.error,
	.no-data {
		text-align: center;
		padding: 3rem;
		background: white;
		border-radius: 12px;
		color: #666;
	}

	.error {
		color: #e53e3e;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 2rem;
	}

	.room-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		transition: transform 0.2s, box-shadow 0.2s;
		page-break-inside: avoid;
	}

	.room-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
	}

	.room-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.room-header h3 {
		margin: 0;
		font-size: 1.25rem;
		color: #333;
	}

	.room-number {
		padding: 0.25rem 0.75rem;
		background: #f0f4ff;
		color: #667eea;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.qr-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.qr-code {
		width: 200px;
		height: 200px;
		border-radius: 8px;
		background: white;
		padding: 0.5rem;
	}

	.qr-hint {
		margin: 0.5rem 0 0 0;
		font-size: 0.85rem;
		color: #666;
	}

	.url-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.url-section label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #555;
	}

	.url-input-group {
		display: flex;
		gap: 0.5rem;
	}

	.url-input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.85rem;
		background: #f9fafb;
		color: #555;
	}

	.btn-copy {
		padding: 0.75rem 1rem;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 1.2rem;
	}

	.btn-copy:hover {
		background: #e5e7eb;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-preview {
		flex: 1;
		padding: 0.75rem;
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
		color: white;
		text-decoration: none;
		text-align: center;
		border-radius: 6px;
		font-weight: 500;
		transition: transform 0.2s;
	}

	.btn-preview:hover {
		transform: translateY(-2px);
	}

	.room-info {
		display: flex;
		justify-content: space-between;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
		font-size: 0.85rem;
		color: #666;
	}

	.status {
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-weight: 500;
		text-transform: capitalize;
	}

	.status.available {
		background: #d1fae5;
		color: #065f46;
	}

	.status.occupied {
		background: #fee2e2;
		color: #991b1b;
	}

	.status.maintenance {
		background: #fef3c7;
		color: #92400e;
	}

	/* Print styles */
	@media print {
		.page-header,
		.actions,
		.url-section {
			display: none;
		}

		.rooms-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.room-card {
			box-shadow: none;
			border: 1px solid #ddd;
		}

		.qr-code {
			width: 150px;
			height: 150px;
		}
	}

	@media (max-width: 768px) {
		.rooms-grid {
			grid-template-columns: 1fr;
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>

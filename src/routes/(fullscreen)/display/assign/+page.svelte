<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let deviceId = $state('');
	let assignUrl = $state('');
	let qrCodeUrl = $state('');
	let isAssigning = $state(false); // Only true when assignment detected and transitioning
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Generate or get existing device ID
	function getOrCreateDeviceId(): string {
		if (!browser) return '';

		let id = localStorage.getItem('deviceId');
		if (!id) {
			// Generate unique device ID
			id = 'DEV-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
			localStorage.setItem('deviceId', id);
		}
		return id;
	}

	// Generate QR code URL
	function generateQRCode(url: string): string {
		return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
	}

	// Check if device has been assigned
	async function checkAssignment() {
		try {
			const response = await fetch(`/api/v1/devices/${deviceId}/assignment`);
			const result = await response.json();

			if (result.success && result.data.assigned) {
				// Device has been assigned!
				isAssigning = true; // Show spinner during transition
				stopPolling();
				localStorage.setItem('assignedRoomId', result.data.roomId);

				// Short delay to show spinner, then redirect
				setTimeout(() => {
					goto(`/display/room/${result.data.roomId}`);
				}, 1000);
			}
		} catch (error) {
			console.error('Error checking assignment:', error);
		}
	}

	// Start polling for assignment
	function startPolling() {
		if (pollInterval) return;

		// Poll every 5 seconds
		pollInterval = setInterval(() => {
			checkAssignment();
		}, 5000);
	}

	// Stop polling
	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	onMount(() => {
		// Generate device ID
		deviceId = getOrCreateDeviceId();

		// Create assignment URL
		const baseUrl = window.location.origin;
		assignUrl = `${baseUrl}/admin/assign-device?deviceId=${deviceId}`;

		// Generate QR code
		qrCodeUrl = generateQRCode(assignUrl);

		// Start checking for assignment
		checkAssignment();
		startPolling();

		// Cleanup on unmount
		return () => {
			stopPolling();
		};
	});
</script>

<svelte:head>
	<title>Device Setup - OFM</title>
</svelte:head>

<div class="assignment-screen">
	<div class="content">
		<div class="header">
			<h1>OFM</h1>
			<p class="subtitle">Device Setup</p>
		</div>

		<div class="setup-card">
			<div class="device-info">
				<span class="label">Device ID:</span>
				<span class="device-id">{deviceId}</span>
			</div>

			<div class="qr-section">
				{#if qrCodeUrl}
					<img src={qrCodeUrl} alt="Assignment QR Code" class="qr-code" />
				{/if}
				<p class="qr-hint">Scan QR code to assign this device to a room</p>
			</div>

			<div class="status">
				{#if isAssigning}
					<div class="spinner"></div>
					<p class="status-text loading">Connecting to assigned room...</p>
				{:else}
					<div class="status-icon">⏳</div>
					<p class="status-text">Waiting for assignment</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.assignment-screen {
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1.5rem;
		overflow: hidden;
	}

	.content {
		max-width: 500px;
		width: 100%;
	}

	.header {
		text-align: center;
		margin-bottom: 1.5rem;
		color: white;
	}

	.header h1 {
		font-size: 3rem;
		margin: 0;
		font-weight: 700;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.subtitle {
		font-size: 1rem;
		margin: 0.25rem 0 0 0;
		opacity: 0.95;
	}

	.setup-card {
		background: white;
		border-radius: 16px;
		padding: 2rem 1.5rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
		text-align: center;
	}

	.device-info {
		background: #f9fafb;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.device-info .label {
		font-size: 0.85rem;
		color: #666;
		font-weight: 600;
	}

	.device-id {
		font-size: 1.1rem;
		font-family: 'Courier New', monospace;
		color: #667eea;
		font-weight: 700;
		letter-spacing: 0.03em;
	}

	.qr-section {
		margin-bottom: 1.5rem;
	}

	.qr-code {
		width: 250px;
		height: 250px;
		border-radius: 12px;
		background: white;
		padding: 0.75rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		display: inline-block;
	}

	.qr-hint {
		margin: 1rem 0 0 0;
		color: #666;
		font-size: 0.9rem;
	}

	.status {
		padding: 1rem;
		background: #f0f4ff;
		border-radius: 8px;
		min-height: 80px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.status-icon {
		font-size: 2rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e0e7ff;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.status-text {
		margin: 0;
		font-weight: 600;
		font-size: 1rem;
		color: #667eea;
	}

	.status-text.loading {
		color: #48bb78;
	}

	@media (max-width: 768px) {
		.assignment-screen {
			padding: 1rem;
		}

		.header h1 {
			font-size: 2.5rem;
		}

		.setup-card {
			padding: 1.5rem 1rem;
		}

		.qr-code {
			width: 220px;
			height: 220px;
		}
	}

	@media (max-height: 700px) {
		.header h1 {
			font-size: 2rem;
		}

		.header {
			margin-bottom: 1rem;
		}

		.setup-card {
			padding: 1.5rem 1rem;
		}

		.qr-code {
			width: 200px;
			height: 200px;
		}

		.device-info {
			margin-bottom: 1rem;
		}

		.qr-section {
			margin-bottom: 1rem;
		}
	}
</style>

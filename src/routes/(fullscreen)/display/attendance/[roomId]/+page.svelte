<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	const roomId = $page.params.roomId;

	let roomData = $state({
		roomName: '',
		currentMeeting: null as any
	});

	let employeeId = $state('');
	let loading = $state(true);
	let submitting = $state(false);
	let error = $state('');
	let success = $state(false);

	onMount(async () => {
		await loadRoomData();
	});

	async function loadRoomData() {
		try {
			const response = await fetch(`/api/v1/rooms/${roomId}/schedule`);
			const result = await response.json();

			if (result.success && result.data) {
				roomData.roomName = result.data.room?.roomName || 'Unknown Room';
				roomData.currentMeeting = result.data.current || null;
			} else {
				error = 'Room not found';
			}
		} catch (err) {
			console.error('Error loading room:', err);
			error = 'Failed to load room data';
		} finally {
			loading = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!employeeId.trim()) {
			error = 'Please enter your Employee ID';
			return;
		}

		if (!roomData.currentMeeting) {
			error = 'No active meeting in this room';
			return;
		}

		submitting = true;
		error = '';

		try {
			const response = await fetch(`/api/v1/meetings/${roomData.currentMeeting._id}/checkin`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: employeeId.trim(),
					method: 'qr'
				})
			});

			const result = await response.json();

			if (result.success) {
				success = true;
			} else {
				error = result.error || 'Check-in failed';
			}
		} catch (err) {
			console.error('Check-in error:', err);
			error = 'Failed to connect to server';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Check In - {roomData.roomName}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
</svelte:head>

<div class="attendance-page">
	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading...</p>
		</div>
	{:else if success}
		<div class="success-card">
			<div class="success-icon">✓</div>
			<h1>Check-in Successful!</h1>
			<p class="meeting-name">{roomData.currentMeeting?.meetingTitle}</p>
			<p class="employee-id">Employee ID: {employeeId}</p>
			<p class="hint">You can close this page now</p>
		</div>
	{:else}
		<div class="check-in-card">
			<div class="room-header">
				<h1>{roomData.roomName}</h1>
				{#if roomData.currentMeeting}
					<p class="meeting-title">{roomData.currentMeeting.meetingTitle}</p>
					<p class="meeting-organizer">Organized by {roomData.currentMeeting.organizerId}</p>
				{:else}
					<p class="no-meeting">No active meeting in this room</p>
				{/if}
			</div>

			{#if roomData.currentMeeting}
				<form onsubmit={handleSubmit} class="check-in-form">
					<label for="employeeId">NIK (Employee ID)</label>
					<input
						id="employeeId"
						type="text"
						bind:value={employeeId}
						placeholder="123456"
						disabled={submitting}
						class="input"
						autocomplete="off"
						autofocus
					/>

					{#if error}
						<div class="error-message">
							⚠️ {error}
						</div>
					{/if}

					<button type="submit" class="submit-btn" disabled={submitting || !employeeId.trim()}>
						{submitting ? 'Checking in...' : 'Check In'}
					</button>
				</form>
			{/if}
		</div>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	.attendance-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.loading {
		text-align: center;
		color: white;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.check-in-card,
	.success-card {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.success-card {
		text-align: center;
	}

	.success-icon {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
		color: white;
		font-size: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		margin: 0 auto 1rem;
	}

	.room-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.room-header h1 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		color: #333;
	}

	.meeting-title,
	.meeting-name {
		font-size: 1.1rem;
		color: #667eea;
		font-weight: 600;
		margin: 0.5rem 0;
	}

	.meeting-organizer {
		font-size: 0.9rem;
		color: #666;
		margin: 0.25rem 0;
	}

	.no-meeting {
		font-size: 1rem;
		color: #999;
		padding: 2rem;
		background: #f9fafb;
		border-radius: 8px;
		margin-top: 1rem;
	}

	.employee-id {
		font-size: 1rem;
		color: #666;
		margin: 1rem 0;
	}

	.hint {
		font-size: 0.85rem;
		color: #999;
		margin-top: 1.5rem;
	}

	.check-in-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.check-in-form label {
		font-weight: 600;
		color: #333;
		font-size: 0.9rem;
	}

	.input {
		padding: 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
		outline: none;
	}

	.input:focus {
		border-color: #667eea;
	}

	.input:disabled {
		background: #f9fafb;
		cursor: not-allowed;
	}

	.error-message {
		padding: 1rem;
		background: #fee;
		border: 2px solid #fcc;
		border-radius: 8px;
		color: #c00;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.submit-btn {
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, opacity 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		.check-in-card,
		.success-card {
			padding: 1.5rem;
		}

		.room-header h1 {
			font-size: 1.25rem;
		}

		.success-icon {
			width: 60px;
			height: 60px;
			font-size: 2rem;
		}
	}
</style>

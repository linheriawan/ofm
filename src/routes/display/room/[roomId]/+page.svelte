<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	// Get room ID from URL
	const roomId = $page.params.roomId;

	let roomData = {
		roomId: '',
		roomName: '',
		roomNumber: '',
		floor: '',
		capacity: 0,
		status: 'available' as 'available' | 'occupied' | 'upcoming',
		currentMeeting: null as any,
		nextMeeting: null as any,
		todaySchedule: [] as any[],
		isAvailable: true,
		availableUntil: null as Date | null
	};

	let currentTime = new Date();
	let isCheckinMode = false;
	let loading = true;
	let error = '';

	// Update current time every second and refresh data every 30 seconds
	onMount(() => {
		const timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		// Initial load
		loadSchedule();

		// Refresh data every 30 seconds
		const refreshInterval = setInterval(() => {
			loadSchedule();
		}, 30000);

		return () => {
			clearInterval(timeInterval);
			clearInterval(refreshInterval);
		};
	});

	async function loadSchedule() {
		try {
			const response = await fetch(`/api/rooms/${roomId}/schedule`);
			const result = await response.json();

			if (result.success) {
				const data = result.data;
				roomData.roomId = data.room.roomId;
				roomData.roomName = data.room.roomName;
				roomData.roomNumber = data.room.roomNumber || '';
				roomData.floor = data.room.floor || '';
				roomData.capacity = data.room.capacity;
				roomData.todaySchedule = data.todaySchedule.map((booking: any) => ({
					id: booking.bookingId,
					title: booking.meetingTitle,
					organizer: booking.organizerId,
					startTime: new Date(booking.startTime),
					endTime: new Date(booking.endTime),
					participants: booking.participants.length,
					status: booking.status
				}));
				roomData.currentMeeting = data.current ? {
					id: data.current.bookingId,
					title: data.current.meetingTitle,
					organizer: data.current.organizerId,
					startTime: new Date(data.current.startTime),
					endTime: new Date(data.current.endTime),
					participants: data.current.participants.length,
					status: data.current.status
				} : null;
				roomData.nextMeeting = data.next ? {
					id: data.next.bookingId,
					title: data.next.meetingTitle,
					organizer: data.next.organizerId,
					startTime: new Date(data.next.startTime),
					endTime: new Date(data.next.endTime),
					participants: data.next.participants.length,
					status: data.next.status
				} : null;
				roomData.isAvailable = data.isAvailable;
				roomData.availableUntil = data.availableUntil ? new Date(data.availableUntil) : null;

				updateRoomStatus();
				loading = false;
			} else {
				error = result.error || 'Failed to load schedule';
				loading = false;
			}
		} catch (err) {
			error = 'Failed to connect to server';
			loading = false;
			console.error('Error loading schedule:', err);
		}
	}

	function updateRoomStatus() {
		if (roomData.currentMeeting) {
			roomData.status = 'occupied';
		} else if (roomData.nextMeeting) {
			const now = currentTime.getTime();
			const minutesUntil = Math.floor((roomData.nextMeeting.startTime.getTime() - now) / 60000);
			if (minutesUntil <= 30) {
				roomData.status = 'upcoming';
			} else {
				roomData.status = 'available';
			}
		} else {
			roomData.status = 'available';
		}
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}

	function formatTimeRange(start: Date, end: Date): string {
		return `${formatTime(start)} - ${formatTime(end)}`;
	}

	function handleCheckin() {
		isCheckinMode = true;
	}

	function handleCheckinSubmit() {
		alert('Check-in successful!');
		isCheckinMode = false;
	}
</script>

<svelte:head>
	<title>Room Display - {roomData.roomName || 'Loading...'}</title>
</svelte:head>

{#if loading}
	<div class="loading-screen">
		<div class="loading-spinner"></div>
		<p>Loading room information...</p>
	</div>
{:else if error}
	<div class="error-screen">
		<div class="error-icon">⚠️</div>
		<h2>Unable to Load Room</h2>
		<p>{error}</p>
		<button onclick={() => loadSchedule()} class="retry-btn">Retry</button>
	</div>
{:else}
<div class="room-display {roomData.status}">
	<!-- Header -->
	<div class="header">
		<div class="room-info">
			<h1>{roomData.roomName}</h1>
			<div class="room-meta">
				<span class="floor">Floor {roomData.floor}</span>
				<span class="capacity">Capacity: {roomData.capacity}</span>
			</div>
		</div>
		<div class="clock">
			<div class="time">{formatTime(currentTime)}</div>
			<div class="date">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
		</div>
	</div>

	<!-- Main Status Display -->
	<div class="main-status">
		{#if roomData.status === 'available'}
			<div class="status-icon">✓</div>
			<h2 class="status-text">Available</h2>
			<p class="status-message">This room is currently available</p>

			{#if roomData.nextMeeting}
				<div class="next-meeting">
					<p>Next Meeting:</p>
					<h3>{roomData.nextMeeting.title}</h3>
					<p>{formatTime(roomData.nextMeeting.startTime)}</p>
				</div>
			{/if}
		{:else if roomData.status === 'occupied'}
			<div class="status-icon">🚫</div>
			<h2 class="status-text">Occupied</h2>

			{#if roomData.currentMeeting}
				<div class="current-meeting">
					<h3>{roomData.currentMeeting.title}</h3>
					<p class="organizer">Organized by {roomData.currentMeeting.organizer}</p>
					<p class="time-range">{formatTimeRange(roomData.currentMeeting.startTime, roomData.currentMeeting.endTime)}</p>
					<p class="participants">{roomData.currentMeeting.participants} participants</p>

					<button class="checkin-btn" onclick={handleCheckin}>
						Check In
					</button>
				</div>
			{/if}
		{:else if roomData.status === 'upcoming'}
			<div class="status-icon">⏰</div>
			<h2 class="status-text">Meeting Soon</h2>

			{#if roomData.nextMeeting}
				<div class="upcoming-meeting">
					<h3>{roomData.nextMeeting.title}</h3>
					<p class="organizer">Organized by {roomData.nextMeeting.organizer}</p>
					<p class="time-range">{formatTimeRange(roomData.nextMeeting.startTime, roomData.nextMeeting.endTime)}</p>
					<p class="starts-in">Starts at {formatTime(roomData.nextMeeting.startTime)}</p>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Today's Schedule -->
	<div class="schedule">
		<h3>Today's Schedule</h3>
		<div class="schedule-list">
			{#each roomData.todaySchedule as meeting}
				<div class="schedule-item {meeting.id === roomData.currentMeeting?.id ? 'active' : ''}">
					<div class="schedule-time">
						{formatTimeRange(meeting.startTime, meeting.endTime)}
					</div>
					<div class="schedule-details">
						<div class="schedule-title">{meeting.title}</div>
						<div class="schedule-organizer">{meeting.organizer}</div>
					</div>
				</div>
			{/each}

			{#if roomData.todaySchedule.length === 0}
				<p class="no-meetings">No meetings scheduled for today</p>
			{/if}
		</div>
	</div>

	<!-- Check-in Modal -->
	{#if isCheckinMode}
		<div class="modal">
			<div class="modal-content">
				<h2>Check In</h2>
				<p>Scan your QR code or enter your employee ID</p>
				<div class="qr-scanner">
					<div class="scanner-frame">
						📷 QR Scanner Active
					</div>
				</div>
				<input type="text" placeholder="Or enter Employee ID" class="employee-id-input">
				<div class="modal-actions">
					<button class="btn-cancel" onclick={() => isCheckinMode = false}>Cancel</button>
					<button class="btn-submit" onclick={handleCheckinSubmit}>Check In</button>
				</div>
			</div>
		</div>
	{/if}
</div>
{/if}

<style>
	/* Loading and Error States */
	.loading-screen, .error-screen {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
		padding: 2rem;
	}

	.loading-spinner {
		width: 80px;
		height: 80px;
		border: 8px solid #e2e8f0;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-screen p {
		margin-top: 2rem;
		font-size: 1.5rem;
		color: #666;
	}

	.error-screen {
		background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
	}

	.error-icon {
		font-size: 5rem;
		margin-bottom: 1rem;
	}

	.error-screen h2 {
		font-size: 2rem;
		color: #333;
		margin: 0 0 1rem 0;
	}

	.error-screen p {
		font-size: 1.2rem;
		color: #666;
		margin-bottom: 2rem;
	}

	.retry-btn {
		padding: 1rem 2rem;
		font-size: 1.2rem;
		font-weight: 600;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.retry-btn:hover {
		transform: scale(1.05);
	}

	/* Room Display */
	.room-display {
		min-height: 100vh;
		padding: 2rem;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.room-display.available {
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
	}

	.room-display.occupied {
		background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
	}

	.room-display.upcoming {
		background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 2rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	.room-info h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.5rem;
		color: #333;
	}

	.room-meta {
		display: flex;
		gap: 2rem;
		color: #666;
		font-size: 1.1rem;
	}

	.clock {
		text-align: right;
	}

	.time {
		font-size: 3rem;
		font-weight: 700;
		color: #333;
		font-variant-numeric: tabular-nums;
	}

	.date {
		font-size: 1.1rem;
		color: #666;
		margin-top: 0.5rem;
	}

	.main-status {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		text-align: center;
	}

	.status-icon {
		font-size: 8rem;
		margin-bottom: 1rem;
	}

	.status-text {
		font-size: 3rem;
		margin: 0 0 1rem 0;
		color: #333;
	}

	.status-message {
		font-size: 1.5rem;
		color: #666;
		margin: 0;
	}

	.current-meeting, .upcoming-meeting, .next-meeting {
		margin-top: 2rem;
		padding: 2rem;
		background: #f5f5f5;
		border-radius: 12px;
		width: 100%;
		max-width: 600px;
	}

	.current-meeting h3, .upcoming-meeting h3, .next-meeting h3 {
		font-size: 2rem;
		margin: 0 0 1rem 0;
		color: #333;
	}

	.organizer, .time-range, .participants, .starts-in {
		font-size: 1.3rem;
		color: #666;
		margin: 0.5rem 0;
	}

	.checkin-btn {
		margin-top: 2rem;
		padding: 1.5rem 3rem;
		font-size: 1.5rem;
		font-weight: 600;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.checkin-btn:hover {
		transform: scale(1.05);
	}

	.schedule {
		padding: 2rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	.schedule h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.8rem;
		color: #333;
	}

	.schedule-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.schedule-item {
		display: flex;
		gap: 1.5rem;
		padding: 1.5rem;
		background: #f9f9f9;
		border-radius: 12px;
		border-left: 4px solid #ddd;
	}

	.schedule-item.active {
		background: #e3f2fd;
		border-left-color: #2196f3;
	}

	.schedule-time {
		font-size: 1.2rem;
		font-weight: 600;
		color: #333;
		min-width: 150px;
		font-variant-numeric: tabular-nums;
	}

	.schedule-details {
		flex: 1;
	}

	.schedule-title {
		font-size: 1.3rem;
		font-weight: 600;
		color: #333;
		margin-bottom: 0.25rem;
	}

	.schedule-organizer {
		font-size: 1.1rem;
		color: #666;
	}

	.no-meetings {
		text-align: center;
		color: #999;
		font-size: 1.2rem;
		padding: 2rem;
	}

	/* Modal */
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0,0,0,0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		padding: 3rem;
		border-radius: 16px;
		max-width: 500px;
		width: 90%;
	}

	.modal-content h2 {
		margin: 0 0 1rem 0;
		font-size: 2rem;
	}

	.qr-scanner {
		margin: 2rem 0;
	}

	.scanner-frame {
		padding: 4rem;
		background: #f5f5f5;
		border: 3px dashed #ccc;
		border-radius: 12px;
		text-align: center;
		font-size: 2rem;
	}

	.employee-id-input {
		width: 100%;
		padding: 1rem;
		font-size: 1.2rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
	}

	.btn-cancel, .btn-submit {
		flex: 1;
		padding: 1rem 2rem;
		font-size: 1.2rem;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.btn-cancel {
		background: #f5f5f5;
		color: #333;
	}

	.btn-submit {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-cancel:hover, .btn-submit:hover {
		transform: scale(1.05);
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
		}

		.clock {
			text-align: left;
		}

		.time {
			font-size: 2rem;
		}

		.status-icon {
			font-size: 5rem;
		}

		.status-text {
			font-size: 2rem;
		}
	}
</style>

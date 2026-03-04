<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { registerServiceWorker, precacheVideos } from '$lib/utils/cache-manager';
	import QRCode from '$lib/components/QRCode.svelte';

	// Get room ID from URL
	const roomId = $page.params.roomId;
	const isPreviewMode = $page.url.searchParams.has('preview');
	let deviceId = $state('');
	let bookingUrl = $state('');
	let attendanceUrl = $state('');

	let roomData = $state({
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
		availableUntil: null as Date | null,
		videoBackgroundIds: [] as string[]
	});

	let currentTime = $state(new Date());
	let isCheckinMode = $state(false);
	let loading = $state(true);
	let error = $state('');
	let cacheStatus = $state<string>(''); // Cache status message
	let videosPreCached = $state(false);

	// Video background state
	let backgroundVideos = $state<any[]>([]);
	let currentVideoIndex = $state(0);
	let videoElement = $state<HTMLVideoElement | null>(null);

	// Check device assignment on mount
	async function checkDeviceAssignment() {
		if (!browser) {
			console.log('❌ Not in browser, skipping');
			return false;
		}

		// Skip device check in preview mode (admin preview from room-displays page)
		if (isPreviewMode) {
			console.log('👁️ Preview mode - skipping device check');
			return true;
		}

		// Get device ID from localStorage
		deviceId = localStorage.getItem('deviceId') || '';

		if (!deviceId) {
			// No device ID - show error instead of redirecting for now
			error = 'Device not registered. Please scan QR code to register this device.';
			loading = false;
			return false;
		}

		// Check if device is assigned to this room
		try {
			const response = await fetch(`/api/v1/devices/${deviceId}/assignment`);
			const result = await response.json();

			if (result.success && result.data.assigned) {
				// Check if assigned to correct room
				if (result.data.roomId !== roomId) {
					// Device is assigned to different room
					console.warn(`⚠️ Device assigned to ${result.data.roomId}, not ${roomId}`);
					error = `This device is assigned to room ${result.data.roomName || result.data.roomId}. Please use the correct device or reassign.`;
					loading = false;
					return false;
				}
				return true;
			} else {
				// Not assigned - allow access for now (testing mode)
				console.log('⚠️ Device not assigned to any room, allowing access for testing');
				return true; // Changed to true to skip device check temporarily
			}
		} catch (error) {
			console.error('❌ Error checking device assignment:', error);
			// Allow access if device API fails (for testing)
			console.log('⚠️ Device check failed, allowing access anyway');
			return true;
		}
	}
	
	// Update current time every second and refresh data every 30 seconds
	onMount(async () => {
		// Set URLs for QR codes
		bookingUrl = `${window.location.origin}/modules/meetings/new?roomId=${roomId}`;
		attendanceUrl = `${window.location.origin}/display/attendance/${roomId}`;

		// Register Service Worker for caching
		await registerServiceWorker();

		// First check device assignment
		const isAssigned = await checkDeviceAssignment();

		if (!isAssigned) {
			return; // Will redirect, no need to continue
		}

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

			// Send device ID in request header
			const response = await fetch(`/api/v1/rooms/${roomId}/schedule`, {
				headers: {
					'X-Device-ID': deviceId || ''
				}
			});

			const result = await response.json();

			// Check if device is not authorized
			if (response.status === 403) {
				console.error('Device not authorized:', result.error);
				error = 'Device not authorized for this room';
				loading = false;
				return;
			}

			if (result.success && result.data) {
				const data = result.data;

				// Safely populate room data
				roomData.roomId = data.room?.roomId || '';
				roomData.roomName = data.room?.roomName || 'Unknown Room';
				roomData.roomNumber = data.room?.roomNumber || '';
				roomData.floor = data.room?.floor || '';
				roomData.capacity = data.room?.capacity || 0;
				roomData.videoBackgroundIds = data.room?.videoBackgroundIds || [];

				console.log('Room data populated:', {
					roomName: roomData.roomName,
					roomId: roomData.roomId,
					videoCount: roomData.videoBackgroundIds.length
				});

				// Map schedule with safe access
				roomData.todaySchedule = (data.todaySchedule || []).map((booking: any) => ({
					id: booking.bookingId || booking._id,
					title: booking.title || booking.meetingTitle || 'Untitled Meeting',
					organizer: booking.organizerId || 'Unknown',
					startTime: new Date(booking.startTime),
					endTime: new Date(booking.endTime),
					participants: (booking.participants || []).length,
					status: booking.status || 'pending'
				}));

				// Safely map current meeting
				roomData.currentMeeting = data.current ? {
					id: data.current._id?.toString() || data.current._id,
					title: data.current.title || data.current.meetingTitle || 'Untitled Meeting',
					organizer: data.current.organizerId || 'Unknown',
					startTime: new Date(data.current.startTime),
					endTime: new Date(data.current.endTime),
					participants: (data.current.participants || []).length,
					status: data.current.status || 'pending'
				} : null;

				// Safely map next meeting
				roomData.nextMeeting = data.next ? {
					id: data.next.bookingId || data.next._id,
					title: data.next.title || data.next.meetingTitle || 'Untitled Meeting',
					organizer: data.next.organizerId || 'Unknown',
					startTime: new Date(data.next.startTime),
					endTime: new Date(data.next.endTime),
					participants: (data.next.participants || []).length,
					status: data.next.status || 'pending'
				} : null;

				roomData.isAvailable = data.isAvailable !== false;
				roomData.availableUntil = data.availableUntil ? new Date(data.availableUntil) : null;

				updateRoomStatus();

				// Load background videos if assigned
				if (roomData.videoBackgroundIds.length > 0) {
					await loadBackgroundVideos();
				} else {
					console.log('No background videos assigned');
				}

				loading = false;
			} else {
				error = result.error || 'Failed to load schedule';
				loading = false;
				console.error('API returned error:', error);
			}
		} catch (err) {
			console.error('❌ Error loading schedule:', err);
			error = `Failed to connect to server: ${err instanceof Error ? err.message : 'Unknown error'}`;
			loading = false;
		}
	}

	async function loadBackgroundVideos() {
		try {
			// Fetch video details for each assigned video ID
			const videoPromises = roomData.videoBackgroundIds.map(async (videoId) => {
				const response = await fetch(`/api/v1/videos/${videoId}`);
				const result = await response.json();
				if (result.success && result.data) {
					return result.data;
				}
				return null;
			});

			const videos = await Promise.all(videoPromises);
			backgroundVideos = videos.filter(v => v !== null && v.isActive);

			// Pre-cache videos for offline use
			if (backgroundVideos.length > 0) {
				const videoUrls = backgroundVideos.map(v => v.videoUrl);

				// Trigger pre-cache in Service Worker (waits for completion)
				const results = await precacheVideos(videoUrls);

				// Update status when complete
				if (results.length > 0) {
					videosPreCached = true;
					cacheStatus = 'Videos cached successfully';
				}
			}
		} catch (err) {
			console.error('Error loading background videos:', err);
			cacheStatus = 'Failed to cache videos';
		}
	}
	function toggleFullscreen(){
		if(!!document.fullscreenElement){
			document.exitFullscreen();
		}else{document.documentElement.requestFullscreen();}
	}
	function handleVideoEnd() {
		// Move to next video when current one ends
		if (backgroundVideos.length > 0) {
			currentVideoIndex = (currentVideoIndex + 1) % backgroundVideos.length;
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

	let employeeIdInput = $state('');
	let externalName = $state('');
	let externalEmail = $state('');
	let isExternal = $state(false);
	let checkingIn = $state(false);
	let checkinError = $state('');
	let logoError = $state(false);

	function handleCheckin() {
		isCheckinMode = true;
		employeeIdInput = '';
		externalName = '';
		externalEmail = '';
		isExternal = false;
		checkinError = '';
	}

	async function handleCheckinSubmit() {
		if (!roomData.currentMeeting) {
			checkinError = 'No active meeting to check in to';
			return;
		}

		// Validate based on participant type
		if (isExternal) {
			if (!externalName.trim()) {
				checkinError = 'Please enter participant name';
				return;
			}
		} else {
			if (!employeeIdInput.trim()) {
				checkinError = 'Please enter NIK';
				return;
			}
		}

		checkingIn = true;
		checkinError = '';

		try {
			const requestBody: any = {
				method: 'manual',
				isExternal: isExternal
			};

			if (isExternal) {
				requestBody.name = externalName.trim();
				requestBody.email = externalEmail.trim();
			} else {
				requestBody.employeeId = employeeIdInput.trim();
			}

			const response = await fetch(`/api/v1/meetings/${roomData.currentMeeting.id}/checkin`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody)
			});

			const result = await response.json();

			if (result.success) {
				alert(`Check-in successful!\n${result.data.name}\nMeeting: ${result.data.meetingTitle}`);
				isCheckinMode = false;
				// Refresh schedule to update meeting status
				loadSchedule();
			} else {
				checkinError = result.error || 'Check-in failed';
			}
		} catch (error) {
			console.error('Check-in error:', error);
			checkinError = 'Failed to connect to server';
		} finally {
			checkingIn = false;
		}
	}
</script>

<svelte:head>
	<title>Room Display - {roomData.roomName || 'Loading...'}</title>
</svelte:head>

{#if loading===true}
	<div class="loading-screen">
		<div class="loading-spinner"></div>
		<p>Loading room information...</p>
		<div style="color: white; margin-top: 2rem; font-size: 0.9rem;">
			<p>Room ID: {roomId}</p>
			<p>Device ID: {deviceId || 'Not set'}</p>
			<p>Check browser console (F12) for details</p>
		</div>
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
	<!-- Video Background -->
	{#if backgroundVideos.length > 0}
		<div class="video-background">
			<video
				bind:this={videoElement}
				src={backgroundVideos[currentVideoIndex]?.videoUrl}
				autoplay
				muted
				onended={handleVideoEnd}
				class="background-video"
			></video>
			<div class="video-overlay"></div>
		</div>
	{/if}

	<!-- Preview Mode Banner -->
	{#if isPreviewMode}
		<div class="preview-banner">
			<span>PREVIEW MODE</span>
			<button class="preview-close" onclick={() => window.close()}>Close</button>
		</div>
	{/if}

	<!-- Cache Status Indicator -->
	{#if cacheStatus && !videosPreCached}
		<div class="cache-status caching">
			<span class="cache-icon">📦</span>
			<span class="cache-text">{cacheStatus}</span>
		</div>
	{:else if videosPreCached}
		<div class="cache-status cached">
			<span class="cache-icon">✓</span>
			<span class="cache-text">Videos cached</span>
		</div>
	{/if}

	<!-- TV Broadcast Frame Grid -->
	<div class="tv-frame-grid" class:has-meeting={roomData.currentMeeting !== null}>
		<!-- Top Bar (Row 1, Col 2-3) -->
		<div class="header">
			<div class="room-title">
				<span class="room-name">{roomData.roomName}</span>
				{#if roomData.roomNumber}
					<span class="room-number">#{roomData.roomNumber}</span>
				{/if}
			</div>
			<div class="clock" onclick={location.reload()}>
				<span class="time">{formatTime(currentTime)}</span>
			</div>
		</div>

		<div class="top-left">
			<div class="company-logo" onclick={toggleFullscreen}>
				<!-- Company logo placeholder -->
				{#if !logoError}
					<img src="/logo.png" alt="Company Logo" onerror={() => logoError = true} />
				{:else}
					<span class="company-name">IAS</span>
				{/if}
			</div>
		</div>
		<!-- Left Bar (Col 1, Row 1-2) -->
		<div class="left-bar">
			<div class="amenities-section">
				<div class="amenity-item">
					<span class="amenity-icon">📽️</span>
					<span class="amenity-label">Projector</span>
				</div>
				<div class="amenity-item">
					<span class="amenity-icon">📺</span>
					<span class="amenity-label">TV</span>
				</div>
				<div class="amenity-item">
					<span class="amenity-icon">🎥</span>
					<span class="amenity-label">Video Conf</span>
				</div>
				<div class="amenity-item">
					<span class="amenity-icon">📋</span>
					<span class="amenity-label">Whiteboard</span>
				</div>
				<div class="amenity-item">
					<span class="amenity-icon">❄️</span>
					<span class="amenity-label">AC</span>
				</div>
			</div>
			<div class="room-details">
				<div class="detail-item">
					<span class="detail-label">FLOOR</span>
					<span class="detail-value">{roomData.floor}</span>
				</div>
				<div class="detail-item">
					<span class="detail-label">CAPACITY</span>
					<span class="detail-value">{roomData.capacity}</span>
				</div>
			</div>
		</div>

		<!-- Main Area (Center, transparent) -->
		<div class="main-area"></div>

		<!-- Right Bar (Col 3, Row 2) -->
		<div class="right-bar">
			<!-- Quick Book QR - Always visible -->
			<div class="qr-section">
				<div class="qr-label">QUICK BOOK</div>
				<div class="qr-code">
					{#if bookingUrl}
						<QRCode value={bookingUrl} size={100} />
					{:else}
						<div class="qr-placeholder">Loading...</div>
					{/if}
				</div>
				<div class="qr-hint">Scan to book this room</div>
			</div>

			<!-- Attendance QR - Only when meeting is active -->
			{#if roomData.currentMeeting && attendanceUrl}
				<div class="qr-section">
					<div class="qr-label">MARK ATTENDANCE</div>
					<div class="qr-code">
						<QRCode value={attendanceUrl} size={100} />
					</div>
					<div class="qr-hint">Scan to check in</div>
					<button class="manual-checkin-btn" onclick={handleCheckin}>
						Manual Entry
					</button>
				</div>
				<div class="meeting-end-widget">
					<div class="widget-label">ENDS</div>
					<div class="end-time">{formatTime(roomData.currentMeeting.endTime)}</div>
				</div>
			{:else}
				<!-- Next Meeting Preview (when no meeting) -->
				{#if roomData.nextMeeting}
					<div class="next-meeting-widget">
						<div class="widget-label">NEXT</div>
						<div class="next-time">{formatTime(roomData.nextMeeting.startTime)}</div>
						<div class="next-title">{roomData.nextMeeting.title}</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- 2nd Bottom Bar (Row 3, Col 1-3 FULL WIDTH) - Auto-hide when no meeting -->
		{#if roomData.currentMeeting}
			<div class="second-footer">
				<div class="meeting-info">
					<div class="meeting-title">{roomData.currentMeeting.title}</div>
					<div class="meeting-details">
						<span class="meeting-organizer">👤 {roomData.currentMeeting.organizer}</span>
						<span class="meeting-time">🕐 {formatTimeRange(roomData.currentMeeting.startTime, roomData.currentMeeting.endTime)}</span>
						<span class="meeting-participants">👥 {roomData.currentMeeting.participants} participants</span>
					</div>
				</div>
			</div>
		{/if}



		<div class="footer">
			<!-- Schedule Ticker -->
			<div class="schedule-ticker">
				<div class="ticker-label">{currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
				<div class="ticker-content">
					{#if roomData.todaySchedule.length > 0}
						<div class="ticker-scroll">
							{#each roomData.todaySchedule as meeting}
								<span class="ticker-item">
									{formatTimeRange(meeting.startTime, meeting.endTime)} • {meeting.title}
								</span>
							{/each}
							<!-- Duplicate for seamless loop -->
							{#each roomData.todaySchedule as meeting}
								<span class="ticker-item">
									{formatTimeRange(meeting.startTime, meeting.endTime)} • {meeting.title}
								</span>
							{/each}
						</div>
					{:else}
						<span class="ticker-empty">No meetings scheduled</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Check-in Modal -->
	{#if isCheckinMode}
		<div class="modal">
			<div class="modal-content">
				<h2>Check In</h2>
				{#if roomData.currentMeeting}
					<p class="meeting-info">Meeting: <strong>{roomData.currentMeeting.title}</strong></p>
				{/if}

				<!-- Participant Type Toggle -->
				<label class="toggle-container">
					<input
						type="checkbox"
						bind:checked={isExternal}
						disabled={checkingIn}
						class="toggle-checkbox"
					/>
					<span class="toggle-label">External Participant (Guest/Client)</span>
				</label>

				<!-- Internal Participant Form -->
				{#if !isExternal}
					<p class="form-hint">Enter NIK for internal employee</p>
					<input
						type="text"
						placeholder="NIK (e.g., 123456)"
						class="employee-id-input"
						bind:value={employeeIdInput}
						disabled={checkingIn}
						onkeydown={(e) => e.key === 'Enter' && handleCheckinSubmit()}
						autofocus
					/>
				{:else}
					<!-- External Participant Form -->
					<p class="form-hint">Enter participant details</p>
					<input
						type="text"
						placeholder="Full Name *"
						class="employee-id-input"
						bind:value={externalName}
						disabled={checkingIn}
						autofocus
					/>
					<input
						type="email"
						placeholder="Email (optional)"
						class="employee-id-input"
						bind:value={externalEmail}
						disabled={checkingIn}
						onkeydown={(e) => e.key === 'Enter' && handleCheckinSubmit()}
					/>
				{/if}

				{#if checkinError}
					<div class="checkin-error">
						⚠️ {checkinError}
					</div>
				{/if}
				<div class="modal-actions">
					<button
						class="btn-cancel"
						onclick={() => isCheckinMode = false}
						disabled={checkingIn}
					>
						Cancel
					</button>
					<button
						class="btn-submit"
						onclick={handleCheckinSubmit}
						disabled={checkingIn || !employeeIdInput.trim()}
					>
						{checkingIn ? 'Checking in...' : 'Check In'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
{/if}

<style>
	/* Loading and Error States */
	.loading-screen, .error-screen {
		max-height: 100vh;
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
		max-height: 100vh;
		position: relative;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		overflow: hidden;
	}

	/* Video Background */
	.video-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		overflow: hidden;
	}

	.background-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.video-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.3);
		z-index: 1;
	}

	/* CSS Variables for Status Colors */
	.room-display.available {
		--accent-color: #10b981;
		--status-bg: #0f172a;
	}

	.room-display.occupied {
		--accent-color: #ef4444;
		--status-bg: #1e1b4b;
	}

	.room-display.upcoming {
		--accent-color: #f59e0b;
		--status-bg: #1e293b;
	}

	/* TV Frame Grid Layout - 4 Rows × 3 Columns */
	.tv-frame-grid {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		max-height: 100vh;
		z-index: 10;
		display: grid;
		grid-template-columns: 100px 1fr 150px;
		grid-template-rows: 6vh 1fr 0 6vh;
		grid-template-areas:
			"top-left header header"
			"left-bar main-area right-bar"
			"left-bar bottom right-bar"
			"footer footer footer";
		transition: grid-template-rows 0.3s ease;
		overflow: hidden;
	}

	/* When meeting is active, row 3 stays at 0 — second-footer is absolutely positioned */
	.tv-frame-grid.has-meeting {
		grid-template-rows: 6vh 1fr 0 6vh;
	}

	/* Fallback background for rooms without video */
	.room-display:not(:has(.video-background)) .tv-frame-grid {
		background: linear-gradient(135deg, var(--status-bg) 0%, #0a0e1a 100%);
	}

	/* Top Bar - Transparent with Text Stroke */
	.header {
		grid-area: header;
		background: transparent;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 2rem;
		/* overflow: hidden; */
		min-height: 0;
	}

	.room-title {
		display: flex;
		align-items: baseline;
		gap: 1rem;
	}

	.room-name {
		font-size: 3.6rem;
		font-weight: 700;
		padding: .3em 0 0 0;
		color: white;
		text-transform: uppercase;
		letter-spacing: 2px;
		text-shadow:
			0 0 10px rgba(0, 0, 0, 0.9),
			0 2px 6px rgba(0, 0, 0, 0.8),
			2px 2px 4px rgba(0, 0, 0, 1),
			-1px -1px 2px rgba(0, 0, 0, 0.8);
	}

	.room-number {
		font-size: 1rem;
		color: #fbbf24;
		font-weight: 600;
		text-shadow:
			0 0 8px rgba(0, 0, 0, 0.9),
			0 2px 4px rgba(0, 0, 0, 0.7);
	}

	.clock {
		display: flex;
		align-items: baseline;
		gap: 1.5rem;
	}

	.clock .time {
		font-size: 2rem;
		font-weight: 700;
		color: white;
		font-variant-numeric: tabular-nums;
		text-shadow:
			0 0 10px rgba(0, 0, 0, 0.9),
			0 2px 6px rgba(0, 0, 0, 0.8),
			2px 2px 4px rgba(0, 0, 0, 1);
	}

	.clock .date {
		font-size: 0.9rem;
		color: #fbbf24;
		font-weight: 500;
		text-shadow:
			0 0 8px rgba(0, 0, 0, 0.9),
			0 2px 4px rgba(0, 0, 0, 0.7);
	}

	/* Left Bar - Dark with Backdrop Blur */
	.left-bar {
		grid-area: left-bar;
		background: rgba(20, 25, 30, 0.4);
		backdrop-filter: blur(10px);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 0.5rem;
		gap: 2rem;
		overflow-y: auto;
		overflow-x: hidden;
		min-height: 0;
	}

	.amenities-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex: 1;
	}

	.amenity-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.amenity-icon {
		font-size: 1.8rem;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
	}

	.amenity-label {
		font-size: 0.65rem;
		color: #fbbf24;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		text-align: center;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
	}

	.room-details {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
		margin-top: auto;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.detail-label {
		font-size: 0.65rem;
		color: #fbbf24;
		font-weight: 600;
		letter-spacing: 1px;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
	}

	.detail-value {
		font-size: 1.8rem;
		color: white;
		font-weight: 700;
		text-shadow:
			0 0 8px rgba(0, 0, 0, 0.9),
			0 2px 4px rgba(0, 0, 0, 0.7);
	}

	/* Main Area (transparent) */
	.main-area {
		grid-area: main-area;
		pointer-events: none;
	}

	/* Right Bar - Dark with Backdrop Blur */
	.right-bar {
		grid-area: right-bar;
		backdrop-filter: blur(10px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		padding: 1.5rem 1rem;
		gap: 2rem;
		overflow-y: auto;
		overflow-x: hidden;
		min-height: 0;
	}

	/* QR Code Section */
	.qr-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		flex-shrink: 0;
		width: 100%;
	}

	/* Attendance QR styling - distinct from booking QR */
	.attendance-qr {
		margin-top: 1rem;
		padding: 1rem;
		border-top: 2px solid rgba(251, 191, 36, 0.3);
		background: rgba(251, 191, 36, 0.05);
		border-radius: 8px;
	}

	.attendance-qr .qr-label {
		color: #10b981; /* Green for attendance */
	}

	.qr-label {
		font-size: 0.7rem;
		color: #fbbf24;
		font-weight: 700;
		letter-spacing: 1px;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
	}

	.qr-code {
		padding: 0.5rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		width: fit-content;
	}

	.qr-code canvas {
		display: block;
		max-width: 100%;
		height: auto !important;
		aspect-ratio: 1 / 1;
	}

	.qr-hint {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.8);
		text-align: center;
		margin-top: 0.5rem;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
	}

	.qr-placeholder {
		width: 100px;
		height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		font-size: 0.7rem;
	}

	.manual-checkin-btn {
		margin-top: 0.5rem;
		padding: 0.6rem 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.4);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		letter-spacing: 0.5px;
		width: 100%;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
	}

	.manual-checkin-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	.meeting-end-widget {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
		width: 100%;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	/* Meeting Widgets */
	.next-meeting-widget, .current-meeting-widget {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8rem;
		text-align: center;
		width: 100%;
	}

	.widget-label {
		font-size: 0.7rem;
		color: #fbbf24;
		font-weight: 700;
		letter-spacing: 1px;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
	}

	.next-title {
		font-size: 0.85rem;
		color: white;
		font-weight: 600;
		line-height: 1.3;
		word-wrap: break-word;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
	}

	.next-time, .end-time {
		font-size: 1.8rem;
		color: white;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		text-shadow:
			0 0 8px rgba(0, 0, 0, 0.9),
			0 2px 4px rgba(0, 0, 0, 0.7);
	}

	.checkin-btn-small {
		margin-top: 0.5rem;
		padding: 0.8rem 1.2rem;
		font-size: 0.8rem;
		font-weight: 700;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		letter-spacing: 1px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}

	.checkin-btn-small:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
	}

	/* 2nd Bottom Bar - Absolute overlay, grows upward above the footer */
	.second-footer {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 6vh;
		display: flex;
		align-items: center;
		padding: 0 150px 0 calc(100px);
		z-index: 15;
	}

	.meeting-info {
		width: 100%;
		display: flex;
		flex-direction: column;
    	align-items: start;
		gap: 2rem;
		background: rgba(20, 25, 30, 0.65);
		backdrop-filter: blur(10px);
		padding:0 1em;
		/* overflow: hidden; */
		min-height: 0;
	}

	.meeting-title {
		font-size: 4.8rem;
		font-weight: 700;
		color: white;
		flex: 1;
		text-shadow:
			0 0 8px rgba(0, 0, 0, 0.9),
			0 2px 4px rgba(0, 0, 0, 0.7);
		white-space: nowrap;
		/* overflow: hidden; */
		text-overflow: ellipsis;
	}

	.meeting-details {
		display: flex;
		gap: 2rem;
		font-size: 2rem;
		color: #fbbf24;
		font-weight: 500;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
		flex-shrink: 0;
	}

	.meeting-organizer, .meeting-time, .meeting-participants {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
	}

	/* Bottom Left - Company Logo */
	.top-left {
		grid-area: top-left;
		background: rgba(20, 25, 30, 0.5);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		overflow: hidden;
		min-height: 0;
	}

	.company-logo {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.company-logo img {
		max-width: 80%;
		max-height: 80%;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
	}

	.company-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		letter-spacing: 2px;
		text-shadow:
			0 0 8px rgba(0, 0, 0, 0.9),
			0 2px 4px rgba(0, 0, 0, 0.7);
	}

	/* Bottom Right - Schedule Ticker */
	.footer {
		grid-area: footer;
		background: rgba(20, 25, 30, 0.85);
		backdrop-filter: blur(10px);
		border-top: 2px solid var(--accent-color);
		display: flex;
		align-items: center;
		overflow: hidden;
		min-height: 0;
	}

	.schedule-ticker {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		overflow: hidden;
		min-height: 0;
	}

	.ticker-label {
		padding: 0 1.2rem;
		font-size: 0.75rem;
		font-weight: 700;
		color: #fbbf24;
		letter-spacing: 1px;
		background: rgba(0, 0, 0, 0.4);
		height: 100%;
		display: flex;
		align-items: center;
		border-right: 2px solid rgba(251, 191, 36, 0.3);
		white-space: nowrap;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
	}

	.ticker-content {
		flex: 1;
		overflow: hidden;
		position: relative;
		height: 100%;
	}

	.ticker-scroll {
		display: flex;
		gap: 3rem;
		position: absolute;
		white-space: nowrap;
		animation: scroll-left 30s linear infinite;
		padding: 0 2rem;
		align-items: center;
		height: 100%;
	}

	@keyframes scroll-left {
		0% { transform: translateX(0); }
		100% { transform: translateX(-50%); }
	}

	.ticker-item {
		font-size: 0.95rem;
		color: white;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
	}

	.ticker-empty {
		padding: 0 2rem;
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.7);
		font-style: italic;
		display: flex;
		align-items: center;
		height: 100%;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.7);
	}

	/* Modal */
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0,0,0,0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		backdrop-filter: blur(4px);
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

	.meeting-info strong {
		color: #667eea;
	}

	.toggle-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		margin: 1.5rem 0;
		cursor: pointer;
		user-select: none;
	}

	.toggle-checkbox {
		width: 20px;
		height: 20px;
		cursor: pointer;
	}

	.toggle-label {
		font-size: 1rem;
		color: #333;
		font-weight: 500;
	}

	.form-hint {
		font-size: 0.9rem;
		color: #666;
		margin: 0.5rem 0;
	}

	.employee-id-input {
		width: 100%;
		padding: 1rem;
		font-size: 1.2rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		margin-bottom: 1rem;
		box-sizing: border-box;
	}

	.employee-id-input:focus {
		outline: none;
		border-color: #667eea;
	}

	.employee-id-input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	.checkin-error {
		padding: 1rem;
		background: #fef2f2;
		border: 2px solid #fecaca;
		border-radius: 8px;
		color: #dc2626;
		font-weight: 600;
		margin-bottom: 1rem;
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

	.btn-cancel:hover:not(:disabled), .btn-submit:hover:not(:disabled) {
		transform: scale(1.05);
	}

	.btn-cancel:disabled, .btn-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Preview Mode Banner */
	.preview-banner {
		position: fixed;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		z-index: 2000;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.4rem 1.2rem;
		background: rgba(245, 158, 11, 0.9);
		color: white;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 2px;
		border-radius: 0 0 8px 8px;
		backdrop-filter: blur(10px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.preview-close {
		padding: 0.2rem 0.6rem;
		background: rgba(255, 255, 255, 0.25);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		cursor: pointer;
		letter-spacing: 0.5px;
	}

	.preview-close:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	/* Cache Status Indicator */
	.cache-status {
		position: fixed;
		bottom: 0;
		right: .2rem;
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		backdrop-filter: blur(10px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		transition: opacity 0.3s ease;
	}

	.cache-status.caching {
		background: rgba(255, 152, 0, 0.85);
		color: white;
		animation: pulse-cache 2s ease-in-out infinite;
	}

	.cache-status.cached {
		background: rgba(16, 185, 129, 0.85);
		color: white;
		animation: fade-out 3s ease-in-out 2s forwards;
	}

	@keyframes pulse-cache {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	@keyframes fade-out {
		from { opacity: 1; }
		to { opacity: 0; pointer-events: none; }
	}

	.cache-icon {
		font-size: 1.2rem;
	}

	.cache-text {
		text-shadow:
			0 1px 2px rgba(0, 0, 0, 0.5);
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
		}

		.cache-status {
			top: 0;
			right: 0.5rem;
			font-size: 0.75rem;
			padding: 0.4rem 0.8rem;
		}
	}
</style>

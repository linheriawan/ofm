<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ImageCarousel from '$lib/components/ImageCarousel.svelte';
	import '$lib/styles/meeting-booking.css';

	// Check if we're in edit mode
	let bookingId = $derived($page.url.searchParams.get('id'));
	let isEditMode = $derived(!!bookingId);
	let title = $derived(isEditMode ? 'View/Edit Meeting Booking' : 'Book Meeting Room');

	let isLoadingBooking = $state(false);
	let errorMessage = $state('');
	let isSubmitting = $state(false);

	// Form state
	let meetingType = $state<'online' | 'offline' | 'hybrid'>('offline');
	let meetingTitle = $state('');
	let meetingDate = $state(new Date().toISOString().split('T')[0]);
	let startTime = $state('09:00');
	let endTime = $state('10:00');
	let participantCount = $state(1);
	let selectedRoom = $state('');
	let platform = $state<'zoom' | 'google-meet' | 'teams'>('zoom');
	let participants = $state<string[]>([]);
	let participantInput = $state('');
	let externalParticipants = $state<string[]>([]);
	let externalInput = $state('');
	let facilitiesNeeded = $state<string[]>([]);
	let notes = $state('');
	let isRecurring = $state(false);
	let recurringPattern = $state('weekly');

	// Rooms data - fetched from API
	let availableRooms = $state<any[]>([]);
	let isLoadingRooms = $state(false);

	// Fetch rooms from API
	async function fetchRooms() {
		try {
			isLoadingRooms = true;
			const response = await fetch('/api/v1/rooms');
			const result = await response.json();

			if (result.success && result.data) {
				// Map to expected format and filter only available rooms
				availableRooms = result.data
					.filter((room: any) => room.status === 'available')
					.map((room: any) => ({
						id: room.roomId,
						_id: room._id,
						name: room.roomName,
						capacity: room.capacity,
						floor: room.floor || 'N/A',
						facilities: room.facilities || [],
						hasVideoConf: room.hasVideoConference,
						imageUrls: room.imageUrls || (room.imageUrl ? [room.imageUrl] : []) // backward compatibility
					}));
			}
		} catch (error) {
			console.error('Failed to fetch rooms:', error);
		} finally {
			isLoadingRooms = false;
		}
	}

	let availableFacilities = [
		'Projector', 'Whiteboard', 'Video Conference',
		'Sound System', 'Microphone', 'TV Display',
		'Snack', 'Lunch'
	];

	let filteredRooms = $derived(
		meetingType === 'offline'
			? availableRooms
			: meetingType === 'hybrid'
				? availableRooms.filter(r => r.hasVideoConf)
				: []
	);

	let duration = $derived(calculateDuration(startTime, endTime));

	// Load existing booking if in edit mode
	async function loadBooking() {
		if (!bookingId) return;

		try {
			isLoadingBooking = true;
			const response = await fetch(`/api/v1/meeting/requests/${bookingId}`);
			const result = await response.json();

			if (result.success && result.data) {
				const booking = result.data;

				// Pre-fill form fields
				meetingType = booking.type || 'offline';
				meetingTitle = booking.title || '';

				const startDateTime = new Date(booking.startTime);
				meetingDate = startDateTime.toISOString().split('T')[0];
				startTime = startDateTime.toTimeString().slice(0, 5);

				const endDateTime = new Date(booking.endTime);
				endTime = endDateTime.toTimeString().slice(0, 5);

				participantCount = booking.participantCount || 1;
				selectedRoom = booking.roomId || '';
				platform = booking.platform || 'zoom';
				participants = booking.participants || [];
				externalParticipants = booking.externalParticipants || [];
				facilitiesNeeded = booking.requiredFacilities || [];

				// Add Snack/Lunch to facilities if catering was required
				if (booking.cateringRequired && !facilitiesNeeded.includes('Snack') && !facilitiesNeeded.includes('Lunch')) {
					facilitiesNeeded = [...facilitiesNeeded, 'Snack'];
				}

				notes = booking.notes || '';
			}
		} catch (error) {
			console.error('Failed to load booking:', error);
			errorMessage = 'Failed to load booking details. Please try again.';
		} finally {
			isLoadingBooking = false;
		}
	}

	onMount(async () => {
		await Promise.all([
			loadBooking(),
			fetchRooms()
		]);
	});

	function calculateDuration(start: string, end: string): number {
		const [startH, startM] = start.split(':').map(Number);
		const [endH, endM] = end.split(':').map(Number);
		const startMinutes = startH * 60 + startM;
		const endMinutes = endH * 60 + endM;
		return endMinutes - startMinutes;
	}

	function addParticipant() {
		if (participantInput.trim()) {
			participants = [...participants, participantInput.trim()];
			participantInput = '';
		}
	}

	function removeParticipant(index: number) {
		participants = participants.filter((_, i) => i !== index);
	}

	function addExternalParticipant() {
		if (externalInput.trim()) {
			externalParticipants = [...externalParticipants, externalInput.trim()];
			externalInput = '';
		}
	}

	function removeExternalParticipant(index: number) {
		externalParticipants = externalParticipants.filter((_, i) => i !== index);
	}

	function toggleFacility(facility: string) {
		if (facilitiesNeeded.includes(facility)) {
			facilitiesNeeded = facilitiesNeeded.filter(f => f !== facility);
		} else {
			facilitiesNeeded = [...facilitiesNeeded, facility];
		}
	}

	async function handleSubmit() {
		if (!meetingTitle || !meetingDate || !startTime || !endTime) {
			errorMessage = 'Please fill all required fields';
			return;
		}

		if ((meetingType === 'offline' || meetingType === 'hybrid') && !selectedRoom) {
			errorMessage = 'Please select a meeting room';
			return;
		}

		if ((meetingType === 'offline' || meetingType === 'hybrid') && !participantCount) {
			errorMessage = 'Please specify the number of participants (required for GA to prepare snacks/lunch)';
			return;
		}

		errorMessage = '';
		isSubmitting = true;

		// Construct date-time strings
		const startDateTime = `${meetingDate}T${startTime}:00`;
		const endDateTime = `${meetingDate}T${endTime}:00`;

		// Check if Snack or Lunch is selected in facilities
		const cateringRequired = facilitiesNeeded.includes('Snack') || facilitiesNeeded.includes('Lunch');

		const requestData = {
			type: meetingType,
			title: meetingTitle,
			startTime: startDateTime,
			endTime: endDateTime,
			participantCount: (meetingType === 'offline' || meetingType === 'hybrid') ? participantCount : undefined,
			roomId: meetingType !== 'online' ? selectedRoom : undefined,
			platform: meetingType !== 'offline' ? platform : undefined,
			participants,
			externalParticipants,
			cateringRequired,
			requiredFacilities: facilitiesNeeded.length > 0 ? facilitiesNeeded : undefined,
			notes: notes || undefined,
			isRecurring,
			recurringPattern: isRecurring ? recurringPattern : undefined,
			sendCalendarInvite: true
		};

		try {
			const url = isEditMode
				? `/api/v1/meeting/requests/${bookingId}`
				: '/api/v1/meeting/requests';
			const method = isEditMode ? 'PATCH' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestData)
			});

			const result = await response.json();

			if (result.success) {
				alert(
					isEditMode
						? 'Meeting booking updated successfully!'
						: `Meeting room booked successfully!\n\nRequest Number: ${result.data.requestNumber}\nStatus: Pending approval\n\nYou will be notified once your request is approved.`
				);

				// Redirect to bookings page
				goto('/meeting/bookings');
			} else {
				errorMessage = result.error?.message || `Failed to ${isEditMode ? 'update' : 'book'} meeting`;
			}
		} catch (error) {
			console.error('Error submitting booking:', error);
			errorMessage = `An error occurred while ${isEditMode ? 'updating' : 'booking'} the meeting. Please try again.`;
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		meetingTitle = '';
		selectedRoom = '';
		participants = [];
		externalParticipants = [];
		facilitiesNeeded = [];
		notes = '';
		isRecurring = false;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="booking-page">
	<div class="header">
		<h1>{isEditMode ? 'View/Edit Meeting Booking' : 'Book Meeting Room'}</h1>
		<p class="subtitle">
			{isEditMode ? 'View or modify your meeting booking' : 'Schedule online, offline, or hybrid meetings'}
		</p>
	</div>

	{#if isLoadingBooking}
		<div class="loading">Loading booking details...</div>
	{:else}
	<div class="form-container">
		<!-- Error Message -->
		{#if errorMessage}
			<div class="alert alert-error">
				<span class="alert-icon">⚠️</span>
				<span>{errorMessage}</span>
			</div>
		{/if}
		<!-- Meeting Type Selection -->
		<div class="card">
			<h2>Meeting Type</h2>
			<div class="type-selector">
				<label class="type-option {meetingType === 'online' ? 'active' : ''}">
					<input type="radio" bind:group={meetingType} value="online" />
					<div class="type-card">
						<div class="type-icon">💻</div>
						<h3>Online</h3>
						<p>Video conference only</p>
					</div>
				</label>

				<label class="type-option {meetingType === 'offline' ? 'active' : ''}">
					<input type="radio" bind:group={meetingType} value="offline" />
					<div class="type-card">
						<div class="type-icon">🏢</div>
						<h3>Offline</h3>
						<p>Physical room only</p>
					</div>
				</label>

				<label class="type-option {meetingType === 'hybrid' ? 'active' : ''}">
					<input type="radio" bind:group={meetingType} value="hybrid" />
					<div class="type-card">
						<div class="type-icon">🔄</div>
						<h3>Hybrid</h3>
						<p>Both online & offline</p>
					</div>
				</label>
			</div>
		</div>

		<!-- Meeting Details Form -->
		<form on:submit|preventDefault={handleSubmit}>
			<div class="card">
				<h2>Meeting Details</h2>
				<div class="form-grid">
					<!-- Title -->
					<div class="form-group full-width">
						<label for="meetingTitle">Meeting Title <span class="required">*</span></label>
						<input type="text" id="meetingTitle" bind:value={meetingTitle} placeholder="e.g., Board Meeting, Team Sync" required />
					</div>

					<!-- Date & Time -->
					<div class="form-group">
						<label for="meetingDate">Date <span class="required">*</span></label>
						<input type="date" id="meetingDate" bind:value={meetingDate} required min={new Date().toISOString().split('T')[0]} />
					</div>

					<div class="form-group">
						<label for="startTime">Start Time <span class="required">*</span></label>
						<input type="time" id="startTime" bind:value={startTime} required />
					</div>

					<div class="form-group">
						<label for="endTime">End Time <span class="required">*</span></label>
						<input type="time" id="endTime" bind:value={endTime} required />
					</div>

					<div class="form-group">
						<label>Duration</label>
						<div class="duration-display">{duration} minutes</div>
					</div>

				</div>
			</div>

			<!-- Participants Section -->
			<div class="card">
				<h2>Participants</h2>

				{#if meetingType === 'offline' || meetingType === 'hybrid'}
					<div class="form-group" transition:slide={{ duration: 300 }}>
						<label for="participantCount">
							Number of Participants <span class="required">*</span>
							<span class="helper-text">(Required for GA to prepare snacks/lunch)</span>
						</label>
						<input
							type="number"
							id="participantCount"
							bind:value={participantCount}
							min="1"
							max="100"
							required
						/>
					</div>
				{/if}

				<div class="participants-subsection">
					<h3>Internal Participants</h3>
					<div class="input-with-button">
						<input
							type="text"
							bind:value={participantInput}
							placeholder="Enter employee name or email, then click Add"
							on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
						/>
						<button type="button" class="btn-add" on:click={addParticipant}>Add</button>
					</div>
					<div class="tags">
						{#each participants as participant, i}
							<span class="tag">
								{participant}
								<button type="button" on:click={() => removeParticipant(i)}>×</button>
							</span>
						{/each}
					</div>
				</div>

				<div class="participants-subsection">
					<h3>External Participants</h3>
					<div class="input-with-button">
						<input
							type="email"
							bind:value={externalInput}
							placeholder="Enter external email, then click Add"
							on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addExternalParticipant())}
						/>
						<button type="button" class="btn-add" on:click={addExternalParticipant}>Add</button>
					</div>
					<div class="tags">
						{#each externalParticipants as participant, i}
							<span class="tag">
								{participant}
								<button type="button" on:click={() => removeExternalParticipant(i)}>×</button>
							</span>
						{/each}
					</div>
				</div>
			</div>

			<!-- Room Selection (for offline/hybrid) -->
			{#if meetingType === 'offline' || meetingType === 'hybrid'}
				<div class="card" transition:slide={{ duration: 300 }}>
					<h2>Select Room</h2>
					{#if isLoadingRooms}
						<div class="loading-rooms">Loading available rooms...</div>
					{:else if filteredRooms.length === 0}
						<div class="no-rooms">No rooms available for this meeting type</div>
					{:else}
						<div class="room-grid">
								{#each filteredRooms as room}
									<label class="room-card {selectedRoom === room.id ? 'selected' : ''}">
										<input type="radio" bind:group={selectedRoom} value={room.id} />
										<div class="room-content">
											{#if room.imageUrls && room.imageUrls.length > 0}
												<div class="room-image-carousel">
													{#if room.imageUrls.length > 1}
														<ImageCarousel
															images={room.imageUrls}
															alt={room.name}
															autoplay={true}
															interval={4000}
															showDots={true}
															showArrows={false}
														/>
													{:else}
														<img src={room.imageUrls[0]} alt={room.name} />
													{/if}
													<!-- Room info overlay on carousel -->
													<div class="room-info-overlay">
														<h4>{room.name}</h4>
														<p class="room-floor">Floor {room.floor}</p>
														<p class="room-capacity">👥 {room.capacity} people</p>
													</div>
												</div>
											{:else}
												<div class="room-icon">🏢</div>
												<h4>{room.name}</h4>
												<p class="room-floor">Floor {room.floor}</p>
												<p class="room-capacity">Capacity: {room.capacity}</p>
											{/if}
											<div class="room-facilities">
												{#each room.facilities.slice(0, 3) as facility}
													<span class="facility-badge">{facility}</span>
												{/each}
												{#if room.facilities.length > 3}
													<span class="facility-badge">+{room.facilities.length - 3}</span>
												{/if}
											</div>
										</div>
									</label>
								{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Platform Selection (for online/hybrid) -->
			{#if meetingType === 'online' || meetingType === 'hybrid'}
				<div class="card" transition:slide={{ duration: 300 }}>
					<h2>Select Platform</h2>
					<div class="platform-grid">
							<label class="platform-card {platform === 'zoom' ? 'selected' : ''}">
								<input type="radio" bind:group={platform} value="zoom" />
								<div class="platform-content">
									<h4>Zoom</h4>
								</div>
							</label>

							<label class="platform-card {platform === 'google-meet' ? 'selected' : ''}">
								<input type="radio" bind:group={platform} value="google-meet" />
								<div class="platform-content">
									<h4>Google Meet</h4>
								</div>
							</label>

							<label class="platform-card {platform === 'teams' ? 'selected' : ''}">
								<input type="radio" bind:group={platform} value="teams" />
								<div class="platform-content">
									<h4>MS Teams</h4>
								</div>
							</label>
					</div>
				</div>
			{/if}

			<!-- Facilities (for offline/hybrid) -->
			{#if meetingType === 'offline' || meetingType === 'hybrid'}
				<div class="card" transition:slide={{ duration: 300 }}>
					<h2>Additional Facilities</h2>
					<div class="facilities-grid">
							{#each availableFacilities as facility}
								<label class="facility-checkbox">
									<input
										type="checkbox"
										checked={facilitiesNeeded.includes(facility)}
										on:change={() => toggleFacility(facility)}
									/>
									<span>{facility}</span>
								</label>
							{/each}
					</div>
				</div>
			{/if}

			<!-- Recurring & Notes -->
			<div class="card">
				<h2>Additional Options</h2>

				<div class="recurring-section">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={isRecurring} />
						<span>Recurring Meeting</span>
					</label>

					{#if isRecurring}
						<select bind:value={recurringPattern} class="select-input" in:slide="{{ duration: 300 }}">
							<option value="daily">Daily</option>
							<option value="weekly">Weekly</option>
							<option value="biweekly">Bi-weekly</option>
							<option value="monthly">Monthly</option>
						</select>
					{/if}
				</div>

				<!-- Notes -->
				<div class="form-group full-width" style="margin-top: 1.5rem;">
					<label for="notes">Additional Notes</label>
					<textarea id="notes" bind:value={notes} rows="3" placeholder="Any special requirements or notes..."></textarea>
				</div>
			</div>

			<!-- Actions -->
			<div class="form-actions">
				<a href="/meeting/bookings" class="btn-secondary">Cancel</a>
				<button type="submit" class="btn-primary" disabled={isSubmitting}>
					{isSubmitting
						? (isEditMode ? 'Updating...' : 'Submitting...')
						: (isEditMode ? 'Update Booking' : 'Book Meeting Room')}
				</button>
			</div>
		</form>
	</div>
	{/if}
</div>

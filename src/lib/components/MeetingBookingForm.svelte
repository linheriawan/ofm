<script lang="ts">
	import { slide } from 'svelte/transition';

	// Using any type since API returns MeetingRequest but client has MeetingBooking type
	interface Props {
		booking?: any | null;
		onSuccess?: () => void;
		onCancel?: () => void;
	}

	let { booking = null, onSuccess, onCancel }: Props = $props();

	// Determine mode based on whether booking exists
	const isEditMode = booking?._id != null;
	const title = isEditMode ? 'Edit Meeting Booking' : 'Create Meeting Booking';

	// Form state - using correct field names from MeetingRequest schema
	let meetingType: 'online' | 'offline' | 'hybrid' = $state(booking?.type || 'offline');
	let meetingTitle = $state(booking?.title || '');
	let meetingDescription = $state(booking?.description || '');
	let meetingDate = $state(
		booking?.startTime
			? new Date(booking.startTime).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0]
	);
	let startTime = $state(
		booking?.startTime
			? new Date(booking.startTime).toTimeString().slice(0, 5)
			: '09:00'
	);
	let endTime = $state(
		booking?.endTime
			? new Date(booking.endTime).toTimeString().slice(0, 5)
			: '10:00'
	);
	let participantCount = $state(booking?.participantCount || 1);
	let selectedRoom = $state(booking?.roomId || '');
	let platform: 'zoom' | 'google_meet' | 'teams' = $state(booking?.platform || 'zoom');
	let participants: string[] = $state(booking?.participants || []);
	let participantInput = $state('');
	let externalParticipantsCount = $state(booking?.externalParticipants || 0);
	let cateringNeeded = $state(booking?.cateringRequired || false);
	let cateringDetails = $state(booking?.cateringDetails || { type: 'snack', itemCount: 0, notes: '' });
	let facilitiesNeeded: string[] = $state(booking?.requiredFacilities || []);
	let notes = $state(booking?.notes || '');
	let submitting = $state(false);

	// Mock data for rooms
	let availableRooms = [
		{
			id: 'ROOM-A301',
			name: 'Board Room A-301',
			capacity: 20,
			floor: '3',
			facilities: ['projector', 'whiteboard', 'video-conference', 'ac'],
			hasVideoConf: true
		},
		{
			id: 'ROOM-A302',
			name: 'Conference Room A-302',
			capacity: 15,
			floor: '3',
			facilities: ['projector', 'whiteboard', 'video-conference'],
			hasVideoConf: true
		},
		{
			id: 'ROOM-B101',
			name: 'Meeting Room B-101',
			capacity: 10,
			floor: '1',
			facilities: ['tv', 'whiteboard'],
			hasVideoConf: false
		},
		{
			id: 'ROOM-B102',
			name: 'Meeting Room B-102',
			capacity: 8,
			floor: '1',
			facilities: ['tv', 'whiteboard', 'video-conference'],
			hasVideoConf: true
		}
	];

	let availableFacilities = [
		'Projector',
		'Whiteboard',
		'Video Conference',
		'Sound System',
		'Microphone',
		'TV Display'
	];

	let filteredRooms = $derived(
		meetingType === 'offline'
			? availableRooms
			: meetingType === 'hybrid'
				? availableRooms.filter((r) => r.hasVideoConf)
				: []
	);

	let duration = $derived(calculateDuration(startTime, endTime));

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

	function toggleFacility(facility: string) {
		if (facilitiesNeeded.includes(facility)) {
			facilitiesNeeded = facilitiesNeeded.filter((f) => f !== facility);
		} else {
			facilitiesNeeded = [...facilitiesNeeded, facility];
		}
	}

	async function handleSubmit() {
		if (!meetingTitle || !meetingDate || !startTime || !endTime) {
			alert('Please fill all required fields');
			return;
		}

		if ((meetingType === 'offline' || meetingType === 'hybrid') && !selectedRoom) {
			alert('Please select a meeting room');
			return;
		}

		if ((meetingType === 'offline' || meetingType === 'hybrid') && !participantCount) {
			alert('Please specify the number of participants');
			return;
		}

		submitting = true;

		// Construct date-time strings
		const startDateTime = `${meetingDate}T${startTime}:00`;
		const endDateTime = `${meetingDate}T${endTime}:00`;

		const requestData = {
			type: meetingType,
			title: meetingTitle,
			description: meetingDescription || undefined,
			startTime: startDateTime,
			endTime: endDateTime,
			participantCount: meetingType === 'offline' || meetingType === 'hybrid' ? participantCount : undefined,
			participants,
			externalParticipants: externalParticipantsCount || undefined,
			roomId: meetingType !== 'online' ? selectedRoom : undefined,
			platform: meetingType !== 'offline' ? platform : undefined,
			requiredFacilities: facilitiesNeeded.length > 0 ? facilitiesNeeded : undefined,
			cateringRequired: cateringNeeded,
			cateringDetails: cateringNeeded ? cateringDetails : undefined,
			notes: notes || undefined
		};

		try {
			const url = isEditMode
				? `/api/v1/meeting/requests/${booking._id}`
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
						: `Meeting room booked successfully!\nBooking ID: ${result.data.requestNumber}`
				);
				onSuccess?.();
			} else {
				alert(`Failed to ${isEditMode ? 'update' : 'create'} booking: ${result.error?.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error submitting booking:', error);
			alert(`An error occurred while ${isEditMode ? 'updating' : 'creating'} the booking. Please try again.`);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="booking-form">
	<h2>{title}</h2>

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<!-- Meeting Type Selection -->
		<div class="section">
			<h3>Meeting Type</h3>
			<div class="type-selector">
				<label class="type-option {meetingType === 'online' ? 'active' : ''}">
					<input type="radio" bind:group={meetingType} value="online" />
					<div class="type-card">
						<div class="type-icon">💻</div>
						<h4>Online</h4>
						<p>Video conference only</p>
					</div>
				</label>

				<label class="type-option {meetingType === 'offline' ? 'active' : ''}">
					<input type="radio" bind:group={meetingType} value="offline" />
					<div class="type-card">
						<div class="type-icon">🏢</div>
						<h4>Offline</h4>
						<p>Physical room only</p>
					</div>
				</label>

				<label class="type-option {meetingType === 'hybrid' ? 'active' : ''}">
					<input type="radio" bind:group={meetingType} value="hybrid" />
					<div class="type-card">
						<div class="type-icon">🔄</div>
						<h4>Hybrid</h4>
						<p>Both online & offline</p>
					</div>
				</label>
			</div>
		</div>

		<!-- Meeting Details -->
		<div class="section">
			<h3>Meeting Details</h3>
			<div class="form-grid">
				<div class="form-group full-width">
					<label for="meetingTitle">Meeting Title <span class="required">*</span></label>
					<input
						type="text"
						id="meetingTitle"
						bind:value={meetingTitle}
						placeholder="e.g., Board Meeting, Team Sync"
						required
					/>
				</div>

				<div class="form-group full-width">
					<label for="description">Description</label>
					<textarea
						id="description"
						bind:value={meetingDescription}
						rows="2"
						placeholder="Meeting description..."
					></textarea>
				</div>

				<div class="form-group">
					<label for="meetingDate">Date <span class="required">*</span></label>
					<input
						type="date"
						id="meetingDate"
						bind:value={meetingDate}
						required
						min={new Date().toISOString().split('T')[0]}
					/>
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

				{#if meetingType === 'offline' || meetingType === 'hybrid'}
					<div class="form-group full-width" transition:slide={{ duration: 300 }}>
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
			</div>
		</div>

		<!-- Room Selection -->
		{#if meetingType === 'offline' || meetingType === 'hybrid'}
			<div class="section" transition:slide={{ duration: 300 }}>
				<h3>Select Room</h3>
				<div class="room-grid">
					{#each filteredRooms as room}
						<label class="room-card {selectedRoom === room.id ? 'selected' : ''}">
							<input type="radio" bind:group={selectedRoom} value={room.id} />
							<div class="room-content">
								<div class="room-icon">🏢</div>
								<h4>{room.name}</h4>
								<p class="room-floor">Floor {room.floor}</p>
								<p class="room-capacity">Capacity: {room.capacity}</p>
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
			</div>
		{/if}

		<!-- Platform Selection -->
		{#if meetingType === 'online' || meetingType === 'hybrid'}
			<div class="section" transition:slide={{ duration: 300 }}>
				<h3>Select Platform</h3>
				<div class="platform-grid">
					<label class="platform-card {platform === 'zoom' ? 'selected' : ''}">
						<input type="radio" bind:group={platform} value="zoom" />
						<div class="platform-content">
							<h4>Zoom</h4>
						</div>
					</label>

					<label class="platform-card {platform === 'google_meet' ? 'selected' : ''}">
						<input type="radio" bind:group={platform} value="google_meet" />
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

		<!-- Participants -->
		<div class="section">
			<h3>Internal Participants</h3>
			<div class="input-with-button">
				<input
					type="text"
					bind:value={participantInput}
					placeholder="Enter employee name or email"
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
				/>
				<button type="button" class="btn-add" onclick={addParticipant}>Add</button>
			</div>
			<div class="tags">
				{#each participants as participant, i}
					<span class="tag">
						{participant}
						<button type="button" onclick={() => removeParticipant(i)}>×</button>
					</span>
				{/each}
			</div>
		</div>

		<div class="section">
			<h3>External Participants Count</h3>
			<input
				type="number"
				bind:value={externalParticipantsCount}
				min="0"
				placeholder="Number of external participants"
			/>
		</div>

		<!-- Facilities -->
		{#if meetingType === 'offline' || meetingType === 'hybrid'}
			<div class="section" transition:slide={{ duration: 300 }}>
				<h3>Additional Facilities</h3>
				<div class="facilities-grid">
					{#each availableFacilities as facility}
						<label class="facility-checkbox">
							<input
								type="checkbox"
								checked={facilitiesNeeded.includes(facility)}
								onchange={() => toggleFacility(facility)}
							/>
							<span>{facility}</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Catering -->
			<div class="section">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={cateringNeeded} />
					<span>Catering Needed</span>
				</label>

				{#if cateringNeeded}
					<div class="catering-details" transition:slide={{ duration: 300 }}>
						<div class="form-grid">
							<div class="form-group">
								<label for="cateringType">Type</label>
								<select id="cateringType" bind:value={cateringDetails.type}>
									<option value="snack">Snack</option>
									<option value="lunch">Lunch</option>
									<option value="dinner">Dinner</option>
								</select>
							</div>
							<div class="form-group">
								<label for="itemCount">Item Count</label>
								<input
									type="number"
									id="itemCount"
									bind:value={cateringDetails.itemCount}
									min="0"
								/>
							</div>
							<div class="form-group full-width">
								<label for="cateringNotes">Catering Notes</label>
								<textarea
									id="cateringNotes"
									bind:value={cateringDetails.notes}
									rows="2"
									placeholder="Special requests..."
								></textarea>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Notes -->
		<div class="section">
			<div class="form-group">
				<label for="notes">Additional Notes</label>
				<textarea
					id="notes"
					bind:value={notes}
					rows="3"
					placeholder="Any special requirements or notes..."
				></textarea>
			</div>
		</div>

		<!-- Actions -->
		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={onCancel} disabled={submitting}>
				Cancel
			</button>
			<button type="submit" class="btn-primary" disabled={submitting}>
				{submitting ? 'Submitting...' : isEditMode ? 'Update Booking' : 'Create Booking'}
			</button>
		</div>
	</form>
</div>

<style>
	.booking-form {
		max-width: 900px;
		margin: 0 auto;
	}

	h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.75rem;
		color: #333;
	}

	h3 {
		margin: 0 0 1rem 0;
		font-size: 1.2rem;
		color: #333;
	}

	h4 {
		margin: 0;
		font-size: 1rem;
		color: #333;
	}

	.section {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.section:last-of-type {
		border-bottom: none;
	}

	/* Type Selector */
	.type-selector {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.type-option {
		cursor: pointer;
	}

	.type-option input {
		display: none;
	}

	.type-card {
		padding: 1.5rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		text-align: center;
		transition: all 0.2s;
	}

	.type-option.active .type-card {
		border-color: #48bb78;
		background: #f0fff4;
	}

	.type-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.type-card p {
		margin: 0.25rem 0 0 0;
		color: #666;
		font-size: 0.875rem;
	}

	/* Form */
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	label {
		font-weight: 500;
		color: #333;
		font-size: 0.938rem;
	}

	.required {
		color: #f56565;
	}

	.helper-text {
		font-weight: normal;
		color: #48bb78;
		font-size: 0.813rem;
		margin-left: 0.5rem;
	}

	input[type='text'],
	input[type='email'],
	input[type='date'],
	input[type='time'],
	input[type='number'],
	select,
	textarea {
		padding: 0.625rem;
		border: 2px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.938rem;
		transition: border-color 0.2s;
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: #48bb78;
	}

	.duration-display {
		padding: 0.625rem;
		background: #f9f9f9;
		border-radius: 6px;
		font-weight: 600;
		color: #48bb78;
	}

	/* Room Selection */
	.room-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.room-card {
		cursor: pointer;
	}

	.room-card input {
		display: none;
	}

	.room-content {
		padding: 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		text-align: center;
		transition: all 0.2s;
	}

	.room-card.selected .room-content {
		border-color: #48bb78;
		background: #f0fff4;
	}

	.room-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.room-floor,
	.room-capacity {
		margin: 0.25rem 0;
		font-size: 0.813rem;
		color: #666;
	}

	.room-facilities {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.5rem;
		justify-content: center;
	}

	.facility-badge {
		padding: 0.2rem 0.5rem;
		background: #e2e8f0;
		border-radius: 4px;
		font-size: 0.688rem;
		color: #666;
	}

	/* Platform Selection */
	.platform-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.platform-card {
		cursor: pointer;
	}

	.platform-card input {
		display: none;
	}

	.platform-content {
		padding: 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		text-align: center;
		transition: all 0.2s;
	}

	.platform-card.selected .platform-content {
		border-color: #48bb78;
		background: #f0fff4;
	}

	/* Participants */
	.input-with-button {
		display: flex;
		gap: 0.5rem;
	}

	.input-with-button input {
		flex: 1;
	}

	.btn-add {
		padding: 0.625rem 1.25rem;
		background: #48bb78;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
	}

	.btn-add:hover {
		background: #38a169;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		background: #e2e8f0;
		border-radius: 16px;
		color: #333;
		font-size: 0.875rem;
	}

	.tag button {
		background: none;
		border: none;
		color: #666;
		font-size: 1.25rem;
		cursor: pointer;
		line-height: 1;
		padding: 0;
		margin: 0;
	}

	/* Facilities */
	.facilities-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.facility-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.facility-checkbox input {
		width: 1.125rem;
		height: 1.125rem;
		cursor: pointer;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-weight: 500;
	}

	.checkbox-label input {
		width: 1.125rem;
		height: 1.125rem;
		cursor: pointer;
	}

	.catering-details {
		margin-top: 1rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 6px;
	}

	/* Actions */
	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.625rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
		font-size: 0.938rem;
	}

	.btn-primary {
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
		color: white;
	}

	.btn-secondary {
		background: white;
		color: #48bb78;
		border: 2px solid #48bb78;
	}

	.btn-primary:hover:not(:disabled),
	.btn-secondary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.type-selector {
			grid-template-columns: 1fr;
		}

		.room-grid {
			grid-template-columns: 1fr;
		}

		.platform-grid {
			grid-template-columns: 1fr;
		}

		.facilities-grid {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>

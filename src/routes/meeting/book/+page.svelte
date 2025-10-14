<script lang="ts">
	import { slide } from 'svelte/transition';

	let title = 'Book Meeting Room';

	// Form state
	let meetingType: 'online' | 'offline' | 'hybrid' = 'offline';
	let meetingTitle = '';
	let meetingDate = new Date().toISOString().split('T')[0];
	let startTime = '09:00';
	let endTime = '10:00';
	let participantCount = 1;
	let selectedRoom = '';
	let platform: 'zoom' | 'google-meet' | 'teams' = 'zoom';
	let participants: string[] = [];
	let participantInput = '';
	let externalParticipants: string[] = [];
	let externalInput = '';
	let cateringNeeded = false;
	let cateringItems: string[] = [];
	let cateringItem = '';
	let facilitiesNeeded: string[] = [];
	let notes = '';
	let isRecurring = false;
	let recurringPattern = 'weekly';

	// Mock data
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
		'Projector', 'Whiteboard', 'Video Conference',
		'Sound System', 'Microphone', 'TV Display'
	];

	$: filteredRooms = meetingType === 'offline'
		? availableRooms
		: meetingType === 'hybrid'
		? availableRooms.filter(r => r.hasVideoConf)
		: [];

	$: duration = calculateDuration(startTime, endTime);

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

	function addCateringItem() {
		if (cateringItem.trim()) {
			cateringItems = [...cateringItems, cateringItem.trim()];
			cateringItem = '';
		}
	}

	function removeCateringItem(index: number) {
		cateringItems = cateringItems.filter((_, i) => i !== index);
	}

	function toggleFacility(facility: string) {
		if (facilitiesNeeded.includes(facility)) {
			facilitiesNeeded = facilitiesNeeded.filter(f => f !== facility);
		} else {
			facilitiesNeeded = [...facilitiesNeeded, facility];
		}
	}

	function handleSubmit() {
		if (!meetingTitle || !meetingDate || !startTime || !endTime) {
			alert('Please fill all required fields');
			return;
		}

		if ((meetingType === 'offline' || meetingType === 'hybrid') && !selectedRoom) {
			alert('Please select a meeting room');
			return;
		}

		if ((meetingType === 'offline' || meetingType === 'hybrid') && !participantCount) {
			alert('Please specify the number of participants (required for GA to prepare snacks/lunch)');
			return;
		}

		const formData = {
			meetingType,
			meetingTitle,
			meetingDate,
			startTime,
			endTime,
			duration,
			participantCount: (meetingType === 'offline' || meetingType === 'hybrid') ? participantCount : null,
			selectedRoom: meetingType !== 'online' ? selectedRoom : null,
			platform: meetingType !== 'offline' ? platform : null,
			participants,
			externalParticipants,
			cateringNeeded,
			cateringItems: cateringNeeded ? cateringItems : [],
			facilitiesNeeded,
			notes,
			isRecurring,
			recurringPattern: isRecurring ? recurringPattern : null,
			sendCalendarInvite: true // Will send .ics calendar file to all participants
		};

		console.log('Submitting booking:', formData);
		alert(
			'Meeting room booked successfully!\n' +
			'Booking ID: #MTG-' + Math.floor(Math.random() * 1000) + '\n\n' +
			'📧 Calendar invitations (.ics) will be sent to all participants via email.'
		);

		// Reset form
		resetForm();
	}

	function resetForm() {
		meetingTitle = '';
		selectedRoom = '';
		participants = [];
		externalParticipants = [];
		cateringNeeded = false;
		cateringItems = [];
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
		<h1>Book Meeting Room</h1>
		<p class="subtitle">Schedule online, offline, or hybrid meetings</p>
	</div>

	<div class="form-container">
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
		<div class="card">
			<h2>Meeting Details</h2>
			<form on:submit|preventDefault={handleSubmit}>
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

					<!-- Participant Count (required for offline/hybrid) -->
					{#if meetingType === 'offline' || meetingType === 'hybrid'}
						<div class="form-group full-width" in:slide="{{ duration: 300 }}" out:slide="{{ duration: 300 }}">
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

				<!-- Room Selection (for offline/hybrid) -->
				{#if meetingType === 'offline' || meetingType === 'hybrid'}
					<div class="room-selection" in:slide="{{ duration: 300 }}" out:slide="{{ duration: 300 }}">
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

				<!-- Platform Selection (for online/hybrid) -->
				{#if meetingType === 'online' || meetingType === 'hybrid'}
					<div class="platform-selection" in:slide="{{ duration: 300 }}" out:slide="{{ duration: 300 }}">
						<h3>Select Platform</h3>
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

				<!-- Participants -->
				<div class="participants-section">
					<h3>Internal Participants</h3>
					<div class="input-with-button">
						<input
							type="text"
							bind:value={participantInput}
							placeholder="Enter employee name or email"
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

				<div class="participants-section">
					<h3>External Participants</h3>
					<div class="input-with-button">
						<input
							type="email"
							bind:value={externalInput}
							placeholder="Enter external email"
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

				<!-- Facilities (for offline/hybrid) -->
				{#if meetingType === 'offline' || meetingType === 'hybrid'}
					<div class="facilities-section" in:slide="{{ duration: 300 }}" out:slide="{{ duration: 300 }}">
						<h3>Additional Facilities</h3>
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

					<!-- Catering -->
					<div class="catering-section">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={cateringNeeded} />
							<span>Catering Needed</span>
						</label>

						{#if cateringNeeded}
							<div class="catering-items" in:slide="{{ duration: 300 }}">
								<div class="input-with-button">
									<input
										type="text"
										bind:value={cateringItem}
										placeholder="e.g., Coffee & snacks, Lunch boxes"
										on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addCateringItem())}
									/>
									<button type="button" class="btn-add" on:click={addCateringItem}>Add</button>
								</div>
								<div class="tags">
									{#each cateringItems as item, i}
										<span class="tag">
											{item}
											<button type="button" on:click={() => removeCateringItem(i)}>×</button>
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Recurring -->
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
				<div class="form-group full-width">
					<label for="notes">Additional Notes</label>
					<textarea id="notes" bind:value={notes} rows="3" placeholder="Any special requirements or notes..."></textarea>
				</div>

				<!-- Actions -->
				<div class="form-actions">
					<a href="/meeting" class="btn-secondary">Cancel</a>
					<button type="submit" class="btn-primary">Book Meeting Room</button>
				</div>
			</form>
		</div>
	</div>
</div>

<style>
	.booking-page {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
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

	.form-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 900px;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}

	.card h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		color: #333;
	}

	.card h3 {
		margin: 2rem 0 1rem 0;
		font-size: 1.2rem;
		color: #333;
	}

	/* Type Selector */
	.type-selector {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}

	.type-option {
		cursor: pointer;
	}

	.type-option input {
		display: none;
	}

	.type-card {
		padding: 2rem;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		text-align: center;
		transition: all 0.2s;
	}

	.type-option.active .type-card {
		border-color: #48bb78;
		background: #f0fff4;
	}

	.type-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.type-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
		color: #333;
	}

	.type-card p {
		margin: 0;
		color: #666;
		font-size: 0.9rem;
	}

	/* Form */
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
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
	}

	.required {
		color: #f56565;
	}

	.helper-text {
		font-weight: normal;
		color: #48bb78;
		font-size: 0.85rem;
		margin-left: 0.5rem;
	}

	input[type="text"],
	input[type="email"],
	input[type="date"],
	input[type="time"],
	input[type="number"],
	textarea,
	.select-input {
		padding: 0.75rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus, textarea:focus, .select-input:focus {
		outline: none;
		border-color: #48bb78;
	}

	.duration-display {
		padding: 0.75rem;
		background: #f9f9f9;
		border-radius: 8px;
		font-weight: 600;
		color: #48bb78;
	}

	/* Room Selection */
	.room-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1rem;
	}

	.room-card {
		cursor: pointer;
	}

	.room-card input {
		display: none;
	}

	.room-content {
		padding: 1.5rem;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		text-align: center;
		transition: all 0.2s;
	}

	.room-card.selected .room-content {
		border-color: #48bb78;
		background: #f0fff4;
	}

	.room-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.room-content h4 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		color: #333;
	}

	.room-floor, .room-capacity {
		margin: 0.25rem 0;
		font-size: 0.85rem;
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
		font-size: 0.75rem;
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
		padding: 1.5rem;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		text-align: center;
		transition: all 0.2s;
	}

	.platform-card.selected .platform-content {
		border-color: #48bb78;
		background: #f0fff4;
	}

	.platform-content h4 {
		margin: 0;
		font-size: 1.1rem;
		color: #333;
	}

	/* Participants */
	.participants-section, .facilities-section, .catering-section, .recurring-section {
		margin-top: 2rem;
	}

	.input-with-button {
		display: flex;
		gap: 0.5rem;
	}

	.input-with-button input {
		flex: 1;
	}

	.btn-add {
		padding: 0.75rem 1.5rem;
		background: #48bb78;
		color: white;
		border: none;
		border-radius: 8px;
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
		margin-top: 1rem;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #e2e8f0;
		border-radius: 20px;
		color: #333;
	}

	.tag button {
		background: none;
		border: none;
		color: #666;
		font-size: 1.5rem;
		cursor: pointer;
		line-height: 1;
		padding: 0;
		margin: 0;
	}

	/* Facilities */
	.facilities-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.facility-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.facility-checkbox input {
		width: 1.2rem;
		height: 1.2rem;
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
		width: 1.2rem;
		height: 1.2rem;
		cursor: pointer;
	}

	.catering-items {
		margin-top: 1rem;
	}

	/* Actions */
	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	.btn-primary, .btn-secondary {
		padding: 0.75rem 2rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
		font-size: 1rem;
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

	.btn-primary:hover, .btn-secondary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

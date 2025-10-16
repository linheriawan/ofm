<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import { transportApi } from '$lib/client/api';

	let title = 'Request Transportation';
	let isSubmitting = false;
	let errorMessage = '';
	let isLoadingCompanies = true;

	// Form state
	let requestType: 'company-car' | 'voucher' = 'company-car';
	let bookingDate = new Date().toISOString().split('T')[0];
	let bookingTime = '09:00';
	let fromLocation = '';
	let toLocation = '';
	let fromLat: number | null = null;
	let fromLng: number | null = null;
	let toLat: number | null = null;
	let toLng: number | null = null;
	let purpose = '';
	let numberOfPassengers = 1;
	let selectedTransportCompanyId = '';
	let isRoundTrip = false;
	let returnDate = new Date().toISOString().split('T')[0];
	let returnTime = '17:00';
	let notes = '';
	let showMapPicker = false;
	let currentMapField: 'from' | 'to' = 'from';

	// Transport companies from database
	interface TransportCompany {
		_id: string;
		companyId: string;
		name: string;
		type: string;
		isActive: boolean;
	}
	let transportCompanies: TransportCompany[] = [];
	let availableVoucherCounts: Record<string, number> = {};

	// Trip purposes from database
	interface TripPurpose {
		_id: string;
		purposeId: string;
		name: string;
		category: string;
		isActive: boolean;
	}
	let tripPurposes: TripPurpose[] = [];
	let selectedPurposeId = '';
	let driverShouldWait = false;

	// Mock data
	let availableVehicles = [
		{ id: 'VEH-SUV-001', name: 'Toyota Fortuner', type: 'SUV', capacity: 7, licensePlate: 'B 1234 ABC' },
		{ id: 'VEH-SED-001', name: 'Honda Accord', type: 'Sedan', capacity: 5, licensePlate: 'B 5678 DEF' },
		{ id: 'VEH-MPV-001', name: 'Toyota Alphard', type: 'MPV', capacity: 8, licensePlate: 'B 9012 GHI' },
		{ id: 'VEH-EV-001', name: 'BYD Atto 3', type: 'EV', capacity: 5, licensePlate: 'B 3456 JKL' }
	];

	let selectedVehicle = '';

	// Fetch transport companies and trip purposes on mount
	onMount(async () => {
		await Promise.all([loadTransportCompanies(), loadTripPurposes()]);
	});

	async function loadTransportCompanies() {
		try {
			isLoadingCompanies = true;
			const response = await fetch('/api/v1/transport-companies');
			const result = await response.json();

			if (result.success && result.data) {
				// Filter only active companies
				transportCompanies = result.data.filter((c: TransportCompany) => c.isActive);

				// Set default selection to first company
				if (transportCompanies.length > 0) {
					selectedTransportCompanyId = transportCompanies[0]._id;
				}

				// Fetch voucher availability for each company
				await loadVoucherAvailability();
			}
		} catch (error) {
			console.error('Failed to load transport companies:', error);
			errorMessage = 'Failed to load transport providers. Please refresh the page.';
		} finally {
			isLoadingCompanies = false;
		}
	}

	async function loadVoucherAvailability() {
		try {
			// Fetch voucher stats
			const response = await fetch('/api/v1/vouchers/stats');
			const result = await response.json();

			if (result.success && result.data) {
				// Build map of company ID to available voucher count
				for (const company of transportCompanies) {
					const stats = result.data.byProvider.find(
						(p: any) => p._id === company.name.toLowerCase()
					);
					availableVoucherCounts[company._id] = stats?.available || 0;
				}
			}
		} catch (error) {
			console.error('Failed to load voucher availability:', error);
		}
	}

	async function loadTripPurposes() {
		try {
			const response = await fetch('/api/v1/trip-purposes');
			const result = await response.json();

			if (result.success && result.data) {
				tripPurposes = result.data;
			}
		} catch (error) {
			console.error('Failed to load trip purposes:', error);
		}
	}

	async function handleSubmit() {
		// Validation
		if (requestType === 'company-car') {
			if (!fromLocation || !toLocation || (!selectedPurposeId && !purpose) || !selectedVehicle) {
				errorMessage = 'Please fill all required fields (location, purpose, vehicle)';
				return;
			}
		} else {
			if (!fromLocation || !toLocation || (!selectedPurposeId && !purpose)) {
				errorMessage = 'Please fill all required fields (location, purpose)';
				return;
			}
		}

		errorMessage = '';
		isSubmitting = true;

		try {
			// Format date and time to ISO string
			const scheduledDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
			const returnDateTime = isRoundTrip && returnDate && returnTime
				? new Date(`${returnDate}T${returnTime}:00`)
				: undefined;

			// Find selected transport company to get provider name
			const selectedCompany = transportCompanies.find(c => c._id === selectedTransportCompanyId);

			// Find selected purpose to get the name
			const selectedPurpose = tripPurposes.find(p => p._id === selectedPurposeId);
			const purposeText = selectedPurpose ? selectedPurpose.name : purpose;

			// Prepare API request body
			const requestBody = {
				type: requestType === 'company-car' ? 'company_car' : 'voucher',
				pickup: {
					address: fromLocation,
					latitude: fromLat || undefined,
					longitude: fromLng || undefined
				},
				destination: {
					address: toLocation,
					latitude: toLat || undefined,
					longitude: toLng || undefined
				},
				scheduledTime: scheduledDateTime.toISOString(),
				returnTime: returnDateTime?.toISOString(),
				isRoundTrip: isRoundTrip,
				passengerCount: numberOfPassengers,
				purposeId: selectedPurposeId || undefined,
				purpose: purposeText,
				priority: 'medium',
				specialRequirements: notes || undefined,
				driverShouldWait: requestType === 'company-car' ? driverShouldWait : undefined,
				// For company car - vehicle will be assigned by admin
				// For voucher - transport company info
				transportCompanyId: requestType === 'voucher' ? selectedTransportCompanyId : undefined,
				voucherProvider: requestType === 'voucher' && selectedCompany
					? selectedCompany.name.toLowerCase()
					: undefined
			};

			// Call API
			const response = await transportApi.createRequest(requestBody);

			if (response.success && response.data) {
				// Show success message
				alert(
					`Transportation request submitted successfully!\n\n` +
					`Request Number: ${response.data.requestNumber}\n` +
					`Status: Pending approval\n\n` +
					`You will be notified once your request is approved.`
				);

				// Redirect to bookings page
				goto('/transportation/bookings');
			}
		} catch (error: any) {
			errorMessage = error.message || 'Failed to submit request. Please try again.';
			console.error('Submission error:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		fromLocation = '';
		toLocation = '';
		fromLat = null;
		fromLng = null;
		toLat = null;
		toLng = null;
		purpose = '';
		numberOfPassengers = 1;
		selectedVehicle = '';
		isRoundTrip = false;
		notes = '';
	}

	function handleLocationSelect(event: CustomEvent<{ address: string; lat: number; lng: number }>) {
		const { address, lat, lng } = event.detail;

		if (currentMapField === 'from') {
			fromLocation = address;
			fromLat = lat;
			fromLng = lng;
		} else {
			toLocation = address;
			toLat = lat;
			toLng = lng;
		}

		showMapPicker = false;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="request-page">
	<div class="header">
		<h1>Request Transportation</h1>
		<p class="subtitle">Book a company car or request a transportation voucher</p>
	</div>

	<div class="form-container">
		<!-- Error Message -->
		{#if errorMessage}
			<div class="alert alert-error">
				<span class="alert-icon">⚠️</span>
				<span>{errorMessage}</span>
			</div>
		{/if}

		<!-- Request Type Selection -->
		<div class="card">
			<h2>Select Request Type</h2>
			<div class="type-selector">
				<label class="type-option {requestType === 'company-car' ? 'active' : ''}">
					<input type="radio" bind:group={requestType} value="company-car" />
					<div class="type-card">
						<div class="type-icon">🚗</div>
						<h3>Company Car</h3>
						<p>Book a vehicle with driver</p>
					</div>
				</label>

				<label class="type-option {requestType === 'voucher' ? 'active' : ''}">
					<input type="radio" bind:group={requestType} value="voucher" />
					<div class="type-card">
						<div class="type-icon">🎫</div>
						<h3>Transportation Voucher</h3>
						<p>Request ride-hailing voucher</p>
					</div>
				</label>
			</div>
		</div>

		<!-- Booking Form -->
		<div class="card">
			<h2>Trip Details</h2>
			<form on:submit|preventDefault={handleSubmit}>
				<div class="form-grid">
					<!-- Date & Time -->
					<div class="form-group">
						<label for="bookingDate">Date <span class="required">*</span></label>
						<input type="date" id="bookingDate" bind:value={bookingDate} required min={new Date().toISOString().split('T')[0]} />
					</div>

					<div class="form-group">
						<label for="bookingTime">Time <span class="required">*</span></label>
						<input type="time" id="bookingTime" bind:value={bookingTime} required />
					</div>

					<!-- Locations -->
					<div class="form-group full-width">
						<label for="fromLocation">From Location <span class="required">*</span></label>
						<div class="location-input-group">
							<input type="text" id="fromLocation" bind:value={fromLocation} placeholder="e.g., Office Jakarta, Home" required />
							{#if requestType === 'company-car'}
								<button type="button" class="btn-map" on:click={() => { currentMapField = 'from'; showMapPicker = true; }}>
									📍 Use Map
								</button>
							{/if}
						</div>
					</div>

					<div class="form-group full-width">
						<label for="toLocation">To Location <span class="required">*</span></label>
						<div class="location-input-group">
							<input type="text" id="toLocation" bind:value={toLocation} placeholder="e.g., Airport, Client Office" required />
							{#if requestType === 'company-car'}
								<button type="button" class="btn-map" on:click={() => { currentMapField = 'to'; showMapPicker = true; }}>
									📍 Use Map
								</button>
							{/if}
						</div>
					</div>

					<!-- Purpose -->
					<div class="form-group full-width">
						<label for="purposeDropdown">Trip Purpose <span class="required">*</span></label>
						<select id="purposeDropdown" bind:value={selectedPurposeId} required>
							<option value="">-- Select Purpose --</option>
							{#each tripPurposes as tripPurpose}
								<option value={tripPurpose._id}>{tripPurpose.name}</option>
							{/each}
						</select>
						{#if selectedPurposeId === ''}
							<input
								type="text"
								id="purpose"
								bind:value={purpose}
								placeholder="Or type custom purpose..."
								class="purpose-fallback"
							/>
						{/if}
					</div>

					<!-- Passengers -->
					<div class="form-group">
						<label for="passengers">Number of Passengers <span class="required">*</span></label>
						<input type="number" id="passengers" bind:value={numberOfPassengers} min="1" max="10" required />
					</div>
				</div>

				<!-- Company Car Specific Fields -->
				{#if requestType === 'company-car'}
					<div class="vehicle-selection" in:slide="{{ duration: 300 }}" out:slide="{{ duration: 300 }}">
						<h3>Select Vehicle</h3>
						<div class="vehicle-grid">
							{#each availableVehicles as vehicle}
								<label class="vehicle-card {selectedVehicle === vehicle.id ? 'selected' : ''}">
									<input type="radio" bind:group={selectedVehicle} value={vehicle.id} />
									<div class="vehicle-content">
										<div class="vehicle-icon">
											{vehicle.type === 'EV' ? '⚡' : '🚗'}
										</div>
										<h4>{vehicle.name}</h4>
										<p class="vehicle-type">{vehicle.type}</p>
										<p class="vehicle-plate">{vehicle.licensePlate}</p>
										<p class="vehicle-capacity">Capacity: {vehicle.capacity} passengers</p>
									</div>
								</label>
							{/each}
						</div>

						<!-- Driver Wait/Drop Option -->
						<div class="driver-wait-option">
							<label class="checkbox-label">
								<input type="checkbox" bind:checked={driverShouldWait} />
								<span>
									<strong>Driver should wait for return trip</strong>
									<span class="info-text">
										{driverShouldWait
											? '(Driver will wait and bring you back to the office)'
											: '(Driver will just drop you off at the destination)'}
									</span>
								</span>
							</label>
						</div>
					</div>
				{/if}

				<!-- Voucher Specific Fields -->
				{#if requestType === 'voucher'}
					<div class="voucher-selection" in:slide="{{ duration: 300 }}" out:slide="{{ duration: 300 }}">
						<h3>Select Provider</h3>

						{#if isLoadingCompanies}
							<div class="loading-message">
								<p>Loading transport providers...</p>
							</div>
						{:else if transportCompanies.length === 0}
							<div class="empty-message">
								<p>No active transport providers available. Please contact administrator.</p>
							</div>
						{:else}
							<div class="provider-grid">
								{#each transportCompanies as company}
									{@const voucherCount = availableVoucherCounts[company._id] || 0}
									<label class="provider-card {selectedTransportCompanyId === company._id ? 'selected' : ''} {voucherCount === 0 ? 'disabled' : ''}">
										<input
											type="radio"
											bind:group={selectedTransportCompanyId}
											value={company._id}
											disabled={voucherCount === 0}
										/>
										<div class="provider-content">
											<h4>{company.name}</h4>
											<p class="available-count">{voucherCount} vouchers available</p>
										</div>
									</label>
								{/each}
							</div>
						{/if}

						<!-- Round Trip Option -->
						<div class="round-trip-option">
							<label class="checkbox-label">
								<input type="checkbox" bind:checked={isRoundTrip} />
								<span>Round Trip <span class="info-text">(2 vouchers will be allocated)</span></span>
							</label>
						</div>

						{#if isRoundTrip}
							<div class="return-details" in:slide="{{ duration: 300 }}" out:slide="{{ duration: 300 }}">
								<h4>Return Trip Details</h4>
								<div class="form-grid">
									<div class="form-group">
										<label for="returnDate">Return Date <span class="required">*</span></label>
										<input type="date" id="returnDate" bind:value={returnDate} required min={bookingDate} />
									</div>
									<div class="form-group">
										<label for="returnTime">Return Time <span class="required">*</span></label>
										<input type="time" id="returnTime" bind:value={returnTime} required />
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Notes -->
				<div class="form-group full-width">
					<label for="notes">Additional Notes / Instructions for Driver or Administrator</label>
					<textarea id="notes" bind:value={notes} rows="3" placeholder="e.g., Pick up from basement parking, Contact security at gate, Special luggage..."></textarea>
				</div>

				<!-- Actions -->
				<div class="form-actions">
					<a href="/transportation" class="btn-secondary">Cancel</a>
					<button type="submit" class="btn-primary" disabled={isSubmitting}>
						{isSubmitting ? 'Submitting...' : 'Submit Request'}
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Map Picker Modal -->
	{#if showMapPicker}
		<div class="modal-overlay" on:click={() => showMapPicker = false}>
			<div class="modal-content" on:click|stopPropagation>
				<div class="modal-header">
					<h2>Select {currentMapField === 'from' ? 'Departure' : 'Arrival'} Location</h2>
					<button type="button" class="btn-close" on:click={() => showMapPicker = false}>✕</button>
				</div>
				<div class="modal-body">
					<LocationPicker
						initialLat={currentMapField === 'from' ? (fromLat || -6.2088) : (toLat || -6.2088)}
						initialLng={currentMapField === 'from' ? (fromLng || 106.8456) : (toLng || 106.8456)}
						label=""
						placeholder="Search location..."
						selectedAddress={currentMapField === 'from' ? fromLocation : toLocation}
						on:select={handleLocationSelect}
					/>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn-secondary" on:click={() => showMapPicker = false}>Cancel</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.request-page {
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
		grid-template-columns: repeat(2, 1fr);
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
		border-color: #667eea;
		background: #f0f4ff;
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

	input[type="text"],
	input[type="date"],
	input[type="time"],
	input[type="number"],
	select,
	textarea {
		padding: 0.75rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	select {
		cursor: pointer;
		background: white;
	}

	.purpose-fallback {
		margin-top: 0.5rem;
	}

	input:focus, select:focus, textarea:focus {
		outline: none;
		border-color: #667eea;
	}

	/* Vehicle Selection */
	.vehicle-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.vehicle-card {
		cursor: pointer;
	}

	.vehicle-card input {
		display: none;
	}

	.vehicle-content {
		padding: 1.5rem;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		text-align: center;
		transition: all 0.2s;
	}

	.vehicle-card.selected .vehicle-content {
		border-color: #667eea;
		background: #f0f4ff;
	}

	.vehicle-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.vehicle-content h4 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		color: #333;
	}

	.vehicle-type, .vehicle-plate, .vehicle-capacity {
		margin: 0.25rem 0;
		font-size: 0.85rem;
		color: #666;
	}

	/* Voucher/Provider Selection */
	.provider-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
	}

	.provider-card {
		cursor: pointer;
	}

	.provider-card.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading-message,
	.empty-message {
		padding: 2rem;
		text-align: center;
		color: #666;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.loading-message p,
	.empty-message p {
		margin: 0;
	}

	.provider-card input {
		display: none;
	}

	.provider-content {
		padding: 1.5rem;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		text-align: center;
		transition: all 0.2s;
	}

	.provider-card.selected .provider-content {
		border-color: #667eea;
		background: #f0f4ff;
	}

	.provider-content h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		color: #333;
	}

	.available-count {
		margin: 0;
		font-size: 0.9rem;
		color: #666;
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-secondary {
		background: white;
		color: #667eea;
		border: 2px solid #667eea;
	}

	.btn-primary:hover, .btn-secondary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Alert */
	.alert {
		padding: 1rem 1.5rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.alert-error {
		background: #fff5f5;
		border: 2px solid #fc8181;
		color: #c53030;
	}

	.alert-icon {
		font-size: 1.5rem;
	}

	/* Location Input with Map Button */
	.location-input-group {
		display: flex;
		gap: 0.5rem;
	}

	.location-input-group input {
		flex: 1;
	}

	.btn-map {
		padding: 0.75rem 1rem;
		border: 2px solid #667eea;
		border-radius: 8px;
		background: white;
		color: #667eea;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.btn-map:hover {
		background: #667eea;
		color: white;
		transform: translateY(-2px);
	}

	/* Driver Wait/Drop Option */
	.driver-wait-option {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f0f4ff;
		border: 2px solid #667eea;
		border-radius: 8px;
	}

	/* Round Trip Option */
	.round-trip-option {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-weight: 500;
	}

	.checkbox-label input[type="checkbox"] {
		width: 20px;
		height: 20px;
		cursor: pointer;
	}

	.info-text {
		color: #667eea;
		font-size: 0.9rem;
	}

	.return-details {
		margin-top: 1rem;
		padding: 1rem;
		background: white;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
	}

	.return-details h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		color: #333;
	}

	/* Modal Styles */
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
		max-width: 800px;
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

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 2px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.type-selector {
			grid-template-columns: 1fr;
		}

		.vehicle-grid {
			grid-template-columns: 1fr;
		}

		.provider-grid {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}

		.location-input-group {
			flex-direction: column;
		}

		.btn-map {
			width: 100%;
		}

		.modal-content {
			max-width: 100%;
			max-height: 100vh;
			border-radius: 0;
		}
	}
</style>

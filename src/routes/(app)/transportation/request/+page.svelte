<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import { transportApi } from '$lib/client/api';
	import '$lib/styles/transportation-booking.css';

	// Check if we're in edit mode
	$: bookingId = $page.url.searchParams.get('id');
	$: isEditMode = !!bookingId;
	$: title = isEditMode ? 'View/Edit Transportation Request' : 'Request Transportation';

	let isSubmitting = false;
	let errorMessage = '';
	let isLoadingCompanies = true;
	let isLoadingBooking = false;

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

	// Load existing booking if in edit mode
	async function loadBooking() {
		if (!bookingId) return;

		try {
			isLoadingBooking = true;
			const response = await fetch(`/api/v1/transport/requests/${bookingId}`);
			const result = await response.json();

			if (result.success && result.data) {
				const booking = result.data;

				// Pre-fill form fields
				requestType = booking.type === 'company_car' ? 'company-car' : 'voucher';

				const scheduleDate = new Date(booking.scheduledTime);
				bookingDate = scheduleDate.toISOString().split('T')[0];
				bookingTime = scheduleDate.toTimeString().slice(0, 5);

				fromLocation = booking.pickup?.address || '';
				fromLat = booking.pickup?.latitude || null;
				fromLng = booking.pickup?.longitude || null;

				toLocation = booking.destination?.address || '';
				toLat = booking.destination?.latitude || null;
				toLng = booking.destination?.longitude || null;

				purpose = booking.purpose || '';
				selectedPurposeId = booking.purposeId || '';
				numberOfPassengers = booking.passengerCount || 1;

				isRoundTrip = booking.isRoundTrip || false;
				if (booking.returnTime) {
					const returnDateTime = new Date(booking.returnTime);
					returnDate = returnDateTime.toISOString().split('T')[0];
					returnTime = returnDateTime.toTimeString().slice(0, 5);
				}

				notes = booking.specialRequirements || '';
				selectedTransportCompanyId = booking.transportCompanyId || '';
				selectedVehicle = booking.vehicleId || '';
				driverShouldWait = booking.driverShouldWait || false;
			}
		} catch (error) {
			console.error('Failed to load booking:', error);
			errorMessage = 'Failed to load booking details. Please try again.';
		} finally {
			isLoadingBooking = false;
		}
	}

	// Fetch transport companies and trip purposes on mount
	onMount(async () => {
		await Promise.all([loadTransportCompanies(), loadTripPurposes(), loadBooking()]);
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

			// Call API (create or update)
			let response;
			if (isEditMode) {
				// Update existing booking
				response = await fetch(`/api/v1/transport/requests/${bookingId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(requestBody)
				});
				const result = await response.json();
				response = result;
			} else {
				// Create new booking
				response = await transportApi.createRequest(requestBody);
			}

			if (response.success && response.data) {
				// Show success message
				alert(
					isEditMode
						? `Transportation request updated successfully!\n\nRequest Number: ${response.data.requestNumber}`
						: `Transportation request submitted successfully!\n\n` +
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

<div class="transport-request-page">
	<div class="page-header">
		<h1>{isEditMode ? 'View/Edit Transportation Request' : 'Request Transportation'}</h1>
		<p class="page-subtitle">
			{isEditMode ? 'View or modify your transportation request' : 'Book a company car or request a transportation voucher'}
		</p>
	</div>

	{#if isLoadingBooking}
		<div class="loading">Loading booking details...</div>
	{:else}
	<div class="transport-form-container">
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
					<a href="/transportation/bookings" class="btn-secondary">Cancel</a>
					<button type="submit" class="btn-primary" disabled={isSubmitting}>
						{isSubmitting
							? (isEditMode ? 'Updating...' : 'Submitting...')
							: (isEditMode ? 'Update Request' : 'Submit Request')}
					</button>
				</div>
			</form>
		</div>
	</div>
	{/if}

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

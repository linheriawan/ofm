<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Vehicle } from '$lib/types';

	let title = 'Vehicles Management - OFM';
	let isModalOpen = $state(false);
	let editingVehicle: Vehicle | null = $state(null);
	let formData = $state({
		vehicleId: '',
		companyId: 'IAS',
		licensePlate: '',
		vehicleType: 'sedan',
		brand: '',
		model: '',
		year: new Date().getFullYear(),
		capacity: 4,
		fuelType: 'gasoline',
		isElectric: false,
		status: 'available',
		locationId: 'LOC-CGK',
		hasGPS: false,
		hasOBD: false,
		arduinoDeviceId: ''
	});

	const columns = [
		{ key: 'vehicleId', label: 'Vehicle ID' },
		{ key: 'licensePlate', label: 'License Plate' },
		{ key: 'brand', label: 'Brand' },
		{ key: 'model', label: 'Model' },
		{ key: 'year', label: 'Year' },
		{ key: 'vehicleType', label: 'Type' },
		{ key: 'capacity', label: 'Capacity' },
		{
			key: 'status',
			label: 'Status',
			format: (val: string) => val.charAt(0).toUpperCase() + val.slice(1)
		}
	];

	function openAddModal() {
		editingVehicle = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(vehicle: Vehicle) {
		editingVehicle = vehicle;
		formData = {
			vehicleId: vehicle.vehicleId,
			companyId: vehicle.companyId,
			licensePlate: vehicle.licensePlate,
			vehicleType: vehicle.vehicleType,
			brand: vehicle.brand,
			model: vehicle.model,
			year: vehicle.year,
			capacity: vehicle.capacity,
			fuelType: vehicle.fuelType,
			isElectric: vehicle.isElectric,
			status: vehicle.status,
			locationId: vehicle.locationId || 'LOC-CGK',
			hasGPS: vehicle.hasGPS,
			hasOBD: vehicle.hasOBD,
			arduinoDeviceId: vehicle.arduinoDeviceId || ''
		};
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			vehicleId: '',
			companyId: 'IAS',
			licensePlate: '',
			vehicleType: 'sedan',
			brand: '',
			model: '',
			year: new Date().getFullYear(),
			capacity: 4,
			fuelType: 'gasoline',
			isElectric: false,
			status: 'available',
			locationId: 'LOC-CGK',
			hasGPS: false,
			hasOBD: false,
			arduinoDeviceId: ''
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		const url = editingVehicle
			? `/api/vehicles/${editingVehicle._id}`
			: '/api/vehicles';
		const method = editingVehicle ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await response.json();

			if (result.success) {
				isModalOpen = false;
				window.location.reload(); // Refresh the table
			} else {
				alert(result.error || 'Failed to save vehicle');
			}
		} catch (error) {
			alert('Failed to save vehicle');
			console.error('Error saving vehicle:', error);
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingVehicle = null;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="vehicles-page">
	<DataTable
		title="Vehicles"
		{columns}
		apiEndpoint="/api/vehicles"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal bind:isOpen={isModalOpen} title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'} onClose={closeModal}>
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group">
				<label for="vehicleId">Vehicle ID</label>
				<input
					type="text"
					id="vehicleId"
					bind:value={formData.vehicleId}
					placeholder="Auto-generated if empty"
				/>
			</div>

			<div class="form-group">
				<label for="licensePlate">License Plate *</label>
				<input
					type="text"
					id="licensePlate"
					bind:value={formData.licensePlate}
					required
					placeholder="e.g. B 1234 ABC"
				/>
			</div>

			<div class="form-group">
				<label for="brand">Brand *</label>
				<input
					type="text"
					id="brand"
					bind:value={formData.brand}
					required
					placeholder="e.g. Toyota"
				/>
			</div>

			<div class="form-group">
				<label for="model">Model *</label>
				<input
					type="text"
					id="model"
					bind:value={formData.model}
					required
					placeholder="e.g. Fortuner"
				/>
			</div>

			<div class="form-group">
				<label for="year">Year *</label>
				<input
					type="number"
					id="year"
					bind:value={formData.year}
					required
					min="2000"
					max="2030"
				/>
			</div>

			<div class="form-group">
				<label for="vehicleType">Vehicle Type *</label>
				<select id="vehicleType" bind:value={formData.vehicleType} required>
					<option value="sedan">Sedan</option>
					<option value="suv">SUV</option>
					<option value="mpv">MPV</option>
					<option value="van">Van</option>
					<option value="bus">Bus</option>
				</select>
			</div>

			<div class="form-group">
				<label for="capacity">Capacity *</label>
				<input
					type="number"
					id="capacity"
					bind:value={formData.capacity}
					required
					min="1"
					max="50"
				/>
			</div>

			<div class="form-group">
				<label for="fuelType">Fuel Type *</label>
				<select id="fuelType" bind:value={formData.fuelType} required>
					<option value="gasoline">Gasoline</option>
					<option value="diesel">Diesel</option>
					<option value="electric">Electric</option>
					<option value="hybrid">Hybrid</option>
				</select>
			</div>

			<div class="form-group">
				<label for="status">Status *</label>
				<select id="status" bind:value={formData.status} required>
					<option value="available">Available</option>
					<option value="in-use">In Use</option>
					<option value="maintenance">Maintenance</option>
					<option value="inactive">Inactive</option>
				</select>
			</div>

			<div class="form-group">
				<label for="arduinoDeviceId">Arduino Device ID</label>
				<input
					type="text"
					id="arduinoDeviceId"
					bind:value={formData.arduinoDeviceId}
					placeholder="e.g. ARD-001"
				/>
			</div>

			<div class="form-group checkbox-group">
				<label>
					<input type="checkbox" bind:checked={formData.hasGPS} />
					Has GPS
				</label>
			</div>

			<div class="form-group checkbox-group">
				<label>
					<input type="checkbox" bind:checked={formData.hasOBD} />
					Has OBD
				</label>
			</div>
		</div>

		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={closeModal}>
				Cancel
			</button>
			<button type="submit" class="btn-primary">
				{editingVehicle ? 'Update' : 'Create'} Vehicle
			</button>
		</div>
	</form>
</Modal>

<style>
	.vehicles-page {
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

	form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

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

	.form-group label {
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
	}

	.form-group input,
	.form-group select {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #667eea;
	}

	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox-group input[type='checkbox'] {
		width: auto;
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #333;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

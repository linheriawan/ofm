<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Location } from '$lib/types';

	let title = 'Locations Management - OFM';
	let isModalOpen = $state(false);
	let editingLocation: Location | null = $state(null);
	let formData = $state({
		locationId: '',
		companyId: 'IAS',
		locationName: '',
		address: '',
		city: '',
		province: '',
		country: 'Indonesia',
		postalCode: '',
		latitude: 0,
		longitude: 0,
		isActive: true
	});

	const columns = [
		{ key: 'locationId', label: 'Location ID' },
		{ key: 'locationName', label: 'Location Name' },
		{ key: 'city', label: 'City' },
		{ key: 'province', label: 'Province' },
		{ key: 'country', label: 'Country' },
		{ key: 'isActive', label: 'Active', format: (val: boolean) => (val ? 'Yes' : 'No') }
	];

	function openAddModal() {
		editingLocation = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(location: Location) {
		editingLocation = location;
		formData = {
			locationId: location.locationId,
			companyId: location.companyId || 'IAS',
			locationName: location.locationName,
			address: location.address,
			city: location.city,
			province: location.province || '',
			country: location.country,
			postalCode: location.postalCode || '',
			latitude: location.latitude || 0,
			longitude: location.longitude || 0,
			isActive: location.isActive
		};
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			locationId: '',
			companyId: 'IAS',
			locationName: '',
			address: '',
			city: '',
			province: '',
			country: 'Indonesia',
			postalCode: '',
			latitude: 0,
			longitude: 0,
			isActive: true
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const url = editingLocation ? `/api/v1/locations/${editingLocation._id}` : '/api/v1/locations';
		const method = editingLocation ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await response.json();
			if (result.success) {
				isModalOpen = false;
				window.location.reload();
			} else {
				alert(result.error || 'Failed to save location');
			}
		} catch (error) {
			alert('Failed to save location');
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingLocation = null;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="locations-page">
	<DataTable
		title="Locations"
		{columns}
		apiEndpoint="/api/v1/locations"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal
	bind:isOpen={isModalOpen}
	title={editingLocation ? 'Edit Location' : 'Add New Location'}
	onClose={closeModal}
>
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group full-width">
				<label for="locationId">Location ID</label>
				<input
					type="text"
					id="locationId"
					bind:value={formData.locationId}
					placeholder="Auto-generated"
				/>
			</div>

			<div class="form-group full-width">
				<label for="locationName">Location Name *</label>
				<input
					type="text"
					id="locationName"
					bind:value={formData.locationName}
					required
					placeholder="Jakarta Office"
				/>
			</div>

			<div class="form-group full-width">
				<label for="address">Address *</label>
				<input
					type="text"
					id="address"
					bind:value={formData.address}
					required
					placeholder="Jl. Sudirman No. 123"
				/>
			</div>

			<div class="form-group">
				<label for="city">City *</label>
				<input type="text" id="city" bind:value={formData.city} required placeholder="Jakarta" />
			</div>

			<div class="form-group">
				<label for="province">Province</label>
				<input
					type="text"
					id="province"
					bind:value={formData.province}
					placeholder="DKI Jakarta"
				/>
			</div>

			<div class="form-group">
				<label for="country">Country *</label>
				<input
					type="text"
					id="country"
					bind:value={formData.country}
					required
					placeholder="Indonesia"
				/>
			</div>

			<div class="form-group">
				<label for="postalCode">Postal Code</label>
				<input
					type="text"
					id="postalCode"
					bind:value={formData.postalCode}
					placeholder="12190"
				/>
			</div>

			<div class="form-group">
				<label for="latitude">Latitude</label>
				<input
					type="number"
					id="latitude"
					bind:value={formData.latitude}
					step="0.000001"
					placeholder="-6.200000"
				/>
			</div>

			<div class="form-group">
				<label for="longitude">Longitude</label>
				<input
					type="number"
					id="longitude"
					bind:value={formData.longitude}
					step="0.000001"
					placeholder="106.816666"
				/>
			</div>

			<div class="form-group checkbox-group">
				<label>
					<input type="checkbox" bind:checked={formData.isActive} />
					Is Active
				</label>
			</div>
		</div>

		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={closeModal}>Cancel</button>
			<button type="submit" class="btn-primary"
				>{editingLocation ? 'Update' : 'Create'} Location</button
			>
		</div>
	</form>
</Modal>

<style>
	.locations-page {
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

	.form-group.full-width {
		grid-column: 1 / -1;
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

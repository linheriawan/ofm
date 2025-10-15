<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Driver } from '$lib/types';

	let title = 'Drivers Management - OFM';
	let isModalOpen = $state(false);
	let editingDriver: Driver | null = $state(null);
	let formData = $state({
		driverId: '',
		userId: '',
		companyId: 'IAS',
		licenseNumber: '',
		licenseExpiry: '',
		status: 'available',
		locationId: 'LOC-CGK',
		rating: 0
	});

	const columns = [
		{ key: 'driverId', label: 'Driver ID' },
		{ key: 'userId', label: 'User ID' },
		{ key: 'licenseNumber', label: 'License Number' },
		{
			key: 'licenseExpiry',
			label: 'License Expiry',
			format: (val: Date) => new Date(val).toLocaleDateString()
		},
		{
			key: 'status',
			label: 'Status',
			format: (val: string) => val.charAt(0).toUpperCase() + val.slice(1)
		},
		{ key: 'rating', label: 'Rating' }
	];

	function openAddModal() {
		editingDriver = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(driver: Driver) {
		editingDriver = driver;
		formData = {
			driverId: driver.driverId,
			userId: driver.userId,
			companyId: driver.companyId,
			licenseNumber: driver.licenseNumber,
			licenseExpiry: new Date(driver.licenseExpiry).toISOString().split('T')[0],
			status: driver.status,
			locationId: driver.locationId || 'LOC-CGK',
			rating: driver.rating || 0
		};
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			driverId: '',
			userId: '',
			companyId: 'IAS',
			licenseNumber: '',
			licenseExpiry: '',
			status: 'available',
			locationId: 'LOC-CGK',
			rating: 0
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		const url = editingDriver ? `/api/drivers/${editingDriver._id}` : '/api/drivers';
		const method = editingDriver ? 'PUT' : 'POST';

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
				alert(result.error || 'Failed to save driver');
			}
		} catch (error) {
			alert('Failed to save driver');
			console.error('Error saving driver:', error);
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingDriver = null;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="drivers-page">
	<DataTable
		title="Drivers"
		{columns}
		apiEndpoint="/api/drivers"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal bind:isOpen={isModalOpen} title={editingDriver ? 'Edit Driver' : 'Add New Driver'} onClose={closeModal}>
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group full-width">
				<label for="driverId">Driver ID</label>
				<input
					type="text"
					id="driverId"
					bind:value={formData.driverId}
					placeholder="Auto-generated if empty"
				/>
			</div>

			<div class="form-group full-width">
				<label for="userId">User ID *</label>
				<input
					type="text"
					id="userId"
					bind:value={formData.userId}
					required
					placeholder="e.g. USR-004"
				/>
				<small>Must reference an existing user</small>
			</div>

			<div class="form-group">
				<label for="licenseNumber">License Number *</label>
				<input
					type="text"
					id="licenseNumber"
					bind:value={formData.licenseNumber}
					required
					placeholder="e.g. SIM-12345678"
				/>
			</div>

			<div class="form-group">
				<label for="licenseExpiry">License Expiry *</label>
				<input
					type="date"
					id="licenseExpiry"
					bind:value={formData.licenseExpiry}
					required
				/>
			</div>

			<div class="form-group">
				<label for="status">Status *</label>
				<select id="status" bind:value={formData.status} required>
					<option value="available">Available</option>
					<option value="on-duty">On Duty</option>
					<option value="off-duty">Off Duty</option>
					<option value="on-leave">On Leave</option>
				</select>
			</div>

			<div class="form-group">
				<label for="rating">Rating</label>
				<input
					type="number"
					id="rating"
					bind:value={formData.rating}
					min="0"
					max="5"
					step="0.1"
				/>
			</div>
		</div>

		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={closeModal}>
				Cancel
			</button>
			<button type="submit" class="btn-primary">
				{editingDriver ? 'Update' : 'Create'} Driver
			</button>
		</div>
	</form>
</Modal>

<style>
	.drivers-page {
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

	.form-group small {
		font-size: 0.8rem;
		color: #666;
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

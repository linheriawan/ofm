<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let title = 'Trip Purposes - OFM Admin';
	let isModalOpen = $state(false);
	let editingPurpose: any | null = $state(null);
	let formData = $state({
		name: '',
		category: 'business',
		description: '',
		requiresApproval: false,
		isActive: true,
		sortOrder: 999
	});

	const categoryOptions = [
		{ value: 'business', label: 'Business' },
		{ value: 'operational', label: 'Operational' },
		{ value: 'official', label: 'Official' },
		{ value: 'other', label: 'Other' }
	];

	const columns = [
		{ key: 'purposeId', label: 'ID' },
		{ key: 'name', label: 'Purpose Name' },
		{
			key: 'category',
			label: 'Category',
			format: (val: string) => val.charAt(0).toUpperCase() + val.slice(1)
		},
		{
			key: 'requiresApproval',
			label: 'Requires Approval',
			format: (val: boolean) => (val ? '✓ Yes' : '✗ No')
		},
		{ key: 'sortOrder', label: 'Sort Order' },
		{
			key: 'isActive',
			label: 'Status',
			format: (val: boolean) => (val ? 'Active' : 'Inactive')
		}
	];

	function openAddModal() {
		editingPurpose = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(purpose: any) {
		editingPurpose = purpose;
		formData = {
			name: purpose.name,
			category: purpose.category,
			description: purpose.description || '',
			requiresApproval: purpose.requiresApproval,
			isActive: purpose.isActive,
			sortOrder: purpose.sortOrder
		};
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			name: '',
			category: 'business',
			description: '',
			requiresApproval: false,
			isActive: true,
			sortOrder: 999
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		const url = editingPurpose
			? `/api/v1/trip-purposes/${editingPurpose._id}`
			: '/api/v1/trip-purposes';
		const method = editingPurpose ? 'PUT' : 'POST';

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
				alert(result.error?.message || 'Failed to save trip purpose');
			}
		} catch (error) {
			alert('Failed to save trip purpose');
			console.error('Error saving trip purpose:', error);
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingPurpose = null;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="trip-purposes-page">
	<DataTable
		title="Trip Purposes"
		{columns}
		apiEndpoint="/api/v1/trip-purposes"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal bind:isOpen={isModalOpen} title={editingPurpose ? 'Edit Trip Purpose' : 'Add New Trip Purpose'} onClose={closeModal}>
	<form onsubmit={handleSubmit}>
		<div class="form-group">
			<label for="name">Purpose Name <span class="required">*</span></label>
			<input
				type="text"
				id="name"
				bind:value={formData.name}
				placeholder="e.g., Airport Transfer, Client Meeting"
				required
			/>
		</div>

		<div class="form-group">
			<label for="category">Category <span class="required">*</span></label>
			<select id="category" bind:value={formData.category} required>
				{#each categoryOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<div class="form-group">
			<label for="description">Description</label>
			<textarea
				id="description"
				bind:value={formData.description}
				rows="3"
				placeholder="Optional description..."
			></textarea>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label for="sortOrder">Sort Order</label>
				<input
					type="number"
					id="sortOrder"
					bind:value={formData.sortOrder}
					min="0"
					max="999"
				/>
			</div>

			<div class="form-group checkbox-group">
				<label>
					<input type="checkbox" bind:checked={formData.requiresApproval} />
					Requires manager approval
				</label>
			</div>

			<div class="form-group checkbox-group">
				<label>
					<input type="checkbox" bind:checked={formData.isActive} />
					Active
				</label>
			</div>
		</div>

		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={closeModal}>
				Cancel
			</button>
			<button type="submit" class="btn-primary">
				{editingPurpose ? 'Update' : 'Create'}
			</button>
		</div>
	</form>
</Modal>

<style>
	.trip-purposes-page {
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

	.form-group input[type='text'],
	.form-group input[type='number'],
	.form-group select,
	.form-group textarea {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #667eea;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 1rem;
	}

	.checkbox-group {
		padding-top: 1.8rem;
	}

	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-weight: 400;
	}

	.checkbox-group input[type='checkbox'] {
		width: 20px;
		height: 20px;
		cursor: pointer;
	}

	.required {
		color: #f56565;
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
		.form-row {
			grid-template-columns: 1fr;
		}

		.checkbox-group {
			padding-top: 0;
		}
	}
</style>

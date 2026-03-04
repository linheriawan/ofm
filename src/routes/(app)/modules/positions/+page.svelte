<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { onMount } from 'svelte';

	let title = 'Positions Management - OFM';
	let isModalOpen = $state(false);
	let editingPosition: any = null;
	let companies: any[] = $state([]);
	let formData = $state({
		positionId: '',
		positionName: '',
		code: '',
		level: 1,
		grade: '',
		companyId: 'IAS',
		isActive: true
	});

	onMount(async () => {
		await loadCompanies();
	});

	async function loadCompanies() {
		try {
			const response = await fetch('/api/v1/companies?limit=100');
			const result = await response.json();
			if (result.success) {
				companies = result.data || [];
			}
		} catch (error) {
			console.error('Failed to load companies:', error);
		}
	}

	const columns = [
		{ key: 'positionId', label: 'Position ID' },
		{ key: 'positionName', label: 'Position Name' },
		{ key: 'code', label: 'Code' },
		{ key: 'level', label: 'Level' },
		{ key: 'grade', label: 'Grade' },
		{ key: 'companyId', label: 'Company' },
		{ key: 'isActive', label: 'Active', format: (val: boolean) => (val ? 'Yes' : 'No') }
	];

	function openAddModal() {
		editingPosition = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(position: any) {
		editingPosition = position;
		formData = {
			positionId: position.positionId,
			positionName: position.positionName,
			code: position.code || '',
			level: position.level || 1,
			grade: position.grade || '',
			companyId: position.companyId || 'IAS',
			isActive: position.isActive
		};
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			positionId: '',
			positionName: '',
			code: '',
			level: 1,
			grade: '',
			companyId: 'IAS',
			isActive: true
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const url = editingPosition ? `/api/v1/positions/${editingPosition._id}` : '/api/v1/positions';
		const method = editingPosition ? 'PUT' : 'POST';

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
				alert(result.error || 'Failed to save position');
			}
		} catch (error) {
			alert('Failed to save position');
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingPosition = null;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="positions-page">
	<DataTable
		title="Positions"
		{columns}
		apiEndpoint="/api/v1/positions"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal
	bind:isOpen={isModalOpen}
	title={editingPosition ? 'Edit Position' : 'Add New Position'}
	onClose={closeModal}
>
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group">
				<label for="positionId">Position ID *</label>
				<input
					type="text"
					id="positionId"
					bind:value={formData.positionId}
					required
					placeholder="POS-001"
					disabled={!!editingPosition}
				/>
			</div>

			<div class="form-group">
				<label for="code">Code</label>
				<input type="text" id="code" bind:value={formData.code} placeholder="MGR" />
			</div>

			<div class="form-group full-width">
				<label for="positionName">Position Name *</label>
				<input
					type="text"
					id="positionName"
					bind:value={formData.positionName}
					required
					placeholder="Manager"
				/>
			</div>

			<div class="form-group">
				<label for="level">Level</label>
				<input
					type="number"
					id="level"
					bind:value={formData.level}
					min="1"
					max="10"
					placeholder="1"
				/>
			</div>

			<div class="form-group">
				<label for="grade">Grade</label>
				<input type="text" id="grade" bind:value={formData.grade} placeholder="A, B, C, D" />
			</div>

			<div class="form-group">
				<label for="companyId">Company *</label>
				<select id="companyId" bind:value={formData.companyId} required>
					<option value="">Select Company</option>
					{#each companies as company}
						<option value={company.companyId}>{company.companyName}</option>
					{/each}
				</select>
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
				>{editingPosition ? 'Update' : 'Create'} Position</button
			>
		</div>
	</form>
</Modal>

<style>
	.positions-page {
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

	.form-group input:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
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

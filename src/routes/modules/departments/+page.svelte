<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { onMount } from 'svelte';

	let title = 'Departments Management - OFM';
	let isModalOpen = $state(false);
	let editingDepartment: any = null;
	let companies: any[] = $state([]);
	let formData = $state({
		departmentId: '',
		departmentName: '',
		code: '',
		type: 'department',
		companyId: 'IAS',
		level: 1,
		parentDepartmentId: '',
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
		{ key: 'departmentId', label: 'Department ID' },
		{ key: 'departmentName', label: 'Department Name' },
		{ key: 'code', label: 'Code' },
		{ key: 'type', label: 'Type' },
		{ key: 'companyId', label: 'Company' },
		{ key: 'level', label: 'Level' },
		{ key: 'isActive', label: 'Active', format: (val: boolean) => (val ? 'Yes' : 'No') }
	];

	const departmentTypes = [
		{ value: 'directorate', label: 'Directorate' },
		{ value: 'division', label: 'Division' },
		{ value: 'department', label: 'Department' },
		{ value: 'section', label: 'Section' },
		{ value: 'unit', label: 'Unit' },
		{ value: 'other', label: 'Other' }
	];

	function openAddModal() {
		editingDepartment = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(department: any) {
		editingDepartment = department;
		formData = {
			departmentId: department.departmentId,
			departmentName: department.departmentName,
			code: department.code || '',
			type: department.type || 'department',
			companyId: department.companyId || 'IAS',
			level: department.level || 1,
			parentDepartmentId: department.parentDepartmentId || '',
			isActive: department.isActive
		};
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			departmentId: '',
			departmentName: '',
			code: '',
			type: 'department',
			companyId: 'IAS',
			level: 1,
			parentDepartmentId: '',
			isActive: true
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const url = editingDepartment
			? `/api/v1/departments/${editingDepartment._id}`
			: '/api/v1/departments';
		const method = editingDepartment ? 'PUT' : 'POST';

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
				alert(result.error || 'Failed to save department');
			}
		} catch (error) {
			alert('Failed to save department');
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingDepartment = null;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="departments-page">
	<DataTable
		title="Departments"
		{columns}
		apiEndpoint="/api/v1/departments"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal
	bind:isOpen={isModalOpen}
	title={editingDepartment ? 'Edit Department' : 'Add New Department'}
	onClose={closeModal}
>
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group">
				<label for="departmentId">Department ID *</label>
				<input
					type="text"
					id="departmentId"
					bind:value={formData.departmentId}
					required
					placeholder="DEPT-001"
					disabled={!!editingDepartment}
				/>
			</div>

			<div class="form-group">
				<label for="code">Code</label>
				<input type="text" id="code" bind:value={formData.code} placeholder="IT-DIV" />
			</div>

			<div class="form-group full-width">
				<label for="departmentName">Department Name *</label>
				<input
					type="text"
					id="departmentName"
					bind:value={formData.departmentName}
					required
					placeholder="IT Division"
				/>
			</div>

			<div class="form-group">
				<label for="type">Type *</label>
				<select id="type" bind:value={formData.type} required>
					{#each departmentTypes as deptType}
						<option value={deptType.value}>{deptType.label}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="level">Level *</label>
				<input
					type="number"
					id="level"
					bind:value={formData.level}
					required
					min="1"
					max="10"
					placeholder="1"
				/>
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

			<div class="form-group">
				<label for="parentDepartmentId">Parent Department ID</label>
				<input
					type="text"
					id="parentDepartmentId"
					bind:value={formData.parentDepartmentId}
					placeholder="For sub-departments"
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
				>{editingDepartment ? 'Update' : 'Create'} Department</button
			>
		</div>
	</form>
</Modal>

<style>
	.departments-page {
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

<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from '$lib/components/Modal.svelte';

	let title = 'Transport Companies - OFM';
	let companies: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');

	// Modal
	let isModalOpen = $state(false);
	let editingCompany: any = null;
	let formData = $state({
		name: '',
		type: 'ride_hailing',
		contactPerson: '',
		contactPhone: '',
		contactEmail: '',
		contractNumber: '',
		contractStartDate: '',
		contractEndDate: '',
		billingCycle: 'monthly',
		billingContactEmail: '',
		isActive: true,
		notes: ''
	});

	onMount(() => {
		fetchCompanies();
	});

	async function fetchCompanies() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/v1/transport-companies');
			const result = await response.json();

			if (result.success) {
				companies = result.data;
			} else {
				error = result.error?.message || 'Failed to load companies';
			}
		} catch (err) {
			error = 'Failed to connect to server';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function openAddModal() {
		editingCompany = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(company: any) {
		editingCompany = company;
		formData = {
			name: company.name,
			type: company.type,
			contactPerson: company.contactPerson || '',
			contactPhone: company.contactPhone || '',
			contactEmail: company.contactEmail || '',
			contractNumber: company.contractNumber || '',
			contractStartDate: company.contractStartDate
				? new Date(company.contractStartDate).toISOString().split('T')[0]
				: '',
			contractEndDate: company.contractEndDate
				? new Date(company.contractEndDate).toISOString().split('T')[0]
				: '',
			billingCycle: company.billingCycle || 'monthly',
			billingContactEmail: company.billingContactEmail || '',
			isActive: company.isActive !== false,
			notes: company.notes || ''
		};
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			name: '',
			type: 'ride_hailing',
			contactPerson: '',
			contactPhone: '',
			contactEmail: '',
			contractNumber: '',
			contractStartDate: '',
			contractEndDate: '',
			billingCycle: 'monthly',
			billingContactEmail: '',
			isActive: true,
			notes: ''
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		const url = editingCompany
			? `/api/v1/transport-companies/${editingCompany._id}`
			: '/api/v1/transport-companies';
		const method = editingCompany ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await response.json();

			if (result.success) {
				isModalOpen = false;
				fetchCompanies();
			} else {
				alert(result.error?.message || 'Failed to save company');
			}
		} catch (error) {
			alert('Failed to save company');
			console.error('Error saving company:', error);
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingCompany = null;
	}

	function getStatusBadge(isActive: boolean) {
		return isActive ? 'badge-active' : 'badge-inactive';
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="companies-page">
	<div class="page-header">
		<h1>Transport Companies</h1>
		<button onclick={openAddModal} class="btn-primary">Add Company</button>
	</div>

	<div class="info-box">
		<span class="info-icon">💡</span>
		<div>
			<strong>Transport Companies</strong> - Manage ride-hailing and transport service providers
			(Gojek, Grab, etc.). You can deactivate companies to prevent them from being selected for new
			voucher requests.
		</div>
	</div>

	{#if loading}
		<div class="loading">Loading companies...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if companies.length === 0}
		<div class="no-data">No transport companies found. Add one to get started.</div>
	{:else}
		<div class="table-card">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Type</th>
						<th>Contact Person</th>
						<th>Contact Phone</th>
						<th>Billing Cycle</th>
						<th>Contract Expiry</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each companies as company}
						<tr>
							<td class="company-name">{company.name}</td>
							<td>
								<span class="badge-type">{company.type.replace('_', ' ')}</span>
							</td>
							<td>{company.contactPerson || '-'}</td>
							<td>{company.contactPhone || '-'}</td>
							<td>{company.billingCycle || '-'}</td>
							<td>
								{#if company.contractEndDate}
									{new Date(company.contractEndDate).toLocaleDateString('id-ID')}
								{:else}
									-
								{/if}
							</td>
							<td>
								<span class="badge {getStatusBadge(company.isActive)}">
									{company.isActive ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td class="actions">
								<button onclick={() => openEditModal(company)} class="btn-edit">Edit</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Add/Edit Modal -->
<Modal
	bind:isOpen={isModalOpen}
	title={editingCompany ? 'Edit Transport Company' : 'Add Transport Company'}
	onClose={closeModal}
>
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group full-width">
				<label for="name">Company Name *</label>
				<input
					type="text"
					id="name"
					bind:value={formData.name}
					required
					placeholder="e.g. Gojek, Grab"
				/>
			</div>

			<div class="form-group">
				<label for="type">Type *</label>
				<select id="type" bind:value={formData.type} required>
					<option value="ride_hailing">Ride Hailing</option>
					<option value="car_rental">Car Rental</option>
					<option value="taxi">Taxi</option>
				</select>
			</div>

			<div class="form-group">
				<label for="isActive">Status *</label>
				<select id="isActive" bind:value={formData.isActive} required>
					<option value={true}>Active</option>
					<option value={false}>Inactive</option>
				</select>
				<small>Inactive companies cannot be selected for new voucher requests</small>
			</div>

			<div class="form-group">
				<label for="contactPerson">Contact Person</label>
				<input type="text" id="contactPerson" bind:value={formData.contactPerson} />
			</div>

			<div class="form-group">
				<label for="contactPhone">Contact Phone</label>
				<input type="text" id="contactPhone" bind:value={formData.contactPhone} />
			</div>

			<div class="form-group full-width">
				<label for="contactEmail">Contact Email</label>
				<input type="email" id="contactEmail" bind:value={formData.contactEmail} />
			</div>

			<div class="form-group">
				<label for="contractNumber">Contract Number</label>
				<input type="text" id="contractNumber" bind:value={formData.contractNumber} />
			</div>

			<div class="form-group">
				<label for="billingCycle">Billing Cycle</label>
				<select id="billingCycle" bind:value={formData.billingCycle}>
					<option value="weekly">Weekly</option>
					<option value="monthly">Monthly</option>
					<option value="quarterly">Quarterly</option>
				</select>
			</div>

			<div class="form-group">
				<label for="contractStartDate">Contract Start Date</label>
				<input type="date" id="contractStartDate" bind:value={formData.contractStartDate} />
			</div>

			<div class="form-group">
				<label for="contractEndDate">Contract End Date</label>
				<input type="date" id="contractEndDate" bind:value={formData.contractEndDate} />
			</div>

			<div class="form-group full-width">
				<label for="billingContactEmail">Billing Contact Email</label>
				<input type="email" id="billingContactEmail" bind:value={formData.billingContactEmail} />
			</div>

			<div class="form-group full-width">
				<label for="notes">Notes</label>
				<textarea id="notes" bind:value={formData.notes} rows="3"></textarea>
			</div>
		</div>

		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={closeModal}>Cancel</button>
			<button type="submit" class="btn-primary">
				{editingCompany ? 'Update' : 'Create'} Company
			</button>
		</div>
	</form>
</Modal>

<style>
	.companies-page {
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

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
	}

	.info-box {
		background: #eff6ff;
		border-left: 4px solid #3b82f6;
		padding: 1rem;
		margin-bottom: 2rem;
		border-radius: 8px;
		display: flex;
		gap: 1rem;
		align-items: start;
	}

	.info-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.table-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: #f9fafb;
	}

	th {
		text-align: left;
		padding: 1rem;
		font-weight: 600;
		color: #333;
		border-bottom: 2px solid #e2e8f0;
		white-space: nowrap;
	}

	td {
		padding: 1rem;
		border-bottom: 1px solid #e2e8f0;
		color: #555;
	}

	tbody tr:hover {
		background: #f9fafb;
	}

	.company-name {
		font-weight: 600;
		color: #667eea;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.badge-active {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-inactive {
		background: #fee2e2;
		color: #991b1b;
	}

	.badge-type {
		background: #e0e7ff;
		color: #3730a3;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-edit {
		padding: 0.5rem 1rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-edit:hover {
		transform: translateY(-2px);
	}

	.loading,
	.error,
	.no-data {
		text-align: center;
		padding: 3rem;
		color: #666;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.error {
		color: #e53e3e;
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

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-secondary {
		padding: 0.75rem 1.5rem;
		background: #f3f4f6;
		color: #333;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}
	}
</style>

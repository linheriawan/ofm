<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let title = 'Companies Management - OFM';
	let isModalOpen = $state(false);
	let editingCompany: any = null;
	let formData = $state({
		companyId: '',
		companyName: '',
		code: '',
		email: '',
		phone: '',
		address: '',
		parentCompanyId: '',
		isActive: true
	});

	const columns = [
		{ key: 'companyId', label: 'Company ID' },
		{ key: 'companyName', label: 'Company Name' },
		{ key: 'code', label: 'Code' },
		{ key: 'email', label: 'Email' },
		{ key: 'phone', label: 'Phone' },
		{ key: 'isActive', label: 'Active', format: (val: boolean) => (val ? 'Yes' : 'No') }
	];

	function openAddModal() {
		editingCompany = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(company: any) {
		editingCompany = company;
		formData = {
			companyId: company.companyId,
			companyName: company.companyName,
			code: company.code || '',
			email: company.email || '',
			phone: company.phone || '',
			address: company.address || '',
			parentCompanyId: company.parentCompanyId || '',
			isActive: company.isActive
		};
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			companyId: '',
			companyName: '',
			code: '',
			email: '',
			phone: '',
			address: '',
			parentCompanyId: '',
			isActive: true
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const url = editingCompany ? `/api/v1/companies/${editingCompany._id}` : '/api/v1/companies';
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
				window.location.reload();
			} else {
				alert(result.error || 'Failed to save company');
			}
		} catch (error) {
			alert('Failed to save company');
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingCompany = null;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="companies-page">
	<DataTable
		title="Companies"
		{columns}
		apiEndpoint="/api/v1/companies"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal
	bind:isOpen={isModalOpen}
	title={editingCompany ? 'Edit Company' : 'Add New Company'}
	onClose={closeModal}
>
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group">
				<label for="companyId">Company ID *</label>
				<input
					type="text"
					id="companyId"
					bind:value={formData.companyId}
					required
					placeholder="IAS"
					disabled={!!editingCompany}
				/>
			</div>

			<div class="form-group">
				<label for="code">Code</label>
				<input type="text" id="code" bind:value={formData.code} placeholder="IAS" />
			</div>

			<div class="form-group full-width">
				<label for="companyName">Company Name *</label>
				<input
					type="text"
					id="companyName"
					bind:value={formData.companyName}
					required
					placeholder="PT. Infomedia Solusi Humanika"
				/>
			</div>

			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" bind:value={formData.email} placeholder="info@ias.co.id" />
			</div>

			<div class="form-group">
				<label for="phone">Phone</label>
				<input type="tel" id="phone" bind:value={formData.phone} placeholder="+62-21-12345678" />
			</div>

			<div class="form-group full-width">
				<label for="address">Address</label>
				<input
					type="text"
					id="address"
					bind:value={formData.address}
					placeholder="Jakarta, Indonesia"
				/>
			</div>

			<div class="form-group">
				<label for="parentCompanyId">Parent Company ID</label>
				<input
					type="text"
					id="parentCompanyId"
					bind:value={formData.parentCompanyId}
					placeholder="For subsidiaries"
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
				>{editingCompany ? 'Update' : 'Create'} Company</button
			>
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

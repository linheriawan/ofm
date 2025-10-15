<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { User } from '$lib/types';

	let title = 'Users Management - OFM';
	let isModalOpen = $state(false);
	let editingUser: User | null = $state(null);
	let formData = $state({
		userId: '',
		email: '',
		username: '',
		firstName: '',
		lastName: '',
		phone: '',
		companyId: 'IAS',
		roleIds: [] as string[],
		isActive: true
	});

	const columns = [
		{ key: 'userId', label: 'User ID' },
		{ key: 'email', label: 'Email' },
		{ key: 'firstName', label: 'First Name' },
		{ key: 'lastName', label: 'Last Name' },
		{ key: 'phone', label: 'Phone' },
		{ key: 'isActive', label: 'Active', format: (val: boolean) => val ? 'Yes' : 'No' }
	];

	function openAddModal() {
		editingUser = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(user: User) {
		editingUser = user;
		formData = {
			userId: user.userId,
			email: user.email,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			phone: user.phone || '',
			companyId: user.companyId,
			roleIds: user.roleIds || [],
			isActive: user.isActive
		};
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			userId: '',
			email: '',
			username: '',
			firstName: '',
			lastName: '',
			phone: '',
			companyId: 'IAS',
			roleIds: [],
			isActive: true
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
		const method = editingUser ? 'PUT' : 'POST';

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
				alert(result.error || 'Failed to save user');
			}
		} catch (error) {
			alert('Failed to save user');
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingUser = null;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="users-page">
	<DataTable
		title="Users"
		{columns}
		apiEndpoint="/api/users"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal bind:isOpen={isModalOpen} title={editingUser ? 'Edit User' : 'Add New User'} onClose={closeModal}>
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group full-width">
				<label for="userId">User ID</label>
				<input type="text" id="userId" bind:value={formData.userId} placeholder="Auto-generated" />
			</div>

			<div class="form-group">
				<label for="email">Email *</label>
				<input type="email" id="email" bind:value={formData.email} required placeholder="user@example.com" />
			</div>

			<div class="form-group">
				<label for="username">Username *</label>
				<input type="text" id="username" bind:value={formData.username} required placeholder="username" />
			</div>

			<div class="form-group">
				<label for="firstName">First Name *</label>
				<input type="text" id="firstName" bind:value={formData.firstName} required placeholder="John" />
			</div>

			<div class="form-group">
				<label for="lastName">Last Name *</label>
				<input type="text" id="lastName" bind:value={formData.lastName} required placeholder="Doe" />
			</div>

			<div class="form-group">
				<label for="phone">Phone</label>
				<input type="tel" id="phone" bind:value={formData.phone} placeholder="+62-811-1111-1111" />
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
			<button type="submit" class="btn-primary">{editingUser ? 'Update' : 'Create'} User</button>
		</div>
	</form>
</Modal>

<style>
	.users-page {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
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

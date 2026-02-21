<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Role } from '$lib/types';

	let title = 'Roles & Permissions - OFM';
	let isModalOpen = $state(false);
	let isPermissionsModalOpen = $state(false);
	let editingRole: Role | null = $state(null);
	let formData = $state({
		roleId: '',
		roleName: '',
		description: '',
		permissions: [] as string[],
		companyId: '',
		isActive: true
	});

	// Available permissions by module
	const availablePermissions = [
		{ id: 'transportation.create', label: 'Create Transportation Requests', module: 'Transportation' },
		{ id: 'transportation.read', label: 'View Transportation Requests', module: 'Transportation' },
		{ id: 'transportation.update', label: 'Update Transportation Requests', module: 'Transportation' },
		{ id: 'transportation.delete', label: 'Delete Transportation Requests', module: 'Transportation' },
		{ id: 'transportation.approve', label: 'Approve Transportation Requests', module: 'Transportation' },
		{ id: 'transportation.assign_driver', label: 'Assign Drivers', module: 'Transportation' },
		{ id: 'transportation.assign_vehicle', label: 'Assign Vehicles', module: 'Transportation' },
		{ id: 'transportation.allocate_voucher', label: 'Allocate Vouchers', module: 'Transportation' },

		{ id: 'meeting.create', label: 'Create Meeting Bookings', module: 'Meeting' },
		{ id: 'meeting.read', label: 'View Meeting Bookings', module: 'Meeting' },
		{ id: 'meeting.update', label: 'Update Meeting Bookings', module: 'Meeting' },
		{ id: 'meeting.delete', label: 'Delete Meeting Bookings', module: 'Meeting' },
		{ id: 'meeting.approve', label: 'Approve Meeting Bookings', module: 'Meeting' },

		{ id: 'admin.users.create', label: 'Create Users', module: 'Admin' },
		{ id: 'admin.users.read', label: 'View Users', module: 'Admin' },
		{ id: 'admin.users.update', label: 'Update Users', module: 'Admin' },
		{ id: 'admin.users.delete', label: 'Delete Users', module: 'Admin' },

		{ id: 'admin.roles.create', label: 'Create Roles', module: 'Admin' },
		{ id: 'admin.roles.read', label: 'View Roles', module: 'Admin' },
		{ id: 'admin.roles.update', label: 'Update Roles', module: 'Admin' },
		{ id: 'admin.roles.delete', label: 'Delete Roles', module: 'Admin' },

		{ id: 'admin.vehicles.create', label: 'Create Vehicles', module: 'Admin' },
		{ id: 'admin.vehicles.read', label: 'View Vehicles', module: 'Admin' },
		{ id: 'admin.vehicles.update', label: 'Update Vehicles', module: 'Admin' },
		{ id: 'admin.vehicles.delete', label: 'Delete Vehicles', module: 'Admin' },

		{ id: 'admin.drivers.create', label: 'Create Drivers', module: 'Admin' },
		{ id: 'admin.drivers.read', label: 'View Drivers', module: 'Admin' },
		{ id: 'admin.drivers.update', label: 'Update Drivers', module: 'Admin' },
		{ id: 'admin.drivers.delete', label: 'Delete Drivers', module: 'Admin' },

		{ id: 'admin.rooms.create', label: 'Create Meeting Rooms', module: 'Admin' },
		{ id: 'admin.rooms.read', label: 'View Meeting Rooms', module: 'Admin' },
		{ id: 'admin.rooms.update', label: 'Update Meeting Rooms', module: 'Admin' },
		{ id: 'admin.rooms.delete', label: 'Delete Meeting Rooms', module: 'Admin' },

		{ id: 'admin.locations.create', label: 'Create Locations', module: 'Admin' },
		{ id: 'admin.locations.read', label: 'View Locations', module: 'Admin' },
		{ id: 'admin.locations.update', label: 'Update Locations', module: 'Admin' },
		{ id: 'admin.locations.delete', label: 'Delete Locations', module: 'Admin' },

		{ id: 'reports.view', label: 'View Reports', module: 'Reports' },
		{ id: 'reports.export', label: 'Export Reports', module: 'Reports' },

		{ id: 'global.manage_all', label: 'Manage All Entities', module: 'Global' }
	];

	// Group permissions by module
	const permissionsByModule = availablePermissions.reduce((acc, perm) => {
		if (!acc[perm.module]) {
			acc[perm.module] = [];
		}
		acc[perm.module].push(perm);
		return acc;
	}, {} as Record<string, typeof availablePermissions>);

	const columns = [
		{ key: 'roleId', label: 'Role ID' },
		{ key: 'roleName', label: 'Role Name' },
		{ key: 'description', label: 'Description' },
		{
			key: 'permissions',
			label: 'Permissions',
			format: (val: string[]) => val ? `${val.length} permissions` : '0 permissions'
		},
		{ key: 'isActive', label: 'Active', format: (val: boolean) => val ? 'Yes' : 'No' }
	];

	function openAddModal() {
		editingRole = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(role: Role) {
		editingRole = role;
		formData = {
			roleId: role.roleId,
			roleName: role.roleName,
			description: role.description || '',
			permissions: role.permissions || [],
			companyId: role.companyId || '',
			isActive: role.isActive
		};
		isModalOpen = true;
	}

	function openPermissionsModal() {
		isPermissionsModalOpen = true;
	}

	function resetForm() {
		formData = {
			roleId: '',
			roleName: '',
			description: '',
			permissions: [],
			companyId: '',
			isActive: true
		};
	}

	function togglePermission(permissionId: string) {
		if (formData.permissions.includes(permissionId)) {
			formData.permissions = formData.permissions.filter(p => p !== permissionId);
		} else {
			formData.permissions = [...formData.permissions, permissionId];
		}
	}

	function toggleAllInModule(module: string) {
		const modulePermissions = permissionsByModule[module].map(p => p.id);
		const allSelected = modulePermissions.every(p => formData.permissions.includes(p));

		if (allSelected) {
			// Deselect all in module
			formData.permissions = formData.permissions.filter(p => !modulePermissions.includes(p));
		} else {
			// Select all in module
			const newPermissions = [...formData.permissions];
			modulePermissions.forEach(p => {
				if (!newPermissions.includes(p)) {
					newPermissions.push(p);
				}
			});
			formData.permissions = newPermissions;
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const url = editingRole ? `/api/v1/roles/${editingRole._id}` : '/api/v1/roles';
		const method = editingRole ? 'PUT' : 'POST';

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
				alert(result.error?.message || 'Failed to save role');
			}
		} catch (error) {
			alert('Failed to save role');
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingRole = null;
	}

	function closePermissionsModal() {
		isPermissionsModalOpen = false;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="roles-page">
	<DataTable
		title="Roles & Permissions"
		{columns}
		apiEndpoint="/api/v1/roles"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal bind:isOpen={isModalOpen} title={editingRole ? 'Edit Role' : 'Add New Role'} onClose={closeModal}>
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group">
				<label for="roleId">Role ID *</label>
				<input
					type="text"
					id="roleId"
					bind:value={formData.roleId}
					required
					placeholder="e.g., transport_admin"
					disabled={!!editingRole}
				/>
			</div>

			<div class="form-group">
				<label for="roleName">Role Name *</label>
				<input
					type="text"
					id="roleName"
					bind:value={formData.roleName}
					required
					placeholder="e.g., Transport Administrator"
				/>
			</div>

			<div class="form-group full-width">
				<label for="description">Description</label>
				<textarea
					id="description"
					bind:value={formData.description}
					placeholder="Brief description of the role"
					rows="3"
				></textarea>
			</div>

			<div class="form-group full-width">
				<div class="permissions-header">
					<label>Permissions ({formData.permissions.length} selected)</label>
					<button type="button" class="btn-link" onclick={openPermissionsModal}>
						Manage Permissions
					</button>
				</div>
				<div class="permissions-summary">
					{#if formData.permissions.length === 0}
						<span class="text-muted">No permissions selected</span>
					{:else}
						<div class="permissions-chips">
							{#each formData.permissions.slice(0, 5) as perm}
								<span class="chip">{perm}</span>
							{/each}
							{#if formData.permissions.length > 5}
								<span class="chip-more">+{formData.permissions.length - 5} more</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<div class="form-group">
				<label for="companyId">Company ID (Optional)</label>
				<input
					type="text"
					id="companyId"
					bind:value={formData.companyId}
					placeholder="Leave empty for global role"
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
			<button type="submit" class="btn-primary">{editingRole ? 'Update' : 'Create'} Role</button>
		</div>
	</form>
</Modal>

<Modal bind:isOpen={isPermissionsModalOpen} title="Manage Permissions" onClose={closePermissionsModal} width="800px">
	<div class="permissions-manager">
		{#each Object.entries(permissionsByModule) as [module, permissions]}
			<div class="permission-module">
				<div class="module-header">
					<h3>{module}</h3>
					<button
						type="button"
						class="btn-link-small"
						onclick={() => toggleAllInModule(module)}
					>
						{permissions.every(p => formData.permissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
					</button>
				</div>
				<div class="permission-list">
					{#each permissions as permission}
						<label class="permission-item">
							<input
								type="checkbox"
								checked={formData.permissions.includes(permission.id)}
								onchange={() => togglePermission(permission.id)}
							/>
							<span>{permission.label}</span>
						</label>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<div class="modal-actions">
		<button type="button" class="btn-primary" onclick={closePermissionsModal}>Done</button>
	</div>
</Modal>

<style>
	.roles-page {
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
	.form-group select,
	.form-group textarea {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
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

	.permissions-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.permissions-summary {
		padding: 0.75rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		min-height: 60px;
	}

	.permissions-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.chip {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: #667eea;
		color: white;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.chip-more {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: #e5e7eb;
		color: #666;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.text-muted {
		color: #9ca3af;
		font-size: 0.9rem;
	}

	.permissions-manager {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-height: 500px;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.permission-module {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
		background: #f9fafb;
	}

	.module-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.module-header h3 {
		margin: 0;
		font-size: 1rem;
		color: #667eea;
		font-weight: 600;
	}

	.permission-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 0.75rem;
	}

	.permission-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.permission-item:hover {
		background: #f0f4ff;
		border-color: #667eea;
	}

	.permission-item input[type='checkbox'] {
		cursor: pointer;
	}

	.permission-item span {
		font-size: 0.875rem;
		color: #333;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		margin-top: 1rem;
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

	.btn-link {
		background: none;
		border: none;
		color: #667eea;
		font-weight: 500;
		cursor: pointer;
		padding: 0;
		font-size: 0.9rem;
	}

	.btn-link:hover {
		color: #764ba2;
		text-decoration: underline;
	}

	.btn-link-small {
		background: none;
		border: none;
		color: #667eea;
		font-weight: 500;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}

	.btn-link-small:hover {
		color: #764ba2;
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.permission-list {
			grid-template-columns: 1fr;
		}
	}
</style>

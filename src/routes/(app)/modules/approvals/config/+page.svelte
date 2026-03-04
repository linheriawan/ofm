<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { onMount } from 'svelte';

	let title = 'Approval Workflow Configuration - OFM';
	let isModalOpen = $state(false);
	let editingWorkflow: any | null = $state(null);
	let roles: any[] = $state([]);
	let users: any[] = $state([]);

	let formData = $state({
		workflowName: '',
		module: 'transportation',
		description: '',
		requiredApprovers: 1,
		approverRoles: [] as string[],
		approverUsers: [] as string[],
		autoApproveEnabled: false,
		autoApproveConditions: {},
		escalationEnabled: false,
		escalationHours: 24,
		escalationToRoles: [] as string[],
		notifyOnSubmit: true,
		notifyOnApproval: true,
		notifyOnRejection: true,
		isActive: true,
		priority: 0
	});

	const columns = [
		{ key: 'workflowName', label: 'Workflow Name' },
		{ key: 'module', label: 'Module' },
		{ key: 'requiredApprovers', label: 'Required Approvers' },
		{
			key: 'approverRoles',
			label: 'Approver Roles',
			format: (val: string[]) => val && val.length > 0 ? `${val.length} roles` : 'None'
		},
		{ key: 'isActive', label: 'Active', format: (val: boolean) => val ? 'Yes' : 'No' }
	];

	onMount(async () => {
		await Promise.all([loadRoles(), loadUsers()]);
	});

	async function loadRoles() {
		try {
			const response = await fetch('/api/v1/roles?limit=100');
			const result = await response.json();
			if (result.success) {
				roles = result.data || [];
			}
		} catch (error) {
			console.error('Failed to load roles:', error);
		}
	}

	async function loadUsers() {
		try {
			const response = await fetch('/api/v1/users?limit=100');
			const result = await response.json();
			if (result.success) {
				users = result.data || [];
			}
		} catch (error) {
			console.error('Failed to load users:', error);
		}
	}

	function openAddModal() {
		editingWorkflow = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(workflow: any) {
		editingWorkflow = workflow;
		formData = {
			workflowName: workflow.workflowName,
			module: workflow.module,
			description: workflow.description || '',
			requiredApprovers: workflow.requiredApprovers || 1,
			approverRoles: workflow.approverRoles || [],
			approverUsers: workflow.approverUsers || [],
			autoApproveEnabled: workflow.autoApproveEnabled || false,
			autoApproveConditions: workflow.autoApproveConditions || {},
			escalationEnabled: workflow.escalationEnabled || false,
			escalationHours: workflow.escalationHours || 24,
			escalationToRoles: workflow.escalationToRoles || [],
			notifyOnSubmit: workflow.notifyOnSubmit !== false,
			notifyOnApproval: workflow.notifyOnApproval !== false,
			notifyOnRejection: workflow.notifyOnRejection !== false,
			isActive: workflow.isActive,
			priority: workflow.priority || 0
		};
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			workflowName: '',
			module: 'transportation',
			description: '',
			requiredApprovers: 1,
			approverRoles: [],
			approverUsers: [],
			autoApproveEnabled: false,
			autoApproveConditions: {},
			escalationEnabled: false,
			escalationHours: 24,
			escalationToRoles: [],
			notifyOnSubmit: true,
			notifyOnApproval: true,
			notifyOnRejection: true,
			isActive: true,
			priority: 0
		};
	}

	function toggleRoleSelection(roleId: string) {
		if (formData.approverRoles.includes(roleId)) {
			formData.approverRoles = formData.approverRoles.filter(r => r !== roleId);
		} else {
			formData.approverRoles = [...formData.approverRoles, roleId];
		}
	}

	function toggleEscalationRole(roleId: string) {
		if (formData.escalationToRoles.includes(roleId)) {
			formData.escalationToRoles = formData.escalationToRoles.filter(r => r !== roleId);
		} else {
			formData.escalationToRoles = [...formData.escalationToRoles, roleId];
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const url = editingWorkflow ? `/api/v1/approval-workflows/${editingWorkflow._id}` : '/api/v1/approval-workflows';
		const method = editingWorkflow ? 'PUT' : 'POST';

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
				alert(result.error?.message || 'Failed to save workflow');
			}
		} catch (error) {
			alert('Failed to save workflow');
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingWorkflow = null;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="workflows-page">
	<div class="page-header">
		<div>
			<h1>Approval Workflow Configuration</h1>
			<p class="subtitle">Configure automated approval rules and escalation policies</p>
		</div>
	</div>

	<DataTable
		title="Approval Workflows"
		{columns}
		apiEndpoint="/api/v1/approval-workflows"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal bind:isOpen={isModalOpen} title={editingWorkflow ? 'Edit Workflow' : 'Add New Workflow'} onClose={closeModal} width="700px">
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group full-width">
				<label for="workflowName">Workflow Name *</label>
				<input
					type="text"
					id="workflowName"
					bind:value={formData.workflowName}
					required
					placeholder="e.g., Standard Transportation Approval"
				/>
			</div>

			<div class="form-group">
				<label for="module">Module *</label>
				<select id="module" bind:value={formData.module} required>
					<option value="transportation">Transportation</option>
					<option value="meeting">Meeting</option>
				</select>
			</div>

			<div class="form-group">
				<label for="priority">Priority</label>
				<input
					type="number"
					id="priority"
					bind:value={formData.priority}
					placeholder="0 = lowest"
					min="0"
				/>
			</div>

			<div class="form-group full-width">
				<label for="description">Description</label>
				<textarea
					id="description"
					bind:value={formData.description}
					placeholder="Describe when this workflow should be applied..."
					rows="2"
				></textarea>
			</div>

			<div class="form-section full-width">
				<h3>Approval Settings</h3>

				<div class="form-group">
					<label for="requiredApprovers">Required Number of Approvers</label>
					<input
						type="number"
						id="requiredApprovers"
						bind:value={formData.requiredApprovers}
						min="1"
						required
					/>
				</div>

				<div class="form-group full-width">
					<label>Roles That Can Approve</label>
					<div class="checkbox-grid">
						{#each roles as role}
							<label class="checkbox-item">
								<input
									type="checkbox"
									checked={formData.approverRoles.includes(role._id)}
									onchange={() => toggleRoleSelection(role._id)}
								/>
								<span>{role.roleName}</span>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<div class="form-section full-width">
				<h3>Auto-Approval Rules</h3>

				<div class="form-group checkbox-group">
					<label>
						<input type="checkbox" bind:checked={formData.autoApproveEnabled} />
						Enable Auto-Approval
					</label>
				</div>

				{#if formData.autoApproveEnabled}
					<div class="form-group full-width">
						<p class="info-text">
							Configure conditions for automatic approval (Coming Soon)
						</p>
					</div>
				{/if}
			</div>

			<div class="form-section full-width">
				<h3>Escalation Policy</h3>

				<div class="form-group checkbox-group">
					<label>
						<input type="checkbox" bind:checked={formData.escalationEnabled} />
						Enable Escalation
					</label>
				</div>

				{#if formData.escalationEnabled}
					<div class="form-group">
						<label for="escalationHours">Escalate After (Hours)</label>
						<input
							type="number"
							id="escalationHours"
							bind:value={formData.escalationHours}
							min="1"
							required
						/>
					</div>

					<div class="form-group full-width">
						<label>Escalate To Roles</label>
						<div class="checkbox-grid">
							{#each roles as role}
								<label class="checkbox-item">
									<input
										type="checkbox"
										checked={formData.escalationToRoles.includes(role._id)}
										onchange={() => toggleEscalationRole(role._id)}
									/>
									<span>{role.roleName}</span>
								</label>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="form-section full-width">
				<h3>Notification Settings</h3>

				<div class="checkbox-grid">
					<label class="checkbox-item">
						<input type="checkbox" bind:checked={formData.notifyOnSubmit} />
						<span>Notify on Submit</span>
					</label>
					<label class="checkbox-item">
						<input type="checkbox" bind:checked={formData.notifyOnApproval} />
						<span>Notify on Approval</span>
					</label>
					<label class="checkbox-item">
						<input type="checkbox" bind:checked={formData.notifyOnRejection} />
						<span>Notify on Rejection</span>
					</label>
				</div>
			</div>

			<div class="form-group checkbox-group full-width">
				<label>
					<input type="checkbox" bind:checked={formData.isActive} />
					Workflow is Active
				</label>
			</div>
		</div>

		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={closeModal}>Cancel</button>
			<button type="submit" class="btn-primary">{editingWorkflow ? 'Update' : 'Create'} Workflow</button>
		</div>
	</form>
</Modal>

<style>
	.workflows-page {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.page-header {
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin: 0.5rem 0 0 0;
		font-size: 1rem;
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

	.form-section {
		border-top: 2px solid #e2e8f0;
		padding-top: 1rem;
		margin-top: 0.5rem;
	}

	.form-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #667eea;
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

	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.checkbox-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.5rem;
		background: white;
		border-radius: 6px;
		transition: background 0.2s;
	}

	.checkbox-item:hover {
		background: #f0f4ff;
	}

	.checkbox-item input[type='checkbox'] {
		cursor: pointer;
	}

	.info-text {
		margin: 0;
		padding: 1rem;
		background: #f0f4ff;
		border-radius: 6px;
		color: #667eea;
		font-size: 0.9rem;
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

		.checkbox-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

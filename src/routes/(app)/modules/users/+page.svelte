<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { User } from '$lib/types';

	let { data } = $props();
	let title = 'Users - OFM';

	// Tabs — each maps to a roleId filter (null = all users)
	const tabs = [
		{ id: 'all',         label: 'All Users',      icon: '👥', roleId: null },
		{ id: 'super_admin', label: 'Super Admin',     icon: '🔑', roleId: 'super_admin' },
		{ id: 'admin',       label: 'Admin',           icon: '🛡️', roleId: 'admin' },
		{ id: 'employee',    label: 'Employee',        icon: '👤', roleId: 'employee' },
		{ id: 'driver',      label: 'Driver',          icon: '🚗', roleId: 'driver' }
	];

	let activeTab = $state('all');
	let roleCounts: Record<string, number> = $state({});

	// Data state
	let users: User[] = $state([]);
	let totalUsers = $state(0);
	let currentPage = $state(1);
	let currentPageSize = $state(25);
	let currentSearch = $state('');
	let currentSortKey = $state('');
	let currentSortDir: 'asc' | 'desc' = $state('asc');
	let isLoading = $state(false);

	// Edit modal
	let isModalOpen = $state(false);
	let editingUser: User | null = $state(null);
	let roles: any[] = $state([]);
	let departments: any[] = $state([]);
	let locations: any[] = $state([]);

	// SSO-owned fields — display only, never submitted
	let ssoProfile = $state({
		userId: '',
		email: '',
		username: '',
		firstName: '',
		lastName: '',
		phone: '',
		departmentId: '',
		companyId: '',
		isActive: false,
		syncedAt: null as string | null
	});

	// OFM-managed fields — the only ones editable and submitted
	let formData = $state({
		locationId: '',
		roleIds: [] as string[]
	});

	function formatSyncedAt(iso: string | null): string {
		if (!iso) return 'Never';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
	}

	const groupedRoles = $derived.by(() => {
		const groups = [
			{ id: 'system', label: 'System',        match: (r: any) => r.roleId === 'super_admin' },
			{ id: 'admin',  label: 'Administration', match: (r: any) => r.roleId !== 'super_admin' && r.roleId?.includes('admin') },
			{ id: 'ops',    label: 'Operations',     match: (r: any) => r.roleId === 'driver' },
			{ id: 'user',   label: 'Users',          match: (r: any) => !r.roleId?.includes('admin') && r.roleId !== 'driver' }
		];
		return groups
			.map(g => ({ ...g, items: roles.filter(g.match) }))
			.filter(g => g.items.length > 0);
	});

	async function loadUsers() {
		isLoading = true;
		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: currentPageSize.toString()
			});
			if (currentSearch) params.set('search', currentSearch);
			if (currentSortKey) { params.set('sortKey', currentSortKey); params.set('sortDirection', currentSortDir); }

			const activeRoleId = tabs.find(t => t.id === activeTab)?.roleId;
			if (activeRoleId) params.set('role', activeRoleId);

			const res = await fetch(`/api/v1/users?${params}`);
			const json = await res.json();
			if (json.success) {
				users = json.data ?? [];
				totalUsers = json.pagination?.total ?? json.total ?? json.meta?.total ?? users.length;
				if (json.roleCounts) roleCounts = json.roleCounts;
			}
		} catch (e) {
			console.error('Failed to load users', e);
		} finally {
			isLoading = false;
		}
	}

	async function loadMeta() {
		const [rRes, dRes, lRes] = await Promise.allSettled([
			fetch('/api/v1/roles?limit=100').then(r => r.json()),
			fetch('/api/v1/departments?limit=100').then(r => r.json()),
			fetch('/api/v1/locations?limit=100').then(r => r.json())
		]);
		if (rRes.status === 'fulfilled' && rRes.value.success) roles = rRes.value.data ?? [];
		if (dRes.status === 'fulfilled' && dRes.value.success) departments = dRes.value.data ?? [];
		if (lRes.status === 'fulfilled' && lRes.value.success) locations = lRes.value.data ?? [];
	}

	$effect(() => { loadUsers(); loadMeta(); });

	function switchTab(tabId: string) {
		activeTab = tabId;
		currentPage = 1;
		currentSearch = '';
		loadUsers();
	}

	function getTabCount(tab: typeof tabs[0]): number {
		if (tab.roleId === null) return Object.values(roleCounts).reduce((a, b) => a + b, 0);
		return roleCounts[tab.roleId] ?? 0;
	}

	const columns = [
		{ key: 'userId', label: 'User ID', sortable: true },
		{
			key: 'firstName',
			label: 'Name',
			sortable: true,
			render: (val: string, row: any) =>
				`<div style="font-weight:500">${val ?? ''} ${row.lastName ?? ''}</div><div style="font-size:0.75rem;color:#6b7280">${row.phone || ''}</div>`
		},
		{
			key: 'email',
			label: 'Email',
			sortable: true,
			render: (val: string, row: any) =>
				val ?? `<span style="color:#6b7280">${row.username ?? '—'}</span>`
		},
		{
			key: 'roleIds',
			label: 'Roles',
			render: (val: string[]) => {
				if (!val?.length) return '<span style="color:#9ca3af">—</span>';
				return val.map(r => `<span class="badge badge-role">${r.replace(/_/g, ' ')}</span>`).join(' ');
			}
		},
		{
			key: 'isActive',
			label: 'Status',
			sortable: true,
			render: (val: boolean) =>
				`<span class="badge ${val ? 'badge-green' : 'badge-red'}">${val ? 'Active' : 'Inactive'}</span>`
		}
	];

	function handlePageChange(p: number) { currentPage = p; loadUsers(); }
	function handlePageSizeChange(s: number) { currentPageSize = s; currentPage = 1; loadUsers(); }
	function handleSort(e: { key: string; direction: 'asc' | 'desc' }) { currentSortKey = e.key; currentSortDir = e.direction; currentPage = 1; loadUsers(); }
	function handleSearch(q: string) { currentSearch = q; currentPage = 1; loadUsers(); }

	// Converts any ObjectId strings to roleId strings using the loaded roles list
	function normaliseRoleIds(ids: string[]): string[] {
		return ids.map(id => {
			const byId = roles.find(r => r._id?.toString() === id);
			return byId ? byId.roleId : id;
		});
	}

	async function openEditModal(user: User) {
		editingUser = user;

		// SSO-managed — display only
		ssoProfile = {
			userId: user.userId,
			email: user.email,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			phone: user.phone || '',
			departmentId: user.departmentId || '',
			companyId: (user as any).companyId || '',
			isActive: user.isActive,
			syncedAt: (user as any).syncedAt ?? null
		};

		// OFM-managed — editable
		formData = {
			locationId: (user as any).locationId || '',
			roleIds: normaliseRoleIds(user.roleIds || [])
		};

		isModalOpen = true;
	}

	function closeModal() { isModalOpen = false; editingUser = null; }

	function toggleRole(roleId: string) {
		if (formData.roleIds.includes(roleId)) {
			formData.roleIds = formData.roleIds.filter(id => id !== roleId);
		} else {
			formData.roleIds = [...formData.roleIds, roleId];
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!editingUser) return;
		try {
			// Only send OFM-managed fields — SSO fields are never submitted
			const userRes = await fetch(`/api/v1/users/${(editingUser as any)._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});
			const userResult = await userRes.json();
			if (!userResult.success) { alert(userResult.error || 'Failed to update user'); return; }

			isModalOpen = false;
			loadUsers();
		} catch {
			alert('Failed to update user');
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="users-page">
	<div class="sync-banner">
		<span>👥 Users are synced from <strong>Aksara SSO</strong> via SCIM. Manual creation is not available.</span>
		<a href="/modules/sync" class="sync-link">Go to Sync →</a>
	</div>

	<div class="table-card">
		<!-- Tabs -->
		<div class="tabs-bar">
			{#each tabs as tab}
				<button
					type="button"
					class="tab-btn"
					class:tab-active={activeTab === tab.id}
					onclick={() => switchTab(tab.id)}
				>
					<span>{tab.icon}</span>
					{tab.label}
					<span class="tab-count">{getTabCount(tab)}</span>
				</button>
			{/each}
		</div>

		<DataTable
			data={users}
			{columns}
			totalItems={totalUsers}
			page={currentPage}
			pageSize={currentPageSize}
			pageSizeOptions={[10, 25, 50, 100]}
			loading={isLoading}
			searchable={true}
			searchPlaceholder="Search by name, email, user ID..."
			searchKeys={['firstName', 'lastName', 'email', 'userId', 'username', 'phone']}
			onPageChange={handlePageChange}
			onPageSizeChange={handlePageSizeChange}
			onSort={handleSort}
			onSearch={handleSearch}
			onEdit={openEditModal}
			emptyMessage="No users found in this group."
		/>
	</div>
</div>

<Modal bind:isOpen={isModalOpen} title="Edit User" onClose={closeModal} width="700px">
	<form onsubmit={handleSubmit}>

		<!-- SSO Profile — readonly, managed by Aksara SSO -->
		<div class="sso-section">
			<div class="sso-section-header">
				<span class="sso-label">🔒 Synced from Aksara SSO</span>
				<a
					href="{data.ssoBaseUrl}/admin/users"
					target="_blank"
					rel="noopener noreferrer"
					class="sso-link"
				>Edit in SSO ↗</a>
			</div>
			<div class="form-grid">
				<div class="form-group">
					<label>User ID</label>
					<div class="readonly-field">{ssoProfile.userId || '—'}</div>
				</div>
				<div class="form-group">
					<label>Status</label>
					<div class="readonly-field">
						<span class="badge {ssoProfile.isActive ? 'badge-green' : 'badge-red'}">
							{ssoProfile.isActive ? 'Active' : 'Inactive'}
						</span>
					</div>
				</div>
				<div class="form-group">
					<label>First Name</label>
					<div class="readonly-field">{ssoProfile.firstName || '—'}</div>
				</div>
				<div class="form-group">
					<label>Last Name</label>
					<div class="readonly-field">{ssoProfile.lastName || '—'}</div>
				</div>
				<div class="form-group full-width">
					<label>Email</label>
					<div class="readonly-field">{ssoProfile.email || '—'}</div>
				</div>
				<div class="form-group">
					<label>Username</label>
					<div class="readonly-field">{ssoProfile.username || '—'}</div>
				</div>
				<div class="form-group">
					<label>Phone</label>
					<div class="readonly-field">{ssoProfile.phone || '—'}</div>
				</div>
				<div class="form-group">
					<label>Department</label>
					<div class="readonly-field">
						{departments.find(d => d._id === ssoProfile.departmentId)?.name || ssoProfile.departmentId || '—'}
					</div>
				</div>
				<div class="form-group">
					<label>Last Synced</label>
					<div class="readonly-field muted">{formatSyncedAt(ssoProfile.syncedAt)}</div>
				</div>
			</div>
		</div>

		<!-- OFM Settings — editable -->
		<div class="ofm-section">
			<div class="ofm-section-header">OFM Settings</div>
			<div class="form-grid">
				<div class="form-group full-width">
					<label for="locationId">Work Location</label>
					<select id="locationId" bind:value={formData.locationId}>
						<option value="">— None —</option>
						{#each locations as loc}
							<option value={loc._id}>{loc.name} — {loc.city}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		{#if groupedRoles.length > 0}
			<div class="roles-section">
				<h3>Roles</h3>
				<div class="roles-groups">
					{#each groupedRoles as group}
						<div class="role-group">
							<div class="role-group-header">{group.label}</div>
							<div class="role-group-list">
								{#each group.items as role}
									<label class="role-row">
										<input
											type="checkbox"
											checked={formData.roleIds.includes(role.roleId)}
											onchange={() => toggleRole(role.roleId)}
										/>
										<span class="role-row-content">
											<span class="role-row-name">{role.roleName}</span>
											{#if role.description}
												<span class="role-row-desc">{role.description}</span>
											{/if}
										</span>
										{#if role.permissions?.includes('*')}
											<span class="role-badge role-badge-danger">Full Access</span>
										{:else if role.permissions?.length > 0}
											<span class="role-badge role-badge-info">{role.permissions.length} perm</span>
										{/if}
									</label>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={closeModal}>Cancel</button>
			<button type="submit" class="btn-primary">Update User</button>
		</div>
	</form>
</Modal>

<style>
	.users-page { animation: fadeIn 0.3s ease-in; }

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.sync-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.875rem 1.25rem;
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 8px;
		margin-bottom: 1.25rem;
		font-size: 0.9rem;
		color: #1e40af;
	}

	.sync-link {
		white-space: nowrap;
		font-weight: 600;
		color: #2563eb;
		text-decoration: none;
	}
	.sync-link:hover { text-decoration: underline; }

	/* Card wrapping tabs + table */
	.table-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		overflow: hidden;
	}

	/* Tabs */
	.tabs-bar {
		display: flex;
		gap: 0;
		border-bottom: 2px solid #e5e7eb;
		padding: 0 1.5rem;
		overflow-x: auto;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.9rem 1.1rem;
		border: none;
		background: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		white-space: nowrap;
		transition: color 0.15s;
	}

	.tab-btn:hover { color: #374151; }

	.tab-btn.tab-active {
		color: #667eea;
		border-bottom-color: #667eea;
	}

	.tab-count {
		display: inline-block;
		background: #f3f4f6;
		color: #6b7280;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		min-width: 1.4rem;
		text-align: center;
	}

	.tab-btn.tab-active .tab-count {
		background: #eef2ff;
		color: #667eea;
	}

	/* DataTable sits inside .table-card — remove its own border-radius/shadow */
	.table-card :global(.dt-container) {
		border-radius: 0;
		box-shadow: none;
		animation: none;
	}

	/* Badge styles (used via @html in DataTable render) */
	:global(.badge) {
		display: inline-block;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
	}
	:global(.badge-green)  { background: #dcfce7; color: #166534; }
	:global(.badge-red)    { background: #fee2e2; color: #991b1b; }
	:global(.badge-role)   { background: #e0e7ff; color: #3730a3; text-transform: capitalize; }

	/* Modal form */
	form { display: flex; flex-direction: column; gap: 1.5rem; }

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
	.form-group.full-width { grid-column: 1 / -1; }
	.form-group label { font-weight: 500; color: #333; font-size: 0.875rem; }

	.form-group input,
	.form-group select {
		padding: 0.65rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9rem;
		outline: none;
		transition: border-color 0.15s;
	}

	.form-group input:focus,
	.form-group select:focus { border-color: #667eea; }

	/* SSO profile section */
	.sso-section {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1rem;
	}

	.sso-section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.875rem;
	}

	.sso-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.sso-link {
		font-size: 0.8rem;
		color: #2563eb;
		text-decoration: none;
		font-weight: 500;
	}
	.sso-link:hover { text-decoration: underline; }

	.readonly-field {
		padding: 0.5rem 0.75rem;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.875rem;
		color: #374151;
		min-height: 2.25rem;
		display: flex;
		align-items: center;
	}
	.readonly-field.muted { color: #9ca3af; font-size: 0.8rem; }

	/* OFM settings section */
	.ofm-section {
		padding-top: 0.25rem;
	}

	.ofm-section-header {
		font-size: 0.8rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.checkbox-group label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
	.checkbox-group input[type='checkbox'] { width: auto; }

	/* Roles grouped section */
	.roles-section {
		padding-top: 1.25rem;
		border-top: 1px solid #e2e8f0;
	}

	.roles-section h3 { margin: 0 0 0.75rem; font-size: 0.95rem; font-weight: 600; color: #333; }

	.roles-groups {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.role-group {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
	}

	.role-group-header {
		padding: 0.4rem 0.75rem;
		background: #f3f4f6;
		font-size: 0.72rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-bottom: 1px solid #e5e7eb;
	}

	.role-group-list { display: flex; flex-direction: column; }

	.role-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		transition: background 0.12s;
		border-bottom: 1px solid #f3f4f6;
	}

	.role-row:last-child { border-bottom: none; }
	.role-row:hover { background: #f9fafb; }
	.role-row input[type='checkbox'] { flex-shrink: 0; }

	.role-row-content {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		flex: 1;
		min-width: 0;
	}

	.role-row-name { font-size: 0.875rem; font-weight: 500; color: #111; }
	.role-row-desc { font-size: 0.75rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

	.role-badge {
		flex-shrink: 0;
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
	}
	.role-badge-danger { background: #fee2e2; color: #991b1b; }
	.role-badge-info   { background: #e0e7ff; color: #3730a3; }

	/* Driver section */
	.driver-section {
		padding-top: 1.25rem;
		border-top: 1px solid #fde68a;
		background: #fffbeb;
		border-radius: 8px;
		padding: 1rem;
		border: 1px solid #fde68a;
	}

	.driver-section h3 {
		margin: 0 0 0.75rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: #92400e;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.driver-section h3::before { content: '🚗'; }

	/* Form actions */
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-primary, .btn-secondary {
		padding: 0.65rem 1.25rem;
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

	.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
	.btn-secondary { background: #f3f4f6; color: #333; }
	.btn-secondary:hover { background: #e5e7eb; }

	@media (max-width: 768px) {
		.form-grid { grid-template-columns: 1fr; }
		.roles-groups { grid-template-columns: 1fr; }
		.tabs-bar { padding: 0 0.75rem; }
	}
</style>

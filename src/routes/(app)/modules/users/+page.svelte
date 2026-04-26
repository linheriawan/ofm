<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { User } from '$lib/types';

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
	let existingDriverId: string | null = $state(null); // MongoDB _id of the driver record if exists
	let roles: any[] = $state([]);
	let departments: any[] = $state([]);
	let locations: any[] = $state([]);

	let formData = $state({
		userId: '',
		email: '',
		username: '',
		firstName: '',
		lastName: '',
		phone: '',
		departmentId: '',
		locationId: '',
		roleIds: [] as string[],
		isActive: true
	});

	let driverData = $state({
		licenseNumber: '',
		licenseExpiry: '',
		status: 'available',
		rating: 0
	});

	const isDriver = $derived(formData.roleIds.includes('driver'));

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
		formData = {
			userId: user.userId,
			email: user.email,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			phone: user.phone || '',
			departmentId: user.departmentId || '',
			locationId: user.locationId || '',
			roleIds: normaliseRoleIds(user.roleIds || []),
			isActive: user.isActive
		};

		// Reset driver data
		existingDriverId = null;
		driverData = { licenseNumber: '', licenseExpiry: '', status: 'available', rating: 0 };

		// Fetch existing driver record if user has driver role or was a driver
		try {
			const res = await fetch(`/api/v1/drivers?userId=${(user as any)._id}&limit=1`);
			const json = await res.json();
			const record = json.data?.[0];
			if (record) {
				existingDriverId = record._id;
				driverData = {
					licenseNumber: record.licenseNumber || '',
					licenseExpiry: record.licenseExpiry ? new Date(record.licenseExpiry).toISOString().split('T')[0] : '',
					status: record.status || 'available',
					rating: record.rating ?? 0
				};
			}
		} catch { /* non-critical */ }

		isModalOpen = true;
	}

	function closeModal() { isModalOpen = false; editingUser = null; existingDriverId = null; }

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
			// Save user
			const userRes = await fetch(`/api/v1/users/${(editingUser as any)._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});
			const userResult = await userRes.json();
			if (!userResult.success) { alert(userResult.error || 'Failed to update user'); return; }

			// Sync driver record
			if (isDriver) {
				const driverPayload = {
					...driverData,
					userId: (editingUser as any)._id,
					userName: `${formData.firstName} ${formData.lastName}`.trim() || formData.email,
					companyId: (editingUser as any).companyId || 'IAS',
					locationId: formData.locationId || 'LOC-CGK'
				};
				if (existingDriverId) {
					await fetch(`/api/v1/drivers/${existingDriverId}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(driverPayload)
					});
				} else {
					await fetch('/api/v1/drivers', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(driverPayload)
					});
				}
			} else if (existingDriverId) {
				// Role removed — delete the driver record
				await fetch(`/api/v1/drivers/${existingDriverId}`, { method: 'DELETE' });
			}

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
		<div class="form-grid">
			<div class="form-group full-width">
				<label>User ID</label>
				<input type="text" value={formData.userId} readonly class="readonly-input" />
			</div>

			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" bind:value={formData.email} />
			</div>

			<div class="form-group">
				<label for="username">Username</label>
				<input type="text" id="username" bind:value={formData.username} />
			</div>

			<div class="form-group">
				<label for="firstName">First Name</label>
				<input type="text" id="firstName" bind:value={formData.firstName} />
			</div>

			<div class="form-group">
				<label for="lastName">Last Name</label>
				<input type="text" id="lastName" bind:value={formData.lastName} />
			</div>

			<div class="form-group">
				<label for="phone">Phone</label>
				<input type="tel" id="phone" bind:value={formData.phone} placeholder="+62-811-1111-1111" />
			</div>

			<div class="form-group">
				<label for="departmentId">Department</label>
				<select id="departmentId" bind:value={formData.departmentId}>
					<option value="">— None —</option>
					{#each departments as dept}
						<option value={dept._id}>{dept.name}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="locationId">Location</label>
				<select id="locationId" bind:value={formData.locationId}>
					<option value="">— None —</option>
					{#each locations as loc}
						<option value={loc._id}>{loc.name} — {loc.city}</option>
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

		{#if isDriver}
			<div class="driver-section">
				<h3>Driver Details</h3>
				<div class="form-grid">
					<div class="form-group">
						<label for="licenseNumber">License Number *</label>
						<input
							type="text"
							id="licenseNumber"
							bind:value={driverData.licenseNumber}
							placeholder="e.g. SIM-12345678"
							required
						/>
					</div>

					<div class="form-group">
						<label for="licenseExpiry">License Expiry *</label>
						<input
							type="date"
							id="licenseExpiry"
							bind:value={driverData.licenseExpiry}
							required
						/>
					</div>

					<div class="form-group">
						<label for="driverStatus">Driver Status</label>
						<select id="driverStatus" bind:value={driverData.status}>
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
							bind:value={driverData.rating}
							min="0"
							max="5"
							step="0.1"
						/>
					</div>
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

	.readonly-input { background: #f9fafb; color: #6b7280; cursor: default; }

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

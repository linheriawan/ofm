<script lang="ts">
	import { onMount } from 'svelte';

	let title = 'Voucher Management - OFM';
	let activeTab = $state('list'); // 'list' | 'import' | 'reconcile'

	// Statistics
	let stats = $state({
		total: 0,
		available: 0,
		used: 0,
		expired: 0,
		byProvider: []
	});

	// Voucher List
	let vouchers: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let limit = $state(50);

	// Filters
	let statusFilter = $state('');
	let providerFilter = $state('');
	let billingMonthFilter = $state('');

	// Import
	let importFile: File | null = $state(null);
	let importing = $state(false);
	let importResult: any = null;
	let transportCompanies: any[] = $state([]);
	let selectedCompany = $state('');

	// Export
	let exporting = $state(false);
	let exportBillingMonth = $state('');
	let exportProvider = $state('');

	onMount(() => {
		fetchStats();
		fetchVouchers();
		fetchTransportCompanies();
	});

	async function fetchStats() {
		try {
			const response = await fetch('/api/v1/vouchers/stats');
			const result = await response.json();
			if (result.success) {
				stats = result.data;
			}
		} catch (err) {
			console.error('Error fetching stats:', err);
		}
	}

	async function fetchVouchers() {
		loading = true;
		error = '';
		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: limit.toString()
			});

			if (statusFilter) params.append('status', statusFilter);
			if (providerFilter) params.append('provider', providerFilter);
			if (billingMonthFilter) params.append('billingMonth', billingMonthFilter);

			const response = await fetch(`/api/v1/vouchers?${params}`);
			const result = await response.json();

			if (result.success) {
				vouchers = result.data;
				totalPages = Math.ceil((result.meta?.total || 0) / limit);
			} else {
				error = result.error?.message || 'Failed to load vouchers';
			}
		} catch (err) {
			error = 'Failed to connect to server';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function fetchTransportCompanies() {
		try {
			const response = await fetch('/api/v1/transport-companies');
			const result = await response.json();
			if (result.success) {
				transportCompanies = result.data.filter((c: any) => c.isActive);
			}
		} catch (err) {
			console.error('Error fetching companies:', err);
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			importFile = target.files[0];
		}
	}

	async function handleImport() {
		if (!importFile || !selectedCompany) {
			alert('Please select a file and transport company');
			return;
		}

		importing = true;
		importResult = null;

		try {
			const formData = new FormData();
			formData.append('file', importFile);
			formData.append('transportCompanyId', selectedCompany);

			const response = await fetch('/api/v1/vouchers/import', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			importResult = result;

			if (result.success) {
				// Refresh stats and list
				fetchStats();
				fetchVouchers();
			}
		} catch (err: any) {
			importResult = {
				success: false,
				errors: [err.message || 'Import failed']
			};
		} finally {
			importing = false;
		}
	}

	async function handleExport() {
		exporting = true;
		try {
			const params = new URLSearchParams();
			if (exportBillingMonth) params.append('billingMonth', exportBillingMonth);
			if (exportProvider) params.append('provider', exportProvider);

			const response = await fetch(`/api/v1/vouchers/export?${params}`);
			const result = await response.json();

			if (result.success) {
				// Download CSV
				const blob = new Blob([result.data.csv], { type: 'text/csv' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = result.data.filename;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				alert(result.error?.message || 'Export failed');
			}
		} catch (err) {
			alert('Export failed');
			console.error(err);
		} finally {
			exporting = false;
		}
	}

	function applyFilters() {
		currentPage = 1;
		fetchVouchers();
	}

	function clearFilters() {
		statusFilter = '';
		providerFilter = '';
		billingMonthFilter = '';
		currentPage = 1;
		fetchVouchers();
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			fetchVouchers();
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			fetchVouchers();
		}
	}

	function formatDate(date: Date | string | undefined): string {
		if (!date) return '-';
		return new Date(date).toLocaleString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			available: 'green',
			used: 'blue',
			expired: 'red'
		};
		return colors[status] || 'gray';
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="vouchers-page">
	<div class="page-header">
		<h1>Voucher Management</h1>
	</div>

	<!-- Statistics Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-label">Total Vouchers</div>
			<div class="stat-value">{stats.total}</div>
		</div>
		<div class="stat-card green">
			<div class="stat-label">Available</div>
			<div class="stat-value">{stats.available}</div>
		</div>
		<div class="stat-card blue">
			<div class="stat-label">Used</div>
			<div class="stat-value">{stats.used}</div>
		</div>
		<div class="stat-card red">
			<div class="stat-label">Expired</div>
			<div class="stat-value">{stats.expired}</div>
		</div>
	</div>

	<!-- By Provider Stats -->
	{#if stats.byProvider.length > 0}
		<div class="provider-stats">
			{#each stats.byProvider as provider}
				<div class="provider-card">
					<h3>{provider._id.toUpperCase()}</h3>
					<div class="provider-breakdown">
						<span>Total: {provider.total}</span>
						<span class="available">Available: {provider.available}</span>
						<span class="used">Used: {provider.used}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Tabs -->
	<div class="tabs">
		<button
			class="tab {activeTab === 'list' ? 'active' : ''}"
			onclick={() => (activeTab = 'list')}
		>
			Voucher List
		</button>
		<button
			class="tab {activeTab === 'import' ? 'active' : ''}"
			onclick={() => (activeTab = 'import')}
		>
			Import Vouchers
		</button>
		<button
			class="tab {activeTab === 'reconcile' ? 'active' : ''}"
			onclick={() => (activeTab = 'reconcile')}
		>
			Export for Reconciliation
		</button>
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'list'}
			<!-- Filters -->
			<div class="filters-card">
				<h3>Filters</h3>
				<div class="filters-grid">
					<div class="filter-group">
						<label for="status">Status</label>
						<select id="status" bind:value={statusFilter}>
							<option value="">All</option>
							<option value="available">Available</option>
							<option value="used">Used</option>
							<option value="expired">Expired</option>
						</select>
					</div>

					<div class="filter-group">
						<label for="provider">Provider</label>
						<select id="provider" bind:value={providerFilter}>
							<option value="">All</option>
							<option value="gojek">Gojek</option>
							<option value="grab">Grab</option>
						</select>
					</div>

					<div class="filter-group">
						<label for="billingMonth">Billing Month</label>
						<input type="month" id="billingMonth" bind:value={billingMonthFilter} />
					</div>

					<div class="filter-actions">
						<button onclick={applyFilters} class="btn-apply">Apply</button>
						<button onclick={clearFilters} class="btn-clear">Clear</button>
					</div>
				</div>
			</div>

			<!-- Voucher Table -->
			<div class="table-card">
				{#if loading}
					<div class="loading">Loading vouchers...</div>
				{:else if error}
					<div class="error">{error}</div>
				{:else if vouchers.length === 0}
					<div class="no-data">No vouchers found</div>
				{:else}
					<table>
						<thead>
							<tr>
								<th>Voucher Code</th>
								<th>Provider</th>
								<th>Status</th>
								<th>Billing Month</th>
								<th>Used At</th>
								<th>Used By</th>
								<th>Actual Price</th>
								<th>Billed At</th>
							</tr>
						</thead>
						<tbody>
							{#each vouchers as voucher}
								<tr>
									<td class="voucher-code">{voucher.voucherCode}</td>
									<td>
										<span class="badge-provider">{voucher.provider.toUpperCase()}</span>
									</td>
									<td>
										<span class="status-badge {getStatusColor(voucher.status)}">
											{voucher.status}
										</span>
									</td>
									<td>{voucher.billingMonth}</td>
									<td>{formatDate(voucher.usedAt)}</td>
									<td>{voucher.usedBy || '-'}</td>
									<td>
										{#if voucher.actualPrice}
											Rp {voucher.actualPrice.toLocaleString('id-ID')}
										{:else}
											-
										{/if}
									</td>
									<td>{formatDate(voucher.billedAt)}</td>
								</tr>
							{/each}
						</tbody>
					</table>

					<!-- Pagination -->
					<div class="pagination">
						<div class="pagination-info">
							Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, stats.total)}
							of {stats.total}
						</div>
						<div class="pagination-controls">
							<button onclick={prevPage} disabled={currentPage === 1}>Previous</button>
							<span>Page {currentPage} of {totalPages}</span>
							<button onclick={nextPage} disabled={currentPage === totalPages}>Next</button>
						</div>
					</div>
				{/if}
			</div>
		{:else if activeTab === 'import'}
			<div class="import-card">
				<h3>Import Voucher Codes from CSV</h3>

				<div class="info-box">
					<span class="info-icon">💡</span>
					<div>
						<strong>How to import:</strong>
						<ol>
							<li>Select the transport company (Gojek, Grab, etc.)</li>
							<li>Upload the CSV file containing voucher codes</li>
							<li>System will automatically extract codes and billing month from filename</li>
							<li>Duplicate codes will be skipped</li>
						</ol>
					</div>
				</div>

				<div class="form-group">
					<label for="company">Transport Company *</label>
					<select id="company" bind:value={selectedCompany} required>
						<option value="">Select Company</option>
						{#each transportCompanies as company}
							<option value={company._id}>{company.name}</option>
						{/each}
					</select>
					{#if transportCompanies.length === 0}
						<small class="warning"
							>No active transport companies. <a href="/admin/transport-companies">Add one first</a
							>.</small
						>
					{/if}
				</div>

				<div class="form-group">
					<label for="file">CSV File *</label>
					<input type="file" id="file" accept=".csv" onchange={handleFileSelect} required />
					{#if importFile}
						<small>Selected: {importFile.name}</small>
					{/if}
				</div>

				<button
					onclick={handleImport}
					class="btn-primary"
					disabled={importing || !importFile || !selectedCompany}
				>
					{importing ? 'Importing...' : 'Import Vouchers'}
				</button>

				{#if importResult}
					<div class="import-result {importResult.success ? 'success' : 'error'}">
						{#if importResult.success}
							<h4>✅ Import Successful</h4>
							<p>Imported: {importResult.data.imported} vouchers</p>
							{#if importResult.data.duplicates > 0}
								<p>Skipped duplicates: {importResult.data.duplicates}</p>
							{/if}
						{:else}
							<h4>❌ Import Failed</h4>
							{#each importResult.errors || [] as error}
								<p>{error}</p>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		{:else if activeTab === 'reconcile'}
			<div class="export-card">
				<h3>Export Used Vouchers for Reconciliation</h3>

				<div class="info-box">
					<span class="info-icon">💡</span>
					<div>
						<strong>Reconciliation Process:</strong>
						<ol>
							<li>Export used vouchers for a billing period</li>
							<li>Compare with provider's invoice (Gojek/Grab billing)</li>
							<li>Upload provider's invoice CSV to match prices</li>
							<li>System will update voucher prices for reporting</li>
						</ol>
					</div>
				</div>

				<div class="form-group">
					<label for="exportBillingMonth">Billing Month (optional)</label>
					<input type="month" id="exportBillingMonth" bind:value={exportBillingMonth} />
					<small>Leave empty to export all used vouchers</small>
				</div>

				<div class="form-group">
					<label for="exportProvider">Provider (optional)</label>
					<select id="exportProvider" bind:value={exportProvider}>
						<option value="">All Providers</option>
						<option value="gojek">Gojek</option>
						<option value="grab">Grab</option>
					</select>
				</div>

				<button onclick={handleExport} class="btn-primary" disabled={exporting}>
					{exporting ? 'Exporting...' : 'Export to CSV'}
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.vouchers-page {
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
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		border-left: 4px solid #667eea;
	}

	.stat-card.green {
		border-left-color: #48bb78;
	}

	.stat-card.blue {
		border-left-color: #4299e1;
	}

	.stat-card.red {
		border-left-color: #f56565;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #333;
	}

	.provider-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.provider-card {
		background: white;
		padding: 1rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
	}

	.provider-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		color: #667eea;
	}

	.provider-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
	}

	.provider-breakdown .available {
		color: #48bb78;
	}

	.provider-breakdown .used {
		color: #4299e1;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.tab {
		padding: 0.75rem 1.5rem;
		background: none;
		border: none;
		border-bottom: 3px solid transparent;
		font-weight: 500;
		color: #666;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab:hover {
		color: #667eea;
	}

	.tab.active {
		color: #667eea;
		border-bottom-color: #667eea;
	}

	.tab-content {
		min-height: 400px;
	}

	.filters-card,
	.table-card,
	.import-card,
	.export-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		margin-bottom: 1.5rem;
	}

	.filters-card h3,
	.import-card h3,
	.export-card h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #333;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #555;
	}

	.filter-group select,
	.filter-group input,
	.form-group select,
	.form-group input {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
	}

	.filter-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-apply,
	.btn-clear {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-apply {
		background: #667eea;
		color: white;
	}

	.btn-clear {
		background: #f3f4f6;
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

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	.voucher-code {
		font-family: 'Courier New', monospace;
		font-weight: 600;
		color: #667eea;
	}

	.badge-provider {
		background: #e0e7ff;
		color: #3730a3;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.status-badge.green {
		background: #d1fae5;
		color: #065f46;
	}

	.status-badge.blue {
		background: #dbeafe;
		color: #1e40af;
	}

	.status-badge.red {
		background: #fee2e2;
		color: #991b1b;
	}

	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.pagination-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.pagination-controls button {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		background: white;
		border-radius: 6px;
		cursor: pointer;
	}

	.pagination-controls button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.info-box {
		background: #eff6ff;
		border-left: 4px solid #3b82f6;
		padding: 1rem;
		margin-bottom: 1.5rem;
		border-radius: 8px;
		display: flex;
		gap: 1rem;
		align-items: start;
	}

	.info-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #333;
	}

	.form-group small {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: #666;
	}

	.form-group small.warning {
		color: #f56565;
	}

	.form-group small a {
		color: #667eea;
		text-decoration: underline;
	}

	.import-result {
		margin-top: 1.5rem;
		padding: 1rem;
		border-radius: 8px;
	}

	.import-result.success {
		background: #d1fae5;
		border-left: 4px solid #48bb78;
	}

	.import-result.error {
		background: #fee2e2;
		border-left: 4px solid #f56565;
	}

	.import-result h4 {
		margin: 0 0 0.5rem 0;
	}

	.import-result p {
		margin: 0.25rem 0;
	}

	.loading,
	.error,
	.no-data {
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	.error {
		color: #e53e3e;
	}

	@media (max-width: 768px) {
		.filters-grid {
			grid-template-columns: 1fr;
		}

		.tabs {
			overflow-x: auto;
		}
	}
</style>

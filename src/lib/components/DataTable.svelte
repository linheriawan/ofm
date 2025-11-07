<script lang="ts">
	import { onMount } from 'svelte';

	interface Column {
		key: string;
		label: string;
		sortable?: boolean;
		format?: (value: any, row?: any) => string;
		render?: (value: any, row?: any) => any; // For custom HTML rendering
	}

	interface FilterField {
		key: string;
		label: string;
		type: 'select' | 'text' | 'date' | 'daterange';
		options?: { value: string; label: string }[]; // For select type
		placeholder?: string;
	}

	interface ActionButton {
		label: string;
		class?: string; // CSS class for button styling
		onClick: (item: any) => void;
		show?: (item: any) => boolean; // Conditional visibility
	}

	interface Props {
		title: string;
		columns: Column[];
		apiEndpoint: string;
		filters?: FilterField[];
		actions?: ActionButton[];
		onEdit?: (item: any) => void;
		onDelete?: (item: any) => void;
		onAdd?: () => void;
		addButtonLabel?: string;
	}

	let {
		title,
		columns,
		apiEndpoint,
		filters = [],
		actions = [],
		onEdit,
		onDelete,
		onAdd,
		addButtonLabel = 'Add New'
	}: Props = $props();

	let data: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	let limit = $state(10);

	// Filter values state
	let filterValues: Record<string, any> = $state({});

	// Initialize filter values
	onMount(() => {
		filters.forEach((filter) => {
			if (filter.type === 'daterange') {
				filterValues[`${filter.key}_from`] = '';
				filterValues[`${filter.key}_to`] = '';
			} else {
				filterValues[filter.key] = '';
			}
		});
		fetchData();
	});

	async function fetchData() {
		loading = true;
		error = '';

		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: limit.toString()
			});

			// Add filter parameters
			Object.entries(filterValues).forEach(([key, value]) => {
				if (value) {
					params.append(key, value);
				}
			});

			const response = await fetch(`${apiEndpoint}?${params}`);
			const result = await response.json();

			if (result.success) {
				data = result.data;
				total = result.meta?.total || result.total || 0;
				totalPages = result.meta?.totalPages || result.totalPages || 1;
			} else {
				error = result.error?.message || result.error || 'Failed to fetch data';
			}
		} catch (err) {
			error = 'Failed to fetch data';
			console.error('Error fetching data:', err);
		} finally {
			loading = false;
		}
	}

	function applyFilters() {
		currentPage = 1;
		fetchData();
	}

	function clearFilters() {
		filters.forEach((filter) => {
			if (filter.type === 'daterange') {
				filterValues[`${filter.key}_from`] = '';
				filterValues[`${filter.key}_to`] = '';
			} else {
				filterValues[filter.key] = '';
			}
		});
		currentPage = 1;
		fetchData();
	}

	async function handleDelete(item: any) {
		if (!confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) {
			return;
		}

		try {
			const response = await fetch(`${apiEndpoint}/${item._id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				await fetchData();
			} else {
				alert(result.error?.message || result.error || 'Failed to delete');
			}
		} catch (err) {
			alert('Failed to delete');
			console.error('Error deleting:', err);
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			fetchData();
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			fetchData();
		}
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			fetchData();
		}
	}

	// Determine if row has any actions
	function hasActions() {
		return onEdit || onDelete || actions.length > 0;
	}

	// Check if specific action should be shown for item
	function shouldShowAction(action: ActionButton, item: any): boolean {
		return action.show ? action.show(item) : true;
	}
</script>

<div class="data-table-container">
	<div class="table-header">
		<h2>{title}</h2>
		{#if onAdd}
			<button class="btn-primary" onclick={onAdd}>
				{addButtonLabel}
			</button>
		{/if}
	</div>

	<!-- Filters Panel -->
	{#if filters.length > 0}
		<div class="filters-panel">
			<div class="filters-grid">
				{#each filters as filter}
					<div class="filter-group">
						<label for={filter.key}>{filter.label}</label>
						{#if filter.type === 'select'}
							<select id={filter.key} bind:value={filterValues[filter.key]}>
								<option value="">All</option>
								{#each filter.options || [] as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						{:else if filter.type === 'daterange'}
							<div class="daterange-inputs">
								<input
									type="date"
									bind:value={filterValues[`${filter.key}_from`]}
									placeholder="From"
								/>
								<span>to</span>
								<input
									type="date"
									bind:value={filterValues[`${filter.key}_to`]}
									placeholder="To"
								/>
							</div>
						{:else if filter.type === 'date'}
							<input type="date" id={filter.key} bind:value={filterValues[filter.key]} />
						{:else}
							<input
								type="text"
								id={filter.key}
								bind:value={filterValues[filter.key]}
								placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}`}
							/>
						{/if}
					</div>
				{/each}
			</div>
			<div class="filter-actions">
				<button class="btn-apply" onclick={applyFilters}>Apply Filters</button>
				<button class="btn-clear" onclick={clearFilters}>Clear</button>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="loading">Loading...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else}
		<div class="table-responsive">
			<table>
				<thead>
					<tr>
						{#each columns as column}
							<th>{column.label}</th>
						{/each}
						{#if hasActions()}
							<th>Actions</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#if data.length === 0}
						<tr>
							<td colspan={columns.length + (hasActions() ? 1 : 0)} class="no-data">
								No data available
							</td>
						</tr>
					{:else}
						{#each data as item}
							<tr>
								{#each columns as column}
									<td>
										{#if column.render}
											{@html column.render(item[column.key], item)}
										{:else if column.format}
											{column.format(item[column.key], item)}
										{:else}
											{item[column.key] || '-'}
										{/if}
									</td>
								{/each}
								{#if hasActions()}
									<td class="actions">
										{#if onEdit}
											<button class="btn-action btn-edit" onclick={() => onEdit && onEdit(item)}>
												Edit
											</button>
										{/if}
										{#each actions as action}
											{#if shouldShowAction(action, item)}
												<button
													class="btn-action {action.class || 'btn-custom'}"
													onclick={() => action.onClick(item)}
												>
													{action.label}
												</button>
											{/if}
										{/each}
										{#if onDelete}
											<button class="btn-action btn-delete" onclick={() => handleDelete(item)}>
												Delete
											</button>
										{/if}
									</td>
								{/if}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<div class="pagination">
			<div class="pagination-info">
				Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total}
				entries
			</div>
			<div class="pagination-controls">
				<button onclick={prevPage} disabled={currentPage === 1}>Previous</button>
				<button onclick={() => goToPage(1)} disabled={currentPage === 1}>First</button>
				<span class="page-number">Page {currentPage} of {totalPages}</span>
				<button onclick={() => goToPage(totalPages)} disabled={currentPage === totalPages}
					>Last</button
				>
				<button onclick={nextPage} disabled={currentPage === totalPages}>Next</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.data-table-container {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

	.table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.table-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
	}

	/* Filters Panel */
	.filters-panel {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		border: 1px solid #e2e8f0;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #555;
	}

	.filter-group select,
	.filter-group input {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		background: white;
	}

	.daterange-inputs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.daterange-inputs input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.daterange-inputs span {
		font-size: 0.875rem;
		color: #666;
	}

	.filter-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
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

	.btn-apply:hover {
		background: #5568d3;
	}

	.btn-clear {
		background: #e5e7eb;
		color: #333;
	}

	.btn-clear:hover {
		background: #d1d5db;
	}

	/* Table Styles */
	.loading,
	.error {
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	.error {
		color: #e53e3e;
	}

	.table-responsive {
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

	.no-data {
		text-align: center;
		color: #999;
		padding: 3rem !important;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.btn-action {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-edit {
		background: #0d6efd;
		color: white;
	}

	.btn-edit:hover {
		background: #0b5ed7;
	}

	.btn-delete {
		background: #dc3545;
		color: white;
	}

	.btn-delete:hover {
		background: #bb2d3b;
	}

	.btn-custom {
		background: #48bb78;
		color: white;
	}

	.btn-custom:hover {
		background: #38a169;
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.pagination-info {
		color: #666;
		font-size: 0.875rem;
	}

	.pagination-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.pagination-controls button {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.pagination-controls button:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #667eea;
	}

	.pagination-controls button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-number {
		font-weight: 500;
		color: #333;
		padding: 0 0.5rem;
	}

	@media (max-width: 768px) {
		.table-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.filters-grid {
			grid-template-columns: 1fr;
		}

		.pagination {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.pagination-controls {
			flex-wrap: wrap;
		}

		.actions {
			flex-direction: column;
		}
	}
</style>

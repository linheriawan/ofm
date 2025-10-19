<script lang="ts">
	import { onMount } from 'svelte';

	interface Column {
		key: string;
		label: string;
		sortable?: boolean;
		format?: (value: any) => string;
	}

	interface Props {
		title: string;
		columns: Column[];
		apiEndpoint: string;
		onEdit?: (item: any) => void;
		onDelete?: (item: any) => void;
		onAdd?: () => void;
	}

	let { title, columns, apiEndpoint, onEdit, onDelete, onAdd }: Props = $props();

	let data: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	let limit = $state(10);

	async function fetchData() {
		loading = true;
		error = '';

		try {
			const response = await fetch(`${apiEndpoint}?page=${currentPage}&limit=${limit}`);
			const result = await response.json();

			if (result.success) {
				data = result.data;
				// Support both meta.total and direct total properties
				total = result.meta?.total || result.total || 0;
				totalPages = result.meta?.totalPages || result.totalPages || 1;
			} else {
				error = result.error || 'Failed to fetch data';
			}
		} catch (err) {
			error = 'Failed to fetch data';
			console.error('Error fetching data:', err);
		} finally {
			loading = false;
		}
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
				alert(result.error || 'Failed to delete');
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

	onMount(() => {
		fetchData();
	});
</script>

<div class="data-table-container">
	<div class="table-header">
		<h2>{title}</h2>
		{#if onAdd}
			<button class="btn-primary" onclick={onAdd}>
				Add New
			</button>
		{/if}
	</div>

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
						{#if onEdit || onDelete}
							<th>Actions</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#if data.length === 0}
						<tr>
							<td colspan={columns.length + (onEdit || onDelete ? 1 : 0)} class="no-data">
								No data available
							</td>
						</tr>
					{:else}
						{#each data as item}
							<tr>
								{#each columns as column}
									<td>
										{#if column.format}
											{column.format(item[column.key])}
										{:else}
											{item[column.key] || '-'}
										{/if}
									</td>
								{/each}
								{#if onEdit || onDelete}
									<td class="actions">
										{#if onEdit}
											<button class="btn-edit" onclick={() => onEdit && onEdit(item)}>
												Edit
											</button>
										{/if}
										{#if onDelete}
											<button class="btn-delete" onclick={() => handleDelete(item)}>
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
				Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total} entries
			</div>
			<div class="pagination-controls">
				<button onclick={prevPage} disabled={currentPage === 1}>
					Previous
				</button>
				<span class="page-number">Page {currentPage} of {totalPages}</span>
				<button onclick={nextPage} disabled={currentPage === totalPages}>
					Next
				</button>
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
	}

	.btn-edit,
	.btn-delete {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-edit {
		background: #48bb78;
		color: white;
	}

	.btn-edit:hover {
		background: #38a169;
	}

	.btn-delete {
		background: #e53e3e;
		color: white;
	}

	.btn-delete:hover {
		background: #c53030;
	}

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
		gap: 1rem;
		align-items: center;
	}

	.pagination-controls button {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
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
	}

	@media (max-width: 768px) {
		.table-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.pagination {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.actions {
			flex-direction: column;
		}
	}
</style>

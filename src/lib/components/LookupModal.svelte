<script lang="ts">
	import Modal from './Modal.svelte';

	interface Column {
		key: string;
		label: string;
		render?: (value: any, row: any) => string;
	}

	interface LookupItem {
		_id: string;
		[key: string]: any;
	}

	interface Props {
		value?: string | null;
		displayValue?: string;
		fetchEndpoint: string;
		columns: Column[];
		placeholder?: string;
		label?: string;
		disabled?: boolean;
		title?: string;
		required?: boolean;
		onSelect: (item: LookupItem | null) => void;
	}

	let {
		value = $bindable(null),
		displayValue = '',
		fetchEndpoint,
		columns,
		placeholder = 'Click to select...',
		label = '',
		disabled = false,
		title = 'Select',
		required = false,
		onSelect
	}: Props = $props();

	let showModal = $state(false);
	let items = $state<LookupItem[]>([]);
	let isLoading = $state(false);
	let searchQuery = $state('');
	let currentPage = $state(1);
	let pageSize = 10;
	let totalItems = $state(0);
	let totalPages = $state(1);

	async function fetchItems() {
		isLoading = true;
		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: pageSize.toString()
			});
			if (searchQuery) params.set('search', searchQuery);

			const sep = fetchEndpoint.includes('?') ? '&' : '?';
			const res = await fetch(`${fetchEndpoint}${sep}${params}`);
			if (res.ok) {
				const json = await res.json();
				if (json.success) {
					items = json.data ?? [];
					totalItems = json.pagination?.total ?? items.length;
					totalPages = json.pagination?.totalPages ?? 1;
				}
			}
		} catch (e) {
			console.error('LookupModal fetch error', e);
		} finally {
			isLoading = false;
		}
	}

	function openModal() {
		if (disabled) return;
		showModal = true;
		currentPage = 1;
		searchQuery = '';
		fetchItems();
	}

	function closeModal() {
		showModal = false;
		items = [];
	}

	function selectItem(item: LookupItem) {
		value = item._id;
		onSelect(item);
		closeModal();
	}

	function clearSelection(e: MouseEvent) {
		e.stopPropagation();
		value = null;
		onSelect(null);
	}

	function getCellValue(item: LookupItem, col: Column): string {
		const raw = item[col.key];
		return col.render ? col.render(raw, item) : (raw ?? '');
	}

	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearch(e: Event) {
		searchQuery = (e.target as HTMLInputElement).value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			currentPage = 1;
			fetchItems();
		}, 300);
	}

	function goToPage(page: number) {
		currentPage = page;
		fetchItems();
	}
</script>

<div class="lookup-field">
	{#if label}
		<label class="lookup-label">{label}{required ? ' *' : ''}</label>
	{/if}
	<div class="lookup-input-wrap" class:disabled>
		<input
			type="text"
			value={displayValue}
			onclick={openModal}
			readonly
			{placeholder}
			{disabled}
			class="lookup-input"
		/>
		<div class="lookup-icons">
			{#if value && displayValue}
				<button type="button" onclick={clearSelection} class="icon-btn" title="Clear">✕</button>
			{/if}
			<button type="button" onclick={openModal} {disabled} class="icon-btn">▼</button>
		</div>
	</div>
</div>

{#if showModal}
	<Modal isOpen={showModal} {title} onClose={closeModal} width="700px">
		<div class="lookup-modal-body">
			<input
				type="text"
				class="lookup-search"
				placeholder="Search..."
				oninput={handleSearch}
			/>

			{#if isLoading}
				<div class="lookup-loading">Loading...</div>
			{:else if items.length === 0}
				<div class="lookup-empty">No items found.</div>
			{:else}
				<div class="lookup-table-wrap">
					<table class="lookup-table">
						<thead>
							<tr>
								{#each columns as col}
									<th>{col.label}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each items as item}
								<tr onclick={() => selectItem(item)} class="lookup-row">
									{#each columns as col}
										<td>{@html getCellValue(item, col)}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if totalPages > 1}
					<div class="lookup-pagination">
						<button onclick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>← Prev</button>
						<span>Page {currentPage} of {totalPages} ({totalItems} total)</span>
						<button onclick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>Next →</button>
					</div>
				{/if}
			{/if}
		</div>
	</Modal>
{/if}

<style>
	.lookup-field { display: flex; flex-direction: column; gap: 0.4rem; }

	.lookup-label { font-size: 0.875rem; font-weight: 500; color: #374151; }

	.lookup-input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.lookup-input {
		width: 100%;
		padding: 0.625rem 2.5rem 0.625rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
		background: white;
		transition: border-color 0.15s;
	}

	.lookup-input:focus { outline: none; border-color: #667eea; }

	.lookup-input-wrap.disabled .lookup-input { background: #f3f4f6; cursor: not-allowed; }

	.lookup-icons {
		position: absolute;
		right: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: #9ca3af;
		font-size: 0.8rem;
		padding: 0.15rem 0.25rem;
		line-height: 1;
	}
	.icon-btn:hover { color: #374151; }

	.lookup-modal-body { display: flex; flex-direction: column; gap: 0.75rem; }

	.lookup-search {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9rem;
	}
	.lookup-search:focus { outline: none; border-color: #667eea; }

	.lookup-loading, .lookup-empty {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
		font-size: 0.9rem;
	}

	.lookup-table-wrap { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 6px; }

	.lookup-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }

	.lookup-table th {
		background: #f9fafb;
		padding: 0.625rem 0.875rem;
		text-align: left;
		font-weight: 600;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
		white-space: nowrap;
	}

	.lookup-table td {
		padding: 0.625rem 0.875rem;
		border-bottom: 1px solid #f3f4f6;
		color: #374151;
	}

	.lookup-row { cursor: pointer; transition: background 0.1s; }
	.lookup-row:hover { background: #eff6ff; }
	.lookup-row:last-child td { border-bottom: none; }

	.lookup-pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.85rem;
		color: #6b7280;
	}

	.lookup-pagination button {
		padding: 0.4rem 0.875rem;
		border: 1px solid #d1d5db;
		border-radius: 5px;
		background: white;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.lookup-pagination button:hover:not(:disabled) { background: #f3f4f6; }
	.lookup-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>

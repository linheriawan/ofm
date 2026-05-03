<script lang="ts" generics="T extends Record<string, any>">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Column<T> {
		key: string;
		label: string;
		sortable?: boolean;
		class?: string;
		format?: (value: any, row?: T) => string;
		render?: (value: any, row?: T) => string;
	}

	interface FilterField {
		key: string;
		label: string;
		type: 'select' | 'text' | 'date' | 'daterange';
		options?: { value: string; label: string }[];
		placeholder?: string;
	}

	interface HeaderAction {
		text: string;
		class?: string;
		action: () => void;
	}

	interface ActionButton {
		label: string;
		class?: string;
		icon?: string;
		onClick: () => void;
	}

	interface Props {
		// Data source — provide either data (external) or apiEndpoint (internal fetch)
		data?: T[];
		apiEndpoint?: string;
		// Display
		title?: string;
		columns: Column<T>[];
		// Filters panel (OFM-style, only used in apiEndpoint mode)
		filters?: FilterField[];
		// Header
		header_actions?: () => HeaderAction[];
		onAdd?: () => void;
		addButtonLabel?: string;
		cssClass?: string;
		// Pagination
		page?: number;
		pageSize?: number;
		totalItems?: number;
		pageSizeOptions?: number[];
		// Search
		searchable?: boolean;
		searchPlaceholder?: string;
		searchKeys?: string[];
		// Sorting
		sortKey?: string;
		sortDirection?: 'asc' | 'desc';
		// Style variants
		striped?: boolean;
		hoverable?: boolean;
		bordered?: boolean;
		compact?: boolean;
		// Actions
		showActions?: boolean;
		actionColumn?: Snippet<[{ row: T }]>;
		actions?: (row: T) => ActionButton[];
		onEdit?: (item: T) => void;
		onDelete?: (item: T) => void;
		onRowClick?: (item: T) => void;
		// Loading / empty
		loading?: boolean;
		emptyMessage?: string;
		// Callbacks for server-side mode
		onPageChange?: (page: number) => void;
		onPageSizeChange?: (pageSize: number) => void;
		onSort?: (event: { key: string; direction: 'asc' | 'desc' }) => void;
		onSearch?: (query: string) => void;
	}

	let {
		data,
		apiEndpoint,
		title,
		columns,
		filters = [],
		header_actions,
		onAdd,
		addButtonLabel = 'Add New',
		cssClass = '',
		page = 1,
		pageSize = 10,
		totalItems = 0,
		pageSizeOptions = [10, 25, 50, 100],
		searchable = true,
		searchPlaceholder = 'Search...',
		searchKeys = [],
		sortKey = $bindable(''),
		sortDirection = $bindable('asc'),
		striped = true,
		hoverable = true,
		bordered = false,
		compact = false,
		showActions = false,
		actionColumn,
		actions,
		onEdit,
		onDelete,
		onRowClick,
		loading: externalLoading = false,
		emptyMessage = 'No data available',
		onPageChange,
		onPageSizeChange,
		onSort,
		onSearch
	}: Props = $props();

	// Internal state for apiEndpoint mode
	let internalData: T[] = $state([]);
	let internalLoading = $state(false);
	let internalError = $state('');
	let internalTotal = $state(0);
	let internalTotalPages = $state(1);
	let internalPage = $state(1);
	let internalPageSize = $state(pageSize);
	let filterValues: Record<string, any> = $state({});

	// Shared state
	let searchQuery = $state('');
	let currentSortKey = $state(sortKey);
	let currentSortDir: 'asc' | 'desc' = $state(sortDirection);

	const isExternalMode = $derived(data !== undefined);
	const effectiveLoading = $derived(isExternalMode ? externalLoading : internalLoading);
	const effectiveData = $derived(isExternalMode ? (data ?? []) : internalData);
	const effectivePage = $derived(isExternalMode ? page : internalPage);
	const effectivePageSize = $derived(isExternalMode ? pageSize : internalPageSize);
	const effectiveTotal = $derived(isExternalMode ? totalItems : internalTotal);

	// Client-side filtering & sort (only for external mode with no server callbacks)
	const filteredData = $derived.by(() => {
		if (!isExternalMode) return effectiveData;
		let result = [...effectiveData];
		if (searchQuery && searchKeys.length > 0 && !onSearch) {
			const q = searchQuery.toLowerCase();
			result = result.filter((item) =>
				searchKeys.some((key) => item[key]?.toString().toLowerCase().includes(q))
			);
		}
		if (currentSortKey && !onSort) {
			result.sort((a, b) => {
				const av = a[currentSortKey];
				const bv = b[currentSortKey];
				if (av === bv) return 0;
				const cmp = av > bv ? 1 : -1;
				return currentSortDir === 'asc' ? cmp : -cmp;
			});
		}
		return result;
	});

	const effectiveTotalFiltered = $derived(
		isExternalMode && totalItems > 0 ? totalItems : !isExternalMode && internalTotal > 0 ? internalTotal : filteredData.length
	);
	const effectiveTotalPages = $derived(
		isExternalMode && totalItems > 0
			? Math.ceil(totalItems / effectivePageSize)
			: isExternalMode
				? Math.ceil(filteredData.length / effectivePageSize)
				: internalTotalPages
	);

	const paginatedData = $derived.by(() => {
		if (!isExternalMode) return effectiveData;
		if (totalItems > 0) return filteredData; // server handles pagination
		const start = (effectivePage - 1) * effectivePageSize;
		return filteredData.slice(start, start + effectivePageSize);
	});

	const startItem = $derived((effectivePage - 1) * effectivePageSize + 1);
	const endItem = $derived(Math.min(effectivePage * effectivePageSize, effectiveTotalFiltered));

	const hasActions = $derived(
		(showActions || !!actionColumn || !!actions || !!onEdit || !!onDelete) && !onRowClick
	);

	// Init filter values + fetch for apiEndpoint mode
	onMount(() => {
		filters.forEach((f) => {
			if (f.type === 'daterange') {
				filterValues[`${f.key}_from`] = '';
				filterValues[`${f.key}_to`] = '';
			} else {
				filterValues[f.key] = '';
			}
		});
		if (apiEndpoint) fetchData();
	});

	async function fetchData() {
		internalLoading = true;
		internalError = '';
		try {
			const params = new URLSearchParams({
				page: internalPage.toString(),
				limit: internalPageSize.toString()
			});
			if (searchQuery) params.append('search', searchQuery);
			if (currentSortKey) {
				params.append('sortKey', currentSortKey);
				params.append('sortDirection', currentSortDir);
			}
			Object.entries(filterValues).forEach(([k, v]) => { if (v) params.append(k, v); });

			const res = await fetch(`${apiEndpoint}?${params}`);
			const json = await res.json();
			if (json.success) {
				internalData = json.data ?? [];
				internalTotal = json.meta?.total ?? json.total ?? json.pagination?.total ?? internalData.length;
				internalTotalPages = json.meta?.totalPages ?? json.totalPages ?? json.pagination?.totalPages ?? 1;
			} else {
				internalError = json.error?.message ?? json.error ?? 'Failed to fetch data';
			}
		} catch {
			internalError = 'Failed to fetch data';
		} finally {
			internalLoading = false;
		}
	}

	async function handleDeleteInternal(item: T) {
		if (!confirm(`Are you sure you want to delete this item?`)) return;
		try {
			const res = await fetch(`${apiEndpoint}/${(item as any)._id}`, { method: 'DELETE' });
			const json = await res.json();
			if (json.success) await fetchData();
			else alert(json.error?.message ?? json.error ?? 'Failed to delete');
		} catch {
			alert('Failed to delete');
		}
	}

	function handleDeleteRow(item: T) {
		if (onDelete) onDelete(item);
		else if (apiEndpoint) handleDeleteInternal(item);
	}

	function applyFilters() { internalPage = 1; fetchData(); }
	function clearFilters() {
		filters.forEach((f) => {
			if (f.type === 'daterange') { filterValues[`${f.key}_from`] = ''; filterValues[`${f.key}_to`] = ''; }
			else filterValues[f.key] = '';
		});
		internalPage = 1;
		fetchData();
	}

	function goToPage(p: number) {
		if (p < 1 || p > effectiveTotalPages) return;
		if (isExternalMode) {
			onPageChange?.(p);
		} else {
			internalPage = p;
			fetchData();
		}
	}

	function changePageSize(s: number) {
		if (isExternalMode) {
			onPageSizeChange?.(s);
		} else {
			internalPageSize = s;
			internalPage = 1;
			fetchData();
		}
	}

	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			if (onSearch) {
				onSearch(searchQuery);
			} else if (!isExternalMode) {
				internalPage = 1;
				fetchData();
			}
		}, 300);
	}

	function handleSort(col: Column<T>) {
		if (!col.sortable) return;
		if (currentSortKey === col.key) {
			currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
		} else {
			currentSortKey = col.key;
			currentSortDir = 'asc';
		}
		sortKey = currentSortKey;
		sortDirection = currentSortDir;
		if (onSort) onSort({ key: currentSortKey, direction: currentSortDir });
		else if (!isExternalMode) fetchData();
	}

	function getCellValue(row: T, col: Column<T>): string {
		const val = row[col.key];
		if (col.render) return col.render(val, row);
		if (col.format) return col.format(val, row) ?? '-';
		return val?.toString() ?? '-';
	}

	// Sync external props for page (server-side)
	$effect(() => { if (!isExternalMode) internalPageSize = pageSize; });

	// Visible page numbers (up to 5 around current)
	const visiblePages = $derived.by(() => {
		const total = effectiveTotalPages;
		const cur = effectivePage;
		const start = Math.max(1, Math.min(cur - 2, total - 4));
		return Array.from({ length: Math.min(5, total) }, (_, i) => start + i).filter(p => p <= total);
	});
</script>

<div class="dt-container {cssClass}">
	<!-- Header row -->
	<div class="dt-header-row">
		<div class="dt-header-left">
			{#if title}
				<h2 class="dt-title">{title}</h2>
			{/if}
			{#if searchable}
				<div class="dt-search-wrap">
					<svg class="dt-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<input
						type="text"
						bind:value={searchQuery}
						oninput={handleSearchInput}
						placeholder={searchPlaceholder}
						class="dt-search-input"
					/>
				</div>
			{/if}
		</div>
		<div class="dt-header-right">
			{#if header_actions}
				{#each header_actions() as ha}
					<button onclick={ha.action} class="dt-ha-btn {ha.class ?? ''}">{ha.text}</button>
				{/each}
			{:else if onAdd}
				<button class="dt-btn-primary" onclick={onAdd}>{addButtonLabel}</button>
			{/if}
		</div>
	</div>

	<!-- Filters Panel (apiEndpoint mode) -->
	{#if filters.length > 0}
		<div class="dt-filters-panel">
			<div class="dt-filters-grid">
				{#each filters as filter}
					<div class="dt-filter-group">
						<label for={filter.key}>{filter.label}</label>
						{#if filter.type === 'select'}
							<select id={filter.key} bind:value={filterValues[filter.key]}>
								<option value="">All</option>
								{#each filter.options ?? [] as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						{:else if filter.type === 'daterange'}
							<div class="dt-daterange">
								<input type="date" bind:value={filterValues[`${filter.key}_from`]} />
								<span>to</span>
								<input type="date" bind:value={filterValues[`${filter.key}_to`]} />
							</div>
						{:else if filter.type === 'date'}
							<input type="date" id={filter.key} bind:value={filterValues[filter.key]} />
						{:else}
							<input type="text" id={filter.key} bind:value={filterValues[filter.key]} placeholder={filter.placeholder ?? `Filter by ${filter.label.toLowerCase()}`} />
						{/if}
					</div>
				{/each}
			</div>
			<div class="dt-filter-actions">
				<button class="dt-btn-apply" onclick={applyFilters}>Apply Filters</button>
				<button class="dt-btn-clear" onclick={clearFilters}>Clear</button>
			</div>
		</div>
	{/if}

	<!-- Error -->
	{#if internalError}
		<div class="dt-error">{internalError}</div>
	{/if}

	<!-- Table -->
	<div class="dt-table-wrap">
		<table class:dt-striped={striped} class:dt-hoverable={hoverable} class:dt-bordered={bordered} class:dt-compact={compact}>
			<thead>
				<tr>
					{#each columns as col}
						<th
							class={col.class ?? ''}
							class:dt-sortable={col.sortable}
							onclick={() => handleSort(col)}
						>
							<span>{col.label}</span>
							{#if col.sortable}
								<span class="dt-sort-icon">
									{#if currentSortKey === col.key}
										{currentSortDir === 'asc' ? '↑' : '↓'}
									{:else}↕{/if}
								</span>
							{/if}
						</th>
					{/each}
					{#if hasActions}
						<th class="dt-actions-th">Actions</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#if effectiveLoading}
					<tr>
						<td colspan={columns.length + (hasActions ? 1 : 0)} class="dt-loading-cell">
							<div class="dt-spinner"></div>
							<span>Loading...</span>
						</td>
					</tr>
				{:else if paginatedData.length === 0}
					<tr>
						<td colspan={columns.length + (hasActions ? 1 : 0)} class="dt-empty-cell">
							<svg class="dt-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
							</svg>
							<p>{emptyMessage}</p>
						</td>
					</tr>
				{:else}
					{#each paginatedData as row, i (i)}
						<tr
							class:dt-clickable={!!onRowClick}
							onclick={() => onRowClick?.(row)}
						>
							{#each columns as col}
								<td class={col.class ?? ''}>{@html getCellValue(row, col)}</td>
							{/each}
							{#if hasActions}
								<td class="dt-actions-td">
									{#if actionColumn}
										{@render actionColumn({ row })}
									{:else if actions}
										{#each actions(row) as action}
											<button
												type="button"
												onclick={action.onClick}
												class="dt-action-btn {action.class ?? 'dt-action-custom'}"
											>
												{#if action.icon}<span>{action.icon}</span>{/if}
												{action.label}
											</button>
										{/each}
									{:else}
										{#if onEdit}
											<button type="button" class="dt-icon-btn dt-icon-edit" onclick={() => onEdit?.(row)} title="Edit" aria-label="Edit">
												<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
											</button>
										{/if}
										{#if onDelete}
											<button type="button" class="dt-icon-btn dt-icon-delete" onclick={() => handleDeleteRow(row)} title="Delete" aria-label="Delete">
												<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										{/if}
									{/if}
								</td>
							{/if}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if !effectiveLoading && (effectiveTotalFiltered > 0 || effectiveTotalPages > 1)}
		<div class="dt-pagination">
			<div class="dt-page-size-row">
				<span>Show:</span>
				<select
					value={effectivePageSize}
					onchange={(e) => changePageSize(Number((e.target as HTMLSelectElement).value))}
					aria-label="Items per page"
				>
					{#each pageSizeOptions as s}
						<option value={s}>{s}</option>
					{/each}
				</select>
				<span class="dt-page-info">
					{startItem}–{endItem} of {effectiveTotalFiltered}
				</span>
			</div>
			<div class="dt-page-btns">
				<button onclick={() => goToPage(1)} disabled={effectivePage === 1} title="First">«</button>
				<button onclick={() => goToPage(effectivePage - 1)} disabled={effectivePage === 1} title="Previous">‹</button>
				{#each visiblePages as p}
					<button
						onclick={() => goToPage(p)}
						class:dt-page-active={effectivePage === p}
					>{p}</button>
				{/each}
				<button onclick={() => goToPage(effectivePage + 1)} disabled={effectivePage === effectiveTotalPages} title="Next">›</button>
				<button onclick={() => goToPage(effectiveTotalPages)} disabled={effectivePage === effectiveTotalPages} title="Last">»</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.dt-container {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		animation: dtFadeIn 0.3s ease-in;
	}

	@keyframes dtFadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Header */
	.dt-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}

	.dt-header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
		min-width: 0;
	}

	.dt-header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.dt-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		white-space: nowrap;
	}

	/* Search */
	.dt-search-wrap {
		position: relative;
		flex: 1;
		min-width: 180px;
		max-width: 360px;
	}

	.dt-search-icon {
		position: absolute;
		left: 0.65rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1.1rem;
		height: 1.1rem;
		color: #9ca3af;
		pointer-events: none;
	}

	.dt-search-input {
		width: 100%;
		padding: 0.55rem 0.75rem 0.55rem 2.1rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		outline: none;
		transition: border-color 0.15s;
		box-sizing: border-box;
	}

	.dt-search-input:focus { border-color: #667eea; }

	/* Header action buttons */
	.dt-ha-btn {
		cursor: pointer;
		border: none;
		background: none;
		font-size: 0.9rem;
	}

	.dt-btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.6rem 1.25rem;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		font-size: 0.875rem;
		transition: transform 0.2s;
	}

	.dt-btn-primary:hover { transform: translateY(-1px); }

	/* Filters panel */
	.dt-filters-panel {
		background: #f9fafb;
		padding: 1.25rem;
		border-radius: 8px;
		margin-bottom: 1.25rem;
		border: 1px solid #e2e8f0;
	}

	.dt-filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.dt-filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.dt-filter-group label { font-size: 0.8rem; font-weight: 500; color: #555; }

	.dt-filter-group select,
	.dt-filter-group input {
		padding: 0.6rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		background: white;
		outline: none;
	}

	.dt-filter-group select:focus,
	.dt-filter-group input:focus { border-color: #667eea; }

	.dt-daterange {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.dt-daterange input { flex: 1; }
	.dt-daterange span { font-size: 0.8rem; color: #666; }

	.dt-filter-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.dt-btn-apply, .dt-btn-clear {
		padding: 0.6rem 1.25rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.dt-btn-apply { background: #667eea; color: white; }
	.dt-btn-apply:hover { background: #5568d3; }
	.dt-btn-clear { background: #e5e7eb; color: #333; }
	.dt-btn-clear:hover { background: #d1d5db; }

	/* Error */
	.dt-error {
		color: #e53e3e;
		text-align: center;
		padding: 1.5rem;
		font-size: 0.9rem;
	}

	/* Table */
	.dt-table-wrap {
		overflow-x: auto;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	thead { background: #f9fafb; }

	th {
		padding: 0.75rem 1rem;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e2e8f0;
		text-align: left;
		white-space: nowrap;
	}

	th.dt-sortable {
		cursor: pointer;
		user-select: none;
	}

	th.dt-sortable:hover { background: #f3f4f6; }

	.dt-sort-icon {
		margin-left: 0.3rem;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f3f4f6;
		color: #374151;
		vertical-align: middle;
	}

	table.dt-striped tbody tr:nth-child(even) { background: #f9fafb; }
	table.dt-hoverable tbody tr:hover { background: #f3f4f6; }
	table.dt-bordered th, table.dt-bordered td { border: 1px solid #e5e7eb; }
	table.dt-compact th, table.dt-compact td { padding: 0.5rem 0.75rem; }

	tr.dt-clickable { cursor: pointer; }
	tbody tr:last-child td { border-bottom: none; }

	/* Loading & empty */
	.dt-loading-cell, .dt-empty-cell {
		text-align: center;
		padding: 3rem 1rem;
		color: #6b7280;
	}

	.dt-loading-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.dt-spinner {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid #e5e7eb;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: dtSpin 0.7s linear infinite;
	}

	@keyframes dtSpin { to { transform: rotate(360deg); } }

	.dt-empty-icon {
		width: 3rem;
		height: 3rem;
		color: #d1d5db;
		margin: 0 auto 0.5rem;
		display: block;
	}

	/* Actions */
	.dt-actions-th { text-align: right; }

	.dt-actions-td {
		text-align: right;
		white-space: nowrap;
	}

	.dt-icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.3rem;
		border-radius: 4px;
		transition: background 0.15s;
		display: inline-flex;
		align-items: center;
	}

	.dt-icon-btn svg { width: 1.1rem; height: 1.1rem; }

	.dt-icon-edit { color: #4f46e5; }
	.dt-icon-edit:hover { background: #eef2ff; }
	.dt-icon-delete { color: #dc2626; }
	.dt-icon-delete:hover { background: #fef2f2; }

	.dt-action-btn {
		padding: 0.35rem 0.75rem;
		border: none;
		border-radius: 5px;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.dt-action-custom { background: #48bb78; color: white; }
	.dt-action-custom:hover { background: #38a169; }

	/* Pagination */
	.dt-pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.dt-page-size-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: #6b7280;
	}

	.dt-page-size-row select {
		padding: 0.35rem 0.6rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.85rem;
		outline: none;
	}

	.dt-page-info { color: #374151; font-weight: 500; }

	.dt-page-btns {
		display: flex;
		gap: 0.3rem;
		align-items: center;
	}

	.dt-page-btns button {
		min-width: 2.25rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.15s;
		color: #374151;
	}

	.dt-page-btns button:hover:not(:disabled) { background: #f3f4f6; border-color: #667eea; }
	.dt-page-btns button:disabled { opacity: 0.4; cursor: not-allowed; }
	.dt-page-btns button.dt-page-active {
		background: #667eea;
		color: white;
		border-color: #667eea;
	}

	@media (max-width: 768px) {
		.dt-header-row { flex-direction: column; align-items: flex-start; }
		.dt-header-left { flex-direction: column; width: 100%; }
		.dt-search-wrap { max-width: 100%; width: 100%; }
		.dt-pagination { flex-direction: column; align-items: flex-start; }
		.dt-filters-grid { grid-template-columns: 1fr; }
	}
</style>

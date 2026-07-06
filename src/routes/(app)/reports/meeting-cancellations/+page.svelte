<script lang="ts">
	import { onMount } from 'svelte';

	let title = 'Meeting Cancellation Report - OFM';

	function toInputDate(date: Date): string {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	const today = new Date();
	let startDate = $state(toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)));
	let endDate = $state(toInputDate(today));

	let rows: { departmentId: string | null; departmentName: string; cancelledCount: number }[] = $state([]);
	let totalCancelled = $state(0);
	let loading = $state(false);
	let errorMessage = $state('');

	async function loadReport() {
		loading = true;
		errorMessage = '';
		try {
			const params = new URLSearchParams({ startDate, endDate });
			const res = await fetch(`/api/v1/reports/meeting-cancellations?${params}`);
			const json = await res.json();
			if (json.success) {
				rows = json.data.departments ?? [];
				totalCancelled = json.data.totalCancelled ?? 0;
			} else {
				errorMessage = json.error?.message || 'Failed to load report';
				rows = [];
				totalCancelled = 0;
			}
		} catch (e) {
			errorMessage = 'Failed to load report';
			rows = [];
			totalCancelled = 0;
		} finally {
			loading = false;
		}
	}

	function handleSubmit(event: Event) {
		event.preventDefault();
		loadReport();
	}

	onMount(loadReport);
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="report-page">
	<div class="header">
		<h1>📊 Meeting Cancellation Report</h1>
		<p class="subtitle">Cancelled meeting bookings grouped by department</p>
	</div>

	<form class="filters" onsubmit={handleSubmit}>
		<div class="filter-group">
			<label for="startDate">From</label>
			<input type="date" id="startDate" bind:value={startDate} required max={endDate} />
		</div>
		<div class="filter-group">
			<label for="endDate">To</label>
			<input type="date" id="endDate" bind:value={endDate} required min={startDate} />
		</div>
		<button type="submit" class="btn-primary" disabled={loading}>
			{loading ? 'Loading…' : 'Apply'}
		</button>
	</form>

	{#if errorMessage}
		<div class="alert-error">{errorMessage}</div>
	{/if}

	<div class="table-card">
		{#if loading}
			<p class="empty-hint">Loading report…</p>
		{:else if rows.length === 0}
			<p class="empty-hint">No cancelled meetings found in this period.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>Department</th>
						<th>Department ID</th>
						<th class="num">Cancellations</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row, i}
						<tr>
							<td>{i + 1}</td>
							<td>{row.departmentName}</td>
							<td class="dept-id">{row.departmentId ?? '-'}</td>
							<td class="num">{row.cancelledCount}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td colspan="3">Total</td>
						<td class="num">{totalCancelled}</td>
					</tr>
				</tfoot>
			</table>
		{/if}
	</div>
</div>

<style>
	.report-page {
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

	.header h1 {
		margin: 0;
		font-size: 1.75rem;
		color: #333;
	}

	.subtitle {
		margin: 0.25rem 0 1.5rem;
		color: #666;
	}

	.filters {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
		background: white;
		border-radius: 12px;
		padding: 1.25rem 1.5rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
	}

	.filter-group input {
		padding: 0.6rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.95rem;
		font-family: inherit;
	}

	.filter-group input:focus {
		outline: none;
		border-color: #667eea;
	}

	.btn-primary {
		padding: 0.65rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		transition: all 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
	}

	.table-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		overflow-x: auto;
	}

	.empty-hint {
		padding: 2rem;
		text-align: center;
		color: #888;
		margin: 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		padding: 0.85rem 1.25rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background: #f9fafb;
		color: #667eea;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	td.dept-id {
		color: #6b7280;
		font-size: 0.85rem;
	}

	.num {
		text-align: right;
	}

	tfoot td {
		font-weight: 700;
		background: #f9fafb;
		border-bottom: none;
	}

	@media (max-width: 768px) {
		.filters {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>

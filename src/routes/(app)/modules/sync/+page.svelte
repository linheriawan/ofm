<script lang="ts">
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';

	let { data, form } = $props();

	let syncing = $state(false);
	let lastSyncTime = $state(data.lastSync ? new Date(data.lastSync) : null);
	let syncLogs = $state<string[]>([]);
	let syncProgress = $state<{
		phase?: string;
		current?: number;
		total?: number;
		created?: number;
		updated?: number;
		deactivated?: number;
		errors?: number;
	}>({});

	// Get webhook URL (only available in browser)
	let webhookUrl = $state('');
	if (browser) {
		webhookUrl = `${window.location.origin}/api/v1/scim/webhook`;
	}

	// Format date
	function formatDate(date: Date | null): string {
		if (!date) return 'Never';
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(date);
	}

	// Time ago helper
	function timeAgo(date: Date | null): string {
		if (!date) return '';
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	// Streaming sync function
	async function startStreamingSync() {
		syncing = true;
		syncLogs = [];
		syncProgress = {};

		try {
			const response = await fetch('/api/v1/sync/stream');
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error('No response body');
			}

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = JSON.parse(line.substring(6));

						// Handle different event types
						if (data.message) {
							syncLogs = [...syncLogs, data.message];
						}

						if (data.phase) {
							syncProgress = data;
						}

						if (data.stats) {
							// Sync complete
							lastSyncTime = new Date();
						}
					}
				}
			}

			alert('✅ Synchronization completed successfully!');
		} catch (error) {
			console.error('Sync failed:', error);
			syncLogs = [...syncLogs, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`];
			alert(`❌ Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			syncing = false;
		}
	}
</script>

<svelte:head>
	<title>Data Synchronization - OFM</title>
</svelte:head>

<div class="sync-page">
	<div class="header">
		<h1>Data Synchronization</h1>
		<p class="subtitle">Sync organizational data from Aksara SSO using SCIM 2.0</p>
	</div>

	<div class="content-card">
		<!-- Connection Status -->
		<div class="status-section">
			<h3>🔌 Connection Status</h3>
			{#if data.scimConfigured}
				{#if data.connectionStatus.success}
					<div class="status-box success">
						<div class="status-icon">✅</div>
						<div class="status-content">
							<h4>Connected to Aksara SSO</h4>
							<p>{data.connectionStatus.message}</p>
							{#if data.connectionStatus.details}
								<ul class="details">
									<li>Bulk Operations: {data.connectionStatus.details.supportsBulk ? '✅' : '❌'}</li>
									<li>Advanced Filtering: {data.connectionStatus.details.supportsFilter ? '✅' : '❌'}</li>
									<li>Max Results: {data.connectionStatus.details.maxResults || 'N/A'}</li>
								</ul>
							{/if}
						</div>
					</div>
				{:else}
					<div class="status-box error">
						<div class="status-icon">❌</div>
						<div class="status-content">
							<h4>Connection Failed</h4>
							<p>{data.connectionStatus.message}</p>
							<p class="hint">Check your SCIM credentials in .env file</p>
						</div>
					</div>
				{/if}
			{:else}
				<div class="status-box warning">
					<div class="status-icon">⚠️</div>
					<div class="status-content">
						<h4>SCIM Not Configured</h4>
						<p>Set SCIM_CLIENT_ID and SCIM_CLIENT_SECRET in your .env file</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Last Sync Info -->
		<div class="sync-info">
			<h3>📊 Sync Status</h3>
			<div class="sync-grid">
				<div class="info-item">
					<label>Last Sync</label>
					<div class="value">
						{formatDate(lastSyncTime)}
						{#if lastSyncTime}
							<span class="time-ago">({timeAgo(lastSyncTime)})</span>
						{/if}
					</div>
				</div>
				<div class="info-item">
					<label>Status</label>
					<div class="value">
						{#if data.lastSyncStatus === 'success'}
							<span class="badge success">Success</span>
						{:else if data.lastSyncStatus === 'failed'}
							<span class="badge error">Failed</span>
						{:else}
							<span class="badge neutral">Never Synced</span>
						{/if}
					</div>
				</div>
			</div>

			{#if data.lastSyncStats}
				<div class="stats-grid">
					<div class="stat-card">
						<div class="stat-label">Users Created</div>
						<div class="stat-value">{data.lastSyncStats.usersCreated}</div>
					</div>
					<div class="stat-card">
						<div class="stat-label">Users Updated</div>
						<div class="stat-value">{data.lastSyncStats.usersUpdated}</div>
					</div>
					<div class="stat-card">
						<div class="stat-label">Users Deactivated</div>
						<div class="stat-value">{data.lastSyncStats.usersDeactivated}</div>
					</div>
					<div class="stat-card">
						<div class="stat-label">Org Units Created</div>
						<div class="stat-value">{data.lastSyncStats.orgUnitsCreated}</div>
					</div>
					<div class="stat-card">
						<div class="stat-label">Org Units Updated</div>
						<div class="stat-value">{data.lastSyncStats.orgUnitsUpdated}</div>
					</div>
					<div class="stat-card">
						<div class="stat-label">Errors</div>
						<div class="stat-value error">{data.lastSyncStats.errors?.length || 0}</div>
					</div>
				</div>
			{/if}

			{#if data.lastSyncError}
				<div class="error-box">
					<strong>Error:</strong> {data.lastSyncError}
				</div>
			{/if}
		</div>

		<!-- Sync Actions -->
		<div class="actions-section">
			<h3>⚡ Actions</h3>

			<button
				onclick={startStreamingSync}
				class="btn-primary"
				disabled={syncing || !data.scimConfigured || !data.connectionStatus.success}
			>
				{#if syncing}
					🔄 Syncing...
				{:else}
					🔄 Sync All Data
				{/if}
			</button>

			<p class="hint">
				This will fetch all users and organizational units from Aksara SSO and update the local
				database.
			</p>

			<!-- Progress Display -->
			{#if syncing && syncProgress.phase}
				<div class="progress-box">
					<h4>📊 Progress</h4>
					{#if syncProgress.current && syncProgress.total}
						<div class="progress-bar">
							<div
								class="progress-fill"
								style="width: {(syncProgress.current / syncProgress.total) * 100}%"
							></div>
						</div>
						<p class="progress-text">
							{syncProgress.current} / {syncProgress.total}
							{#if syncProgress.created !== undefined}
								({syncProgress.created} created, {syncProgress.updated} updated{#if syncProgress.deactivated}, {syncProgress.deactivated} deactivated{/if})
							{/if}
						</p>
					{/if}
				</div>
			{/if}

			<!-- Live Logs -->
			{#if syncLogs.length > 0}
				<div class="logs-box">
					<h4>📝 Live Logs</h4>
					<div class="logs-content">
						{#each syncLogs as log}
							<div class="log-line">{log}</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Info Boxes -->
		<div class="info-boxes">
			<div class="info-box">
				<div class="info-icon">💡</div>
				<div class="info-text">
					<h4>About SCIM Synchronization</h4>
					<p>
						SCIM (System for Cross-domain Identity Management) is an industry-standard protocol for
						automatic user provisioning. This integration provides:
					</p>
					<ul>
						<li>One-click synchronization of all organizational data</li>
						<li>Real-time updates via webhooks (when configured)</li>
						<li>Automatic user activation/deactivation</li>
						<li>Hierarchical organizational structure sync</li>
					</ul>
				</div>
			</div>

			<div class="info-box webhook">
				<div class="info-icon">🔔</div>
				<div class="info-text">
					<h4>Real-Time Webhooks</h4>
					<p>For instant updates, register this webhook URL in Aksara SSO admin console:</p>
					<code class="webhook-url">
						{webhookUrl || 'http://localhost:5074/api/v1/scim/webhook'}
					</code>
					<p class="hint">
						Set SCIM_WEBHOOK_SECRET in .env for webhook signature verification
					</p>
				</div>
			</div>

			<div class="info-box schedule">
				<div class="info-icon">⏰</div>
				<div class="info-text">
					<h4>Scheduled Sync (Coming Soon)</h4>
					<p>
						For production use, set up automatic periodic synchronization every 6-12 hours using
						cron jobs or Node.js scheduler.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.sync-page {
		animation: fadeIn 0.3s ease-in;
		max-width: 1200px;
		margin: 0 auto;
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

	.header {
		margin-bottom: 2rem;
	}

	.header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin: 0.5rem 0 0 0;
	}

	.content-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.status-section h3,
	.sync-info h3,
	.actions-section h3 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1.2rem;
	}

	.status-box {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		border-radius: 8px;
		border: 2px solid;
	}

	.status-box.success {
		background: #d1fae5;
		border-color: #10b981;
	}

	.status-box.error {
		background: #fee2e2;
		border-color: #ef4444;
	}

	.status-box.warning {
		background: #fef3c7;
		border-color: #f59e0b;
	}

	.status-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.status-content h4 {
		margin: 0 0 0.5rem 0;
	}

	.status-content p {
		margin: 0 0 0.5rem 0;
		color: #666;
	}

	.status-content .hint {
		font-size: 0.9rem;
		font-style: italic;
		color: #888;
	}

	.details {
		margin: 0.5rem 0 0 0;
		padding-left: 1.5rem;
		font-size: 0.9rem;
	}

	.sync-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.info-item label {
		display: block;
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.25rem;
	}

	.info-item .value {
		font-size: 1.125rem;
		font-weight: 500;
		color: #333;
	}

	.time-ago {
		font-size: 0.875rem;
		color: #666;
		font-weight: 400;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.badge.success {
		background: #10b981;
		color: white;
	}

	.badge.error {
		background: #ef4444;
		color: white;
	}

	.badge.neutral {
		background: #6b7280;
		color: white;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.stat-card {
		background: #f9fafb;
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #333;
	}

	.stat-value.error {
		color: #ef4444;
	}

	.error-box {
		margin-top: 1rem;
		padding: 1rem;
		background: #fee2e2;
		border: 1px solid #ef4444;
		border-radius: 6px;
		color: #991b1b;
		font-size: 0.9rem;
	}

	.progress-box,
	.logs-box {
		margin-top: 1.5rem;
		padding: 1.5rem;
		background: #f9fafb;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.progress-box h4,
	.logs-box h4 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1rem;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e5e7eb;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 0.875rem;
		color: #666;
		margin: 0;
	}

	.logs-content {
		background: #1f2937;
		color: #f9fafb;
		padding: 1rem;
		border-radius: 6px;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.875rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.log-line {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	.log-line:last-child {
		margin-bottom: 0;
	}

	.btn-primary {
		padding: 0.875rem 1.75rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:not(:disabled):hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.hint {
		font-size: 0.875rem;
		color: #666;
		margin: 0;
	}

	.info-boxes {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.info-box {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		border-radius: 8px;
		border: 2px solid;
	}

	.info-box:not(.webhook):not(.schedule) {
		background: #dbeafe;
		border-color: #3b82f6;
	}

	.info-box.webhook {
		background: #e0e7ff;
		border-color: #6366f1;
	}

	.info-box.schedule {
		background: #fef3c7;
		border-color: #f59e0b;
	}

	.info-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.info-text h4 {
		margin: 0 0 0.5rem 0;
		color: #1e40af;
	}

	.info-text p {
		margin: 0 0 0.5rem 0;
		color: #1e3a8a;
	}

	.info-text ul {
		margin: 0.5rem 0 0 0;
		padding-left: 1.5rem;
		color: #1e3a8a;
	}

	.info-text li {
		margin-bottom: 0.25rem;
	}

	.webhook-url {
		display: block;
		background: #f3f4f6;
		padding: 0.75rem;
		border-radius: 6px;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.875rem;
		color: #4f46e5;
		margin: 0.5rem 0;
		word-break: break-all;
	}

	@media (max-width: 768px) {
		.sync-grid,
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.info-box {
			flex-direction: column;
		}
	}
</style>

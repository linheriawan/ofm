<script lang="ts">
	import type { PageData } from './$types';
	import type { Setting } from '$lib/server/db/schemas/settings';

	let { data }: { data: PageData } = $props();

	let title = 'Application Settings - OFM';
	let activeTab = $state<'scim' | 'email' | 'general'>('scim');
	let isSaving = $state(false);
	let isTesting = $state(false);
	let testResult = $state<{ success: boolean; message: string } | null>(null);

	// Form data for each category
	let scimFormData = $state<Record<string, string>>({});
	let emailFormData = $state<Record<string, string>>({});
	let generalFormData = $state<Record<string, string>>({});

	// Initialize form data from server data
	$effect(() => {
		scimFormData = Object.fromEntries(
			data.scimSettings.map((s: Setting) => [s.key, s.value || ''])
		);
		emailFormData = Object.fromEntries(
			data.emailSettings.map((s: Setting) => [s.key, s.value || ''])
		);
		generalFormData = Object.fromEntries(
			data.generalSettings.map((s: Setting) => [s.key, s.value || ''])
		);
	});

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSaving = true;
		testResult = null;

		try {
			// Get form data for active tab
			const formData =
				activeTab === 'scim'
					? scimFormData
					: activeTab === 'email'
						? emailFormData
						: generalFormData;

			// Convert to array format for API
			const settings = Object.entries(formData).map(([key, value]) => ({
				key,
				value: value === '***HIDDEN***' ? '' : value // Don't update if still masked
			}));

			// Filter out settings that are still masked (user didn't change them)
			const settingsToUpdate = settings.filter((s) => s.value !== '');

			if (settingsToUpdate.length === 0) {
				alert('No changes detected');
				isSaving = false;
				return;
			}

			const response = await fetch('/api/v1/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ settings: settingsToUpdate })
			});

			const result = await response.json();

			if (result.success) {
				alert('Settings saved successfully! Changes will take effect in 1 minute.');
				window.location.reload();
			} else {
				alert(result.error || 'Failed to save settings');
			}
		} catch (error) {
			alert('Failed to save settings');
			console.error('Error saving settings:', error);
		} finally {
			isSaving = false;
		}
	}

	async function testSCIMConnection() {
		isTesting = true;
		testResult = null;

		try {
			const response = await fetch('/api/v1/scim/test', {
				method: 'POST'
			});

			testResult = await response.json();
		} catch (error) {
			testResult = {
				success: false,
				message: error instanceof Error ? error.message : 'Connection test failed'
			};
		} finally {
			isTesting = false;
		}
	}

	function renderSettingInput(setting: Setting, formData: Record<string, string>) {
		const value = formData[setting.key] || '';

		if (setting.isSecret) {
			return {
				type: 'password',
				placeholder: value === '***HIDDEN***' ? 'Leave blank to keep current value' : '',
				value: value === '***HIDDEN***' ? '' : value
			};
		}

		return {
			type: 'text',
			placeholder: setting.description || '',
			value
		};
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="settings-page">
	<div class="settings-header">
		<h1>Application Settings</h1>
		<p class="subtitle">Configure application settings and integrations</p>
	</div>

	<!-- Tabs -->
	<div class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'scim'}
			onclick={() => {
				activeTab = 'scim';
				testResult = null;
			}}
		>
			SCIM Integration
		</button>
		<button
			class="tab"
			class:active={activeTab === 'email'}
			onclick={() => {
				activeTab = 'email';
				testResult = null;
			}}
		>
			Email Settings
		</button>
		<button
			class="tab"
			class:active={activeTab === 'general'}
			onclick={() => {
				activeTab = 'general';
				testResult = null;
			}}
		>
			General Settings
		</button>
	</div>

	<!-- Settings Form -->
	<div class="settings-content">
		<form onsubmit={handleSubmit}>
			<div class="settings-grid">
				{#if activeTab === 'scim'}
					{#each data.scimSettings as setting}
						{@const inputProps = renderSettingInput(setting, scimFormData)}
						<div class="form-group" class:full-width={setting.key.includes('url')}>
							<label for="setting-{setting.key}">
								{setting.label}
								{#if setting.isRequired}
									<span class="required">*</span>
								{/if}
							</label>

							{#if setting.isSecret && inputProps.value === ''}
								<input
									type="password"
									id="setting-{setting.key}"
									bind:value={scimFormData[setting.key]}
									placeholder={inputProps.placeholder}
									required={setting.isRequired && !setting.value}
								/>
							{:else}
								<input
									type={inputProps.type}
									id="setting-{setting.key}"
									bind:value={scimFormData[setting.key]}
									placeholder={inputProps.placeholder}
									required={setting.isRequired && !setting.value}
								/>
							{/if}

							{#if setting.description}
								<small>{setting.description}</small>
							{/if}

							{#if setting.isSecret && setting.value}
								<small class="hint">Leave blank to keep current value</small>
							{/if}
						</div>
					{/each}
				{:else if activeTab === 'email'}
					{#each data.emailSettings as setting}
						{@const inputProps = renderSettingInput(setting, emailFormData)}
						<div class="form-group" class:full-width={setting.key.includes('url')}>
							<label for="setting-{setting.key}">
								{setting.label}
								{#if setting.isRequired}
									<span class="required">*</span>
								{/if}
							</label>

							{#if setting.isSecret && inputProps.value === ''}
								<input
									type="password"
									id="setting-{setting.key}"
									bind:value={emailFormData[setting.key]}
									placeholder={inputProps.placeholder}
									required={setting.isRequired && !setting.value}
								/>
							{:else}
								<input
									type={inputProps.type}
									id="setting-{setting.key}"
									bind:value={emailFormData[setting.key]}
									placeholder={inputProps.placeholder}
									required={setting.isRequired && !setting.value}
								/>
							{/if}

							{#if setting.description}
								<small>{setting.description}</small>
							{/if}

							{#if setting.isSecret && setting.value}
								<small class="hint">Leave blank to keep current value</small>
							{/if}
						</div>
					{/each}
				{:else}
					{#each data.generalSettings as setting}
						{@const inputProps = renderSettingInput(setting, generalFormData)}
						<div class="form-group" class:full-width={setting.key.includes('url')}>
							<label for="setting-{setting.key}">
								{setting.label}
								{#if setting.isRequired}
									<span class="required">*</span>
								{/if}
							</label>

							{#if setting.isSecret && inputProps.value === ''}
								<input
									type="password"
									id="setting-{setting.key}"
									bind:value={generalFormData[setting.key]}
									placeholder={inputProps.placeholder}
									required={setting.isRequired && !setting.value}
								/>
							{:else}
								<input
									type={inputProps.type}
									id="setting-{setting.key}"
									bind:value={generalFormData[setting.key]}
									placeholder={inputProps.placeholder}
									required={setting.isRequired && !setting.value}
								/>
							{/if}

							{#if setting.description}
								<small>{setting.description}</small>
							{/if}

							{#if setting.isSecret && setting.value}
								<small class="hint">Leave blank to keep current value</small>
							{/if}
						</div>
					{/each}
				{/if}
			</div>

			<div class="form-actions">
				{#if activeTab === 'scim'}
					<button
						type="button"
						class="btn-test"
						onclick={testSCIMConnection}
						disabled={isTesting}
					>
						{isTesting ? 'Testing...' : 'Test Connection'}
					</button>
				{/if}

				<button type="submit" class="btn-primary" disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Settings'}
				</button>
			</div>
		</form>

		<!-- Test Result -->
		{#if testResult}
			<div class="test-result" class:success={testResult.success} class:error={!testResult.success}>
				<div class="result-icon">
					{#if testResult.success}
						✅
					{:else}
						❌
					{/if}
				</div>
				<div class="result-message">
					<strong>{testResult.success ? 'Success' : 'Failed'}</strong>
					<p>{testResult.message}</p>
				</div>
			</div>
		{/if}

		<!-- Info Box -->
		{#if activeTab === 'scim'}
			<div class="info-box">
				<h3>ℹ️ SCIM Integration Info</h3>
				<ul>
					<li>SCIM is used to sync users and organizational units from Aksara SSO</li>
					<li>Changes to SCIM settings will take effect within 1 minute (cache TTL)</li>
					<li>
						After configuring, go to <a href="/modules/sync">Data Sync</a> to perform initial sync
					</li>
					<li>Configure webhook in SSO to receive real-time updates</li>
				</ul>
			</div>
		{:else if activeTab === 'email'}
			<div class="info-box">
				<h3>ℹ️ Email Settings Info</h3>
				<ul>
					<li>Email settings are used for notifications and calendar invitations</li>
					<li>SMTP settings are required for sending emails</li>
					<li>Test email sending after saving settings</li>
				</ul>
			</div>
		{:else}
			<div class="info-box">
				<h3>ℹ️ General Settings Info</h3>
				<ul>
					<li>Application Name is displayed in the header and page titles</li>
					<li>Application URL is used for generating links in emails</li>
				</ul>
			</div>
		{/if}
	</div>
</div>

<style>
	.settings-page {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
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

	.settings-header {
		margin-bottom: 2rem;
	}

	.settings-header h1 {
		font-size: 2rem;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #6b7280;
		font-size: 1rem;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.tab {
		padding: 0.75rem 1.5rem;
		background: none;
		border: none;
		border-bottom: 3px solid transparent;
		color: #6b7280;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		margin-bottom: -2px;
	}

	.tab:hover {
		color: #667eea;
	}

	.tab.active {
		color: #667eea;
		border-bottom-color: #667eea;
	}

	/* Settings Content */
	.settings-content {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group label {
		font-weight: 500;
		color: #374151;
		font-size: 0.9rem;
	}

	.required {
		color: #ef4444;
		margin-left: 0.25rem;
	}

	.form-group input {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-group small {
		font-size: 0.8rem;
		color: #6b7280;
	}

	.hint {
		color: #f59e0b !important;
		font-style: italic;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn-primary,
	.btn-test {
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

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-test {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-test:hover:not(:disabled) {
		background: #e5e7eb;
	}

	.btn-test:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Test Result */
	.test-result {
		margin-top: 1.5rem;
		padding: 1rem;
		border-radius: 8px;
		display: flex;
		gap: 1rem;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.test-result.success {
		background: #d1fae5;
		border: 1px solid #10b981;
	}

	.test-result.error {
		background: #fee2e2;
		border: 1px solid #ef4444;
	}

	.result-icon {
		font-size: 1.5rem;
	}

	.result-message {
		flex: 1;
	}

	.result-message strong {
		display: block;
		margin-bottom: 0.25rem;
		color: #1f2937;
	}

	.result-message p {
		margin: 0;
		color: #4b5563;
		font-size: 0.9rem;
	}

	/* Info Box */
	.info-box {
		margin-top: 2rem;
		padding: 1.5rem;
		background: #f9fafb;
		border-radius: 8px;
		border-left: 4px solid #667eea;
	}

	.info-box h3 {
		margin: 0 0 1rem 0;
		color: #374151;
		font-size: 1rem;
	}

	.info-box ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #6b7280;
		font-size: 0.9rem;
	}

	.info-box li {
		margin-bottom: 0.5rem;
	}

	.info-box a {
		color: #667eea;
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		.settings-page {
			padding: 1rem;
		}

		.settings-grid {
			grid-template-columns: 1fr;
		}

		.tabs {
			overflow-x: auto;
		}

		.tab {
			white-space: nowrap;
		}
	}
</style>

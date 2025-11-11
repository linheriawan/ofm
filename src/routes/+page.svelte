<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	$: user = $page.data.user;
	$: isAuthenticated = !!user;

	// Redirect authenticated users to the dashboard
	onMount(() => {
		if (isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

<svelte:head>
	<title>Login - OFM</title>
</svelte:head>

{#if !isAuthenticated}
<div class="login-screen">
	<div class="login-container">
		<div class="logo-section">
			<h1>OFM</h1>
			<p class="subtitle">Office Facility Management</p>
		</div>

		<div class="login-card">
			<h2>Welcome</h2>
			<p class="welcome-text">Please select how you want to proceed</p>

			<div class="login-options">
				<form method="GET" action="/auth/login">
					<button type="submit" class="login-btn primary">
						<div class="btn-icon">👤</div>
						<div class="btn-content">
							<div class="btn-title">Staff Login</div>
							<div class="btn-desc">Access the management system</div>
						</div>
					</button>
				</form>

				<a href="/display/assign" class="login-btn secondary">
					<div class="btn-icon">📱</div>
					<div class="btn-content">
						<div class="btn-title">Setup Display Device</div>
						<div class="btn-desc">Configure room tablet/display</div>
					</div>
				</a>
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.login-screen {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem;
	}

	.login-container {
		max-width: 500px;
		width: 100%;
	}

	.logo-section {
		text-align: center;
		margin-bottom: 2rem;
		color: white;
	}

	.logo-section h1 {
		font-size: 4rem;
		margin: 0;
		font-weight: 700;
		text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.subtitle {
		font-size: 1.2rem;
		margin: 0.5rem 0 0 0;
		opacity: 0.95;
	}

	.login-card {
		background: white;
		border-radius: 20px;
		padding: 3rem 2.5rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		text-align: center;
	}

	.login-card h2 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		color: #333;
	}

	.welcome-text {
		color: #666;
		margin: 0 0 2.5rem 0;
		font-size: 1rem;
	}

	.login-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.login-options form {
		margin: 0;
		width: 100%;
		display: block;
	}

	.login-btn {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1.5rem;
		border-radius: 12px;
		text-decoration: none;
		transition: all 0.3s;
		text-align: left;
		border: 2px solid transparent;
		width: 100%;
		cursor: pointer;
		font-family: inherit;
		box-sizing: border-box;
	}

	button.login-btn {
		background: none;
		font-size: 1rem;
	}

	.login-btn.primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.login-btn.primary:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
	}

	.login-btn.secondary {
		background: #f9fafb;
		color: #333;
		border-color: #e5e7eb;
	}

	.login-btn.secondary:hover {
		background: #f0f4ff;
		border-color: #667eea;
		transform: translateY(-3px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
	}

	.btn-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
	}

	.btn-content {
		flex: 1;
	}

	.btn-title {
		font-size: 1.2rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.btn-desc {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.login-btn.secondary .btn-desc {
		color: #666;
	}

	@media (max-width: 768px) {
		.logo-section h1 {
			font-size: 3rem;
		}

		.login-card {
			padding: 2rem 1.5rem;
		}

		.login-btn {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.btn-icon {
			font-size: 3rem;
		}
	}
</style>

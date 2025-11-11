<script lang="ts">
	import '$lib/styles/global.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let isMenuOpen = false;
	let requestsDropdownOpen = false;
	let masterDataDropdownOpen = false;
	let configDropdownOpen = false;
	let userMenuOpen = false;

	// Get user from page data
	$: user = $page.data.user;
	$: isAuthenticated = !!user;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function toggleRequestsDropdown() {
		requestsDropdownOpen = !requestsDropdownOpen;
		masterDataDropdownOpen = false;
		configDropdownOpen = false;
		userMenuOpen = false;
	}

	function toggleMasterDataDropdown() {
		masterDataDropdownOpen = !masterDataDropdownOpen;
		requestsDropdownOpen = false;
		configDropdownOpen = false;
		userMenuOpen = false;
	}

	function toggleConfigDropdown() {
		configDropdownOpen = !configDropdownOpen;
		requestsDropdownOpen = false;
		masterDataDropdownOpen = false;
		userMenuOpen = false;
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
		requestsDropdownOpen = false;
		masterDataDropdownOpen = false;
		configDropdownOpen = false;
	}

	function closeDropdowns() {
		requestsDropdownOpen = false;
		masterDataDropdownOpen = false;
		configDropdownOpen = false;
		userMenuOpen = false;
	}

	// Click outside to close dropdowns
	onMount(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;

			// Check if click is outside all dropdowns
			const isClickInsideDropdown = target.closest('.dropdown') || target.closest('.user-menu');

			if (!isClickInsideDropdown) {
				closeDropdowns();
			}
		}

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="app">
	{#if isAuthenticated}
	<header>
		<nav>
			<div class="nav-brand">
				<h1>OFM</h1>
				<span class="subtitle">Office Facility Management</span>
			</div>

			<button class="menu-toggle" onclick={toggleMenu}>
				☰
			</button>

			<ul class:open={isMenuOpen}>
				<li>
					<a href="/dashboard" class:active={$page.url.pathname === '/dashboard'} onclick={closeDropdowns}>
						Dashboard
					</a>
				</li>
				<li class="dropdown">
					<button
						class="dropdown-trigger {$page.url.pathname.startsWith('/transportation') || $page.url.pathname.startsWith('/meeting') ? 'active' : ''}"
						onclick={toggleRequestsDropdown}
					>
						Requests ▾
					</button>
					{#if requestsDropdownOpen}
						<div class="dropdown-menu">
							<div class="dropdown-section-title">Booking Data</div>
							<a href="/transportation/bookings" onclick={closeDropdowns}>Transport</a>
							<a href="/meeting/bookings" onclick={closeDropdowns}>Meetings</a>
							
							<div class="dropdown-divider"></div>
							<div class="dropdown-section-title">Summary</div>
							<a href="/transportation/tracking" onclick={closeDropdowns}>Track Vehicles</a>
							<a href="/meeting/calendar" onclick={closeDropdowns}>Room Calendar</a>
						</div>
					{/if}
				</li>
				<li class="dropdown">
					<button
						class="dropdown-trigger {$page.url.pathname.startsWith('/admin') ? 'active' : ''}"
						onclick={toggleMasterDataDropdown}
					>
						Master Data ▾
					</button>
					{#if masterDataDropdownOpen}
						<div class="dropdown-menu">
							<div class="dropdown-section-title">Transportation</div>
							<a href="/admin/vehicles" onclick={closeDropdowns}>Vehicles</a>
							<a href="/admin/drivers" onclick={closeDropdowns}>Drivers</a>
							<a href="/admin/transport-companies" onclick={closeDropdowns}>Transport Companies</a>
							<a href="/admin/vouchers" onclick={closeDropdowns}>Vouchers</a>
							<a href="/admin/trip-purposes" onclick={closeDropdowns}>Trip Purposes</a>
							<div class="dropdown-divider"></div>
							<div class="dropdown-section-title">Meeting Rooms</div>
							<a href="/admin/rooms" onclick={closeDropdowns}>Meeting Rooms</a>
							<a href="/admin/devices" onclick={closeDropdowns}>Display Devices</a>
							<a href="/admin/videos" onclick={closeDropdowns}>Background Videos</a>
						</div>
					{/if}
				</li>
				<li class="dropdown">
					<button
						class="dropdown-trigger {$page.url.pathname.startsWith('/admin/approvals') || $page.url.pathname.startsWith('/admin/room-displays') ? 'active' : ''}"
						onclick={toggleConfigDropdown}
					>
						Configuration ▾
					</button>
					{#if configDropdownOpen}
						<div class="dropdown-menu">
							<div class="dropdown-section-title">Approvals</div>
							<a href="/modules/approvals" onclick={closeDropdowns}>Transportation </a>
							<a href="/modules/meeting-approvals" onclick={closeDropdowns}>Meeting</a>
							<div class="user-menu-divider"></div>
							<div class="dropdown-section-title">Modules</div>
							<a href="/modules/room-displays" onclick={closeDropdowns}>Room Displays</a>
							<a href="/modules/sync" onclick={closeDropdowns}>Data Sync</a>
							<div class="dropdown-divider"></div>
							<div class="dropdown-section-title">General</div>
							<a href="/admin/settings" onclick={closeDropdowns}>⚙️ Settings</a>
							<a href="/modules/users" onclick={closeDropdowns}>Users</a>
							<a href="/modules/locations" onclick={closeDropdowns}>Locations</a>
						</div>
					{/if}
				</li>
			</ul>

			<div class="user-menu">
				<button class="user-menu-trigger" onclick={toggleUserMenu}>
					<div class="user-info-compact">
						<span class="user-name">{user?.fullName || user?.name || user?.email || 'User'}</span>
						{#if user?.positionName}
							<span class="user-position">{user.positionName}</span>
						{/if}
					</div>
					<span class="user-arrow">▾</span>
				</button>
				{#if userMenuOpen}
					<div class="user-dropdown">
						<div class="user-info-section">
							<div class="user-detail-row">
								<strong>{user?.fullName || user?.name || 'User'}</strong>
							</div>
							{#if user?.employeeId}
								<div class="user-detail-row text-muted">
									NIK: {user.employeeId}
								</div>
							{/if}
							{#if user?.positionName}
								<div class="user-detail-row">
									<span class="detail-label">Position:</span> {user.positionName}
								</div>
							{/if}
							{#if user?.orgUnitName}
								<div class="user-detail-row">
									<span class="detail-label">Unit:</span> {user.orgUnitName}
								</div>
							{/if}
							{#if user?.workLocation}
								<div class="user-detail-row">
									<span class="detail-label">Location:</span> {user.workLocation}
								</div>
							{/if}
						</div>
						<div class="user-menu-divider"></div>
						<form method="POST" action="/auth/logout" style="margin: 0;">
							<button type="submit" class="user-menu-logout">🚪 Logout</button>
						</form>
					</div>
				{/if}
			</div>
		</nav>
	</header>
	{/if}

	<main class:no-header={!isAuthenticated}>
		<slot />
	</main>

	{#if isAuthenticated}
	<footer>
		<p>&copy; 2025 Office Facility Management System</p>
	</footer>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #f5f5f5;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	nav {
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		align-items: center;
		gap: 2rem;
		height: 60px;
	}

	.nav-brand {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.nav-brand h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.subtitle {
		font-size: 0.75rem;
		opacity: 0.9;
	}

	.menu-toggle {
		display: none;
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
	}

	nav ul {
		display: flex;
		list-style: none;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		flex: 1;
		align-items: center;
	}

	nav ul li a {
		color: white;
		text-decoration: none;
		padding: 0.75rem 1.25rem;
		border-radius: 6px;
		transition: all 0.2s;
		font-weight: 500;
	}

	nav ul li a:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	nav ul li a.active {
		background: rgba(255, 255, 255, 0.3);
	}

	/* Dropdown */
	.dropdown {
		position: relative;
	}

	.dropdown-trigger {
		background: none;
		border: none;
		color: white;
		padding: 0.75rem 1.25rem;
		border-radius: 6px;
		transition: all 0.2s;
		font-weight: 500;
		cursor: pointer;
		font-size: 1rem;
		font-family: inherit;
	}

	.dropdown-trigger:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.dropdown-trigger.active {
		background: rgba(255, 255, 255, 0.3);
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		padding: 0.5rem 0;
		min-width: 200px;
		z-index: 1000;
		animation: dropdownFade 0.2s ease-in;
		* {white-space: nowrap;}
	}

	@keyframes dropdownFade {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-menu a {
		display: block;
		padding: 0.75rem 1.25rem;
		color: #333;
		text-decoration: none;
		transition: background 0.2s;
	}

	.dropdown-menu a:hover {
		background: #f0f4ff;
		color: #667eea;
	}

	.dropdown-section-title {
		padding: 0.5rem 1.25rem 0.25rem;
		color: #667eea;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.dropdown-divider {
		height: 1px;
		background: #e5e7eb;
		margin: 0.5rem 0;
	}

	.user-menu {
		position: relative;
		display: flex;
		align-items: center;
	}

	.user-menu-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.user-menu-trigger:hover {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.user-name {
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.user-arrow {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	.user-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.5rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		padding: 0.5rem 0;
		min-width: 200px;
		z-index: 1000;
		animation: dropdownFade 0.2s ease-in;
	}

	.user-menu-item {
		display: block;
		padding: 0.75rem 1.25rem;
		color: #333;
		text-decoration: none;
		transition: background 0.2s;
		font-size: 0.9rem;
	}

	.user-menu-item:hover {
		background: #f0f4ff;
		color: #667eea;
	}

	.user-menu-divider {
		height: 1px;
		background: #e5e7eb;
		margin: 0.5rem 0;
	}

	.user-menu-logout {
		display: block;
		width: 100%;
		padding: 0.75rem 1.25rem;
		color: #dc2626;
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 0.9rem;
		font-family: inherit;
		font-weight: 500;
	}

	.user-menu-logout:hover {
		background: #fef2f2;
	}

	.user-info-compact {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		white-space: nowrap;
	}

	.user-position {
		font-size: 0.7rem;
		opacity: 0.85;
		font-weight: 400;
		white-space: nowrap;
	}

	.user-info-section {
		padding: 0.75rem 1.25rem;
		background: #f9fafb;
		border-radius: 6px;
		margin: 0.5rem;
	}

	.user-detail-row {
		font-size: 0.85rem;
		color: #333;
		margin-bottom: 0.4rem;
		line-height: 1.4;
		white-space: nowrap;
	}

	.user-detail-row:last-child {
		margin-bottom: 0;
	}

	.user-detail-row strong {
		font-size: 0.95rem;
		color: #111;
	}

	.text-muted {
		color: #6b7280;
		font-size: 0.8rem;
	}

	.detail-label {
		color: #667eea;
		font-weight: 600;
		font-size: 0.75rem;
	}

	main {
		flex: 1;
		width: 100%;
		margin: 0 auto;
		padding: 2rem;
		box-sizing: border-box;
		overflow-x: hidden;
	}

	main.no-header {
		padding: 0;
	}

	main > * {
		max-width: 1400px;
		margin-left: auto;
		margin-right: auto;
	}

	footer {
		background: #333;
		color: white;
		text-align: center;
		padding: .5rem;
		margin-top: 3rem;
	}

	footer p {
		margin: 0;
		font-size: 0.9rem;
		opacity: 0.8;
	}

	@media (max-width: 768px) {
		.menu-toggle {
			display: block;
			margin-left: auto;
		}

		nav ul {
			position: absolute;
			top: 70px;
			left: 0;
			right: 0;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			flex-direction: column;
			padding: 1rem;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
			display: none;
		}

		nav ul.open {
			display: flex;
		}

		nav ul li a {
			display: block;
		}

		.user-menu {
			display: none;
		}

		main {
			padding: 1rem;
		}
	}
</style>

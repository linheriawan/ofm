<script lang="ts">
	let title = 'Module - OFM';

	const adminCategories = [
		{
			category: 'Approvals & Workflows',
			icon: '✅',
			modules: [
				{
					title: 'Transport Approvals',
					description: 'Review and approve transportation requests',
					icon: '🚗',
					href: '/modules/approvals',
					color: '#667eea',
					available: true
				},
				{
					title: 'Meeting Approvals',
					description: 'Review and approve meeting bookings',
					icon: '🏢',
					href: '/modules/meeting-approvals',
					color: '#f6ad55',
					available: true
				},
				{
					title: 'Approval Workflow',
					description: 'Configure approval rules and hierarchy',
					icon: '⚙️',
					href: '/modules/approvals/config',
					color: '#9f7aea',
					available: true
				}
			]
		},
		{
			category: 'Transportation Management',
			icon: '🚗',
			modules: [
				{
					title: 'Vehicles',
					description: 'Manage company vehicles and fleet',
					icon: '🚗',
					href: '/admin/vehicles',
					color: '#667eea',
					available: true
				},
				{
					title: 'Drivers',
					description: 'Manage drivers and assignments',
					icon: '👨‍✈️',
					href: '/admin/drivers',
					color: '#48bb78',
					available: true
				},
				{
					title: 'Transport Companies',
					description: 'Manage Gojek, Grab, and other providers',
					icon: '🚕',
					href: '/admin/transport-companies',
					color: '#10b981',
					available: true
				},
				{
					title: 'Vouchers',
					description: 'Import, manage, and reconcile vouchers',
					icon: '🎫',
					href: '/admin/vouchers',
					color: '#38b2ac',
					available: true
				},
				{
					title: 'Trip Purposes',
					description: 'Manage trip purposes for reporting',
					icon: '🎯',
					href: '/admin/trip-purposes',
					color: '#3b82f6',
					available: true
				}
			]
		},
		{
			category: 'Meeting & Facilities',
			icon: '🏢',
			modules: [
				{
					title: 'Meeting Rooms',
					description: 'Manage meeting rooms and facilities',
					icon: '🏢',
					href: '/admin/rooms',
					color: '#f6ad55',
					available: true
				},
				{
					title: 'Room Displays',
					description: 'QR codes and URLs for room tablets',
					icon: '📺',
					href: '/modules/room-displays',
					color: '#a78bfa',
					available: true
				},
				{
					title: 'Meeting Licenses',
					description: 'Manage Zoom, Teams, Meet licenses',
					icon: '📄',
					href: '/admin/licenses',
					color: '#fc8181',
					available: false
				}
			]
		},
		{
			category: 'User & Access Management',
			icon: '👥',
			modules: [
				{
					title: 'Users',
					description: 'Manage user accounts and profiles',
					icon: '👥',
					href: '/modules/users',
					color: '#9f7aea',
					available: true
				},
				{
					title: 'Roles & Permissions',
					description: 'Manage roles and access control',
					icon: '🔐',
					href: '/modules/roles',
					color: '#ec4899',
					available: true
				}
			]
		},
		{
			category: 'Organization Setup',
			icon: '🏛️',
			modules: [
				{
					title: 'Companies',
					description: 'Manage companies and subsidiaries',
					icon: '🏛️',
					href: '/modules/companies',
					color: '#4299e1',
					available: true
				},
				{
					title: 'Departments',
					description: 'Manage departments and org units',
					icon: '🏢',
					href: '/modules/departments',
					color: '#8b5cf6',
					available: true
				},
				{
					title: 'Positions',
					description: 'Manage job positions and levels',
					icon: '💼',
					href: '/modules/positions',
					color: '#10b981',
					available: true
				},
				{
					title: 'Locations',
					description: 'Manage office locations',
					icon: '📍',
					href: '/modules/locations',
					color: '#ed64a6',
					available: true
				},
				{
					title: 'Sync Data from SSO',
					description: 'Synchronize organizational data',
					icon: '🔄',
					href: '/modules/sync',
					color: '#f59e0b',
					available: true
				}
			]
		},
	];
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="admin-dashboard">
	<div class="header">
		<h1>OFM Modules</h1>
		<p class="subtitle">Manage all aspects of your facility management system</p>
	</div>

	{#each adminCategories as category}
		<div class="category-section">
			<div class="category-header">
				<span class="category-icon">{category.icon}</span>
				<h2>{category.category}</h2>
			</div>

			<div class="modules-grid">
				{#each category.modules as module}
					{#if module.available}
						<a href={module.href} class="module-card available" style="--card-color: {module.color}">
							<div class="card-icon">{module.icon}</div>
							<div class="card-content">
								<h3>{module.title}</h3>
								<p>{module.description}</p>
							</div>
							<div class="card-arrow">→</div>
						</a>
					{:else}
						<div class="module-card unavailable" style="--card-color: {module.color}">
							<div class="card-icon">{module.icon}</div>
							<div class="card-content">
								<h3>{module.title}</h3>
								<p>{module.description}</p>
							</div>
							<div class="coming-soon-badge">Coming Soon</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.admin-dashboard {
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

	.header {
		margin-bottom: 3rem;
	}

	.header h1 {
		margin: 0;
		font-size: 2.5rem;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin: 0.5rem 0 0 0;
		font-size: 1.1rem;
	}

	.category-section {
		margin-bottom: 3rem;
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.category-icon {
		font-size: 2rem;
	}

	.category-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
		font-weight: 600;
	}

	.modules-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.module-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		border-left: 4px solid var(--card-color);
		position: relative;
		overflow: hidden;
	}

	.module-card.available {
		cursor: pointer;
	}

	.module-card.unavailable {
		opacity: 0.6;
		cursor: not-allowed;
		background: #f9fafb;
	}

	.module-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, var(--card-color) 0%, transparent 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.module-card.available:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
	}

	.module-card.available:hover::before {
		opacity: 0.05;
	}

	.card-icon {
		font-size: 3rem;
		flex-shrink: 0;
		z-index: 1;
	}

	.card-content {
		flex: 1;
		z-index: 1;
	}

	.card-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
		color: #333;
	}

	.card-content p {
		margin: 0;
		font-size: 0.9rem;
		color: #666;
		line-height: 1.4;
	}

	.card-arrow {
		font-size: 1.5rem;
		color: var(--card-color);
		transition: transform 0.3s ease;
		z-index: 1;
	}

	.module-card.available:hover .card-arrow {
		transform: translateX(5px);
	}

	.coming-soon-badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		z-index: 2;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 768px) {
		.modules-grid {
			grid-template-columns: 1fr;
		}

		.module-card {
			padding: 1rem;
		}

		.card-icon {
			font-size: 2.5rem;
		}

		.category-header h2 {
			font-size: 1.25rem;
		}

		.header h1 {
			font-size: 2rem;
		}
	}
</style>

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				userId: string;
				email: string;
				name?: string;
				ssoUserId?: string;

				// Employee info
				employeeId?: string;
				firstName?: string;
				lastName?: string;
				fullName?: string;
				phone?: string;

				// Organization
				companyId?: string;
				companyName?: string;
				companyCode?: string;

				// Org Unit
				orgUnitId?: string;
				orgUnitName?: string;
				orgUnitCode?: string;
				orgUnitType?: string;

				// Position
				positionId?: string;
				positionName?: string;
				positionCode?: string;
				positionLevel?: string;
				positionGrade?: string;

				// Work location
				workLocation?: string;
				region?: string;
				employmentType?: string;
				employmentStatus?: string;
				isRemote?: boolean;

				// Manager
				managerId?: string;

				// Roles
				roles: string[];
				ssoRoles?: string[];

				// Multi-entity
				companyAccess?: string[];
				selectedCompanyId?: string;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

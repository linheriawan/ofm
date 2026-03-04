/**
 * Client-side API utility
 * Handles API calls from the browser (used by web UI forms)
 */

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: any;
	};
	meta?: {
		page?: number;
		limit?: number;
		total?: number;
		timestamp?: string;
	};
}

/**
 * Base API client
 */
class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = '/api/v1') {
		this.baseUrl = baseUrl;
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<ApiResponse<T>> {
		const url = `${this.baseUrl}${endpoint}`;

		const defaultHeaders: HeadersInit = {
			'Content-Type': 'application/json'
		};

		const config: RequestInit = {
			...options,
			headers: {
				...defaultHeaders,
				...options.headers
			},
			credentials: 'include' // Include session cookie
		};

		try {
			const response = await fetch(url, config);
			const data: ApiResponse<T> = await response.json();

			if (!response.ok) {
				throw new Error(data.error?.message || 'Request failed');
			}

			return data;
		} catch (error: any) {
			throw new Error(error.message || 'Network error');
		}
	}

	async get<T>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, { method: 'GET' });
	}

	async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: JSON.stringify(body)
		});
	}

	async patch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			body: JSON.stringify(body)
		});
	}

	async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, { method: 'DELETE' });
	}
}

// Export singleton instance
export const api = new ApiClient();

// Transport API
export const transportApi = {
	createRequest: (data: any) => api.post('/transport/requests', data),
	listRequests: (params?: URLSearchParams) =>
		api.get(`/transport/requests${params ? '?' + params.toString() : ''}`),
	getRequest: (id: string) => api.get(`/transport/requests/${id}`),
	updateRequest: (id: string, data: any) => api.patch(`/transport/requests/${id}`, data),
	cancelRequest: (id: string) => api.delete(`/transport/requests/${id}`)
};

// Meeting API
export const meetingApi = {
	createRequest: (data: any) => api.post('/meeting/requests', data),
	listRequests: (params?: URLSearchParams) =>
		api.get(`/meeting/requests${params ? '?' + params.toString() : ''}`),
	getRequest: (id: string) => api.get(`/meeting/requests/${id}`),
	updateRequest: (id: string, data: any) => api.patch(`/meeting/requests/${id}`, data),
	cancelRequest: (id: string) => api.delete(`/meeting/requests/${id}`)
};

// Facility API
export const facilityApi = {
	createRequest: (data: any) => api.post('/facility/requests', data),
	listRequests: (params?: URLSearchParams) =>
		api.get(`/facility/requests${params ? '?' + params.toString() : ''}`),
	getRequest: (id: string) => api.get(`/facility/requests/${id}`),
	updateRequest: (id: string, data: any) => api.patch(`/facility/requests/${id}`, data),
	cancelRequest: (id: string) => api.delete(`/facility/requests/${id}`)
};

// Driver API
export const driverApi = {
	getAssignments: (date?: string) => {
		const params = new URLSearchParams();
		if (date) params.set('date', date);
		return api.get(`/driver/assignments${params.toString() ? '?' + params.toString() : ''}`);
	},
	updateLocation: (data: any) => api.post('/driver/location', data),
	startTrip: (tripId: string, data: any) => api.post(`/driver/trip/${tripId}/start`, data),
	completeTrip: (tripId: string, data: any) => api.post(`/driver/trip/${tripId}/complete`, data)
};

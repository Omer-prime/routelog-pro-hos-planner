import axios from 'axios'
import type { TripFormValues, TripPlanResponse } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
const API_URL = `${BASE_URL}/api/trips/plan/`

type TripPlanErrorResponse = {
  detail?: string
  field?: keyof Pick<
    TripFormValues,
    'current_location' | 'pickup_location' | 'dropoff_location'
  >
}

export class ApiError extends Error {
  field?: TripPlanErrorResponse['field']

  constructor(message: string, field?: TripPlanErrorResponse['field']) {
    super(message)
    this.name = 'ApiError'
    this.field = field
  }
}

export async function planTrip(payload: TripFormValues) {
  try {
    const response = await axios.post<TripPlanResponse>(API_URL, payload)
    return response.data
  } catch (error) {
    if (axios.isAxiosError<TripPlanErrorResponse>(error)) {
      throw new ApiError(
        error.response?.data?.detail ??
          'Unable to reach the trip planner API. Confirm the Django server is running on port 8000.',
        error.response?.data?.field,
      )
    }
    throw error
  }
}

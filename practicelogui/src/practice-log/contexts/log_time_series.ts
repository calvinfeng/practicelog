import { PracticeTimeSeriesDataPoint } from "../types";

export type LogTimeSeriesState = {
  isFetching: boolean
  byMonth: PracticeTimeSeriesDataPoint[]
  byDay: PracticeTimeSeriesDataPoint[]
  total: number
  error: string | null
}

export enum LogTimeSeriesActionType {
  Fetch = 'FETCH',
  FetchSuccess = 'FETCH_BY_MONTH_SUCCESS',
  Error = 'ERROR',
}

export type LogTimeSeriesAction = {
  type: LogTimeSeriesActionType
  byMonth?: PracticeTimeSeriesDataPoint[]
  byDay?: PracticeTimeSeriesDataPoint[]
  total?: number
  error?: string
}

export function logTimeSeriesReducer(state: LogTimeSeriesState, action: LogTimeSeriesAction): LogTimeSeriesState {
  switch (action.type) {
    case LogTimeSeriesActionType.Fetch:
      return { ...state, error: null, isFetching: true }

    case LogTimeSeriesActionType.FetchSuccess:
      return {
        ...state,
        isFetching: false,
        error: null,
        byMonth: action.byMonth as PracticeTimeSeriesDataPoint[],
        byDay: action.byDay as PracticeTimeSeriesDataPoint[],
        total: action.total as number
      }

    case LogTimeSeriesActionType.Error:
      return { ...state, isFetching: false, error: action.error as string }

      default:
      return state
  }
}

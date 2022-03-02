import { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import { LogTimeSeriesAction, LogTimeSeriesActionType } from "../contexts/log_time_series"
import { PracticeTimeSeriesDataPoint } from "../types"


export async function fetchLogTimeSeries(http: AxiosInstance): Promise<LogTimeSeriesAction> {
  try {
    let resp: AxiosResponse

    resp = await http.get('/api/v1/log/labels/duration')
    const total = resp.data.in_minutes as number

    resp = await http.get('/api/v1/log/entries/duration/accum-time-series?group=by_month')
    const byMonth = resp.data.time_series as PracticeTimeSeriesDataPoint[]

    resp = await http.get('/api/v1/log/entries/duration/time-series?group=by_day')
    const byDay = resp.data.time_series as PracticeTimeSeriesDataPoint[]

    return {
      type: LogTimeSeriesActionType.FetchSuccess,
      total: total,
      byMonth: byMonth,
      byDay: byDay
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogTimeSeriesActionType.Error,
      error: error.message
    }
  }
}

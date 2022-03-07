import { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import { LogTimeSeriesAction, LogTimeSeriesActionType } from "../contexts/log_time_series"
import { PracticeTimeSeriesDataPoint } from "../types"

export async function fetchLogTimeSeries(http: AxiosInstance, labelID?:string): Promise<LogTimeSeriesAction> {
  try {
    let resp: AxiosResponse

    resp = await http.get('/api/v1/log/labels/duration')
    const total = resp.data.in_minutes as number

    let params
    params = {
      "group": "by_month"
    }
    if (labelID) {
      params["label_id"] = labelID
    }

    resp = await http.get('/api/v1/log/entries/duration/accum-time-series',{ params })
    const byMonth = resp.data.time_series as PracticeTimeSeriesDataPoint[]

    params = {
      "group": "by_day"
    }
    if (labelID) {
      params["label_id"] = labelID
    }

    resp = await http.get('/api/v1/log/entries/duration/time-series', { params })
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

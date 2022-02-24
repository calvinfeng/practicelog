import { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import { LogEntryAction, LogEntryActionType } from "../globalstate/log_entries"
import { LogEntryJSON } from "../types"

export async function fetchLogEntriesByPage(http: AxiosInstance, page: number): Promise<LogEntryAction> {
  try {
    const resp: AxiosResponse = await http.get('/api/v1/log/entries', {
      params: { "page": page }
    })
    const entries: LogEntryJSON[] = []
    for (let i = 0; i < resp.data.results.length; i++) {
      entries.push({
        id: resp.data.results[i].id,
        date: new Date(resp.data.results[i].date),
        username: resp.data.results[i].username,
        labels: resp.data.results[i].labels,
        message: resp.data.results[i].message,
        details: resp.data.results[i].details,
        duration: resp.data.results[i].duration,
        assignments: resp.data.results[i].assignments
      })
    }

    return {
      type: LogEntryActionType.Fetch,
      payload: entries,
      page: page,
      hasNextPage: resp.data.more
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogEntryActionType.Error,
      error: error.message
    }
  }
}

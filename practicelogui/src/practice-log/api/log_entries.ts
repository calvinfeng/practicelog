import { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import { LogEntryAction, LogEntryActionType } from "../contexts/log_entries"
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
      type: LogEntryActionType.FetchSuccess,
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

export async function createLogEntry(http: AxiosInstance, entry: LogEntryJSON): Promise<LogEntryAction> {
  try {
    const resp: AxiosResponse = await http.post('/api/v1/log/entries', entry)

    if (resp.status === 201) {
      return {
        type: LogEntryActionType.CreateSuccess
      }
    }

    return {
      type: LogEntryActionType.Error,
      error: `failed to create log entry, server returned status ${resp.status}`
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogEntryActionType.Error,
      error: `failed to create log entry, reason: ${error.message}`
    }
  }
}

export async function updateLogEntry(http: AxiosInstance, entry: LogEntryJSON): Promise<LogEntryAction> {
  try {
    const resp: AxiosResponse = await http.put(`/api/v1/log/entries/${entry.id}`, entry)

    if (resp.status === 200) {
      return {
        type: LogEntryActionType.UpdateSuccess,
        payload: {
          id: resp.data.id,
          date: new Date(resp.data.date),
          username: resp.data.username,
          labels: resp.data.labels,
          message: resp.data.message,
          details: resp.data.details,
          duration: resp.data.duration,
          assignments: resp.data.assignments
        }
      }
    }

    return {
      type: LogEntryActionType.Error,
      error: `failed to update log entry, server returned status ${resp.status}`
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogEntryActionType.Error,
      error: `failed to update log entry, reason: ${error.message}`
    }
  }
}

export async function updateLogAssignment(http: AxiosInstance, entry: LogEntryJSON): Promise<LogEntryAction> {
  try {
    const resp: AxiosResponse = await http.put(`/api/v1/log/entries/${entry.id}/assignments`, entry)

    if (resp.status === 200) {
      return {
        type: LogEntryActionType.UpdateSuccess,
        payload: {
          id: resp.data.id,
          date: new Date(resp.data.date),
          username: resp.data.username,
          labels: resp.data.labels,
          message: resp.data.message,
          details: resp.data.details,
          duration: resp.data.duration,
          assignments: resp.data.assignments
        }
      }
    }

    return {
      type: LogEntryActionType.Error,
      error: `failed to update log assignments, server returned status ${resp.status}`
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogEntryActionType.Error,
      error: `failed to update log assignments, reason: ${error.message}`
    }
  }
}

export async function deleteLogEntry(http: AxiosInstance, entry: LogEntryJSON): Promise<LogEntryAction> {
  try {
    const resp: AxiosResponse = await http.delete(`/api/v1/log/entries/${entry.id}`)

    if (resp.status === 200) {
      return {
        type: LogEntryActionType.DeleteSuccess
      }
    }

    return {
      type: LogEntryActionType.Error,
      error: `failed to delete log entry, server returned status ${resp.status}`
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogEntryActionType.Error,
      error: `failed to delete log entry, reason: ${error.message}`
    }
  }
}
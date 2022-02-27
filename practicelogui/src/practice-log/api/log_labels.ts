import { AxiosInstance, AxiosResponse, AxiosError } from "axios"
import { LogLabelAction, LogLabelActionType } from "../contexts/log_labels"
import { LogLabelDurationJSON, LogLabelJSON } from "../types"

export async function fetchLogLabels(http: AxiosInstance): Promise<LogLabelAction> {
  try {
    const resp: AxiosResponse = await http.get('/api/v1/log/labels')
    const labels: LogLabelJSON[] = resp.data.results

    return {
      type: LogLabelActionType.FetchSuccess,
      payload: labels
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogLabelActionType.Error,
      error: error.message
    }
  }
}

export async function fetchLogLabelDurations(http: AxiosInstance): Promise<LogLabelAction> {
  try {
    const resp: AxiosResponse = await http.get('/api/v1/log/labels/duration')
    const durations: LogLabelDurationJSON[] = resp.data.results

    return {
      type: LogLabelActionType.FetchDurationSuccess,
      payload: durations
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogLabelActionType.Error,
      error: error.message
    }
  }
}

export async function createLogLabel(http: AxiosInstance, label: LogLabelJSON): Promise<LogLabelAction> {
  try {
    const resp: AxiosResponse = await http.post('/api/v1/log/labels', label)

    if (resp.status === 201) {
      return {
        type: LogLabelActionType.CreateSuccess
      }
    }

    return {
      type: LogLabelActionType.Error,
      error: `failed to create log label, server returned status ${resp.status}`
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogLabelActionType.Error,
      error: `failed to create log label, reason: ${error.message}`
    }
  }
}

export async function updateLogLabel(http: AxiosInstance, label: LogLabelJSON): Promise<LogLabelAction> {
  try {
    const resp: AxiosResponse = await http.put(`/api/v1/log/labels/${label.id}`, label)

    if (resp.status === 200) {
      return {
        type: LogLabelActionType.UpdateSuccess,
        payload: resp.data as LogLabelJSON
      }
    }

    return {
      type: LogLabelActionType.Error,
      error: `failed to update log label, server returned status ${resp.status}`
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogLabelActionType.Error,
      error: `failed to update log label, reason: ${error.message}`
    }
  }
}

export async function deleteLogLabel(http: AxiosInstance, label: LogLabelJSON): Promise<LogLabelAction> {
  try {
    const resp: AxiosResponse = await http.delete(`/api/v1/log/labels/${label.id}`)

    if (resp.status === 200) {
      return {
        type: LogLabelActionType.DeleteSuccess
      }
    }

    return {
      type: LogLabelActionType.Error,
      error: `failed to delete log label, server returned status ${resp.status}`
    }

  } catch (err: unknown) {
    const error = err as AxiosError

    return {
      type: LogLabelActionType.Error,
      error: `failed to delete log label, reason: ${error.message}`
    }
  }
}

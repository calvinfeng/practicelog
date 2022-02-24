import React from 'react'
import { LogLabelDurationJSON, LogLabelJSON } from "../types"
import { Map } from 'immutable'

export type LogLabelState = {
  logLabels: LogLabelJSON[]
  isFetching: boolean
  selectedParentLabel: LogLabelJSON | null
  selectedChildLabel: LogLabelJSON | null
  error: string | null
}

interface ILogLabelContext {
  state: LogLabelState
  handleSelectParentLabel: (label: LogLabelJSON) => void
  handleDeselectParentLabel: () => void
  handleSelectChildLabel: (label: LogLabelJSON) => void
  handleDeselectChildLabel: () => void
}

// Use {} as T to avoid complaints.
export const LogLabelContext = React.createContext<ILogLabelContext>({} as ILogLabelContext)

export enum LogLabelActionType {
  Fetch = 'FETCH',
  FetchSuccess = 'FETCH_SUCCESS',
  FetchDurationSuccess = 'FETCH_DURATION_SUCCESS',
  CreateSuccess = 'CREATE_SUCCESS',
  DeleteSuccess = 'DELETE_SUCCESS',
  UpdateSuccess = 'UPDATE_SUCCESS',
  Error = 'ERROR',
  SelectParent = 'SELECT_PARENT',
  DeselectParent = 'DESELECT_PARENT',
  SelectChild = 'SELECT_CHILD',
  DeselectChild = 'DESELECT_CHILD',
}

export type LogLabelAction = {
  type: LogLabelActionType
  payload?: LogLabelJSON[] | LogLabelJSON | LogLabelDurationJSON[]
  error?: string
  selectedLogLabel?: LogLabelJSON
}

export function logLabelReducer(state: LogLabelState, action: LogLabelAction): LogLabelState {
  switch (action.type) {
    case LogLabelActionType.Fetch:
      return { ...state, error: null, isFetching: true }

    case LogLabelActionType.FetchSuccess:
      const labels = action.payload as LogLabelJSON[]

      let childrenIDByParentID = Map<string, string[]>()
      labels.forEach((label: LogLabelJSON) => {
        if (label.parent_id) {
          let children = childrenIDByParentID.get(label.parent_id)
          if (!children) {
            children = []
          }
          children.push(label.id)
          // WARNING: Using immutable map
          childrenIDByParentID = childrenIDByParentID.set(label.parent_id, children)
        }
      })
      labels.forEach((label: LogLabelJSON) => {
        if (childrenIDByParentID.get(label.id)) {
          label.children = childrenIDByParentID.get(label.id) as string[]
        } else {
          label.children = []
        }
      })

      return {
        ...state,
        logLabels: labels,
        isFetching: false,
        error: null
      }

    case LogLabelActionType.FetchDurationSuccess:
      const currLabels = state.logLabels
      const durations = action.payload as LogLabelDurationJSON[]

      let durationMap = Map<string, number>()
      for (let i = 0; i < durations.length; i++) {
        durationMap = durationMap.set(durations[i].id, durations[i].duration)
      }
      for (let i = 0; i < currLabels.length; i++) {
        currLabels[i].duration = durationMap.get(currLabels[i].id) as number
      }

      return {
        ...state,
        logLabels: currLabels,
        error: null
      }

    case LogLabelActionType.CreateSuccess:
    case LogLabelActionType.UpdateSuccess:
    case LogLabelActionType.DeleteSuccess:
      return { ...state, error: null }

    case LogLabelActionType.Error:
      return {
        ...state,
        isFetching: false,
        error: action.error as string
      }

    case LogLabelActionType.SelectParent:
      return { ...state, selectedParentLabel: action.selectedLogLabel as LogLabelJSON}

    case LogLabelActionType.DeselectParent:
      return { ...state, selectedParentLabel: null}

    case LogLabelActionType.SelectChild:
      return { ...state, selectedChildLabel: action.selectedLogLabel as LogLabelJSON}

    case LogLabelActionType.DeselectChild:
      return { ...state, selectedChildLabel: null}

    default:
      return state
  }
}

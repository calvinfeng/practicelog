import React from 'react'
import { LogEntryJSON } from "../types"

export type LogEntryState = {
  logEntries: LogEntryJSON[]
  isFetching: boolean
  currPage: number
  hasNextPage: boolean
  selectedLogEntry: LogEntryJSON | null
  error: string | null
}

export enum LogEntryActionType {
  Fetch = 'FETCH',
  FetchSuccess = 'FETCH_SUCCESS',
  CreateSuccess = 'CREATE_SUCCESS',
  DeleteSuccess = 'DELETE_SUCCESS',
  UpdateSuccess = 'UPDATE_SUCCESS',
  Error = 'ERROR',
  Select = 'SELECT',
  Deselect = 'DESELECT',
  SetPage = 'SET_PAGE'
}

export type LogEntryAction = {
  type: LogEntryActionType
  page?: number
  payload?: LogEntryJSON[] | LogEntryJSON
  error?: string
  hasNextPage?: boolean
  selectedLogEntry?: LogEntryJSON
}

export function logEntryReducer(state: LogEntryState, action: LogEntryAction): LogEntryState {
  switch (action.type) {
    case LogEntryActionType.Fetch:
      return { ...state, error: null, isFetching: true }

    case LogEntryActionType.FetchSuccess:
      return {
        ...state,
        logEntries: action.payload as LogEntryJSON[],
        hasNextPage: action.hasNextPage as boolean,
        isFetching: false,
        error: null,
        selectedLogEntry: null
      }

    case LogEntryActionType.UpdateSuccess:
      const newState = { ... state, error: null, selectedLogEntry: null }
      const payload = action.payload as LogEntryJSON
      for (let i = 0; i < newState.logEntries.length; i++) {
        if (newState.logEntries[i].id === payload.id) {
          newState.logEntries[i] = payload
        }
      }
      return newState

    case LogEntryActionType.CreateSuccess:
    case LogEntryActionType.DeleteSuccess:
      return { ...state, error: null, selectedLogEntry: null }

    case LogEntryActionType.Error:
      return { ...state, isFetching: false, error: action.error as string }

    case LogEntryActionType.SetPage:
      return { ...state, currPage: action.page as number }

    case LogEntryActionType.Select:
      return { ...state, selectedLogEntry: action.selectedLogEntry as LogEntryJSON }

    case LogEntryActionType.Deselect:
      return { ...state, selectedLogEntry: null }

    default:
      return state
  }
}

interface ILogEntryContext {
  state: LogEntryState
  handleSelectLogEntry: (entry: LogEntryJSON) => void
  handleDeselectLogEntry: () => void
}

// Use {} as T to avoid complaints.
export const LogEntryContext = React.createContext<ILogEntryContext>({} as ILogEntryContext)
import React from 'react'
import { LogEntryJSON } from "../types"

interface ILogEntryContext {
  state: LogEntryState
  handleNextPage: () => void
  handlePrevPage: () => void
  handleSelectLogEntry: (entry: LogEntryJSON) => void
}

export const defaultLogEntryState: LogEntryState = {
  currPage: 1,
  hasNextPage: false,
  logEntries: [],
  error: null,
  selectedLogEntry: null
}

export const LogEntryContext = React.createContext<ILogEntryContext>({
  state: defaultLogEntryState,
  handleNextPage: () => {},
  handlePrevPage: () => {},
  handleSelectLogEntry: () => {}
})

export enum LogEntryActionType {
  Fetch = 'FETCH',
  Error = 'ERROR',
  Select = 'SELECT',
  SetPage = 'SET_PAGE',
}

export type LogEntryAction = {
  type: LogEntryActionType
  page?: number
  payload?: LogEntryJSON[]
  error?: string
  hasNextPage?: boolean
  selectedLogEntry?: LogEntryJSON
}

export type LogEntryState = {
  logEntries: LogEntryJSON[]
  currPage: number
  hasNextPage: boolean
  selectedLogEntry: LogEntryJSON | null
  error: string | null
}

export function logEntryReducer(state: LogEntryState, action: LogEntryAction): LogEntryState {
  switch (action.type) {
    case LogEntryActionType.Fetch:
      return {
        ...state,
        logEntries: action.payload as LogEntryJSON[],
        hasNextPage: action.hasNextPage as boolean,
        error: null,
        selectedLogEntry: null
      }
    case LogEntryActionType.Error:
      return {
        ...state,
        error: action.error as string
      }
    case LogEntryActionType.SetPage:
      return {
        ...state,
        currPage: action.page as number
      }
    case LogEntryActionType.Select:
      return {
        ...state,
        selectedLogEntry: action.selectedLogEntry as LogEntryJSON
      }
    default:
      return state
  }
}

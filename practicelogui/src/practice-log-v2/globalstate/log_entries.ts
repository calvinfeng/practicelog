import React from 'react'
import { LogEntryJSON } from "../types"

interface ILogEntryContext {
  state: LogEntryState
  handleNextPage: () => void
  handlePrevPage: () => void
}

export const defaultLogEntryState: LogEntryState = {
  currPage: 1,
  hasNextPage: false,
  logEntries: []
}

export const LogEntryContext = React.createContext<ILogEntryContext>({
  state: defaultLogEntryState,
  handleNextPage: () => {},
  handlePrevPage: () => {}
})

export enum LogEntryActionType {
  Fetch = 'FETCH',
  Error = 'ERROR',
  SetPage = 'SET_PAGE'
}

export type LogEntryAction = {
  type: LogEntryActionType
  page?: number
  payload?: LogEntryJSON[]
  error?: string
  hasNextPage?: boolean
}

export type LogEntryState = {
  logEntries: LogEntryJSON[]
  currPage: number
  hasNextPage: boolean
  error?: string
}

export function logEntryReducer(state: LogEntryState, action: LogEntryAction): LogEntryState {
  switch (action.type) {
    case LogEntryActionType.Fetch:
      return {
        ...state,
        logEntries: action.payload as LogEntryJSON[],
        hasNextPage: action.hasNextPage as boolean,
        error: undefined
      }
    case LogEntryActionType.Error:
      return {
        ...state,
        error: action.error
      }
    case LogEntryActionType.SetPage:
      return {
        ...state,
        currPage: action.page as number
      }
    default:
      return state
  }
}

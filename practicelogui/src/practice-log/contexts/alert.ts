import { AlertColor } from "@mui/material/Alert";

export type AlertState = {
  shown: boolean
  severity: AlertColor
  message: string
}

export enum AlertActionType {
  Show = 'SHOW',
  Hide = 'HIDE'
}

export type AlertAction = {
  type: AlertActionType
  severity?: AlertColor
  message?: string
}

export function alertReducer(state: AlertState, action: AlertAction): AlertState {
  switch (action.type) {
    case AlertActionType.Show:
      return {
        shown: true,
        severity: action.severity as AlertColor,
        message: action.message as string
      }

    case AlertActionType.Hide:
      return { ...state, shown: false }

    default:
      return state
  }
}

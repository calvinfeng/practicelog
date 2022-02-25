import React from 'react'
import axios from 'axios'
import { Button, List, ListItem, CircularProgress, Grid, Typography, Snackbar, Alert, AlertColor } from '@mui/material'

import { GoogleUserProfile } from '../../app/types'

// API
import {
  createLogEntry,
  deleteLogEntry,
  fetchLogEntriesByPage,
  updateLogAssignment,
  updateLogEntry
} from '../api/log_entries'
import { fetchLogTimeSeries } from '../api/log_time_series'
import { fetchLogLabelDurations, fetchLogLabels } from '../api/log_labels'

// Contexts
import {
  logEntryReducer,
  LogEntryAction,
  LogEntryActionType,
  LogEntryContext,
  LogEntryState
} from '../contexts/log_entries'
import { LogEntryJSON } from '../types'
import { LogTimeSeriesActionType, logTimeSeriesReducer } from '../contexts/log_time_series'
import { LogLabelAction, logLabelReducer } from '../contexts/log_labels'

// Components
import PracticeTimeLineChart from './metrics/PracticeTimeLineChart'
import LogEntryManagement from './log-entry-management/LogEntryManagement'
import AssignmentChecklistPopover from './AssignmentChecklistPopover'
import Heatmap from './metrics/Heatmap'
import LogTable from './LogTable'
import './PracticeLog.scss'
import { AlertActionType, alertReducer } from '../contexts/alert'

type Props = {
  currentUser: GoogleUserProfile | null
}

export default function PracticeLog(props: Props) {
  let idToken = ""
  if (props.currentUser) {
    idToken = props.currentUser.id_token
  }

  const http = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 1000,
    headers: {
      "Authorization": idToken
    }
  })

  // Setup default states
  const pageAnchor = React.useRef<null | HTMLDivElement>(null)
  const [popoverAnchor, setPopoverAnchor] = React.useState<HTMLButtonElement | null>(null)
  const [focusedLogEntry, setFocusedLogEntry] = React.useState<LogEntryJSON | null>(null)
  const [alert, dispatchAlertAction] = React.useReducer(alertReducer, {
    shown: false,
    severity: "info",
    message: ""
  })

  const [logEntryState, dispatchLogEntryAction] = React.useReducer(logEntryReducer, {
    currPage: 1,
    hasNextPage: false,
    isFetching: false,
    logEntries: [],
    error: null,
    selectedLogEntry: null
  })
  const [logTimeSeriesState, dispatchLogTimeSeriesAction] = React.useReducer(logTimeSeriesReducer, {
    isFetching: false,
    byMonth: [],
    byDay: [],
    total: 0,
    error: null
  })
  const [logLabelState, dispatchLogLabelAction] = React.useReducer(logLabelReducer, {
    logLabels: [],
    isFetching: false,
    selectedParentLabel: null,
    selectedChildLabel: null,
    error: null
  })

  /**
   * Fetch log entries asynchronously.
   */
  const handleFetchLogEntries = async () => {
    console.log('fetch log entries')
    dispatchLogEntryAction({ type: LogEntryActionType.Fetch })
    const action = await fetchLogEntriesByPage(http, logEntryState.currPage)
    dispatchLogEntryAction(action)
  }

  /**
   * Create a log entry and re-load the list of entries.
   * @param entry
   */
  const handleCreateLogEntry = async (entry: LogEntryJSON) => {
    let action: LogEntryAction
    console.log('create log entry')
    action = await createLogEntry(http, entry)
    dispatchLogEntryAction(action)
    console.log('re-fetch log entry')
    dispatchLogEntryAction({ type: LogEntryActionType.Fetch })
    action = await fetchLogEntriesByPage(http, logEntryState.currPage)
    dispatchLogEntryAction(action)
  }

  /**
   * Update a log entry.
   * @param entry
   */
  const handleUpdateLogEntry = async (entry: LogEntryJSON) => {
    console.log('update log entry', entry.id)
    const action = await updateLogEntry(http, entry)
    dispatchLogEntryAction(action)
    if (action.type === LogEntryActionType.UpdateSuccess) {
      dispatchAlertAction({ type: AlertActionType.Show, severity: "success", message: "successfully updated log entry" })
    } else {
      dispatchAlertAction({ type: AlertActionType.Show, severity: "error", message: action.error as string })
    }
  }

  /**
   * Update assignments of a log entry.
   * @param entry
   */
  const handleUpdateLogAssignments = async (entry: LogEntryJSON) => {
    console.log('update log assignment', entry.id)
    const action = await updateLogAssignment(http, entry)
    dispatchLogEntryAction(action)
    if (action.type === LogEntryActionType.UpdateSuccess) {
      dispatchAlertAction({ type: AlertActionType.Show, severity: "success", message: "successfully updated log assignment" })
    } else {
      dispatchAlertAction({ type: AlertActionType.Show, severity: "error", message: action.error as string })
    }
  }

  /**
   * Delete a log entry and re-load the list of entries.
   * @param entry
   */
  const handleDeleteLogEntry = async (entry: LogEntryJSON) => {
    let action: LogEntryAction
    console.log('delete log entry', entry.id)
    action = await deleteLogEntry(http, entry)
    dispatchLogEntryAction(action)
    console.log('re-fetch log entry')
    dispatchLogEntryAction({ type: LogEntryActionType.Fetch })
    action = await fetchLogEntriesByPage(http, logEntryState.currPage)
    dispatchLogEntryAction(action)
  }

  const handleFetchLogLabels = async () => {
    let action: LogLabelAction
    console.log('fetch log labels')
    action = await fetchLogLabels(http)
    dispatchLogLabelAction(action)
    action = await fetchLogLabelDurations(http)
    dispatchLogLabelAction(action)
  }

  /**
   * Fetch log time series data asynchronously
   */
  const handleFetchTimeSeries = async () => {
    console.log('fetch time series data')
    dispatchLogTimeSeriesAction({ type: LogTimeSeriesActionType.Fetch })
    const action = await fetchLogTimeSeries(http)
    dispatchLogTimeSeriesAction(action)
  }

  /**
   *
   * @param entry
   */
  const handleSelectLogEntry = (entry: LogEntryJSON) => {
    dispatchLogEntryAction({ type: LogEntryActionType.Select, selectedLogEntry: entry })
  }

  /**
   *
   */
  const handleDeselectLogEntry = () => {
    dispatchLogEntryAction({ type: LogEntryActionType.Deselect })
  }

  /**
   *
   */
  const handleScrollToBottom = () => {
    if (pageAnchor.current !== null) {
      pageAnchor.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  React.useEffect(() => { handleFetchLogEntries() }, [logEntryState.currPage])
  React.useEffect(() => { handleFetchTimeSeries() }, [])
  React.useEffect(() => { handleFetchLogLabels() }, [])

  return (
    <section className="PracticeLog">
      <LogEntryContext.Provider value={{
          state: logEntryState,
          handleSelectLogEntry,
          handleDeselectLogEntry
        }}>
        <AssignmentChecklistPopover
          focusedLogEntry={focusedLogEntry}
          popoverAnchor={popoverAnchor}
          handleClearPopoverAnchorEl={() => {
            setPopoverAnchor(null)
            setFocusedLogEntry(null)
          }}
          handleHTTPUpdateLogAssignments={handleUpdateLogAssignments} />
        <LogTable
          scrollToBottom={handleScrollToBottom}
          logEntries={logEntryState.logEntries}
          handleFocusLogEntryAndAnchorEl={
            (event: React.MouseEvent<HTMLButtonElement>, entry: LogEntryJSON) => {
              setFocusedLogEntry(entry)
              setPopoverAnchor(event.currentTarget)
            }
          }
          handleSelectLogEntry={handleSelectLogEntry}
          handleHTTPDeleteLogEntry={handleDeleteLogEntry} />
        <PaginationControlPanel
          logEntryState={logEntryState}
          handleNextPage={() => dispatchLogEntryAction({ type: LogEntryActionType.SetPage, page: logEntryState.currPage + 1})}
          handlePrevPage={() => dispatchLogEntryAction({ type: LogEntryActionType.SetPage, page: logEntryState.currPage - 1})} />
        <LogEntryManagement
          logLabels={logLabelState.logLabels}
          selectedLogEntry={logEntryState.selectedLogEntry}
          handleDeselectLogEntry={handleDeselectLogEntry}
          handleHTTPUpdateLogEntry={handleUpdateLogEntry}
          handleHTTPCreateLogEntry={handleCreateLogEntry} />
        <div ref={pageAnchor} />
        <Heatmap
          timeSeries={logTimeSeriesState.byDay} />
        <PracticeTimeLineChart
          timeSeries={logTimeSeriesState.byMonth} />
        <Snackbar
          open={alert.shown}
          autoHideDuration={6000}
          onClose={() => dispatchAlertAction({ type: AlertActionType.Hide })}>
          <Alert
            onClose={() => dispatchAlertAction({ type: AlertActionType.Hide })}
            severity={alert.severity}>
            {alert.message}
          </Alert>
        </Snackbar>
      </LogEntryContext.Provider>
    </section>
  )
}

type PaginationControlPanelProps = {
  logEntryState: LogEntryState
  handleNextPage: () => void
  handlePrevPage: () => void
}

function PaginationControlPanel(props: PaginationControlPanelProps) {
  return (
    <Grid container
      direction="row"
      justifyContent="flex-end"
      alignItems="baseline"
      spacing={1}
      className="pagination-control-panel">
      <Grid item>
        <Button variant="contained" color="primary" key="prev-page"
          disabled={props.logEntryState.currPage === 1}
          onClick={props.handlePrevPage}>
            Prev
        </Button>
      </Grid>
      <Grid item>
        <Button variant="contained" color="primary" key="next-page"
          disabled={!props.logEntryState.hasNextPage}
          onClick={props.handleNextPage}>
          Next Page
        </Button>
      </Grid>
      <Grid item>
        <Typography>Page {props.logEntryState.currPage} </Typography>
      </Grid>
    </Grid>
  )
}

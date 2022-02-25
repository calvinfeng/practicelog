import axios from 'axios'
import { Button, List, ListItem, Paper, Stack, CircularProgress, Grid, Typography } from '@mui/material'
import React from 'react'
import { GoogleUserProfile } from '../../app/types'
import { deleteLogEntry, fetchLogEntriesByPage } from '../api/log_entries'
import {
  LogEntryContext,
  logEntryReducer,
  LogEntryAction,
  LogEntryActionType,
  LogEntryState
} from '../contexts/log_entries'
import { LogEntryJSON } from '../types'
import './PracticeLog.scss'
import { is } from 'immutable'
import { LogTimeSeriesActionType, logTimeSeriesReducer } from '../contexts/log_time_series'
import { logLabelReducer } from '../contexts/log_labels'
import { fetchLogTimeSeries } from '../api/log_time_series'
import PracticeTimeLineChart from './metrics/PracticeTimeLineChart'
import Heatmap from './metrics/Heatmap'
import LogTable from './LogTable'

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
   * Fetch log entries asynchronously
   */
  const handleFetchLogEntries = async () => {
    console.log('fetch log entries')
    dispatchLogEntryAction({ type: LogEntryActionType.Fetch })
    const action = await fetchLogEntriesByPage(http, logEntryState.currPage)
    dispatchLogEntryAction(action)
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

  return (
    <section className="PracticeLog">
      <LogEntryContext.Provider value={{
          state: logEntryState,
          handleSelectLogEntry,
          handleDeselectLogEntry
        }}>
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
          handleNextPage={() => {
            dispatchLogEntryAction({ type: LogEntryActionType.SetPage, page: logEntryState.currPage + 1})
          }}
          handlePrevPage={() => {
            dispatchLogEntryAction({ type: LogEntryActionType.SetPage, page: logEntryState.currPage - 1})
          }}
        />
        <div ref={pageAnchor} />
        <Heatmap
          timeSeries={logTimeSeriesState.byDay} />
        <PracticeTimeLineChart
          timeSeries={logTimeSeriesState.byMonth} />
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

function EntryList(props) {
  const ctx = React.useContext(LogEntryContext)

  if (props.isFetching) {
    return <CircularProgress />
  }

  const listItems = ctx.state.logEntries.map((entry: LogEntryJSON) => {
    if (ctx.state.selectedLogEntry !== null && entry.id === ctx.state.selectedLogEntry.id) {
      return <ListItem key={entry.id}>{entry.date.toDateString()} <b>{entry.message}</b></ListItem>
    }
    return (
      <ListItem key={entry.id} onClick={() => ctx.handleSelectLogEntry(entry)}>
        {entry.date.toDateString()} {entry.message}
      </ListItem>
    )
  })
  return (
    <List>
      {listItems}
    </List>
  )
}

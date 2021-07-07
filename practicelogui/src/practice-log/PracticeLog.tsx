import React from 'react'
import {
  Typography,
  Grid,
  Button,
  Snackbar,
} from '@material-ui/core'
import MuiAlert, { AlertProps, Color } from '@material-ui/lab/Alert';
import axios, { AxiosInstance, AxiosResponse }  from 'axios'
import { Map } from 'immutable'
import _ from "lodash" // Import the entire lodash library

import { LogEntryJSON, LogLabelJSON, LogLabelDurationJSON, PracticeTimeSeriesDataPoint } from './types'
import LogTable from './LogTable'
import AssignmentChecklistPopover from './AssignmentChecklistPopover'
import LogEntryManagement from './log-entry-management/LogEntryManagement'
import LogLabelManagement from './log-label-management/LogLabelManagement'
import PracticeTimeLineChart from './metrics/PracticeTimeLineChart'
import Heatmap from './metrics/Heatmap'

import './PracticeLog.scss'

type Props = {
  IDToken: string
}

type DataStore = {
  logEntries: LogEntryJSON[]
  logLabels: LogLabelJSON[]

  practiceTimeSeriesByMonth: PracticeTimeSeriesDataPoint[]
  practiceTimeSeriesByDay: PracticeTimeSeriesDataPoint[]
  totalPracticeTime: number
}

type InternalState = {
  logLabelDurationFetched: boolean
}

type InteractionState = {
  selectedLogEntry: LogEntryJSON | null
  focusedLogEntry: LogEntryJSON | null

  pageNum: number
  hasNextPage: boolean

  popoverAnchor: HTMLButtonElement | null

  alertShown: boolean
  alertMessage: string
  alertSeverity: Color
}

type State = DataStore & InternalState & InteractionState

export default class PracticeLog extends React.Component<Props, State> {
  private http: AxiosInstance
  private pageAnchor: HTMLDivElement | null
  constructor(props: Props) {
    super(props)
    this.state = {
      logEntries: [],
      logLabels: [],
      totalPracticeTime: 0,
      logLabelDurationFetched: false,
      selectedLogEntry: null,
      focusedLogEntry: null,
      pageNum: 1,
      hasNextPage: false,
      popoverAnchor: null,
      alertShown: false,
      alertMessage: "",
      alertSeverity: "info",
      practiceTimeSeriesByMonth: [],
      practiceTimeSeriesByDay: []
    }
    this.http = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 1000,
      headers: {
        "Authorization": props.IDToken
      }
    });
    this.pageAnchor = null
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (this.state.pageNum !== prevState.pageNum) {
      this.fetchLogEntriesByPage(this.state.pageNum)
    }
  }

  componentDidMount() {
    this.fetchLogEntriesByPage(this.state.pageNum)
    this.fetchLogLabels()
    this.fetchTotalPracticeTime()
    this.fetchPracticeTimeSeries()
  }

  /**
   * This is an internal class helper function to populate log label duration
   * as state.
   */
  fetchLogLabelDurations() {
    this.http.get('/api/v1/log/labels/duration')
      .then((resp: AxiosResponse) => {
        const labels = _.cloneDeep(this.state.logLabels)
        const durations: LogLabelDurationJSON[] = resp.data.results
        // This is an immutable map
        let durationMap = Map<string, number>()
        for (let i = 0; i < durations.length; i++) {
          durationMap = durationMap.set(durations[i].id, durations[i].duration)
        }
        for (let i = 0; i < labels.length; i++) {
          labels[i].duration = durationMap.get(labels[i].id) as number
        }
        this.setState({
          logLabels: labels,
          logLabelDurationFetched: true
        })
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to list log label durations due to ${reason}`,
          alertSeverity: "error"
        })
      })
  }

  /**
   * This is an internal class helper to populate the state variable totalPracticeDuration.
   */
  fetchTotalPracticeTime() {
    this.http.get('/api/v1/log/entries/duration')
      .then((resp: AxiosResponse) => {
        this.setState({
          totalPracticeTime: resp.data.in_minutes as number
        })
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to fetch log entries total duration to ${reason}`,
          alertSeverity: "error"
        })
      })
  }

  /**
   * This is an internal class helper to populate the state variable durationTimeSeries.
   * By default this will fetch time series by month but maybe I will add a radial button to choose
   * either by day or by month.
   */
  fetchPracticeTimeSeries() {
    this.http.get('/api/v1/log/entries/duration/time-series?group=by_month')
      .then((resp: AxiosResponse) => {
        this.setState({
          practiceTimeSeriesByMonth: resp.data.time_series as PracticeTimeSeriesDataPoint[]
        })
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to fetch log entry time series duration due to ${reason}`,
          alertSeverity: "error"
        })
      })

    this.http.get('/api/v1/log/entries/duration/time-series?group=by_day')
      .then((resp: AxiosResponse) => {
        this.setState({
          practiceTimeSeriesByDay: resp.data.time_series as PracticeTimeSeriesDataPoint[]
        })
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to fetch log entry time series duration due to ${reason}`,
          alertSeverity: "error"
        })
      })
  }

  /**
   * This is an internal class helper function to populate log labels as state.
   */
  fetchLogLabels() {
    this.http.get('/api/v1/log/labels')
      .then((resp: AxiosResponse) => {
        const labels: LogLabelJSON[] = resp.data.results
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
        this.setState({
          logLabels: labels
        })
      })
      .then(() => {
        this.fetchLogLabelDurations()
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to list log labels due to ${reason}`,
          alertSeverity: "error"
        })
      })
  }

  /**
   * This is an internal class helper function to populate log entries as state.
   * @param page indicates which page to fetch from.
   */
  fetchLogEntriesByPage(page: number) {
    this.http.get('/api/v1/log/entries', {
        params: {
          "page": page
        }
      })
      .then((resp: AxiosResponse) => {
        // time.Time is parsed as string. The string needs to be converted back into date object.
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

        // If a log entry is selected, when page loads, it should refresh and update the selected
        // entry. Otherwise, let it stay the same.
        let selectedLogEntry = this.state.selectedLogEntry
        if (selectedLogEntry !== null) {
          let target = entries.find((entry: LogEntryJSON) => entry.id === (selectedLogEntry as LogEntryJSON).id)
          if  (target) {
            selectedLogEntry = target
          }
        }

        this.setState({
          logEntries: entries,
          hasNextPage: resp.data.more,
          selectedLogEntry: selectedLogEntry
        })
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to list log entries due to ${reason}`,
          alertSeverity: "error"
        })
      })
  }
  /**
   * This is a callback for child components to call to create a log label.
   * @param label is the log label to submit to API for create.
   */
  handleHTTPCreateLogLabel = (label: LogLabelJSON) => {
    this.http.post(`/api/v1/log/labels`, label)
    .then((resp: AxiosResponse) => {
      if (resp.status === 201) {
        this.fetchLogLabels()
        this.setState({
          alertShown: true,
          alertMessage: `Successfully created log label ${label.name}`,
          alertSeverity: "success"
        })
      }
    })
    .catch((reason: any) => {
      this.setState({
        alertShown: true,
        alertMessage: `Failed to create log label ${label.name} due to ${reason}`,
        alertSeverity: "error"
      })
    })
  }
  /**
   * This is a callback for child components to call to update a log label.
   * @param label is the log label to submit to API for update.
   */
  handleHTTPUpdateLogLabel = (label: LogLabelJSON) => {
    this.http.put(`/api/v1/log/labels/${label.id}`, label)
    .then((resp: AxiosResponse) => {
      if (resp.status === 200) {
        this.fetchLogLabels()
        this.fetchLogEntriesByPage(this.state.pageNum)
        this.setState({
          alertShown: true,
          alertMessage: `Successfully updated log label ${label.name}`,
          alertSeverity: "success"
        })
      }
    })
    .catch((reason: any) => {
      this.setState({
        alertShown: true,
        alertMessage: `Failed to update log label ${label.name} due to ${reason}`,
        alertSeverity: "error"
      })
    })
  }
  /**
   * This is a callback for child components to call to delete a log label.
   * @param label is the log label to submit to API for delete.
   */
  handleHTTPDeleteLogLabel = (label: LogLabelJSON) => {
    this.http.delete(`/api/v1/log/labels/${label.id}`)
    .then((resp: AxiosResponse) => {
      if (resp.status === 200) {
        this.fetchLogLabels()
        this.fetchLogEntriesByPage(this.state.pageNum)
        this.setState({
          alertShown: true,
          alertMessage: `Successfully deleted log label ${label.name}`,
          alertSeverity: "success"
        })
      }
    })
    .catch((reason: any) => {
      this.setState({
        alertShown: true,
        alertMessage: `Failed to delete log label ${label.name} due to ${reason}`,
        alertSeverity: "error"
      })
    })
  }
  /**
   * This is a callback for child components to call to delete a log entry.
   * @param entry is the entry to submit to API for create.
   */
  handleHTTPDeleteLogEntry = (entry: LogEntryJSON) => {
    this.http.delete(`/api/v1/log/entries/${entry.id}`)
      .then((resp: AxiosResponse) => {
        if (resp.status === 200) {
          this.fetchLogEntriesByPage(this.state.pageNum)
          this.setState({
            alertShown: true,
            alertMessage: `Successfully deleted log entry ${entry.id}`,
            alertSeverity: "success"
          })
        }
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to delete log entry ${entry.id} due to ${reason}`,
          alertSeverity: "error"
        })
      })
  }
  /**
   * This is a callback for child components to call to create a log entry.
   * @param entry is the entry to submit to API For create.
   */
  handleHTTPCreateLogEntry = (entry: LogEntryJSON) => {
    this.http.post(`/api/v1/log/entries`, entry)
      .then((resp: AxiosResponse) => {
        if (resp.status === 201) {
          this.fetchLogEntriesByPage(this.state.pageNum)
          this.setState({
            alertShown: true,
            alertMessage: "Successfully created new log entry",
            alertSeverity: "success",
            selectedLogEntry: null
          })
        }
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to create log entry due to ${reason}`,
          alertSeverity: "error"
        })
      })
  }
  /**
   * This is a callback for child components to call to update a log entry.
   * It is unnecessary to refresh the page with a HTTP request. I expect frequent update here.
   * @param entry is the entry to submit to API for assignments update.
   */
  handleHTTPUpdateLogAssignments = (entry: LogEntryJSON) => {
    this.http.put(`/api/v1/log/entries/${entry.id}/assignments`, entry)
      .then((resp: AxiosResponse) => {
        const updatedEntry: LogEntryJSON = resp.data
        const entries = this.state.logEntries
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].id === updatedEntry.id) {
            entries[i] = {
              id: resp.data.id,
              date: new Date(resp.data.date),
              username: resp.data.username,
              labels: resp.data.labels,
              message: resp.data.message,
              details: resp.data.details,
              duration: resp.data.duration,
              assignments: resp.data.assignments
            }
            break
          }
        }
        this.setState({
          logEntries: entries,
          focusedLogEntry: updatedEntry,
          alertShown: true,
          alertSeverity: "success",
          alertMessage: `Successfully updated entry ${entry.id} assignments`
        })
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to update log entry assignment due to ${reason}`,
          alertSeverity: "error"
        })
      })
  }
  /**
   * This is a callback for child components to call to update a log entry.
   * It is unnecessary to refresh the page with a HTTP request. I expect frequent update here.
   * @param entry is the entry to submit to API for update.
   */
  handleHTTPUpdateLogEntry = (entry: LogEntryJSON) => {
    this.http.put(`/api/v1/log/entries/${entry.id}`, entry)
      .then((resp: AxiosResponse) => {
        const updatedEntry: LogEntryJSON = resp.data
        const entries = this.state.logEntries
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].id === updatedEntry.id) {
            entries[i] = {
              id: resp.data.id,
              date: new Date(resp.data.date),
              username: resp.data.username,
              labels: resp.data.labels,
              message: resp.data.message,
              details: resp.data.details,
              duration: resp.data.duration,
              assignments: resp.data.assignments
            }
            break
          }
        }
        this.setState({
          logEntries: entries,
          selectedLogEntry: null,
          alertShown: true,
          alertSeverity: "success",
          alertMessage: `Successfully updated entry ${entry.id}`
        })
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to update log entry due to ${reason}`,
          alertSeverity: "error"
        })
      })
  }

  scrollToBottom = () => {
    if (this.pageAnchor) {
      this.pageAnchor.scrollIntoView({ behavior: 'smooth' });
    }
  }

  handleClearPopoverAnchorEl = () => {
    this.setState({ popoverAnchor: null, focusedLogEntry: null })
  }

  handleSelectLogEntry = (log: LogEntryJSON) => {
    this.setState({ selectedLogEntry: log })
  }

  handleDeselectLogEntry = () => {
    this.setState({ selectedLogEntry: null })
  }

  handleFocusLogEntryAndAnchorEl = (event: React.MouseEvent<HTMLButtonElement>, log: LogEntryJSON) => {
    this.setState({
      focusedLogEntry: log,
      popoverAnchor: event.currentTarget
    })
  }

  handleCloseAlert = (_ ?: React.SyntheticEvent, reason?: string) => {
    if (reason !== 'clickaway') {
      this.setState({alertShown: false});
    }
  };

  get PaginationControlPanel() {
    const handlePrevPage = () => {
      this.setState({ pageNum: this.state.pageNum - 1 })
    }

    const handleNextPage = () => {
      this.setState({ pageNum: this.state.pageNum + 1 })
    }

    const items: JSX.Element[] = []
    if (this.state.pageNum > 1) {
      items.push(
        <Grid item>
          <Button variant="contained" color="primary" onClick={handlePrevPage}>Prev</Button>
        </Grid>
      )
    }

    if (this.state.hasNextPage) {
      items.push(
        <Grid item>
          <Button variant="contained" color="primary" onClick={handleNextPage}>Next</Button>
        </Grid>
      )
    }

    items.push(
      <Grid item>
        <Typography>Page {this.state.pageNum} </Typography>
      </Grid>
    )

    return (
      <Grid container
        direction="row"
        justify="flex-end"
        alignItems="baseline"
        spacing={1}
        className="pagination-control-panel">
        {items}
    </Grid>
    )
  }

  render() {
    return (
      <section className="PracticeLog">
        <AssignmentChecklistPopover
          focusedLogEntry={this.state.focusedLogEntry}
          popoverAnchor={this.state.popoverAnchor}
          handleClearPopoverAnchorEl={this.handleClearPopoverAnchorEl}
          handleHTTPUpdateLogAssignments={this.handleHTTPUpdateLogAssignments} />
        <LogTable
          scrollToBottom={this.scrollToBottom}
          logEntries={this.state.logEntries}
          handleFocusLogEntryAndAnchorEl={this.handleFocusLogEntryAndAnchorEl}
          handleSelectLogEntry={this.handleSelectLogEntry}
          handleHTTPDeleteLogEntry={this.handleHTTPDeleteLogEntry} />
        {this.PaginationControlPanel}
        <div ref={pageAnchor => { this.pageAnchor = pageAnchor; }} />
        <LogEntryManagement
          logLabels={this.state.logLabels}
          selectedLogEntry={this.state.selectedLogEntry}
          handleDeselectLogEntry={this.handleDeselectLogEntry}
          handleHTTPUpdateLogEntry={this.handleHTTPUpdateLogEntry}
          handleHTTPCreateLogEntry={this.handleHTTPCreateLogEntry} />
        <LogLabelManagement
          logLabels={this.state.logLabels}
          logLabelDurationFetched={this.state.logLabelDurationFetched}
          handleHTTPCreateLogLabel={this.handleHTTPCreateLogLabel}
          handleHTTPUpdateLogLabel={this.handleHTTPUpdateLogLabel}
          handleHTTPDeleteLogLabel={this.handleHTTPDeleteLogLabel} />
        <Heatmap
          timeSeries={this.state.practiceTimeSeriesByDay} />
        <PracticeTimeLineChart
          timeSeries={this.state.practiceTimeSeriesByMonth} />
        <Snackbar
          open={this.state.alertShown}
          autoHideDuration={6000}
          onClose={this.handleCloseAlert}>
          <Alert
            onClose={this.handleCloseAlert}
            severity={this.state.alertSeverity}>
            {this.state.alertMessage}
          </Alert>
        </Snackbar>
      </section>
    )
  }
}

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}
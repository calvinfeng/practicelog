import React from 'react'
import './PracticeLog.scss'

import {
  Typography,
  Grid,
  Button,
  Snackbar,
} from '@material-ui/core'
import MuiAlert, { AlertProps, Color } from '@material-ui/lab/Alert';
import axios, { AxiosInstance, AxiosResponse }  from 'axios'

import { LogEntryJSON, LogLabelJSON, LogLabelDurationJSON } from '../shared/type_definitions'
import LogTable from '../components/LogTable'
import LogEntryManagement from '../components/log_entry_management/LogEntryManagement'
import LogLabelManagement from '../components/LogLabelManagement'
import AssignmentChecklistPopover from '../components/AssignmentChecklistPopover'
import DurationViewer from '../components/DurationViewer';
import { Map } from 'immutable'

type Props = {
  IDToken: string
}

type State = {
  // Store
  logEntries: LogEntryJSON[]
  logLabels: LogLabelJSON[]
  logLabelDurations: Map<string, number>

  // User interaction
  selectedLogEntry: LogEntryJSON | null
  focusedLogEntry: LogEntryJSON | null
  
  // Paginations
  pageNum: number
  hasNextPage: boolean
  
  // Popover
  popoverAnchor: HTMLButtonElement | null
  
  // Alerts
  alertShown: boolean
  alertMessage: string
  alertSeverity: Color
}

export default class PracticeLog extends React.Component<Props, State> {
  private http: AxiosInstance
  private pageAnchor: HTMLDivElement | null
  constructor(props: Props) {
    super(props)
    this.state = {
      logEntries: [],
      logLabels: [],
      logLabelDurations: Map<string, number>(),
      selectedLogEntry: null,
      focusedLogEntry: null,
      pageNum: 1,
      hasNextPage: false,
      popoverAnchor: null,
      alertShown: false,
      alertMessage: "",
      alertSeverity: "info"
    }
    this.http = axios.create({
      baseURL: `${process.env.REACT_APP_API_URL}`,
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
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to list log labels due to ${reason}`,
          alertSeverity: "error"
        })
      })
  }

  /**
   * This fetches log label duration from server.
   * @param labelID indicates which label to fetch duration from.
   */
  fetchLogLabelDuration = (labelID: string) => {
    this.http.get(`/api/v1/log/labels/${labelID}/duration`)
      .then((resp: AxiosResponse) => {
        const payload: LogLabelDurationJSON = resp.data
        this.setState({
          logLabelDurations: this.state.logLabelDurations.set(payload.id, payload.duration)
        })
      })
      .catch((reason: any) => {
        this.setState({
          alertShown: true,
          alertMessage: `Failed to list log label duration due to ${reason}`,
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
            user_id: resp.data.results[i].user_id,
            labels: resp.data.results[i].labels,
            message: resp.data.results[i].message,
            details: resp.data.results[i].details,
            duration: resp.data.results[i].duration,
            assignments: resp.data.results[i].assignments
          })
        }

        let selectedLogEntry = this.state.selectedLogEntry
        if (selectedLogEntry !== null) {
          entries.find((entry: LogEntryJSON) => entry.id === (selectedLogEntry as LogEntryJSON).id)
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
              user_id: resp.data.user_id,
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
              user_id: resp.data.user_id,
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

  // TODO: Refactor this out
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

    // Due to the lack of a Redux store, function to set states have to be passed around.
    // TODO Pass SelectedLogEntry to LogAssignmentManagement
    return (
      <section className="PracticeLog">
        <DurationViewer 
          fetchLogLabelDuration={this.fetchLogLabelDuration}
          logLabels={this.state.logLabels}
          logLabelDurations={this.state.logLabelDurations} />
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
        <LogEntryManagement
          logLabels={this.state.logLabels} 
          selectedLogEntry={this.state.selectedLogEntry}
          handleDeselectLogEntry={this.handleDeselectLogEntry} 
          handleHTTPUpdateLogEntry={this.handleHTTPUpdateLogEntry}
          handleHTTPCreateLogEntry={this.handleHTTPCreateLogEntry} />
        <LogLabelManagement
          logLabels={this.state.logLabels}
          handleHTTPCreateLogLabel={this.handleHTTPCreateLogLabel}
          handleHTTPUpdateLogLabel={this.handleHTTPUpdateLogLabel}
          handleHTTPDeleteLogLabel={this.handleHTTPDeleteLogLabel} />
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
        <div ref={pageAnchor => { this.pageAnchor = pageAnchor; }} />  
      </section>
    )
  }
}

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}
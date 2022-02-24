import axios from 'axios'
import { Button, List, ListItem, Paper, Stack } from '@mui/material'
import React from 'react'
import { GoogleUserProfile } from '../../app/types'
import { fetchLogEntriesByPage } from '../api/log_entries'
import {
  defaultLogEntryState,
  LogEntryContext,
  logEntryReducer,
  LogEntryAction,
  LogEntryActionType,
  LogEntryState
} from '../globalstate/log_entries'
import { LogEntryJSON } from '../types'

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

  const pageAnchor = React.useRef<null | HTMLDivElement>(null)

  // Default states
  const [logEntryState, dispatchLogEntryAction] = React.useReducer(logEntryReducer, defaultLogEntryState)

  React.useEffect(() => {
    console.log('fetch log entries')
    fetchLogEntriesByPage(http, logEntryState.currPage)
      .then((action: LogEntryAction) => dispatchLogEntryAction(action))
  }, [logEntryState.currPage])

  const handleNextPage = () => {
    dispatchLogEntryAction({ type: LogEntryActionType.SetPage, page: logEntryState.currPage + 1})
  }
  const handlePrevPage = () => {
    dispatchLogEntryAction({ type: LogEntryActionType.SetPage, page: logEntryState.currPage - 1})
  }
  const handleSelectLogEntry = (entry: LogEntryJSON) => {
    dispatchLogEntryAction({ type: LogEntryActionType.Select, selectedLogEntry: entry })
  }

  const handleScrollToBottom = () => {
    if (pageAnchor.current !== null) {
      pageAnchor.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <LogEntryContext.Provider value={{
      state: logEntryState, handleNextPage, handlePrevPage, handleSelectLogEntry}}>
      <Paper style={{"margin": "1rem"}}>
        <ButtonToolbar />
        <EntryList />
        <div ref={pageAnchor} />
      </Paper>
    </LogEntryContext.Provider>
  )
}

function EntryList(props) {
  const ctx = React.useContext(LogEntryContext)

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

function ButtonToolbar() {
  const logEntryContext = React.useContext(LogEntryContext)
  return (
    <Stack direction="row" spacing={2}>
      <Button key="prev-page"
        disabled={logEntryContext.state.currPage === 1}
        onClick={logEntryContext.handlePrevPage}>
        Prev Page
      </Button>
      <Button key="next-page"
        disabled={!logEntryContext.state.hasNextPage}
        onClick={logEntryContext.handleNextPage}>
        Next Page
      </Button>
    </Stack>
  )
}

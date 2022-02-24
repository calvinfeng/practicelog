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

  // Default states
  const [logEntryState, dispatchLogEntryAction] = React.useReducer(logEntryReducer, defaultLogEntryState)

  React.useEffect(() => {
    fetchLogEntriesByPage(http, logEntryState.currPage)
      .then((action: LogEntryAction) => dispatchLogEntryAction(action))
  }, [logEntryState.currPage])

  const handleNextPage = () => {
    dispatchLogEntryAction({ type: LogEntryActionType.SetPage, page: logEntryState.currPage + 1})
  }
  const handlePrevPage = () => {
    dispatchLogEntryAction({ type: LogEntryActionType.SetPage, page: logEntryState.currPage - 1})
  }

  return (
    <LogEntryContext.Provider value={{state: logEntryState, handleNextPage, handlePrevPage}}>
      <Paper style={{"margin": "1rem"}}>
        <ButtonToolbar />
        <EntryList />
      </Paper>
    </LogEntryContext.Provider>
  )
}

function EntryList() {
  const logEntryContext = React.useContext(LogEntryContext)

  const listItems = logEntryContext.state.logEntries.map((entry: LogEntryJSON) => {
    return <ListItem key={entry.id}>{entry.date.toDateString()} {entry.message}</ListItem>
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

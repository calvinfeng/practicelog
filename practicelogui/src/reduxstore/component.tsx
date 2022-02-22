import React from 'react'
import { Button, Paper, Typography } from '@material-ui/core'

import { useAppDispatch, useAppSelector } from '.'
import {
    decrement,
    increment,
    incrementByAmount,
    incrementAsync,
    selectCount,
    selectStatus
} from './counter_slice'
import {
  asyncFetchLogLabels,
  selectLogLabels,
  selectIsLoading,
  selectErrorMessage
} from './log_label_slice'
import axios from 'axios'

type CounterProps = {
}

export function Counter(props: CounterProps) {
  const count = useAppSelector(selectCount)
  const status = useAppSelector(selectStatus)
  const dispatch = useAppDispatch()

  return (
    <div>
      <p>Current Count {count}</p>
      <p>Status: {status}</p>
      <button onClick={() => dispatch(increment())}>
        Increment
      </button>
      <button onClick={() => dispatch(decrement())}>
        Decrement
      </button>
      <button onClick={() => dispatch(incrementAsync(1))}>
        Increment Async
      </button>
      <button>Decrement</button>
    </div>
  )
}

export function CounterDisplay() {
  const count = useAppSelector(selectCount)
  const status = useAppSelector(selectStatus)
  return (
    <Paper>
      <Typography>Current Count {count}</Typography>
      <Typography>Current Status: {status}</Typography>
    </Paper>
  )
}

export function LogLabelDisplay(props) {
  const logLabels = useAppSelector(selectLogLabels)
  const isLoading = useAppSelector(selectIsLoading)
  const errorMessage = useAppSelector(selectErrorMessage)
  const dispatch = useAppDispatch()
  return (
    <Paper>
      <Typography>Current Log Labels Count {logLabels.length}</Typography>
      <Typography>Is Loading?: {isLoading}</Typography>
      <Typography>Error? {errorMessage}</Typography>
      <Button onClick={() => dispatch(asyncFetchLogLabels(axios))}>Fetch</Button>
    </Paper>
  )
}

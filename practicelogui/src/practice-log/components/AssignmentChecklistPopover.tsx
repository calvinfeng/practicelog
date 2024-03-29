import React from 'react'
import {
  Checkbox,
  Paper,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'

import { LogEntryJSON, LogAssignmentJSON } from '../types'
import './AssignmentChecklistPopover.scss'

type Props = {
  focusedLogEntry: LogEntryJSON | null
  popoverAnchor: HTMLButtonElement | null
  handleClearPopoverAnchorEl: () => void
  handleHTTPUpdateLogAssignments: (entry: LogEntryJSON) => void
}

export default function AssignmentChecklistPopover(props: Props) {
  let assignments: LogAssignmentJSON[] = []
  if (props.focusedLogEntry !== null && props.focusedLogEntry.assignments) {
    assignments = props.focusedLogEntry.assignments
  }

  const makeHandlerBoxCheck = (position: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (props.focusedLogEntry === null) {
      return
    }
    const entryToUpdate: LogEntryJSON = props.focusedLogEntry as LogEntryJSON
    entryToUpdate.assignments[position].completed = event.target.checked
    console.log(entryToUpdate.assignments[position].name, 'set to', event.target.checked)
    props.handleHTTPUpdateLogAssignments(entryToUpdate)
  }

  const content = (
    <TableContainer component={Paper} className="table-content">
      <Table className={"assignment-list-table-view"} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="left">Item</TableCell>
            <TableCell align="center">Done</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            assignments.map((assignment: LogAssignmentJSON) => (
              <TableRow key={`assignment-item-${assignment.position}`}>
                <TableCell align="left">
                  {assignment.name}
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    onChange={makeHandlerBoxCheck(assignment.position)}
                    checked={assignment.completed}
                    inputProps={{ 'aria-label': 'primary checkbox' }} />
                </TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
    </TableContainer>
  )

  return (
    <Popover
      className="AssignmentChecklistPopover"
      id={"assignment-popover"}
      open={Boolean(props.popoverAnchor)}
      anchorEl={props.popoverAnchor}
      onClose={props.handleClearPopoverAnchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}>
      {content}
    </Popover>
  )
}

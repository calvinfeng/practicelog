import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@material-ui/core'
import { DeleteConfirmationTarget, LogLabelJSON } from '../types'

type Props = {
  open: boolean
  handleClose: () => void
  handleDeleteChildLabel: () => void
  handleDeleteParentLabel: () => void
  selectedParentLabel: LogLabelJSON | null
  selectedChildLabel: LogLabelJSON | null
  target: DeleteConfirmationTarget
}

export default function DeleteConfirmation(props: Props) {
  if (props.selectedChildLabel != null && props.target === DeleteConfirmationTarget.Child) {
    return (
      <Dialog open={props.open} onClose={props.handleClose}>
        <DialogTitle>Delete {props.selectedChildLabel.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {props.selectedChildLabel.name}?
          </DialogContentText>
          <DialogContentText>
            Child label {props.selectedChildLabel.id} will be deleted. The effect will propagate to
            all log entries.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={props.handleClose} color="primary">Cancel</Button>
          <Button onClick={props.handleClose} color="secondary" disabled={true}>
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  if (props.selectedParentLabel != null && props.target === DeleteConfirmationTarget.Parent) {
    return (
      <Dialog open={props.open} onClose={props.handleClose}>
        <DialogTitle>Delete {props.selectedParentLabel.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {props.selectedParentLabel.name}?
          </DialogContentText>
          <DialogContentText>
            Parent label {props.selectedParentLabel.id} will be deleted. This will affect all nested
            child labels and log entries.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={props.handleClose} color="primary">Cancel</Button>
          <Button onClick={props.handleClose} color="secondary" disabled={true}>
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return <div></div>
}
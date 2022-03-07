import React from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip, Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { ExpandMore, MusicNote } from '@material-ui/icons';
import { DeleteConfirmationTarget, LogLabelJSON, nilUUID } from '../../types';
import { LogLabelContext } from '../../contexts/log_labels';
import './LogLabelManagement.scss'

type TextFieldState = {
  parentLabelName: string
  childLabelName: string
}

const initialState: TextFieldState = {
  parentLabelName: "",
  childLabelName: "",
}

export default function LogLabelManagement() {
  const [textField,setTextField] = React.useState<TextFieldState>(initialState)
  const [isDeleteDialogShown, setDeleteDialogShown] = React.useState<boolean>(false)
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteConfirmationTarget>(DeleteConfirmationTarget.None)

  return (
    <Paper className="LabelManagement">
      <Typography variant="h5">Manage Labels</Typography>
      <Grid
          style={{ width: "100%", marginTop: "1rem" }}
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          container
          spacing={1}>
          <LabelSelectPanel
            textField={textField}
            setTextField={setTextField} />
          <LabelEditPanel
            textField={textField}
            setTextField={setTextField}
            setDeleteDialogShown={setDeleteDialogShown}
            setDeleteTarget={setDeleteTarget} />
      </Grid>
      <DeleteConfirmation
          setTextField={setTextField}
          target={deleteTarget}
          open={isDeleteDialogShown}
          handleClose={() => setDeleteDialogShown(false)} />
    </Paper>
  )
}

type PanelProps = {
  textField: TextFieldState
  setTextField: (value: React.SetStateAction<TextFieldState>) => void
}

function LabelSelectPanel(props: PanelProps) {
  const ctx = React.useContext(LogLabelContext)

  const makeSelectParentLabelHandler = (label: LogLabelJSON | null) => () => {
    if (label === null) {
      props.setTextField({...initialState})
      ctx.handleDeselectParentLabel()
    } else {
      props.setTextField(prevState => ({
        ...initialState,
        inputParentLabelName: label.name,
      }))
      ctx.handleSelectParentLabel(label)
      ctx.handleDeselectChildLabel()
    }
  }

  const makeSelectChildLabelHandler = (label: LogLabelJSON | null) => () => {
    if (label === null) {
      props.setTextField(prevState => ({
        ...prevState,
        childLabelName: "",
      }))
      ctx.handleDeselectChildLabel()
    } else {
      props.setTextField(prevState => ({
        ...prevState,
        childLabelName: label.name,
      }))
      ctx.handleSelectChildLabel(label)
    }
  }

  const parents: JSX.Element[] = ctx.state.logLabels
    .filter((label: LogLabelJSON) => label.parent_id === nilUUID)
    .map((label: LogLabelJSON) => {
      let style = { margin: "0.1rem" }
      let handler = makeSelectParentLabelHandler(label)
      if (ctx.state.selectedParentLabel !== null && ctx.state.selectedParentLabel.id === label.id) {
        style["background"] = "green"
        handler = makeSelectParentLabelHandler(null)
      }
      return (
        <Grid item key={label.name}>
          <Chip onClick={handler} style={style} label={label.name} icon={<MusicNote />} color="primary" />
        </Grid>
      )
    })

  let children: JSX.Element[] = ctx.state.logLabels
  .filter((label: LogLabelJSON) => {
    if (ctx.state.selectedParentLabel === null) {
      return false
    }
    return label.parent_id === ctx.state.selectedParentLabel.id
  })
  .map((label: LogLabelJSON) => {
    let style = { margin: "0.1rem" }
    let handler = makeSelectChildLabelHandler(label)

    if (ctx.state.selectedParentLabel !== null && ctx.state.selectedChildLabel !== null &&
      ctx.state.selectedChildLabel.id === label.id) {
      style["background"] = "green"
      handler = makeSelectChildLabelHandler(null)
    }

    return (
      <Grid item key={label.name}>
        <Chip onClick={handler} style={style} label={label.name} icon={<MusicNote />} color="primary" />
      </Grid>
    )
  })
  if (children.length === 0) {
    children = [<Typography key="no-nested-child">No nested child labels</Typography>]
  }

  return (
    <Grid container direction="column" spacing={0} style={{ width: "65%", minHeight: "400px" }}>
      <Accordion expanded={true}>
        <AccordionSummary
          // expandIcon={<ExpandMore />}
          aria-controls="panel1a-content" id="panel1a-header">
        <Typography>Parent Labels</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={0} direction="row">{parents}</Grid>
      </AccordionDetails>
      </Accordion>
      <Accordion expanded={ctx.state.selectedParentLabel!==null}>
        <AccordionSummary
          // expandIcon={<ExpandMore />}
          aria-controls="child-labels-content" id="child-labels-header">
        <Typography>Child Labels</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={0} direction="row">{children}</Grid>
        </AccordionDetails>
      </Accordion>
    </Grid>
  )
}

type EditPanelProps = {
  textField: TextFieldState
  setTextField: (value: React.SetStateAction<TextFieldState>) => void
  setDeleteDialogShown: (value: React.SetStateAction<boolean>) => void
  setDeleteTarget: (value: React.SetStateAction<DeleteConfirmationTarget>) => void
}

function LabelEditPanel(props: EditPanelProps) {
  const ctx = React.useContext(LogLabelContext)

  const resetUI = () => {
    ctx.handleDeselectChildLabel()
    ctx.handleDeselectParentLabel()
    props.setTextField({...initialState})
  }
  const handleCreateChildLabel = () => {
    if (ctx.state.selectedParentLabel !== null ) {
      const newLabel: LogLabelJSON = {
        id: nilUUID,
        parent_id: ctx.state.selectedParentLabel.id,
        name: props.textField.childLabelName,
        duration: 0,
        children: []
      }
      ctx.handleCreateLogLabel(newLabel)
      resetUI()
    }
  }
  const handleUpdateChildLabel = () => {
    if (ctx.state.selectedChildLabel !== null) {
      const payload: LogLabelJSON = {
        id: ctx.state.selectedChildLabel.id,
        parent_id: ctx.state.selectedChildLabel.parent_id,
        name: props.textField.childLabelName,
        duration: 0,
        children: []
      }
      ctx.handleUpdateLogLabel(payload)
      resetUI()
    }
  }
  const handleCreateParentLabel = () => {
    const newLabel: LogLabelJSON = {
      id: nilUUID,
      parent_id: null,
      children: [],
      name: props.textField.parentLabelName,
      duration: 0
    }
    ctx.handleCreateLogLabel(newLabel)
    resetUI()
  }
  const handleUpdateParentLabel = () => {
    if (ctx.state.selectedParentLabel !== null) {
      const payload: LogLabelJSON = {
        id: ctx.state.selectedParentLabel.id,
        parent_id: nilUUID,
        name: props.textField.parentLabelName,
        duration: 0,
        children: []
      }
      ctx.handleUpdateLogLabel(payload)
      resetUI()
    }
  }
  const handleChildLabelNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    props.setTextField(prevState => ({...prevState, childLabelName: ev.target.value }))
  }
  const handleParentLabelNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    props.setTextField(prevState => ({...prevState, parentLabelName: ev.target.value }))
  }
  const makeHandleDeleteClick = (target: DeleteConfirmationTarget) => () => {
    props.setDeleteDialogShown(true)
    props.setDeleteTarget(target)
  }

  const selectedChildButtonGroup = () => {
    if (ctx.state.selectedParentLabel === null || ctx.state.selectedChildLabel === null) {
      return []
    }
    return [
      <Grid item key="selected-child-label-name">
        <Typography variant="subtitle1">
          Selected Child Label: {ctx.state.selectedChildLabel.name}
        </Typography>
      </Grid>,
      <Grid item key="edit-child-label-name">
        <TextField
          variant="standard"
          label="Child Label Name"
          value={props.textField.childLabelName}
          onChange={handleChildLabelNameChange} />
      </Grid>,
      <Grid item key="child-button-group">
        <Button
          style={{margin: "0.1rem"}}
          onClick={handleUpdateChildLabel}
          disabled={props.textField.childLabelName === ctx.state.selectedChildLabel.name}
          variant="contained" color="primary">
          Update
        </Button>
        <Button
          style={{margin: "0.1rem"}}
          onClick={makeHandleDeleteClick(DeleteConfirmationTarget.Child)}
          variant="contained"
          color="secondary">
          Delete {ctx.state.selectedChildLabel.name}
        </Button>
      </Grid>
    ]
  }

  const selectedParentButtonGroup = () => {
    if (ctx.state.selectedParentLabel === null) {
      return []
    }
    return [
      <Grid item key="selected-parent-label-name">
        <Typography variant="subtitle1">
          Selected Parent Label: {ctx.state.selectedParentLabel.name}
        </Typography>
      </Grid>,
      <Grid item key="edit-parent-label-name">
        <TextField
          variant="standard"
          label="Parent Label Name"
          value={props.textField.parentLabelName}
          onChange={handleParentLabelNameChange} />
      </Grid>,
      <Grid item key="edit-child-label-name">
        <TextField
          variant="standard"
          label="Child Label Name"
          value={props.textField.childLabelName}
          onChange={handleChildLabelNameChange} />
      </Grid>,
      <Grid item key="parent-button-group">
        <Button
          style={{margin: "0.1rem"}}
          onClick={handleCreateChildLabel}
          disabled={props.textField.childLabelName.length === 0}
          variant="contained" color="primary">
          Create Child
        </Button>
        <Button
          style={{margin: "0.1rem"}}
          onClick={handleUpdateParentLabel}
          disabled={props.textField.parentLabelName === ctx.state.selectedParentLabel.name}
          variant="contained" color="primary">
          Update
        </Button>
        <Button
          style={{margin: "0.1rem"}}
          onClick={makeHandleDeleteClick(DeleteConfirmationTarget.Parent)}
          variant="contained" color="secondary">
          Delete {ctx.state.selectedParentLabel.name}
        </Button>
      </Grid>
    ]
  }

  const selectedNoneButtonGroup = () => {
    return [
      <Grid item key="edit-new-label-name">
        <TextField
          variant="standard"
          label="New Label Name"
          value={props.textField.parentLabelName}
          onChange={handleParentLabelNameChange} />
      </Grid>,
      <Grid item key="button-group">
        <Button
          style={{margin: "0.1rem"}}
          onClick={handleCreateParentLabel}
          variant="contained" color="primary">
          Create
        </Button>
      </Grid>
    ]
  }

  const durationView = () => {
    if (ctx.state.selectedParentLabel !== null && ctx.state.selectedChildLabel !== null) {
      return (
        <Grid item>
          <Typography>
            Accumulated {ctx.state.selectedChildLabel.duration} minutes of practice on
            {ctx.state.selectedChildLabel.name}
          </Typography>
        </Grid>
      )
    }

    if (ctx.state.selectedParentLabel !== null) {
      return (
        <Grid item>
          <Typography>
            Accumulated {ctx.state.selectedParentLabel.duration} minutes of practice on
            {ctx.state.selectedParentLabel.name}
          </Typography>
        </Grid>
      )
    }

    return <Grid item></Grid>
  }

  let gridItems: JSX.Element[]
  if (ctx.state.selectedParentLabel !== null && ctx.state.selectedChildLabel !== null) {
    // Case 1: Parent & child are selected
    gridItems = selectedChildButtonGroup()
  } else if (ctx.state.selectedParentLabel !== null && ctx.state.selectedChildLabel === null) {
    // Case 2: Parent is selected
    gridItems = selectedParentButtonGroup()
  } else {
    // Case 3: None is selected
    gridItems = selectedNoneButtonGroup()
  }

  return (
    <Grid
      container
      style={{ width: "30%", minHeight: "400px", "marginLeft": "0.5rem" }}
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      spacing={1}>
      {gridItems}
      {durationView()}
    </Grid>
  )
}

type DeleteConfirmationProps = {
  open: boolean
  setTextField: (value: React.SetStateAction<TextFieldState>) => void
  handleClose: () => void
  target: DeleteConfirmationTarget
}

function DeleteConfirmation(props: DeleteConfirmationProps) {

  const ctx = React.useContext(LogLabelContext)

  const resetUI = () => {
    ctx.handleDeselectChildLabel()
    ctx.handleDeselectParentLabel()
    props.setTextField({...initialState})
  }

  const handleDeleteParentLabel = () => {
    if (ctx.state.selectedParentLabel !== null) {
      ctx.handleDeleteLogLabel(ctx.state.selectedParentLabel)
      resetUI()
    }
  }

  const handleDeleteChildLabel = () => {
    if (ctx.state.selectedChildLabel !== null) {
      ctx.handleDeleteLogLabel(ctx.state.selectedChildLabel)
      resetUI()
    }
  }

  if (ctx.state.selectedChildLabel != null && props.target === DeleteConfirmationTarget.Child) {
    return (
      <Dialog open={props.open} onClose={props.handleClose}>
        <DialogTitle>Delete {ctx.state.selectedChildLabel.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {ctx.state.selectedChildLabel.name}?
          </DialogContentText>
          <DialogContentText>
            Child label {ctx.state.selectedChildLabel.id} will be deleted. The effect will propagate to
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

  if (ctx.state.selectedParentLabel != null && props.target === DeleteConfirmationTarget.Parent) {
    return (
      <Dialog open={props.open} onClose={props.handleClose}>
        <DialogTitle>Delete {ctx.state.selectedParentLabel.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {ctx.state.selectedParentLabel.name}?
          </DialogContentText>
          <DialogContentText>
            Parent label {ctx.state.selectedParentLabel.id} will be deleted. This will affect all nested
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

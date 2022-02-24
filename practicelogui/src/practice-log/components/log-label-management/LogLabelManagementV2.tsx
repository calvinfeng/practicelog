import { Button, Chip, Divider, Grid, Paper, TextField, Typography } from '@material-ui/core';
import { MusicNote } from '@material-ui/icons';
import React, { useEffect, useState } from 'react'
import { DeleteConfirmationTarget, LogLabelJSON, nilUUID } from '../../types';
import DeleteConfirmation from './DeleteConfirmation';


type Props = {
  logLabels: LogLabelJSON[]
  logLabelDurationFetched: boolean
  handleHTTPCreateLogLabel: (label: LogLabelJSON) => void
  handleHTTPUpdateLogLabel: (label: LogLabelJSON) => void
  handleHTTPDeleteLogLabel: (label: LogLabelJSON) => void
}

type UIState = {
  selectedParentLabel: LogLabelJSON | null
  selectedChildLabel: LogLabelJSON | null
  inputParentLabelName: string
  inputChildLabelName: string
}

const initialState: UIState = {
  selectedParentLabel: null,
  selectedChildLabel: null,
  inputParentLabelName: "",
  inputChildLabelName: "",
}

function LogLabelManagement(props: Props) {
  const [UIState,setUIState] = useState<UIState>(initialState)
  const [isDeleteDialogShown, setDeleteDialogShown] = useState<boolean>(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteConfirmationTarget>(DeleteConfirmationTarget.None)

  const handleCreateParentLabel = () => {
    const newLabel: LogLabelJSON = {
      id: nilUUID,
      parent_id: null,
      children: [],
      name: UIState.inputParentLabelName,
      duration: 0
    }
    props.handleHTTPCreateLogLabel(newLabel)
    setUIState({...initialState})
  }

  const handleUpdateParentLabel = () => {
    if (UIState.selectedParentLabel !== null) {
      const payload: LogLabelJSON = {
        id: UIState.selectedParentLabel.id,
        parent_id: nilUUID,
        name: UIState.inputParentLabelName,
        duration: 0,
        children: []
      }
      props.handleHTTPUpdateLogLabel(payload)
      setUIState({...initialState})
    }
  }

  const handleDeleteParentLabel = () => {
    if (UIState.selectedParentLabel !== null) {
      props.handleHTTPDeleteLogLabel(UIState.selectedParentLabel)
      setUIState({...initialState})
    }
  }

  const handleCreateChildLabel = () => {
    if (UIState.selectedParentLabel !== null ) {
      const newLabel: LogLabelJSON = {
        id: nilUUID,
        parent_id: UIState.selectedParentLabel.id,
        name: UIState.inputChildLabelName,
        duration: 0,
        children: []
      }
      props.handleHTTPCreateLogLabel(newLabel)
      setUIState({...initialState})
    }
  }

  const handleUpdateChildLabel = () => {
    if (UIState.selectedChildLabel !== null) {
      const payload: LogLabelJSON = {
        id: UIState.selectedChildLabel.id,
        parent_id: UIState.selectedChildLabel.parent_id,
        name: UIState.inputChildLabelName,
        duration: 0,
        children: []
      }
      props.handleHTTPUpdateLogLabel(payload)
      setUIState({...initialState})
    }
  }

  const handleDeleteChildLabel = () => {
    if (UIState.selectedChildLabel !== null) {
      props.handleHTTPDeleteLogLabel(UIState.selectedChildLabel)
      setUIState({...initialState})
    }
  }

  return (
    <Paper className="LabelManagement">
      <Typography variant="h5">Manage Labels</Typography>
      <Grid
          style={{ width: "100%", marginTop: "1rem" }}
          direction="row"
          justify="flex-start"
          alignItems="flex-start"
          container
          spacing={1}>
          <ParentLabelPanel
            logLabels={props.logLabels}
            UIState={UIState}
            setUIState={setUIState} />
          <Divider orientation="vertical" flexItem />
          <ChildLabelPanel
            logLabels={props.logLabels}
            UIState={UIState}
            setUIState={setUIState} />
          <Divider orientation="vertical" flexItem />
          <LabelEditPanel
            logLabelDurationFetched={props.logLabelDurationFetched}
            UIState={UIState}
            setUIState={setUIState}
            handleUpdateChildLabel={handleUpdateChildLabel}
            handleCreateChildLabel={handleCreateChildLabel}
            handleUpdateParentLabel={handleUpdateParentLabel}
            handleCreateParentLabel={handleCreateParentLabel}
            setDeleteDialogShown={setDeleteDialogShown}
            setDeleteTarget={setDeleteTarget} />
      </Grid>
      <DeleteConfirmation
          target={deleteTarget}
          open={isDeleteDialogShown}
          selectedChildLabel={UIState.selectedChildLabel}
          selectedParentLabel={UIState.selectedParentLabel}
          handleClose={() => setDeleteDialogShown(false)}
          handleDeleteChildLabel={handleDeleteChildLabel}
          handleDeleteParentLabel={handleDeleteParentLabel} />
    </Paper>
  )
}

type PanelProps = {
  logLabels: LogLabelJSON[]
  UIState: UIState
  setUIState: (value: React.SetStateAction<UIState>) => void
}

function ParentLabelPanel(props: PanelProps) {
  const makeSelectParentLabelHandler = (label: LogLabelJSON | null) => () => {
    if (label === null) {
      props.setUIState({...initialState})
    } else {
      props.setUIState(prevState => ({
        ...initialState,
        selectedParentLabel: label,
        inputParentLabelName: label.name,
      }))
    }
  }

  const filter = (label: LogLabelJSON) => {
    return label.parent_id === nilUUID
  }
  const mapper = (label: LogLabelJSON) => {
    let style = { margin: "0.1rem" }
    let handler = makeSelectParentLabelHandler(label)
    if (props.UIState.selectedParentLabel !== null &&
        props.UIState.selectedParentLabel.id === label.id) {
      style["background"] = "green"
      handler = makeSelectParentLabelHandler(null)
    }
    return (
      <Grid item>
        <Chip onClick={handler} style={style} label={label.name} icon={<MusicNote />} color="primary" />
      </Grid>
    )
  }

  const items: JSX.Element[] = props.logLabels.filter(filter).map(mapper)
  return (
    <Grid
      style={{ width: "30%", margin: "0.5rem" }}
      direction="row"
      justify="flex-start"
      alignItems="center"
      container
      spacing={0}>
      {items}
    </Grid>
  )
}

function ChildLabelPanel(props: PanelProps) {
  const makeSelectChildLabelHandler = (label: LogLabelJSON | null) => () => {
    if (label === null) {
      props.setUIState(prevState => ({
        ...prevState,
        selectedChildLabel: null,
        inputChildLabelName: "",
      }))
    } else {
      props.setUIState(prevState => ({
        ...prevState,
        selectedChildLabel: label,
        inputChildLabelName: label.name,
      }))
    }
  }

  const filter = (label: LogLabelJSON) => {
    if (props.UIState.selectedParentLabel === null) {
      return false
    }
    return label.parent_id === props.UIState.selectedParentLabel.id
  }

  const mapper = (label: LogLabelJSON) => {
    let style = { margin: "0.1rem" }
    let handler = makeSelectChildLabelHandler(label)
    if (props.UIState.selectedParentLabel !== null &&
        props.UIState.selectedChildLabel !== null &&
        props.UIState.selectedChildLabel.id === label.id) {
      style["background"] = "green"
      handler = makeSelectChildLabelHandler(null)
    }

    return (
      <Grid item>
        <Chip onClick={handler} style={style} label={label.name} icon={<MusicNote />} color="primary" />
      </Grid>
    )
  }

  const items: JSX.Element[] = props.logLabels.filter(filter).map(mapper)
  return (
    <Grid
      style={{ width: "30%", margin: "0.5rem" }}
      direction="row"
      justify="flex-start"
      alignItems="center"
      container
      spacing={0}>
      {items}
    </Grid>
  )
}

type EditPanelProps = {
  logLabelDurationFetched: boolean
  UIState: UIState
  setUIState: (value: React.SetStateAction<UIState>) => void
  handleUpdateChildLabel: () => void
  handleCreateChildLabel: () => void
  handleUpdateParentLabel: () => void
  handleCreateParentLabel: () => void
  setDeleteDialogShown: (value: React.SetStateAction<boolean>) => void
  setDeleteTarget: (value: React.SetStateAction<DeleteConfirmationTarget>) => void
}

function LabelEditPanel(props: EditPanelProps) {
  const handleChildLabelNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    props.setUIState(prevState => ({...prevState, inputChildLabelName: ev.target.value }))
  }
  const handleParentLabelNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    props.setUIState(prevState => ({...prevState, inputParentLabelName: ev.target.value }))
  }

  const makeHandleDeleteClick = (target: DeleteConfirmationTarget) => () => {
    props.setDeleteDialogShown(true)
    props.setDeleteTarget(target)
  }

  const selectedChildButtonGroup = () => {
    if (props.UIState.selectedParentLabel === null || props.UIState.selectedChildLabel === null) {
      return []
    }
    return [
      <Grid item>
        <Typography variant="subtitle1">
          Selected Child Label: {props.UIState.selectedChildLabel.name}
        </Typography>
      </Grid>,
      <Grid item>
        <TextField
          label="Child Label Name"
          value={props.UIState.inputChildLabelName}
          onChange={handleChildLabelNameChange}
          fullWidth InputLabelProps={{ shrink: true }} />
      </Grid>,
      <Grid item>
        <Button
          style={{margin: "0.1rem"}}
          onClick={props.handleUpdateChildLabel}
          disabled={props.UIState.inputChildLabelName === props.UIState.selectedChildLabel.name}
          variant="contained" color="primary">
          Update
        </Button>
        <Button
          style={{margin: "0.1rem"}}
          onClick={makeHandleDeleteClick(DeleteConfirmationTarget.Child)}
          variant="contained"
          color="secondary">
          Delete {props.UIState.selectedChildLabel.name}
        </Button>
      </Grid>
    ]
  }

  const selectedParentButtonGroup = () => {
    if (props.UIState.selectedParentLabel === null) {
      return []
    }
    return [
      <Grid item>
        <Typography variant="subtitle1">
          Selected Parent Label: {props.UIState.selectedParentLabel.name}
        </Typography>
      </Grid>,
      <Grid item>
        <TextField
          label="Parent Label Name"
          value={props.UIState.inputParentLabelName}
          onChange={handleParentLabelNameChange}
          fullWidth InputLabelProps={{ shrink: true }} />
      </Grid>,
      <Grid item>
      <TextField
        label="Child Label Name"
        value={props.UIState.inputChildLabelName}
        onChange={handleChildLabelNameChange}
        fullWidth InputLabelProps={{ shrink: true }} />
      </Grid>,
      <Grid item>
        <Button
          style={{margin: "0.1rem"}}
          onClick={props.handleCreateChildLabel}
          disabled={props.UIState.inputChildLabelName.length === 0}
          variant="contained" color="primary">
            Create Child
        </Button>
        <Button
          style={{margin: "0.1rem"}}
          onClick={props.handleUpdateParentLabel}
          disabled={props.UIState.inputParentLabelName === props.UIState.selectedParentLabel.name}
          variant="contained" color="primary">
            Update
        </Button>
        <Button
          style={{margin: "0.1rem"}}
          onClick={makeHandleDeleteClick(DeleteConfirmationTarget.Parent)}
          variant="contained" color="secondary">
          Delete {props.UIState.selectedParentLabel.name}
        </Button>
      </Grid>
    ]
  }

  const selectedNoneButtonGroup = () => {
    return [
      <Grid item>
        <TextField
          label="New Label Name"
          value={props.UIState.inputParentLabelName}
          onChange={handleParentLabelNameChange}
          fullWidth
          InputLabelProps={{ shrink: true }} />
        </Grid>,
      <Grid item>
        <Button
          style={{margin: "0.1rem"}}
          onClick={props.handleCreateParentLabel}
          variant="contained" color="primary">
          Create
        </Button>
      </Grid>
    ]
  }

  const durationView = () => {
    if (!props.logLabelDurationFetched) {
      return <Grid item></Grid>
    }

    if (props.UIState.selectedParentLabel !== null && props.UIState.selectedChildLabel !== null) {
      return (
        <Grid item>
          <Typography>
            Accumulated {props.UIState.selectedChildLabel.duration} minutes of practice on
            {props.UIState.selectedChildLabel.name}
          </Typography>
        </Grid>
      )
    }

    if (props.UIState.selectedParentLabel !== null) {
      return (
        <Grid item>
          <Typography>
            Accumulated {props.UIState.selectedParentLabel.duration} minutes of practice on
            {props.UIState.selectedParentLabel.name}
          </Typography>
        </Grid>
      )
    }

    return <Grid item></Grid>
  }

  let gridItems: JSX.Element[]
  if (props.UIState.selectedParentLabel !== null && props.UIState.selectedChildLabel !== null) {
    // Case 1: Parent & child are selected
    gridItems = selectedChildButtonGroup()
  } else if (props.UIState.selectedParentLabel !== null && props.UIState.selectedChildLabel === null) {
    // Case 2: Parent is selected
    gridItems = selectedParentButtonGroup()
  } else {
    // Case 3: None is selected
    gridItems = selectedNoneButtonGroup()
  }

  return (
    <Grid
      style={{ width: "30%", margin: "0.5rem" }}
      direction="column"
      justify="flex-start"
      alignItems="flex-start"
      container
      spacing={1}>
      {gridItems}
      {durationView()}
    </Grid>
  )
}

export default LogLabelManagement

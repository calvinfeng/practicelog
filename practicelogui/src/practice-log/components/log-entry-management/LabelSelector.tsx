import React from "react"
import {
  Button,
  FormControl,
  Chip,
  Grid,
  Typography,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem } from "@mui/material"
import {
  MusicNote,
  Add
} from "@mui/icons-material"

import { LogLabelJSON } from "../../types"
import { alphabetOrder } from "../../callbacks"

type Props = {
  // Root data
  logLabels: LogLabelJSON[] // All log labels

  // Users modifiable fields
  inputLabelList: LogLabelJSON[]
  setInputLabelList: (list: LogLabelJSON[]) => void
  removeFromInputLabelList: (id: string) => void
}

export default function LabelSelector(props: Props) {

  const [selectedLabelID, setSelectLabelID] = React.useState<string>('')

  if (props.logLabels.length === 0) {
    return <Typography>Create a Label</Typography>
  }

  const isLabelSelectedAlready = (labelID: string): boolean => {
    const found = props.inputLabelList.find(
      (label: LogLabelJSON) => label.id === labelID
    )
    return Boolean(found)
  }

  const findLabelFromProps = (labelID: string): LogLabelJSON | undefined => {
    return props.logLabels.find(
      (label: LogLabelJSON) => label.id === labelID
    )
  }

  const makeHandlerRemoveFromInputLabelList = (labelID: string) => () => {
    props.removeFromInputLabelList(labelID)
  }

  const handleOnChange = (ev: SelectChangeEvent<string>, child: React.ReactNode) => {
    setSelectLabelID(ev.target.value as string)
  }

  const handleAddLabel = () => {
    if (selectedLabelID === null) {
      return
    }

    if (isLabelSelectedAlready(selectedLabelID)) {
      return
    }

    const newInputLabelList = [...props.inputLabelList]

    const labelToAdd = findLabelFromProps(selectedLabelID)
    if (labelToAdd) {
      newInputLabelList.push(labelToAdd)
    }

    if (labelToAdd &&
        labelToAdd.parent_id !== null &&
        !isLabelSelectedAlready(labelToAdd.parent_id)
    ) {
        const parentToAdd = findLabelFromProps(labelToAdd.parent_id)
        if (parentToAdd) {
          newInputLabelList.push(parentToAdd)
        }
      }
    props.setInputLabelList(newInputLabelList)
  }

  const chips = props.inputLabelList.map((label: LogLabelJSON) => {
    return (
      <Grid item key={label.id}>
        <Chip
          style={{ margin: "0.1rem" }}
          label={label.name}
          icon={<MusicNote />}
          color="primary"
          onDelete={makeHandlerRemoveFromInputLabelList(label.id)} />
      </Grid>
    )
  })

  return (
    <section className="LabelSelector">
      <Grid container direction="row" justifyContent="flex-start" alignItems="center" spacing={0}>
        {chips}
      </Grid>
      <Grid container direction="row" justifyContent="flex-end" alignItems="flex-end" spacing={1}>
        <Grid item>
          <FormControl variant="standard" style={{width: "200px"}}>
            <InputLabel id="label-selector-label">Label</InputLabel>
            <Select
              labelId="label-selector-label"
              id="label-selector"
              value={selectedLabelID}
              onChange={handleOnChange}>
                {props.logLabels.sort(alphabetOrder).map((label: LogLabelJSON) => {
                  return <MenuItem value={label.id} key={label.id}>
                    {label.name}
                  </MenuItem>
                })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            color="primary"
            style={{marginLeft: "0.5rem"}}
            onClick={handleAddLabel}
            startIcon={<Add />}>
            Add Label
          </Button>
        </Grid>
      </Grid>
    </section>
  )
}

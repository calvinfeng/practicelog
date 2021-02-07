import React from 'react'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Divider,
  FormGroup } from '@material-ui/core';
import { Map } from 'immutable'

import { LogLabelJSON, nilUUID } from '../shared/type_definitions';
import { alphabetOrder } from '../shared/callbacks';
import './DurationViewer.scss'

type Props = {
  logLabels: LogLabelJSON[]
  logLabelDurations: Map<string, number>
  fetchLogLabelDuration: (labelID: string) => void
}

// TODO: Separate the check boxes into two lists
// One for parents
// One for child
// If none is selected, display the total duration spent on guitar.
export default function DurationViewer(props: Props) {
  const [expanded, setExpanded] = React.useState<boolean | undefined>(false)
  const [selectedLabelID, selectLabelID] = React.useState<string | null>(null)

  const makeCheckHandler = (labelID: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    if (selectedLabelID === labelID) {
      selectLabelID(null)
    } else {
      selectLabelID(labelID)
    }

    if (!props.logLabelDurations.get(labelID)) {
      props.fetchLogLabelDuration(labelID)
    }
  }

  const isParent = (label: LogLabelJSON) => label.parent_id === nilUUID
  const isChild = (label: LogLabelJSON) => label.parent_id !== nilUUID

  const transformToCheckBox = (label: LogLabelJSON) => {
    let checked = false
    if (selectLabelID !== null) {
      checked = selectedLabelID === label.id
    }
    return (
      <FormControlLabel
        onClick={(event: React.MouseEvent<HTMLLabelElement, MouseEvent>) => event.stopPropagation()}
        control={
          <Checkbox
            checked={checked}
            onChange={makeCheckHandler(label.id)}
            name={label.name}
            color="primary" />}
        label={label.name} />
    )
  }

  let parentCheckBoxes: JSX.Element[] = []
  let childCheckBoxes: JSX.Element[] = []
  if (props.logLabels) {
    parentCheckBoxes = props.logLabels.filter(isParent).sort(alphabetOrder).map(transformToCheckBox)
    childCheckBoxes = props.logLabels.filter(isChild).sort(alphabetOrder).map(transformToCheckBox)
  }

  const handleExpand = (_: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setExpanded(!expanded)
  }

  let content = "Please select a label to view how much time you've spent on it"
  if (selectedLabelID && props.logLabelDurations.get(selectedLabelID)) {
    const mins = props.logLabelDurations.get(selectedLabelID)
    content = `You have spent ${Math.floor(mins as number /60)} hours and ${mins as number %60} minutes on it`
  }

  return (
    <Accordion className="DurationViewer" expanded={expanded} onClick={handleExpand}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}>
        <FormGroup className="parent-form-group" row>
          {parentCheckBoxes}
        </FormGroup>
        <Divider />
        <FormGroup className="child-form-group" row>
          {childCheckBoxes}
        </FormGroup>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body1">
          {content}
        </Typography>
      </AccordionDetails>
    </Accordion>
  )
}

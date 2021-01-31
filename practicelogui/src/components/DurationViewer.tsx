import React from 'react'
import {
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails, 
  ButtonGroup,
  Button} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Map } from 'immutable'

import './DurationViewer.scss'
import { LogLabelJSON } from '../shared/type_definitions';

type Props = {
  logLabels: LogLabelJSON[]
  logLabelDurations: Map<string, number>
  fetchLogLabelDuration: (labelID: string) => void
}

export default function DurationViewer(props: Props) {
  const [expanded, setExpanded] = React.useState<boolean | undefined>(false)
  const [selectedLabelID, selectLabelID] = React.useState<string | null>(null)

  const makeClickHandler = (labelID: string) => (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
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

  let buttons: JSX.Element[] = []
  if (props.logLabels) {
    buttons = props.logLabels.map((label: LogLabelJSON) => {
      if (selectedLabelID !== null && selectedLabelID === label.id) {
        return (
          <Button variant={"contained"}
            onClick={makeClickHandler(label.id)}>
            {label.name}
          </Button>
        )
      }
      return <Button onClick={makeClickHandler(label.id)}>{label.name}</Button>
    })
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
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <ButtonGroup variant="outlined" color="primary">
          {buttons}
        </ButtonGroup>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>
          {content}
        </Typography>
      </AccordionDetails>
    </Accordion>
  )
}
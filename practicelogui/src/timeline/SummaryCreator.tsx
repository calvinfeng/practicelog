import React from 'react'
import { VerticalTimelineElement } from 'react-vertical-timeline-component'
import { contentArrowStyle, contentStyle, iconStyle } from './styles'
import AddCircleIcon from '@material-ui/icons/AddCircle';

type Props = {
}

export function SummaryCreator(props: Props) {
  return <VerticalTimelineElement
    date={"Click to add new progress summary"}
    contentArrowStyle={contentArrowStyle}
    iconStyle={iconStyle}
    iconOnClick={()=> {alert("clicked")}}
    icon={<AddCircleIcon />}>
  </VerticalTimelineElement>
}

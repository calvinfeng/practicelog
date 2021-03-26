import React from 'react'
import ReactPlayer from 'react-player'
import { VideoLogEntryJSON } from '../../shared/type_definitions'
import { VerticalTimelineElement }  from 'react-vertical-timeline-component'
import MusicNoteIcon from '@material-ui/icons/MusicNote'
import './ProgressVideoElement.scss'
import { contentArrowStyle, contentStyle, iconStyle } from './styles'
import { Typography } from '@material-ui/core'

type Props = {
  video: VideoLogEntryJSON
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export function ProgressVideoElement(props: Props) {
  const date = new Date(props.video.published)
  const dateString = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  const hours = Math.round(props.video.minutes_of_guitar_practice * 100 / 60) / 100
  return (
    <VerticalTimelineElement
      date={dateString}
      contentArrowStyle={contentArrowStyle}
      contentStyle={contentStyle}
      iconStyle={iconStyle}
      icon={<MusicNoteIcon />}>
      <div className="ProgressVideoElement">
        <Typography className="title" variant="h6">{hours} hours of guitar playing</Typography>
        <ReactPlayer
          url={`https://www.youtube.com/watch?v=${props.video.id}`}
          width={"100%"}
          height={270}
          controls={true} />
      </div>
    </VerticalTimelineElement>
  )
}

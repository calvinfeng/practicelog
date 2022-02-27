import React from 'react'
import ReactPlayer from 'react-player'
import { VideoLogEntryJSON, MonthNames } from './types'
import { VerticalTimelineElement }  from 'react-vertical-timeline-component'
import {MusicNote} from '@mui/icons-material'
import './ProgressVideoElement.scss'
import { contentArrowStyle, contentStyle, iconStyle } from './styles'
import { Typography } from '@mui/material'

type Props = {
  video: VideoLogEntryJSON
}

export function ProgressVideoElement(props: Props) {
  const date = new Date(props.video.published)
  const dateString = `${MonthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  const hours = Math.round(props.video.minutes_of_guitar_practice * 100 / 60) / 100
  return (
    <VerticalTimelineElement
      date={dateString}
      contentArrowStyle={contentArrowStyle}
      contentStyle={contentStyle}
      iconStyle={iconStyle}
      icon={<MusicNote />}>
      <div className="ProgressVideoElement">
        <ReactPlayer
          url={`https://www.youtube.com/watch?v=${props.video.id}`}
          width={"100%"}
          height={270}
          controls={true} />
        <Typography className="title" variant="body1">This is the result of {hours} hours of guitar practices.</Typography>
      </div>
    </VerticalTimelineElement>
  )
}

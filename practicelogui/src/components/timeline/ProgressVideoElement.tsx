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

export function ProgressVideoElement(props: Props) {
  return (
    <VerticalTimelineElement
      date={props.video.published.toString()}
      contentArrowStyle={contentArrowStyle}
      contentStyle={contentStyle}
      iconStyle={iconStyle}
      icon={<MusicNoteIcon />}>
      <div className="ProgressVideoElement">
        <Typography className="title" variant="h6">{props.video.minutes_of_guitar_practice} minutes</Typography>
        <ReactPlayer
          url={`https://www.youtube.com/watch?v=${props.video.id}`}
          width={"100%"}
          height={270}
          controls={true} />
      </div>
    </VerticalTimelineElement>
  )
}

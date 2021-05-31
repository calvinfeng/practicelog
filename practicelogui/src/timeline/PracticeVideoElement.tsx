import React from 'react'
import {
  Popover,
  Paper,
  ButtonBase,
  Tooltip,
  Typography
} from '@material-ui/core'
import { VerticalTimelineElement }  from 'react-vertical-timeline-component'
import MusicNoteIcon from '@material-ui/icons/MusicNote'
import ReactPlayer from 'react-player'

import { contentStyle, contentArrowStyle, iconStyle } from './styles'
import { MonthNames, SummaryJSON, ThumbnailJSON, VideoLogEntryJSON, VideoOrientation } from './types'

import './PracticeVideoElement.scss'

type Props = {
  year: number
  month: number
  videos: VideoLogEntryJSON[]
  summary: SummaryJSON
}

export function PracticeVideoElement(props: Props) {
  const dateString = `${MonthNames[props.month-1]}, ${props.year}`

  const textContainer = (
    <div className="text-container">
      <Typography variant="h6">{props.summary.title}</Typography>
      <Typography variant="subtitle1">{props.summary.subtitle}</Typography>
      <Typography variant="body2">{props.summary.body}</Typography>
    </div>
  )

  return (
    <VerticalTimelineElement
      date={dateString}
      contentArrowStyle={contentArrowStyle}
      contentStyle={contentStyle}
      iconStyle={iconStyle}
      icon={<MusicNoteIcon />}>
      <div
        className='PracticeVideoElement'
        id={`practice-video-element-${props.year}-${props.month}`}>
        <div className="video-thumbnail-container">
          {props.videos.map((video: VideoLogEntryJSON) => {
            return <VideoPopover video={video} />
          })}
        </div>
        {textContainer}
      </div>
    </VerticalTimelineElement>
  )
}

type VideoPopoverProps = {
  video: VideoLogEntryJSON
}

function VideoPopover(props: VideoPopoverProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  let width, height, className
  if (props.video.video_orientation === VideoOrientation.Portrait) {
    height = 480;
    width = 270;
    className = 'paper portrait-mode'
  } else {
    height = 270;
    width = 480;
    className = 'paper landscape-mode'
  }

  // const oldButton = (
  //   <Button variant="contained" color="primary" onClick={handleClick}>
  //     {props.video.title}
  //   </Button >
  // )

  let thumbnailURL = `https://img.youtube.com/vi/${props.video.id}/1.jpg`

  const thumbnailJSON = props.video.thumbnails["default"] as ThumbnailJSON | undefined
  if (thumbnailJSON) {
    thumbnailURL = thumbnailJSON.url
  }

  return (
    <div className="VideoPopover" id={`video-popover-${props.video.id}`}>
      <Tooltip title={props.video.title}>
        <ButtonBase onClick={handleClick} id={`video-popover-button-${props.video.id}`}>
        <img
          alt="youtube-video-thumbnail"
          src={thumbnailURL} />
        </ButtonBase>
      </Tooltip>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Paper className={className}>
          <ReactPlayer
            url={`https://www.youtube.com/watch?v=${props.video.id}`}
            width={width}
            height={height}
            controls={true} />
        </Paper>
      </Popover>
    </div>
  )
}

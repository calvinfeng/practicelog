import React from 'react'
import {
  Popover,
  Paper,
  ButtonBase,
  Tooltip,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@material-ui/core'
import ReactPlayer from 'react-player'
import MusicNoteIcon from '@material-ui/icons/MusicNote'
import { VerticalTimelineElement }  from 'react-vertical-timeline-component'
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

  const [isEditMode, setEditMode] = React.useState<boolean>(false)

  const textContainer = (
    <div className="text-container" onClick={() => setEditMode(true)}>
      <Typography variant="h6">{props.summary.title}</Typography>
      <Typography variant="subtitle1">{props.summary.subtitle}</Typography>
      <Typography variant="body2">{props.summary.body}</Typography>
    </div>
  )

  const handleCloseDialog = () => setEditMode(false)

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
      <Dialog open={isEditMode} onClose={handleCloseDialog}>
        <DialogTitle id="form-dialog-title">Edit Summary {props.summary.id}</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth style={{"marginBottom": "0.5rem"}}
            label="Title"
            value={props.summary.title} />
          <TextField autoFocus fullWidth style={{"marginBottom": "0.5rem"}}
            label="Subtitle"
            value={props.summary.subtitle} />
          <TextField autoFocus fullWidth style={{"marginBottom": "0.5rem"}}
            label="Body"
            value={props.summary.body}
            multiline />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCloseDialog} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
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

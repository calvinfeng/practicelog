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
} from '@mui/material'
import ReactPlayer from 'react-player'
import { MusicNote } from '@mui/icons-material'
import { VerticalTimelineElement }  from 'react-vertical-timeline-component'
import { contentStyle, contentArrowStyle, iconStyle } from '../styles'
import { MonthNames, SummaryJSON, ThumbnailJSON, VideoLogEntryJSON, VideoOrientation } from '../types'

import './PracticeVideoElement.scss'
import { nilUUID } from '../../practice-log/types'

type Props = {
  year: number
  month: number
  videos: VideoLogEntryJSON[]
  summary: SummaryJSON | null
  hasPermissionToEdit: boolean
  updateSummary: (summary: SummaryJSON) => Promise<any>
  createSummary: (summary: SummaryJSON) => Promise<any>
}

export function PracticeVideoElement(props: Props) {
  const dateString = `${MonthNames[props.month-1]}, ${props.year}`

  const [isEditMode, setEditMode] = React.useState<boolean>(false)
  const [title, setTitle] = React.useState<string>("")
  const [subtitle, setSubtitle] = React.useState<string>("")
  const [body, setBody] = React.useState<string>("")

  // useEffect accepts 2 arguments. The first argument is a callback that is going to be called.
  // The second argument is the dependency, which when changed, it will trigger the callback.
  React.useEffect(() => {
    if (props.summary !== null) {
      setTitle(props.summary.title)
      setSubtitle(props.summary.subtitle)
      setBody(props.summary.body)
    }
  }, [props.summary])

  const handleCloseDialog = () => {
    setEditMode(false)
    if (props.summary !== null) {
      setTitle(props.summary.title)
      setSubtitle(props.summary.subtitle)
      setBody(props.summary.body)
    }
  }

  const handleUpdateSummary = () => {
    if (props.summary !== null) {
      const newSummary: SummaryJSON = {
        id: props.summary.id,
        username: props.summary.username,
        year: props.year,
        month: props.month,
        title: title,
        subtitle: subtitle,
        body: body
      }
      props.updateSummary(newSummary)
    }
    setEditMode(false)
  }

  const handleCreateSummary = () => {
    const newSummary: SummaryJSON = {
      id: nilUUID,
      username: "",
      year: props.year,
      month: props.month,
      title: title,
      subtitle: subtitle,
      body: body
    }
    props.createSummary(newSummary)
    setEditMode(false)
  }

  let summaryContainer;
  if (props.summary !== null) {
    summaryContainer = (
      <div className="summary-container">
        <div className="text" style={{"cursor": "pointer"}} onClick={() => setEditMode(true)}>
          <Typography variant="h6">{props.summary.title}</Typography>
          <Typography variant="subtitle1">{props.summary.subtitle}</Typography>
          <Typography variant="body2">{props.summary.body}</Typography>
        </div>
        <Dialog open={isEditMode} onClose={handleCloseDialog}>
          <DialogTitle id="form-dialog-title">Edit Summary {props.summary.id}</DialogTitle>
          <DialogContent>
            <TextField autoFocus fullWidth style={{"marginBottom": "0.5rem"}}
              label="Title"
              value={title}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setTitle(ev.target.value)} />
            <TextField autoFocus fullWidth style={{"marginBottom": "0.5rem"}}
              label="Subtitle"
              value={subtitle}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setSubtitle(ev.target.value)} />
            <TextField autoFocus fullWidth style={{"marginBottom": "0.5rem"}}
              label="Body"
              value={body}
              multiline
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setBody(ev.target.value)} />
          </DialogContent>
          <DialogActions>
            <Button disabled={!props.hasPermissionToEdit} onClick={handleCloseDialog} color="primary">
              Cancel
            </Button>
            <Button disabled={!props.hasPermissionToEdit} onClick={handleUpdateSummary} color="primary">
              Confirm
            </Button>
          </DialogActions>
          </Dialog>
      </div>
    )
  } else {
    if (props.hasPermissionToEdit) {
      summaryContainer = (
        <div className="summary-container">
          <Button onClick={() => setEditMode(true)}>Add a Summary</Button>
          <Dialog open={isEditMode} onClose={handleCloseDialog}>
            <DialogTitle id="form-dialog-title">Add a Summary</DialogTitle>
            <DialogContent>
              <TextField autoFocus fullWidth style={{"marginBottom": "0.5rem"}}
                label="Title"
                value={title}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setTitle(ev.target.value)} />
              <TextField autoFocus fullWidth style={{"marginBottom": "0.5rem"}}
                label="Subtitle"
                value={subtitle}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setSubtitle(ev.target.value)} />
              <TextField autoFocus fullWidth style={{"marginBottom": "0.5rem"}}
                label="Body"
                value={body}
                multiline
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setBody(ev.target.value)} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="primary">
                Cancel
              </Button>
              <Button onClick={handleCreateSummary} color="primary">
                Confirm
              </Button>
            </DialogActions>
            </Dialog>
        </div>
      )
    } else {
      summaryContainer = (
        <div></div>
      )
    }
  }

  if (props.videos.length === 0 && props.summary === null && !props.hasPermissionToEdit) {
    return <div></div>
  }

  return (
    <VerticalTimelineElement
      date={dateString}
      contentArrowStyle={contentArrowStyle}
      contentStyle={contentStyle}
      iconStyle={iconStyle}
      icon={<MusicNote />}>
      <div
        className='PracticeVideoElement'
        id={`practice-video-element-${props.year}-${props.month}`}>
        <div className="video-thumbnail-container">
          {props.videos.map((video: VideoLogEntryJSON) => {
            return <VideoPopover key={video.id} video={video} />
          })}
        </div>
        {summaryContainer}
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

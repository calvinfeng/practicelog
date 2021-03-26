import React from 'react'
import axios, { AxiosInstance, AxiosResponse }  from 'axios'

import {
  Card,
  CardMedia,
  CardContent,
  Typography,
} from '@material-ui/core'

import {
  VerticalTimeline,
} from 'react-vertical-timeline-component'

import 'react-vertical-timeline-component/style.min.css'

import { SummaryJSON, VideoGroupJSON, VideoLogEntryJSON } from '../shared/type_definitions'
import './Timeline.scss'
import { ProgressVideoElement } from '../components/timeline/ProgressVideoElement'
import { PracticeVideoElement } from '../components/timeline/PracticeVideoElement'

type Props = {
  IDToken: string
}

type State = {
  videoGroups: VideoGroupJSON[],
  summaries: SummaryJSON[]
}

export default class Timeline extends React.Component<Props, State> {
  private http: AxiosInstance

  constructor(props: Props) {
    // TODO: This shouldn't need authentication?
    super(props)
    this.http = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 1000,
      headers: {
        "Authorization": props.IDToken
      }
    })
    this.state = {
      videoGroups: [],
      summaries: []
    }
  }

  componentDidMount() {
    this.fetchVideoLogEntries()
    this.fetchSummaries()
  }

  /**
   * Action to request videos
   */
  fetchVideoLogEntries() {
    this.http.get('/api/v1/videolog/entries')
      .then((resp: AxiosResponse) => {
        this.setState({
          videoGroups: resp.data as VideoGroupJSON[]
        })
      })
      .catch((reason: any) => {
        console.log(reason)
      })
  }

  /**
   * Action to request summaries
   */
  fetchSummaries() {
    this.http.get('/api/v1/videolog/summaries')
      .then((resp: AxiosResponse) => {
        this.setState({
          summaries: resp.data as SummaryJSON[]
        })
      })
      .catch((reason: any) => {
        console.log(reason)
      })
  }

  get timelineContent() {
    if (this.state.videoGroups.length === 0) {
      return <div></div>
    }

    const elements: JSX.Element[] = []
    this.state.videoGroups.forEach((group: VideoGroupJSON) => {
      group.progress_recordings.filter((video: VideoLogEntryJSON) => {
        const date = new Date(video.published)
        return date.getDay() > 15
      }).forEach((video: VideoLogEntryJSON) => {
        elements.push(<ProgressVideoElement video={video} />)
      })

      // If this is a performance issue, use map
      let summary: SummaryJSON | undefined
      for (let i = 0; i < this.state.summaries.length; i++) {
        if (group.year === this.state.summaries[i].year && group.month === this.state.summaries[i].month) {
          summary = this.state.summaries[i]
        }
      }

      if (summary !== undefined) {
        elements.push(<PracticeVideoElement
          year={group.year} month={group.month}
          summary={summary}
          videos={group.practice_recordings} />)
      }

      group.progress_recordings.filter((video: VideoLogEntryJSON) => {
        const date = new Date(video.published)
        return date.getDay() <= 15
      }).forEach((video: VideoLogEntryJSON) => {
        elements.push(<ProgressVideoElement video={video} />)
      })
    })

    return (
      <VerticalTimeline animate={true}>
        {elements}
      </VerticalTimeline>
    )
  }

  render() {
    console.log(this.state)
    return (
      <div className="Timeline">
        <Card className="text-card">
          <CardMedia image={process.env.PUBLIC_URL + '/img/acoustic-guitar.jpg'}
            title="Random Guitar"
            className="media" />
          <CardContent className="content">
            <Typography variant="h4">Guitar Progress Timeline</Typography>
            <Typography variant="subtitle1" color="textSecondary" paragraph={true}>
              A documentary of my learning progress from a beginner to an intermediate player
            </Typography>
            <Typography variant="body2" paragraph={true}>
              To be fair, I wasn't a complete music beginner. I learned piano and violin in my
              childhood. It was in the middle of 2019, I discovered Justin Sandercoe's online guitar
              course. The lessons were so well structured, it motivated me to pick up guitar
              seriously once again. And I figured, if I were to have a wedding any time soon, it is
              the best time now to learn guitar and form a band with my friends so we can perform on
              weddng day!
            </Typography>
            <Typography variant="body2" paragraph={true}>
              Ever since August, 2019 I've been practicing with a rigorious schedule. I practiced
              strictly at least one hour a day. I wanted to see how far can discipline get me. I
              decided to document my guitar playing. Every month I upload progress report
              video and practice recordings. The idea of a progress report is to track the development
              of my techique. I use songs as a metric to benchmark my skill level. If I am improving
              over time, the songs I play will increase in fluidity, complexity and difficulty.
            </Typography>
          </CardContent>
        </Card>
        {this.timelineContent}
      </div>
    )
  }
}

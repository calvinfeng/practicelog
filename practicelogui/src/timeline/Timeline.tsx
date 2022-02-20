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

import { SummaryJSON, VideoGroupJSON, VideoLogEntryJSON } from './types'
import './Timeline.scss'
import { ProgressVideoElement } from './ProgressVideoElement'
import { PracticeVideoElement } from './PracticeVideoElement'
import { SummaryCreator } from './SummaryCreator';
import { Developer, GoogleUserProfile } from '../root/types';
import { useParams } from 'react-router-dom'

type Props = {
  currentUserProfile: GoogleUserProfile,
}

type RouteProps = {
  pathParams: any
}

type State = {
  videoGroups: VideoGroupJSON[],
  summaries: SummaryJSON[]
}

class Timeline extends React.Component<Props & RouteProps, State> {
  private http: AxiosInstance

  constructor(props: Props & RouteProps) {
    super(props)
    this.http = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 1000,
      headers: {
        "Authorization": props.currentUserProfile.id_token
      }
    })
    this.state = {
      videoGroups: [],
      summaries: []
    }
  }

  componentDidMount() {
    console.log('profile ID', this.props.pathParams["profileID"])
    this.fetchVideoLogEntries()
    this.fetchSummaries()
  }

  /**
   * Action to request videos
   */
  async fetchVideoLogEntries(): Promise<any> {
    return this.http.get('/public/api/v1/videolog/entries')
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
  async fetchSummaries(): Promise<any> {
    return this.http.get('/public/api/v1/videolog/summaries')
      .then((resp: AxiosResponse) => {
        this.setState({
          summaries: resp.data as SummaryJSON[]
        })
      })
      .catch((reason: any) => {
        console.log(reason)
      })
  }

  /**
   * Action to update summary. This will be passed to sub-components.
   */
  updateSummary = (summary: SummaryJSON):Promise<any> => {
    return this.http.put(`api/v1/videolog/summaries/${summary.id}`, summary)
      .then((resp: AxiosResponse) => {
        this.fetchSummaries()
      })
      .catch((reason: any) => {
        console.log(reason)
      })
  }

  /**
   * Action to create summary. This will be passed to sub-components.
   */
  createSummary = (summary: SummaryJSON): Promise<any> => {
    return this.http.post(`api/v1/videolog/summaries`, summary)
      .then((resp: AxiosResponse) => {
        this.fetchSummaries()
      })
      .catch((reason: any) => {
        console.log(reason)
      })
  }

  get timelineContent() {
    const elements: JSX.Element[] = []

    this.state.videoGroups.forEach((group: VideoGroupJSON) => {
      // Find a progress recording that is after 15th of each month
      group.progress_recordings.filter((video: VideoLogEntryJSON) => {
        const date = new Date(video.published)
        return date.getDay() > 15
      }).forEach((video: VideoLogEntryJSON) => {
        elements.push(<ProgressVideoElement video={video} />)
      })

      // WARNING: If this is a performance issue, use map
      // This is a linear search for summary. Given that there are at most 12 summary per year, this
      // number is pretty small.
      let summary: SummaryJSON | null = null
      for (let i = 0; i < this.state.summaries.length; i++) {
        if (group.year === this.state.summaries[i].year && group.month === this.state.summaries[i].month) {
          summary = this.state.summaries[i]
        }
      }

      // TODO: Switch to V2 eventually, use profile ID to judge whether user has edit rights.
      elements.push(<PracticeVideoElement
        hasPermissionToEdit={this.props.currentUserProfile.email === "calvin.j.feng@gmail.com" ||
          this.props.currentUserProfile.user_id === Developer.user_id}
        createSummary={this.createSummary}
        updateSummary={this.updateSummary}
        year={group.year}
        month={group.month}
        summary={summary}
        videos={group.practice_recordings} />)

      // Find a progress recording that is before 15th of each month.
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
              To be fair, I wasn't a complete music beginner. I played some piano and violin in my
              childhood. It was in the middle of 2019, I discovered Justin Sandercoe's online guitar
              course. The lessons were so well structured, it motivated me to pick up guitar as a
              serious hobby. And I figured, if I were to have a wedding any time soon, it is
              the best time now to learn guitar and form a band with my friends so we can perform on
              weddng day!
            </Typography>
            <Typography variant="body2" paragraph={true}>
              Ever since August, 2019 I've been practicing with a rigorious schedule. I practiced
              strictly at least one hour a day. I wanted to see how far can discipline get me. I
              decided to document my guitar playing. Every month I upload progress report video and
              practice recordings. The idea of a progress report is to track the development of my
              techiques. I use songs as a metric to benchmark my skill level. If I am improving
              over time, the songs I play will increase in fluidity, complexity and difficulty.
            </Typography>
          </CardContent>
        </Card>
        {this.timelineContent}
      </div>
    )
  }
}

function withRouter(Component: any) {
  return (props: Props) => {
    return <Component {...props} pathParams={useParams()} />
  }
}

export default withRouter(Timeline);

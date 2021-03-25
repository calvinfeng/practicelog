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

import { VideoLogEntryJSON } from '../shared/type_definitions'
import './Timeline.scss'

type Props = {
  IDToken: string
}

type State = {
  practiceRecordings: VideoLogEntryJSON[]
  progressRecordings: VideoLogEntryJSON[]
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
    });
  }

  componentDidMount() {
    this.fetchVideoLogEntries()
  }

    /**
   * This is an internal class helper function to populate log label duration
   * as state.
   */
  fetchVideoLogEntries() {
    this.http.get('/api/v1/videolog/entries')
      .then((resp: AxiosResponse) => {
        this.setState({
          practiceRecordings: resp.data.practice_recordings as VideoLogEntryJSON[],
          progressRecordings: resp.data.progress_recordings as VideoLogEntryJSON[]
        })
      })
      .catch((reason: any) => {
        console.log(reason)
      })
  }

  render() {
    console.log(this.state)
    return (
      <div className="Timeline">
        <Card className="text-card">
          <CardMedia image={process.env.PUBLIC_URL + '/img/acoustic_guitar.jpg'}
            title="Random Guitar"
            className="media" />
          <CardContent className="content">
            <Typography variant="h4">Guitar Journey</Typography>
            <Typography variant="subtitle1" color="textSecondary" paragraph={true}>
              A documentary of my learning progress from a beginner to an intermediate player
            </Typography>
            <Typography variant="body2" paragraph={true}>
              I was first exposed to guitar when I was around 16. As a teenager, I was lacking the
              discipline to stay focused and practice rigoriously. I took guitar lessons for a year.
              I didn't really pay much attention to music theory or maintain a practice routine. Perhaps
              this is one of those things I wish I could have done better. It was in the middle of 2019,
              I discovered Justin Sandercoe's online guitar course. The lessons were so well
              structured, it motivated me to pick up guitar seriously once again. And I figured, if I
              were to have a wedding any time soon, it is the best time now to pick up my guitar and
              form a band with my friends so we can perform on weddng day!
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
        <VerticalTimeline animate={true}>
        </VerticalTimeline>
      </div>
    )
  }
}

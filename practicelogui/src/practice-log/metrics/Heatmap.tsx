import { Paper } from '@material-ui/core'
import React from 'react'
import CalendarHeatmap from 'react-calendar-heatmap';

import 'react-calendar-heatmap/dist/styles.css';
import ReactTooltip from 'react-tooltip';
import { PracticeTimeSeriesDataPoint } from '../types';
import './Heatmap.scss'

type Props = {
  timeSeries: PracticeTimeSeriesDataPoint[]
}

export default function Heatmap(props: Props) {
  if (props.timeSeries.length === 0) {
    return <Paper className='Heatmap' />
  }

  const tooltipDisplayText = (dataPoint) => {
    if (dataPoint.date == null || dataPoint.minutes === null) {
      return {
        'data-tip': "no recorded practice"
      }
    }
    return {
      'data-tip': `${dataPoint.date.toISOString().slice(0, 10)}: ${dataPoint.value} minutes`
    }
  }

  const classForValue = (dataPoint) => {
    if (!dataPoint) {
      return 'color-empty'
    }

    if (dataPoint.value >= 180) {
      return 'color-github-4'
    } else if (dataPoint.value >= 90) {
      return 'color-github-3'
    } else if (dataPoint.value >= 60) {
      return 'color-github-2'
    } else if (dataPoint.value > 0) {
      return 'color-github-1'
    }
    return 'color-empty'
  }

  const today = new Date();

  return (
    <Paper className="Heatmap">
      <CalendarHeatmap
        horizontal={true}
        startDate={shiftDate(today, -365)}
        endDate={today}
        tooltipDataAttrs={tooltipDisplayText}
        classForValue={classForValue}
        values={props.timeSeries.map((dataPoint: PracticeTimeSeriesDataPoint) => {
          return {
            date: new Date(`${dataPoint.year}-${dataPoint.month}-${dataPoint.day}`),
            value: dataPoint.value
          }
        })}
        showWeekdayLabels={true}
        showMonthLabels={true}
      />
      <ReactTooltip />
    </Paper>
  )
}

function shiftDate(date: Date, numDays: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numDays);
  return newDate;
}

function maxMinutes(data: PracticeTimeSeriesDataPoint[]): number {
  if (data.length === 0) {
    return 0
  }

  let max = data[0].value
  for (let i = 1; i < data.length; i++) {
    if (data[i].value > max) {
      max = data[i].value
    }
  }

  return max
}
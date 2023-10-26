import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
} from 'react-native';

import { useFocusEffect, } from '@react-navigation/native';

export default function CountUp(props) {
  let { style = {}, time, add_time } = props

  const [timeElapsed, setTimeElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 })


  useEffect(() => {
    let interval = time && setInterval(() => {
      // will need to switch from submission_time to serverAtTableTime
      let sec_elapsed = (Date.now() - time - add_time) / 1000

      let hours = Math.floor(sec_elapsed / 3600)
      sec_elapsed %= 3600
      let minutes = Math.floor(sec_elapsed / 60)
      sec_elapsed %= 60

      setTimeElapsed({
        hours,
        minutes,
        seconds: Math.floor(sec_elapsed)
      })
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [time])

  if (timeElapsed.hours >= 24) {
    let days = Math.floor(timeElapsed.hours / 24)
    return <Text style={style}>{days} {days === 1 ? 'day' : 'days'}</Text>
  }

  return <Text style={style}>{displayTimeElapsed(timeElapsed)}</Text>
}

const displayTimeElapsed = ({ hours = 0, minutes = 0, seconds = 0 }) => {
  return hours ? hours + 'h' + minutes.toString().padStart(2, 0) + 'm' + seconds.toString().padStart(2, 0) + 's' :
    minutes ? minutes + 'm' + seconds.toString().padStart(2, 0) + 's' :
      seconds + 's'
}


import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
} from 'react-native';

import { useFocusEffect, } from '@react-navigation/native';

export default function CountUp(props) {
  let { style = {}, time, add_time } = props

  const [timeElapsed, setTimeElapsed] = useState({ minutes: 0, seconds: 0 })


  useFocusEffect(useCallback(() => {
    let interval = time && setInterval(() => {
      // will need to switch from submission_time to serverAtTableTime
      let sec_elapsed = (Date.now() - time - add_time) / 1000

      setTimeElapsed({
        minutes: Math.floor(sec_elapsed / 60),
        seconds: Math.floor(sec_elapsed % 60)
      })
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [time]))

  if (timeElapsed.minutes > 1440) {
    let days = Math.floor(timeElapsed.minutes / 1440)
    return <Text style={style}>{days} {days === 1 ? 'day' : 'days'}</Text>
  }

  return <Text style={style}>{displayTimeElapsed(timeElapsed)}</Text>
}

const displayTimeElapsed = ({ minutes = 0, seconds = 0 }) => {
  return minutes ? minutes + 'm' + seconds.toString().padStart(2, 0) + 's' : seconds + 's'
}


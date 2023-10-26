import React, { useState, useEffect, useMemo, } from 'react';
import {
  StyleSheet,
  View,
  AppState,
  Animated,
  ActivityIndicator,
  PixelRatio,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';
import { useSelector } from 'react-redux';
import { selectIsOrderForced, selectIsOrderWaiting, selectOrderAutoPausedMillis, selectOrderLastActivityMillis, selectOrderPausedMillis, selectOrderPausedUserID, selectOrderReadyMillis } from '../../redux/selectors/selectorsBillOrders';
import { Feather, } from '@expo/vector-icons';
import calculateTimeRemaining from '../../utils/functions/calculateTimeRemaining';


const CLOCK_RADIUS = Layout.window.width * 0.17 * PixelRatio.getFontScale()
const CLOCK_STROKE_WIDTH = Layout.window.width * 0.013 * PixelRatio.getFontScale()

const READY_20_SECONDS = 20000
const WAIT_5_MINUTES = 300000
const PAUSE_2_MINUTES = 120000

const getRemainingTime = (readyMillis, autoPausedMillis, lastActivityMillis, isWaiting) => {
  if (readyMillis) {
    return calculateTimeRemaining(readyMillis, READY_20_SECONDS)
  }
  else if (autoPausedMillis || isWaiting) {
    const timeToUnpause = calculateTimeRemaining(autoPausedMillis, PAUSE_2_MINUTES)
    const timeToUnwait = isWaiting ? calculateTimeRemaining(lastActivityMillis, WAIT_5_MINUTES) : 0
    return Math.max(timeToUnpause, timeToUnwait)
  }
  return 0
}

export default function OrderClock({ isOrderStuck, }) {
  const orderReadyMillis = useSelector(selectOrderReadyMillis)
  const orderAutoPausedMillis = useSelector(selectOrderAutoPausedMillis)
  const orderLastActivityMillis = useSelector(selectOrderLastActivityMillis)
  const orderPausedUserID = useSelector(selectOrderPausedUserID)
  const isOrderWaiting = useSelector(selectIsOrderWaiting)
  const isOrderForced = useSelector(selectIsOrderForced)

  const [appStateChanged, setAppStateChanged] = useState(null)

  const handleAppStateChange = () => setAppStateChanged(Date.now())

  useEffect(() => {
    // Trigger rederivation of initialRemainingTime and isTimestampOutOfRange as app goes from background to foreground
    AppState.addEventListener('change', handleAppStateChange)

    return () => {
      AppState.removeEventListener("change", handleAppStateChange);
    };
  }, [])

  const duration = useMemo(() => {
    if (orderReadyMillis) return READY_20_SECONDS
    else if (isOrderWaiting) return WAIT_5_MINUTES
    else if (orderAutoPausedMillis) return PAUSE_2_MINUTES
    return 0
  }, [orderReadyMillis, orderAutoPausedMillis, isOrderWaiting])

  const initialRemainingTime = useMemo(() => {
    return getRemainingTime(orderReadyMillis, orderAutoPausedMillis, orderLastActivityMillis, isOrderWaiting)
  }, [appStateChanged, orderReadyMillis, orderLastActivityMillis, orderAutoPausedMillis, isOrderWaiting])

  const circumferenceColor = useMemo(() => orderReadyMillis ? Colors.white : isOrderWaiting || orderAutoPausedMillis || orderPausedUserID ? Colors.darkgrey : Colors.white, [orderReadyMillis, isOrderWaiting, orderPausedUserID, orderAutoPausedMillis])


  return <View style={{ height: CLOCK_RADIUS, width: CLOCK_RADIUS, marginHorizontal: 10 }}>
    <CountdownCircleTimer
      key={circumferenceColor + initialRemainingTime + duration + orderPausedUserID}
      initialRemainingTime={(orderPausedUserID ? duration : isOrderStuck ? 0 : initialRemainingTime) / 1000}
      duration={duration / 1000}
      isPlaying={!(orderPausedUserID && !isOrderForced)}
      size={CLOCK_RADIUS}
      strokeWidth={CLOCK_STROKE_WIDTH}
      colors={circumferenceColor}
      trailColor={duration ? circumferenceColor + '61' : circumferenceColor}
    >
      {
        (orderPausedUserID && !isOrderForced) ? <Feather name='pause' size={40} color={Colors.darkgrey} /> :
          !duration ?
            <View style={{ height: CLOCK_STROKE_WIDTH, width: CLOCK_RADIUS, backgroundColor: Colors.white, transform: [{ rotate: '-45deg' }] }} /> :
            ({ remainingTime, animatedColor: color }) => {
              // if (!isPlaying) return <Animated.Text style={{ color, fontSize: 12 * PixelRatio.getFontScale() }}>checking</Animated.Text>
              // time is up
              if (!remainingTime || isOrderStuck) return <ActivityIndicator size='large' color={color} />
              // ready
              if (orderReadyMillis) return <Animated.Text style={{ color, fontWeight: 'bold', fontSize: 30 * PixelRatio.getFontScale() }}>{remainingTime}</Animated.Text>
              // paused
              // calculating new time
              return <View>
                <Animated.Text style={{ textAlign: 'center', color, fontSize: 22 * PixelRatio.getFontScale() }}>
                  {remainingTime}
                </Animated.Text>
                {isOrderWaiting && <Animated.Text style={{ color, fontSize: 12 * PixelRatio.getFontScale(), marginTop: -4 }}>inactive</Animated.Text>}
              </View>
            }
      }
    </CountdownCircleTimer>
  </View>
}


const styles = StyleSheet.create({

});
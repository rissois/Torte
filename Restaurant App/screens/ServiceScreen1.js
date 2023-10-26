import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  PixelRatio,
  Platform,
  Alert,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { ClarifyingText, HeaderText, LargeText, MainText, } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fullDays, threeLetterDays } from '../constants/DOTW';
import DateTimePicker from '@react-native-community/datetimepicker';
import RadioButton from '../components/RadioButton';
import { militaryToDate, addHoursToMilitary, dateToMilitary, militaryToClock } from '../functions/dateAndTime';
import { useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import { TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import deleteService from '../transactions/deleteService';
import useRestaurant from '../hooks/useRestaurant';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const buttonResponses = {
  start_closed: 'Closed',
  twenty_four: '24 hours',
  start_prev: 'prev',
  end_midnight: '2400',
  end_next: 'next',
  time: 'time'
}

const serviceErrors = {
  no_end: 'ne',
  hours_flipped: 'hf',
  midnight: 'mn',
  other: 'other',
}

/*
  Poor nomenclature alert: 
  START AND END on this document refer to a radio button selection
  startTime and endTime are saved as start and end on Firestore
    Additionally confusing, startTime and endTime are really date objects
*/


export default function ServiceScreen1({ navigation, route }) {
  const { days = {} } = useSelector(state => state.restaurant)
  const restaurant_id = useRestaurant()
  let { dayIndex, serviceIndex } = route.params
  let isFirstService = serviceIndex === 0

  let text = days[dayIndex]?.text ?? null
  let services = days[dayIndex]?.services ?? []

  const [start, setStart] = useState('')
  const [startTime, setStartTime] = useState(new Date())
  const [end, setEnd] = useState('')
  const [endTime, setEndTime] = useState(new Date())
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [endColor, setEndColor] = useState(Colors.darkgrey)
  const [overlap, setOverlap] = useState(-1)
  const [submitError, setSubmitError] = useState(null)

  const toggleSubmitError = (value) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSubmitError(value)
  }

  // Initialize all variables
  useEffect(() => {
    // Hydrate with existing services if available
    if (services[serviceIndex]) {
      let { start, end } = services[serviceIndex]
      if (start === buttonResponses.start_prev) {
        setStart(buttonResponses.start_prev)
        start = '0830' // Default start time
        setStartTime(militaryToDate(start))
      }
      else {
        setStart(buttonResponses.time)
        setStartTime(militaryToDate(start))
        setShowStartPicker(true)
      }

      if (end === buttonResponses.end_next) {
        setEnd(buttonResponses.end_next)
        let projected_end = addHoursToMilitary(start, 5, '2359')
        setEndTime(militaryToDate(projected_end))
      }
      else if (end === buttonResponses.end_midnight) {
        setEnd(buttonResponses.end_midnight)
        let projected_end = addHoursToMilitary(start, 5, '2359')
        setEndTime(militaryToDate(projected_end))
      }
      else {
        setEnd(buttonResponses.time)
        setEndTime(militaryToDate(end))
        setShowEndPicker(true)
      }
    }
    // Otherwise, populate start and end with the current status
    // And create estimates for the startTime and endTime
    else {
      if (text === buttonResponses.start_closed) {
        setStart(buttonResponses.start_closed)
      }
      let { end = '0630' } = (services[serviceIndex - 1] ?? {})
      if (end === buttonResponses.end_next) {
        end = '0630'
      }
      let projected_start = addHoursToMilitary(end, 2, '2358')
      let projected_end = addHoursToMilitary(projected_start, 5, '2359')
      setStartTime(militaryToDate(projected_start))
      setEndTime(militaryToDate(projected_end))
      if (serviceIndex !== 0) {
        setStart(buttonResponses.time)
        setShowStartPicker(true)
      }
    }
  }, [text, services, serviceIndex])

  // Grey out secondary questions
  useEffect(() => {
    // If start is a number, allow for an end
    setEndColor(start && start !== buttonResponses.start_closed ? Colors.softwhite : Colors.darkgrey)
  }, [start])

  // Check for overlaps and block use
  useEffect(() => {
    if (start !== buttonResponses.start_closed) {
      let currentStartTime = start === buttonResponses.start_prev ? '0000' : dateToMilitary(startTime)
      let currentEndTime = end === buttonResponses.end_next || end === buttonResponses.end_midnight ? '2400' : dateToMilitary(endTime)
      // Can technically do a reduce to find all overlaps
      if (end) {
        let overlapIndex = services.findIndex((service, index) => {
          if (index === serviceIndex) {
            return false
          }
          let inspectStartTime = service.start === buttonResponses.start_prev ? '0000' : service.start
          let inspectEndTime = service.end === buttonResponses.end_next ? '2400' : service.end
          if (currentEndTime < inspectStartTime || currentStartTime > inspectEndTime) {
            return false
          }
          return true
        })
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOverlap(overlapIndex)
      }
      else {
        let overlapIndex = services.findIndex((service, index) => {
          if (index === serviceIndex) {
            return false
          }
          let inspectStartTime = service.start === buttonResponses.start_prev ? '0000' : service.start
          let inspectEndTime = service.end === buttonResponses.end_next ? '2400' : service.end
          if (currentStartTime < inspectStartTime || currentStartTime > inspectEndTime) {
            return false
          }
          return true
        })
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOverlap(overlapIndex)
      }

    }
    else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOverlap(-1)
    }
  }, [start, end, startTime, endTime])

  const nextNavigation = () => {
    if (start === buttonResponses.start_closed || end === buttonResponses.end_midnight || end === buttonResponses.end_next || route.params.return) {
      navigation.navigate('Hours')
    }
    else if (services[serviceIndex + 1]) {
      navigation.push('Service1', { dayIndex, serviceIndex: serviceIndex + 1 })
    }
    else {
      navigation.push('Service2', { dayIndex, serviceIndex })
    }
  }



  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} {...Array.isArray(text) && text[serviceIndex] && {
          rightText: 'Delete', rightFn: () => {
            Alert.alert(`Delete ${text[serviceIndex]}?`, undefined, [
              {
                text: 'Yes', onPress: async () => {
                  try {
                    deleteService(restaurant_id, days[dayIndex], dayIndex, serviceIndex, text[serviceIndex])
                    navigation.navigate('Hours')
                  }
                  catch (error) {
                    console.log(error)
                    setTimeout(() => {
                      toggleSubmitError(serviceErrors.other)
                    }, submitError ? 100 : 0)
                  }
                }
              },
              {
                text: 'Cancel',
                style: 'cancel'
              },
            ])
          }
        }} />
        <View style={{}}>
          <HeaderText style={{ textAlign: 'center', }}>{fullDays[dayIndex]}s</HeaderText>
          {Array.isArray(text) && text[serviceIndex] && <View>
            <MainText style={{ textAlign: 'center' }}>{text[serviceIndex]}</MainText>
          </View>}
          {(!!submitError || !!~overlap) && <TouchableWithoutFeedback onPress={() => { toggleSubmitError(null) }}><View style={{ marginTop: Layout.spacer.medium }}>
            <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>{~overlap ? `CANNOT OVERLAP WITH\n${text[overlap]}` : submitError === serviceErrors.midnight ? 'DID YOU MEAN MIDNIGHT?' : submitError === serviceErrors.no_end ? 'MISSING CLOSING TIME' : submitError === serviceErrors.hours_flipped ? 'OPEN LATER THAN CLOSE' : 'ERROR WITH SUBMISSION'}</LargeText>
          </View></TouchableWithoutFeedback>}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: Layout.window.width * 0.5, alignSelf: 'center', }}>
          <View>
            <LargeText style={{ textAlign: 'center', }}>When do you {isFirstService ? 'first' : ''} open?</LargeText>

            {isFirstService && <TouchableOpacity onPress={() => {
              setStart(buttonResponses.start_closed)
              setEnd('')
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowStartPicker(false)
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small }}>
                <RadioButton on={start === buttonResponses.start_closed} />
                <MainText>We are closed on {fullDays[dayIndex]}s</MainText>
              </View>
            </TouchableOpacity>}

            <TouchableOpacity onPress={() => {
              setStart(buttonResponses.time)
              LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
              setShowStartPicker(true)
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small }}>
                <RadioButton on={start === buttonResponses.time} />
                <MainText>At a set time{start === buttonResponses.time && ' (choose below)'}</MainText>

              </View>
            </TouchableOpacity>

            {isFirstService && <TouchableOpacity onPress={() => {
              setStart(buttonResponses.start_prev)
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowStartPicker(false)
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small }}>
                <RadioButton on={start === buttonResponses.start_prev} />
                <MainText>Service starts on {fullDays[(dayIndex + 6) % 7]} and continues into {fullDays[dayIndex]}</MainText>
              </View>
            </TouchableOpacity>}
          </View>
          {showStartPicker && <DateTimePicker
            mode='time'
            display='spinner'
            value={startTime}
            style={{ width: Layout.window.width * 0.5, height: 200 }}
            onChange={(_, selectedDate) => { setStartTime(selectedDate) }}
            is24Hour={false}
            textColor={Colors.softwhite}
            minuteInterval={5}
          />}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: Layout.window.width * 0.5, alignSelf: 'center', }}>
          <View>
            <LargeText center style={{ color: endColor }} >When do you {isFirstService ? 'first' : ''} close?</LargeText>
            <ClarifyingText center style={{ color: endColor }}>You may close between services. When is the next time it is empty?</ClarifyingText>

            <TouchableOpacity disabled={!start || start === buttonResponses.start_closed} onPress={() => {
              setEnd(buttonResponses.end_midnight)
              // setEndTime(militaryToDate(buttonResponses.end_midnight)) // not sure if this is necessary...
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowEndPicker(false)
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small }}>
                <RadioButton color={endColor} on={end === buttonResponses.end_midnight} />
                <MainText style={{ color: endColor }}>Service ends at <Text {...submitError === serviceErrors.midnight && { style: { color: Colors.red, fontWeight: 'bold' } }}>midnight</Text></MainText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity disabled={!start || start === buttonResponses.start_closed} onPress={() => {
              setEnd(buttonResponses.time)
              LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
              setShowEndPicker(true)
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small }}>
                <RadioButton color={endColor} on={end === buttonResponses.time} />
                <MainText style={{ color: endColor }}>At a set time{end === buttonResponses.time && ' (choose below)'}</MainText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity disabled={!start || start === buttonResponses.start_closed} onPress={() => {
              setEnd(buttonResponses.end_next)
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowEndPicker(false)
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small }}>
                <RadioButton color={endColor} on={end === buttonResponses.end_next} />
                <MainText style={{ color: endColor }}>Service continues into {fullDays[(dayIndex + 1) % 7]}</MainText>
              </View>
            </TouchableOpacity>
          </View>

          {showEndPicker && <DateTimePicker
            mode='time'
            display='spinner'
            value={endTime}
            style={{ width: Layout.window.width * 0.5, height: 200 }}
            onChange={(_, selectedDate) => { setEndTime(selectedDate) }}
            is24Hour={false}
            textColor={Colors.softwhite}
            minuteInterval={5}
          />}
        </View>



        <View style={{ marginVertical: Layout.spacer.medium }}>
          <MenuButton color={(start === buttonResponses.start_closed || (start && end)) && !~overlap ? Colors.purple : Colors.darkgrey} text={services[serviceIndex] ? 'Save' : 'Next'} buttonFn={async () => {
            setSubmitError(null)
            setOverlap(-1)

            let startMilitary = dateToMilitary(startTime)
            let endMilitary = end === buttonResponses.end_midnight ? buttonResponses.end_midnight : dateToMilitary(endTime)

            if (~overlap) {
              setTimeout(() => {
                setOverlap(overlap)
              }, ~overlap ? 100 : 0)
            }
            // There must be an end if not closed
            else if (start !== buttonResponses.start_closed && !end) {
              setTimeout(() => {
                toggleSubmitError(serviceErrors.no_end)
              }, submitError ? 100 : 0)
            }
            else if (end === buttonResponses.time && endMilitary === '0000') {
              setTimeout(() => {
                toggleSubmitError(serviceErrors.midnight)
              }, submitError ? 100 : 0)
            }
            // If both start and end are times of day, start must be earlier than end
            else if (start === buttonResponses.time && end === buttonResponses.time && startMilitary >= endMilitary) {
              setTimeout(() => {
                toggleSubmitError(serviceErrors.hours_flipped)
              }, submitError ? 100 : 0)
            }
            else {
              // Create start, end, mealOrder object for this service
              let service = start === buttonResponses.start_closed ? null : {
                start: start === buttonResponses.start_prev ? buttonResponses.start_prev : startMilitary,
                end: end === buttonResponses.end_next ? buttonResponses.end_next : endMilitary,
                mealOrder: services[serviceIndex]?.mealOrder ?? []
              }

              // Closed and 24 hours indicates there are no services, and therefore the text for the day is a string
              let single_text =
                // Closed
                start === buttonResponses.start_closed ? buttonResponses.start_closed :
                  // 24 hours
                  (start === buttonResponses.start_prev || startMilitary === '0000') && (end === buttonResponses.end_next || endMilitary === '2400') ? buttonResponses.twenty_four : false

              // A range of times has the potential for multiple services, therefore the text for each service is in an array
              let array_text = single_text ? false :
                // Formatted as (3Day || ##:##AM) - (3Day || midnight || ##:##PM)
                (start === buttonResponses.start_prev ? threeLetterDays[(dayIndex + 6) % 7] : militaryToClock(startMilitary)) + ' - ' + (end === buttonResponses.end_next ? threeLetterDays[(dayIndex + 1) % 7] : end === buttonResponses.end_midnight ? 'midnight' : militaryToClock(endMilitary))


              // Check if text has changed
              if ((typeof text === 'string' && text !== single_text) || (Array.isArray(text) && text[serviceIndex] !== array_text)) {
                let new_text = Array.isArray(text) ? [...text] : []
                let new_services = [...services]

                if (single_text) {
                  // If closed or 24 hours, simplify down to empty array or single service
                  new_text = single_text
                  new_services = service ? [service] : []
                }
                else {
                  // Remove the old service and corresponding text
                  new_text.splice(serviceIndex, 1)
                  new_services.splice(serviceIndex, 1)

                  // If empty, simply replace
                  if (!new_services.length) {
                    new_text = [array_text]
                    new_services = [service]
                  }
                  // If this is the last service, or a new service, push to end by default
                  else if (service.end === buttonResponses.end_midnight || service.end === buttonResponses.end_next || serviceIndex === services.length) {
                    new_text.push(array_text)
                    new_services.push(service)
                  }
                  // Otherwise, find where to insert service in order
                  else {
                    let newServiceIndex = new_services.findIndex(({ start }) => { start > service.end })
                    new_text.splice(newServiceIndex, 0, array_text)
                    new_services.splice(newServiceIndex, 0, service)
                  }
                }


                try {
                  await firebase.firestore().collection('restaurants').doc(restaurant_id).set({
                    days: {
                      [dayIndex]: {
                        text: new_text,
                        services: new_services,
                      }
                    }
                  }, { merge: true })
                  nextNavigation()
                }
                catch (error) {
                  console.log(error)
                  setTimeout(() => {
                    toggleSubmitError(serviceErrors.other)
                  }, submitError ? 100 : 0)
                }
              }
              else {
                nextNavigation()
              }
            }
          }
          } />
        </View>

      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  body: {
    width: Layout.window.width * 0.7,
    alignSelf: 'center'
  }
});


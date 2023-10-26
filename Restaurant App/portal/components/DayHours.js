import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { DefaultText, LargeText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { MaterialIcons, } from '@expo/vector-icons';
import firebase from 'firebase';
import PortalGroup from './PortalGroup';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { addHoursToMilitary, dateToMilitary, getDOTW, militaryToClock, militaryToDate, shiftDOTW } from '../../utils/functions/dateAndTime';
import { getStartOfHours, getEndOfHours, checkIfHoursOverlap } from '../functions/getHours';
import StyledButton from '../../utils/components/StyledButton';
import { PortalCheckField } from './PortalFields';
import dateTimePickerStyles from '../constants/dateTimePickerStyles';


export default function DayHours({ day: { hours, is_closed, }, setDays, dotw_id, isTomorrowStartingAtMidnight, endOfTomorrowsFirstHours }) {
  const dispatch = useDispatch()
  const today = getDOTW(dotw_id)
  const tomorrow = getDOTW(dotw_id, 1)
  const [endOfToday, setEndOfToday] = useState('2400')
  const [isOverlap, setIsOverlap] = useState(false)
  const isOvernight = endOfToday === '2400' && isTomorrowStartingAtMidnight

  useEffect(() => {
    setEndOfToday(getEndOfHours(hours))
    setIsOverlap(checkIfHoursOverlap(hours))
  }, [hours])

  const toggleClosed = useCallback(() => {
    setDays(prev => ({
      ...prev,
      [dotw_id]: {
        ...prev[dotw_id],
        is_closed: !prev[dotw_id].is_closed
      }
    }))
  }, [])



  const handleOvernight = useCallback(() => {
    if (isOvernight && isTomorrowStartingAtMidnight) {
      dispatch(doAlertAdd(undefined, `We have automatically identified that ${today} ends at midnight and ${tomorrow} starts at midnight. You may change these hours if the restaurant is not open overnight.`))
    }
    else {
      const startOfTodaysLastHours = getStartOfHours(hours.slice(-1))
      dispatch(doAlertAdd(
        `Set ${today} as open overnight?`,
        `We track each day separately. So if you are open from 8PM - 1AM, you will want to set ${today} as 8PM-midnight and ${tomorrow} as midnight - 1AM`,
        [
          ...!!endOfTomorrowsFirstHours ? [{
            text: `Set ${today} ${militaryToClock(startOfTodaysLastHours)} - midnight and ${tomorrow} midnight - ${militaryToClock(endOfTomorrowsFirstHours, undefined, true)}`,
            onPress: () => setDays(prev => {
              const todaysHours = [...prev[dotw_id].hours]
              todaysHours[todaysHours.length - 1] = { ...todaysHours[todaysHours.length - 1], end: '2400' }

              const tomorrow_dotw_id = shiftDOTW(dotw_id, 1)
              const tomorrowsHours = [...prev[tomorrow_dotw_id].hours]
              tomorrowsHours[0] = { ...tomorrowsHours[0], start: '0000', }

              return {
                ...prev,
                [dotw_id]: {
                  ...prev[dotw_id],
                  hours: todaysHours,
                },
                [tomorrow_dotw_id]: {
                  ...prev[tomorrow_dotw_id],
                  hours: tomorrowsHours,
                }
              }
            })
          }] : [],
          {
            text: `Split ${today}'s hours into ${today} ${militaryToClock(startOfTodaysLastHours)} - midnight and ${tomorrow} midnight - ${militaryToClock(endOfToday)}`,
            onPress: () => {
              setDays(prev => {
                const todaysHours = [...prev[dotw_id].hours]
                todaysHours[todaysHours.length - 1] = { ...todaysHours[todaysHours.length - 1], end: '2400' }

                const tomorrow_dotw_id = shiftDOTW(dotw_id, 1)
                const tomorrowsFirstHours = {
                  start: '0000',
                  end: endOfToday,
                  id: (firebase.firestore().collection('fake').doc()).id,
                  meal_order: [],
                }

                return {
                  ...prev,
                  [dotw_id]: {
                    ...prev[dotw_id],
                    hours: todaysHours,
                  },
                  [tomorrow_dotw_id]: {
                    ...prev[tomorrow_dotw_id],
                    is_closed: false,
                    hours: [tomorrowsFirstHours, ...prev[tomorrow_dotw_id].hours],
                  }
                }
              })
            },
          },
          {
            text: 'Cancel'
          }
        ]
      ))
    }
  }, [isOvernight, hours, endOfToday, isTomorrowStartingAtMidnight, endOfTomorrowsFirstHours])

  const changeTimePicker = (index, isStart) => (event, date) => setDays(prev => {
    const todaysHours = [...prev[dotw_id].hours]
    const dateAsMilitary = dateToMilitary(date)
    todaysHours[index] = {
      ...todaysHours[index],
      ...isStart ? { start: dateAsMilitary } : { end: dateAsMilitary === '0000' ? '2400' : dateAsMilitary }
    }
    return {
      ...prev,
      [dotw_id]: {
        ...prev[dotw_id],
        hours: todaysHours
      }
    }
  })

  const deleteHours = (id) => setDays(prev => ({
    ...prev,
    [dotw_id]: {
      ...prev[dotw_id],
      hours: prev[dotw_id].hours.filter(hour => hour.id !== id),
    }
  }))

  const addHours = () => setDays(prev => ({
    ...prev,
    [dotw_id]: {
      ...prev[dotw_id],
      hours: [
        ...prev[dotw_id].hours,
        {
          start: endOfToday || '1200',
          end: endOfToday ? addHoursToMilitary(endOfToday, 3, '2400') : '2100',
          id: (firebase.firestore().collection('fake').doc()).id,
          meal_order: [],
        }]
    }
  }))

  const sortHours = () => setDays(prev => {
    const todaysHours = [...prev[dotw_id].hours]
    return {
      ...prev,
      [dotw_id]: {
        ...prev[dotw_id],
        hours: todaysHours.sort((a, b) => a.start - b.start)
      }
    }
  })

  return <PortalGroup title={today}>
    <View style={{ marginHorizontal: 20, marginBottom: 30 }}>
      <PortalCheckField
        value={is_closed}
        onPress={toggleClosed}
        text={`The restaurant is closed on ${today}s`}
      />

      <View style={{ opacity: is_closed ? 0.2 : 1, }}>
        {isOverlap && <LargeText center bold red>HOURS CANNOT OVERLAP</LargeText>}
        {
          hours.map(({ end, start, id, meal_order }, index) => (
            <View key={id} style={{ marginVertical: 10, }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <LargeText style={{ marginLeft: 30 }}>Start: </LargeText>
                <DateTimePicker
                  value={militaryToDate(start)}
                  onChange={changeTimePicker(index, true)}
                  {...dateTimePickerStyles}
                />
                <LargeText style={{ marginLeft: 30 }}>End: </LargeText>
                <DateTimePicker
                  value={militaryToDate(end)}
                  onChange={changeTimePicker(index)}
                  {...dateTimePickerStyles}
                />
                <TouchableOpacity onPress={() => {
                  if (meal_order.length) {
                    dispatch(doAlertAdd(
                      'These hours have meals associated with them',
                      `Are you sure you want to delete ${today} ${militaryToClock(start)} - ${militaryToClock(end)}?`,
                      [
                        {
                          text: 'Yes, delete hours',
                          onPress: () => deleteHours(id)
                        },
                        {
                          text: 'No, cancel'
                        }
                      ]
                    ))
                  }
                  else {
                    deleteHours(id)
                  }
                }}>
                  <MaterialIcons name='remove-circle' size={30} color={Colors.red} style={{ marginLeft: 30 }} />
                </TouchableOpacity>
              </View>
              {start > end && <LargeText center bold red>START MUST BE BEFORE END</LargeText>}
            </View>
          ))
        }

        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 10 }}>
          <StyledButton small color={Colors.midgrey} disabled={hours.length <= 1} text='Sort hours' onPress={sortHours} />
          <StyledButton small color={Colors.darkgreen} text='Add hours' onPress={addHours} />
        </View>

        {
          !!hours.length && <PortalCheckField
            value={isOvernight}
            onPress={handleOvernight}
            text={`These hours continue overnight into ${tomorrow}`}
            subtext={`We track each day separately. So if you are open from 8PM - 1AM, you will want to set ${today} as 8PM-midnight and ${tomorrow} as midnight - 1AM`}
            isLocked={is_closed}
          />
        }
      </View>
    </View>
  </PortalGroup>
}

const styles = StyleSheet.create({

});


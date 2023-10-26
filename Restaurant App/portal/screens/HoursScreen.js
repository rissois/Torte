import React, { useState, } from 'react';
import {
  StyleSheet,
} from 'react-native';
import useRestaurantNestedFields from '../../hooks/useRestaurantNestedField';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { getStartOfDay, getEndOfDay, checkIfHoursOverlap } from '../functions/getHours';
import DayHours from '../components/DayHours';
import { fullDays } from '../../utils/constants/DOTW';
import PortalForm from '../components/PortalForm';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';

/*
  ONLY FOCUS ON:
  is_closed
  hours start and end
  
  The remainder is just determined on saving
  ! warn deleting modOrder
*/

const checkIfDaysAltered = (days, currentDays) => {
  return Object.keys(days).some(index => {
    const day = days[index]
    const currentDay = currentDays[index]

    if (day.is_closed !== currentDay.is_closed) return true
    if (day.hours.length !== currentDay.hours.length) return true
    return day.hours.some((hour, index) => {
      const currentHour = currentDay.hours[index]
      return hour.start !== currentHour.start
        || hour.end !== currentHour.end
        || hour.meal_order.length !== currentHour.meal_order.length
    })

  })
}

const sortAllHours = () => setDays(prev => {
  const todaysHours = [...prev[dotw_id].hours]
  return {
    ...prev,
    [dotw_id]: {
      ...prev[dotw_id],
      hours: todaysHours.sort((a, b) => a.start - b.start)
    }
  }
})

export default function HoursScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()

  const currentDays = useRestaurantNestedFields('days')

  const [days, setDays] = useState(currentDays)

  const isAltered = checkIfDaysAltered(days, currentDays)

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => setDays(currentDays)
      },
      {
        text: 'No'
      }
    ]))
  }

  const save = () => {
    let failed = []
    let copy = {}

    Object.keys(days).forEach(dotw_id => {
      const isOverlap = checkIfHoursOverlap(days[dotw_id].hours)
      const isBackwards = days[dotw_id].hours.some(({ start, end }) => start > end)
      if (isOverlap || isBackwards) {
        failed.push(`${fullDays[dotw_id]} ${isOverlap && isBackwards ? 'has overlapping hours and hours that end before they start'
          : isOverlap ? 'has overlapping hours'
            : 'has hours that end before they start'}.`)
      }

      const todaysHours = [...days[dotw_id].hours]
      copy[dotw_id] = {
        ...days[dotw_id],
        hours: todaysHours.sort((a, b) => a.start - b.start)
      }


    })

    // ALWAYS SORT HOURS ON SAVE ATTEMPT
    setDays(copy)

    if (failed.length) {
      dispatch(doAlertAdd('Invalid hours', ['Correct the following fields: ', ...failed]))
    }
    else {
      return restaurantRef.set({
        days: copy
      }, { merge: true }).then(() => {
        dispatch(doSuccessAdd())
      }).catch(error => {
        console.log('HoursScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new hours', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }


  return (
    <PortalForm
      headerText='Hours of Operation'
      save={save}
      reset={reset}
      isAltered={isAltered}
    >
      {
        Object.keys(days).map(dotw_id => {
          return <DayHours
            key={dotw_id}
            dotw_id={dotw_id}
            day={days[dotw_id]}
            setDays={setDays}
            endOfTomorrowsFirstHours={getEndOfDay(days, dotw_id, 1)}
            isTomorrowStartingAtMidnight={getStartOfDay(days, dotw_id, 1) === '0000'}
          />
        })
      }


    </PortalForm>
  )
}


const styles = StyleSheet.create({

});


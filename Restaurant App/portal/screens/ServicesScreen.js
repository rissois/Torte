import React, { useCallback, useEffect, useMemo, useState, } from 'react';
import {
  StyleSheet,
} from 'react-native';
import firebase from 'firebase';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { fullDays } from '../../utils/constants/DOTW';
import PortalForm from '../components/PortalForm';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import PortalGroup from '../components/PortalGroup';
import { ExtraLargeText, LargeText, MediumText } from '../../utils/components/NewStyledText';
import equalArrays from '../../utils/functions/equalArrays';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { PortalTextField } from '../components/PortalFields';
import { useFocusEffect } from '@react-navigation/native';
import useCategoryChild from '../hooks/useCategoryChild';
import { militaryToClock } from '../../utils/functions/dateAndTime';
import StyledButton from '../../utils/components/StyledButton';
import Colors from '../../utils/constants/Colors';
import PortalDragger from '../components/PortalDragger';
import PortalAddOrCreate from '../components/PortalAddOrCreate';

/*
DAYS
[dotw_id]: {
  earliest: '830',
  hours: [
    {
      end: '1330',
      id: 'random',
      meal_order: [],
      start: '1232
    }
  ]
}
*/

/*
MEALS
[meal_id]: {
  end: '2400',
  internal_name: 'Example',
  menus: [
    {
      end: '2400',
      is_strict: false,
      menu_id: '',
      name: '',
      start: ''
    }
  ],
  name: 'Late night',
  start: '1730'
}
*/

export default function ServicesScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()

  const { id, } = route.params ?? {}

  const {
    id: periodExists = '',
    meal_order: incomingMealOrder = [],
    dotw_id: currentDotwID,
    start = '',
    end = '',
  } = useCategoryChild('periods', id)

  useFocusEffect(useCallback(() => {
    if (!periodExists) {
      dispatch(doAlertAdd('Cannot find this period', 'If you recently edited your hours of operation, you may have affected this period. Please try again and let Torte know if the issue persists.'))
      navigation.goBack()
    }
  }, [periodExists]))


  const [currentMealOrder, setCurrentMealOrder] = useState([])
  useEffect(() => {
    setCurrentMealOrder(prev => !equalArrays(prev, incomingMealOrder) ? incomingMealOrder : prev)
  }, [incomingMealOrder])

  const [meal_order, setMealOrder] = useState(incomingMealOrder)

  const isAltered = !equalArrays(meal_order, currentMealOrder, true)

  const navigateToHours = useCallback(() => {
    if (isAltered) {
      dispatch(doAlertAdd('Unsaved changes', 'Save or discard any unsaved changes before changing the hours',
        // You can offer the options here... but worried about accidental discard
      ))
    }
    else {
      navigation.navigate('Hours')
    }
  }, [isAltered])

  const reset = useCallback(() => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => setMealOrder(currentMealOrder)
      },
      {
        text: 'No'
      }
    ]))
  }, [currentMealOrder])

  const save = useCallback(() => {
    let failed = []
    if (!~currentDotwID) failed.push('Cannot find day for period')

    if (failed.length) {
      dispatch(doAlertAdd('Invalid periods', ['Correct the following fields: ', ...failed]))
    }
    else {
      return firebase.firestore().runTransaction(async transaction => {
        const restaurantDoc = await transaction.get(restaurantRef)
        if (!restaurantDoc.exists) throw 'Cannot find restaurant'

        let { days: { [currentDotwID]: { hours } } } = restaurantDoc.data()

        const hourIndex = hours.findIndex(hour => hour.id === id)

        if (!~hourIndex) throw 'Cannot find period'

        hours[hourIndex] = { ...hours[hourIndex], meal_order }

        transaction.set(restaurantRef, {
          days: {
            [currentDotwID]: {
              hours
            }
          }
        }, { merge: true })
      }).then(() => {
        dispatch(doSuccessAdd())
      }).catch(error => {
        console.log('PeriodsScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new settings', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }, [meal_order, currentDotwID])

  return (
    <PortalForm
      headerText='Edit period'
      save={save}
      reset={reset}
      isAltered={isAltered}
    >
      <PortalGroup text='Basic info'>
        <PortalTextField text='Day' value={fullDays[currentDotwID]} isLocked />
        <PortalTextField text='Period' value={`${militaryToClock(start, undefined)} - ${militaryToClock(end, undefined, true)}`} isLocked />

        <LargeText style={{ marginVertical: 10 }}>Do you need to change the hours for this period?</LargeText>
        <StyledButton style={{ alignSelf: 'flex-start', backgroundColor: isAltered ? Colors.darkgrey : Colors.purple }} text='Edit hours' onPress={navigateToHours} />
        {isAltered && <MediumText style={{ marginTop: 12 }}>(You must save this before you can change the hours of operation)</MediumText>}
      </PortalGroup>

      <PortalGroup text='Meals'>
        <PortalDragger
          category='meals'
          child_ids={meal_order}
          setChildIDs={setMealOrder}
          isAltered={isAltered}
        />
        <PortalAddOrCreate
          category='meals'
          navigationParams={id ? { period_id: id, dotw_id: currentDotwID, start, end } : null}
          isAltered={isAltered}
          addExisting={() => setShowChildCategory('meals')}
        />

      </PortalGroup>

    </PortalForm>
  )
}


const styles = StyleSheet.create({

});


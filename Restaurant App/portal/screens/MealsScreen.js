import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import firebase from 'firebase';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import PortalForm from '../components/PortalForm';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import PortalGroup from '../components/PortalGroup';
import { PortalTextField } from '../components/PortalFields';
import { MediumText } from '../../utils/components/NewStyledText';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import useCategoryChild from '../hooks/useCategoryChild';
import { dateToMilitary, } from '../../utils/functions/dateAndTime';
import PortalSelector from '../components/PortalSelector';
import MealMenuDragger from '../components/MealMenuDragger';
import MealStartEndPicker from '../components/MealStartEndPicker';
import PortalDelete from '../components/PortalDelete';
import PortalAddOrCreate from '../components/PortalAddOrCreate';
import { useFocusEffect } from '@react-navigation/native';


const equalMenus = (menus, currentMenus) => {
  if (menus.length !== currentMenus.length) return false
  return menus.every((menu, index) => {
    const currentMenu = currentMenus[index]
    return menu.menu_id === currentMenu.menu_id
      && menu.name === currentMenu.name
      && menu.start === currentMenu.start
      && menu.end === currentMenu.end
      && menu.is_strict === currentMenu.is_strict
  })
}

export default function MealsScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()

  const { id, period_id, dotw_id, start: periodStart, end: periodEnd } = route.params ?? {}

  const {
    end: currentEnd = '',
    internal_name: currentInternalName = '',
    menus: currentMenus = [],
    name: currentName = '',
    start: currentStart = '',
    menus: mealExisting = false,
  } = useCategoryChild('meals', id)

  useEffect(() => {
    if (id && !currentName) navigation.goBack()
  }, [currentName, id])

  useFocusEffect(useCallback(() => {
    setMenus(prev => !equalMenus(prev, currentMenus, true) ? currentMenus : prev)
  }, [currentMenus]))

  const [start, setStart] = useState(periodStart || currentStart)
  const [end, setEnd] = useState(periodEnd || currentEnd)
  const [name, setName] = useState(currentName)
  const [internal_name, setInternalName] = useState(currentInternalName)
  const [menus, setMenus] = useState(currentMenus)
  const [showMenuSelector, setShowMenuSelector] = useState(false)

  const isAltered = name !== currentName
    || internal_name !== currentInternalName
    || start !== currentStart
    || end !== currentEnd
    || !equalMenus(menus, currentMenus)

  const reset = useCallback(() => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setName(currentName)
          setInternalName(currentInternalName)
          setStart(currentStart)
          setEnd(currentEnd)
          setMenus(currentMenus)
        }
      },
      {
        text: 'No'
      }
    ]))
  }, [currentMenus])

  const save = useCallback(() => {
    let failed = []
    if (!name) failed.push('Missing name')
    if (failed.length) {
      dispatch(doAlertAdd('Invalid meals', ['Correct the following fields: ', ...failed]))
    }
    else {
      return firebase.firestore().runTransaction(async transaction => {
        const meal_id = id || (restaurantRef.collection('fake').doc()).id

        let mealInHours = null

        if (!id && period_id) {
          const restaurantDoc = await transaction.get(restaurantRef)
          if (!restaurantDoc.exists) throw 'Cannot find restaurant'

          let { days: { [dotw_id]: { hours } } } = restaurantDoc.data()

          const hourIndex = hours.findIndex(period => period.id === period_id)

          if (!~hourIndex) throw 'Cannot find periods'

          hours[hourIndex] = {
            ...hours[hourIndex],
            meal_order: [...hours[hourIndex].meal_order, meal_id]
          }

          mealInHours = hours
        }


        transaction.set(restaurantRef, {
          ...!!mealInHours && {
            days: {
              [dotw_id]: {
                hours: mealInHours
              }
            }
          },
          meals: {
            [meal_id]: {
              end,
              internal_name,
              menus,
              name,
              start,
            }
          }
        }, { merge: true })

        return meal_id
      }).then(meal_id => {
        dispatch(doSuccessAdd())
        if (!id) navigation.setParams({ id: meal_id })
      }).catch(error => {
        console.log('MealsScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new settings', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }, [menus, start, end, name])

  const setTime = useCallback(isStart => (event, date) => {
    const dateAsMilitary = dateToMilitary(date)
    if (isStart) setStart(dateAsMilitary)
    else if (dateAsMilitary === '0000') setEnd('2400')
    else setEnd(dateAsMilitary)
  }, [])


  return (
    <>
      <PortalForm
        headerText={id ? `Edit ${name}` : 'Create meal'}
        save={save}
        reset={reset}
        isAltered={isAltered}
      >
        <PortalGroup text='Basic info'>
          <PortalTextField
            text='Name'
            value={name}
            onChangeText={setName}
            isRequired
            placeholder='(required)'
            subtext={`Keep this short. E.g. Breakfast, Lunch, Dinner, Late Night, All day`}
          />
          <PortalTextField
            text='Internal name'
            value={internal_name}
            onChangeText={setInternalName}
            placeholder='(optional)'
            subtext={`Used to distinguish between two meals that may be available different days`}
          />
        </PortalGroup>


        <PortalGroup text='When is this meal available?'>
          <View style={{ marginVertical: 10, }}>
            <MediumText><Text style={{ fontWeight: 'bold' }}>NOTE: </Text>Unlike your Hours, meals may overlap. They may also extend overnight, and Torte will automatically display them across days. You can even make them available 5-10 minutes early!</MediumText>
          </View>

          <MealStartEndPicker start={start} end={end} setTime={setTime} />
        </PortalGroup>

        <PortalGroup text='Menus' isDrag>
          <MealMenuDragger menus={menus} setMenus={setMenus} />
          <PortalAddOrCreate
            category='menus'
            navigationParams={id ? { meal_id: id, start, end } : null}
            isAltered={isAltered}
            addExisting={() => setShowMenuSelector(true)}
          />
          {/* <StyledButton text='Add existing menu' center onPress={() => {
            Keyboard.dismiss()
            setShowMenuSelector('menus')
          }} style={{ marginVertical: 20 }} />
          <MediumText center>If you need to create or add a menu,</MediumText>
          <MediumText center>please go to the Menus section</MediumText> */}
        </PortalGroup>

        {!!id && <PortalDelete category='meals' id={id} />}
      </PortalForm>

      {showMenuSelector && <PortalSelector
        category={'menus'}
        selected={menus}
        setSelected={setMenus}
        parent='meals'
        close={() => setShowMenuSelector(false)}
        start={start}
        end={end}
      />}
    </>
  )
}

const styles = StyleSheet.create({

});


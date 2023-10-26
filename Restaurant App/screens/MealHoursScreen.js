import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Alert,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { ClarifyingText, HeaderText, LargeText, MainText, } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { militaryToDate, dateToMilitary, } from '../functions/dateAndTime';
import { useSelector, useDispatch } from 'react-redux';
import firebase from '../config/Firebase';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { setTracker } from '../redux/actionsTracker';
import RenderOverlay from '../components/RenderOverlay';
import useRestaurant from '../hooks/useRestaurant';

const submitErrors = {
  order: 'START MUST COME BEFORE END',
  other: 'ERROR WITH SUBMISSION'
}



export default function MealHoursScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()
  let { name, internal_name } = route?.params ?? {}
  const { restaurant: { days = {}, meals = {} }, tracker: { meal: meal_id, dayIndex = -1, serviceIndex = -1 } } = useSelector(state => state)
  let { [meal_id]: meal = {} } = meals
  let { [dayIndex]: day = {} } = days ?? {}
  let { [serviceIndex]: service = {}, text = {} } = day.services ?? {}

  // Get the end time for the 
  // let nextServiceEndTime = service.end === 'next' ? (days[(dayIndex + 1) % 7].services?.[0]?.end === 'next' ? '2400' : days[(dayIndex + 1) % 7].services?.[0]?.end) : null

  // Use military to date as required... 
  // REMINDER THAT MENU SHOULD USE MEAL HOURS AS THE DEFAULT
  const [startTime, setStartTime] = useState(militaryToDate(route?.params?.start ?? (service.start ? service.start === 'prev' ? '0000' : service.start : '1130')))
  const [endTime, setEndTime] = useState(militaryToDate(route?.params?.end ?? (service.end ? service.end === 'next' ? '2400' : service.end : '1900')))
  const [submitError, setSubmitError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // Check that your start is before your end

  // useEffect(() => {
  //   let miliStart = dateToMilitary(startTime)
  //   let miliEnd = dateToMilitary(endTime)

  //   let warn = false
  //   // If this is a meal edit, check whether this 
  //   if (meal_id && Object.keys(days).findIndex(check_day => {
  //     return Object.keys(days[check_day].services).findIndex(check_service => {
  //       return (day!==dayIndex && check_service!==serviceIndex) && check_service.mealOrder.includes(meal_id) && (miliStart < check_service.start || miliEnd > check_service.end)
  //     })
  //   })) {
  //     setSubmitWarning('NOTE: This meal is assigned to multiple services, and may fall outside your hours of operation. This meal will only be visible to diners during those services.')
  //   }
  //   else if (miliStart < service.start) {
  //     if (miliEnd > service.end) {
  //       setSubmitWarning(`NOTE: Your hours for this service are only from ${serviceText}. Meals are only visible to diners during service. `)
  //     }
  //     else {
  //       setSubmitWarning(`NOTE: Your start time for this service is ${militaryToClock(miliStart)}. This meal will only be available after that time`)
  //     }
  //   }
  //   else if (miliEnd > service.end) {
  //     setSubmitWarning(`NOTE: Your start time for this service is ${militaryToClock(miliEnd)}. This meal will only be available after that time`)
  //   }
  //   else {
  //     setSubmitWarning(false)
  //   }

  //   setSubmitWarning('NOTE: Meals are only visible during the services to which they are assigned. If you wa')
  // }, [startTime, endTime])

  const updateorCreate = async (nav) => {
    let miliStart = dateToMilitary(startTime)
    let miliEnd = dateToMilitary(endTime)

    console.log('1')

    if (miliEnd === '0000') {
      miliEnd = '2400'
    }
    // if (miliStart > miliEnd) {
    //   setSubmitError(submitErrors.order)
    // }
    if (meal_id) {
      navigation.navigate('Meal', { start: miliStart, end: miliEnd })
    }
    else {
      console.log('2')
      let { id: new_meal_id } = firebase.firestore().collection('restaurants').doc()
      console.log('3')
      console.log('DI: ', dayIndex)

      // Not sure if you can merge with arrays, so this approach seems safer
      let services = []
      if (~dayIndex) {
        console.log('4')
        services = [...day.services]
        services[serviceIndex].mealOrder.push(new_meal_id)
      }


      try {
        setIsSaving(true)
        await firebase.firestore().collection('restaurants').doc(restaurant_id)
          .set({
            meals: {
              [new_meal_id]: {
                start: miliStart,
                end: miliEnd,
                name,
                internal_name,
                // menus_start: miliStart,
                // menus_end: miliEnd,
                menus: [],
                live: true
              }
            },
            ...Boolean(~dayIndex) && {
              days: {
                [dayIndex]: {
                  services
                }
              }
            }
          }, { merge: true })

        dispatch(setTracker({ meal: new_meal_id }))
        setIsSaving(false)
        navigation.navigate('Meal')
      }
      catch (error) {
        console.log('CreateMeal error: ', error)
        setIsSaving(false)
        Alert.alert(`Could not save meal`, 'Please try again. Contact Torte support if the issue persists.')
        setSubmitError(submitErrors.other)
      }
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} />
        <View style={{}}>
          <HeaderText style={{ textAlign: 'center', }}>{meal.name}</HeaderText>
          <MainText style={{ textAlign: 'center', }}>{meal.internal_name}</MainText>
          {!!submitError && <TouchableWithoutFeedback onPress={() => { toggleSubmitError(null) }}><View style={{ marginTop: Layout.spacer.medium }}>
            <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>{submitError}</LargeText>
          </View></TouchableWithoutFeedback>}
        </View>

        <View style={{ flex: 1, justifyContent: 'space-evenly', alignItems: 'center', width: Layout.window.width * 0.5, alignSelf: 'center', }}>
          <View>
            <LargeText center>When does this meal start?</LargeText>
            <DateTimePicker
              mode='time'
              display='spinner'
              value={startTime}
              style={{ width: Layout.window.width * 0.6, height: 250 }}
              onChange={(_, selectedDate) => { setStartTime(selectedDate) }}
              is24Hour={false}
              textColor={Colors.softwhite}
            />
          </View>

          <View>
            <LargeText center >When does this meal end?</LargeText>
            {service.end === 'next' && service.start !== 'prev' && <>
              <ClarifyingText center>This service continues into the next day.</ClarifyingText>
              <ClarifyingText center>Meals can go across days. We detect this automatically.</ClarifyingText>
            </>}

            <DateTimePicker
              mode='time'
              display='spinner'
              value={endTime}
              style={{ width: Layout.window.width * 0.6, height: 250 }}
              onChange={(_, selectedDate) => { setEndTime(selectedDate) }}
              is24Hour={false}
              textColor={Colors.softwhite}
            />
          </View>
        </View>


        <View style={{ marginVertical: Layout.spacer.medium, marginHorizontal: Layout.window.width * 0.2 }}>
          <MenuButton text={meal_id ? 'Confirm' : 'Next'} color={Colors.purple} minWidth buttonFn={updateorCreate} />
        </View>

      </SafeAreaView>
      {isSaving && <RenderOverlay text='Saving' opacity={0.9} />}
    </View >
  );
}

const styles = StyleSheet.create({
  body: {
    width: Layout.window.width * 0.7,
    alignSelf: 'center'
  }
});


/* <LargeText>{militaryToClock(dateToMilitary(startTime))}</LargeText>
                  <ClarifyingText style={{ color: Colors.lightgrey, paddingLeft: Layout.spacer.small }}>(edit)</ClarifyingText> */
import React, { useState, } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { ClarifyingText, HeaderText, LargeText, MainText, } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import RadioButton from '../components/RadioButton';
import { militaryToDate, dateToMilitary, militaryToClock } from '../functions/dateAndTime';
import { TouchableOpacity, } from 'react-native-gesture-handler';


export default function MenuHoursScreen({ navigation, route }) {
  let { mealStart, mealEnd, start, end, name } = route?.params ?? {}

  const [startTime, setStartTime] = useState(militaryToDate(start ?? mealStart))
  const [endTime, setEndTime] = useState(militaryToDate(end ?? mealEnd))
  const [isFirmEnd, setIsFirmEnd] = useState(false)
  // const [submitError, setSubmitError] = useState(false)

  const returnMenuHours = () => {
    let miliStart = dateToMilitary(startTime)
    let miliEnd = dateToMilitary(endTime)

    if (miliEnd === '0000') {
      miliEnd = '2400'
    }

    navigation.navigate('Meal', { menuStart: miliStart, menuEnd: miliEnd, menuFirmEnd: isFirmEnd })
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} />
        <View style={{}}>
          <HeaderText style={{ textAlign: 'center', }}>{name}</HeaderText>
          <MainText style={{ textAlign: 'center', }}>Meal: {militaryToClock(mealStart)}-{militaryToClock(mealEnd)}</MainText>
          {/* {!!submitError && <TouchableWithoutFeedback onPress={() => { toggleSubmitError(null) }}><View style={{ marginTop: Layout.spacer.medium }}>
            <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>{submitError}</LargeText>
          </View></TouchableWithoutFeedback>} */}
        </View>

        <View style={{ flex: 1, justifyContent: 'space-evenly', alignItems: 'center', width: Layout.window.width * 0.8, alignSelf: 'center', }}>
          <View>
            <LargeText center>When does this menu start?</LargeText>
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
            <LargeText center >When does this menu end?</LargeText>
            {mealStart > mealEnd && <>
              <ClarifyingText center>This meal continues into the next day.</ClarifyingText>
              <ClarifyingText center>Menus can also go across days. We detect this automatically.</ClarifyingText>
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

          <View>
            <LargeText center>Can a user still order from this menu after the end time?</LargeText>

            <View style={{ alignSelf: 'center' }}>
              <TouchableOpacity onPress={() => {
                setIsFirmEnd('yes')
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.medium }}>
                  <RadioButton on={!isFirmEnd} />
                  <MainText>Yes, as long as the table sat before {militaryToClock(dateToMilitary(endTime))}</MainText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => {
                setIsFirmEnd(isFirmEnd)
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.medium }}>
                  <RadioButton on={isFirmEnd} />
                  <MainText>No, the order must be placed before {militaryToClock(dateToMilitary(endTime))}</MainText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>


        <View style={{ marginVertical: Layout.spacer.medium, marginHorizontal: Layout.window.width * 0.2 }}>
          <MenuButton text='Confirm' color={Colors.purple} minWidth buttonFn={returnMenuHours} />
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


/* <LargeText>{militaryToClock(dateToMilitary(startTime))}</LargeText>
                  <ClarifyingText style={{ color: Colors.lightgrey, paddingLeft: Layout.spacer.small }}>(edit)</ClarifyingText> */
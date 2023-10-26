import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { ClarifyingText, HeaderText, LargeText, MainText, } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fullDays } from '../constants/DOTW';
import RadioButton from '../components/RadioButton';
import { useSelector } from 'react-redux';

export default function ServiceScreen2({ navigation, route }) {
  const { days = {} } = useSelector(state => state.restaurant)
  let { dayIndex, serviceIndex } = route.params

  let text = days[dayIndex]?.text ?? null
  let services = days[dayIndex]?.services ?? []

  const [isOpenLater, setIsOpenLater] = useState(null)

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} />
        <View style={{ marginBottom: Layout.spacer.large }}>
          <HeaderText style={{ textAlign: 'center', }}>{fullDays[dayIndex]}s</HeaderText>
          {Array.isArray(text) && <View>
            {text.map((service, index) => <MainText style={{ textAlign: 'center' }} key={service}>{service}</MainText>)}
          </View>}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: Layout.window.width * 0.8, alignSelf: 'center', }}>

          <LargeText style={{ textAlign: 'center', }}>Are you open again later on {fullDays[dayIndex]}s?</LargeText>

          <View style={{ alignSelf: 'center' }}>
            <TouchableOpacity onPress={() => {
              setIsOpenLater('yes')
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.medium }}>
                <RadioButton on={isOpenLater === 'yes'} />
                <MainText>Yes</MainText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              setIsOpenLater('no')
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.medium }}>
                <RadioButton on={isOpenLater === 'no'} />
                <MainText>No</MainText>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ marginVertical: Layout.spacer.large }}>
            <MenuButton disabled={!isOpenLater} color={isOpenLater ? Colors.purple : Colors.darkgrey} text='Next' buttonFn={() => {
              if (isOpenLater === 'yes') {
                navigation.push('Service1', { dayIndex, serviceIndex: serviceIndex + 1 })
              }
              else {
                navigation.navigate('Hours')
              }
            }} />
          </View>

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
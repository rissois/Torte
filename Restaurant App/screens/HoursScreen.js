import React, { useState, } from 'react';
import {
  StyleSheet,
  View,
  Alert,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fullDays, threeLetterDays } from '../constants/DOTW';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { MaterialIcons, } from '@expo/vector-icons';
import deleteService from '../transactions/deleteService';
import { militaryToClock } from '../functions/dateAndTime';


export default function HoursScreen({ navigation, route }) {
  const { days = {} } = useSelector(state => state.restaurant)
  const [widest, setWidest] = useState(null)
  const [deleteError, setDeleteError] = useState(false)

  let warnings = []
  let cautions = []

  // Warn any inconsistencies in the hours
  for (let i = 0; i < 7; i++) {
    let today = days[i]
    let yesterday = days[(i + 6) % 7]
    let tomorrow = days[(i + 1) % 7]
    if (today.services[0]?.start === 'prev' && yesterday.services[yesterday.services.length - 1]?.end !== 'next') {
      warnings.push(fullDays[i] + ' hours do not continue from ' + fullDays[(i + 6) % 7])
    }
    if (today.services[today.services.length - 1]?.end === 'next' && tomorrow.services[0]?.start !== 'prev') {
      warnings.push(fullDays[i] + ' hours do not continue into ' + fullDays[(i + 1) % 7])
    }

    if (today.services.length > 1) {
      for (let i = 1; i < today.services.length; i++) {
        let early = today.services[i - 1]
        let late = today.services[i]
        if (!isNaN(early.end) && !isNaN(late.start)) {
          let earlyHours = early.end.substring(0, 2)
          let earlyMin = early.end.substring(2)
          let lateHours = late.start.substring(0, 2)
          let lateMin = late.start.substring(2)
          if (earlyHours === lateHours && lateMin - earlyMin <= 1 ||
            lateHours - earlyHours === 1 && lateMin - earlyMin === 1) {
            cautions.push(fullDays[i] + ' ' + militaryToClock(early.end) + ' and ' + militaryToClock(late.start))
          }
        }
      }
    }
  }


  // Could probably just use Object.keys(days).sort().map(...)
  const generateRows = () => {
    let rows = []

    for (let i = 0; i < 7; i++) {
      let { text } = days[i]
      rows.push(<View key={i} style={{ flexDirection: 'row', }}>
        <TouchableOpacity onPress={() => { navigation.navigate('Service1', { dayIndex: i, serviceIndex: 0 }) }}><View onLayout={({ nativeEvent }) => {
          setWidest(curr => {
            if (curr < nativeEvent.layout.width) {
              return nativeEvent.layout.width
            }
            return curr
          })
        }} style={[styles.shadow, styles.rectPadding, { alignSelf: 'flex-start', width: widest, backgroundColor: text === 'Closed' ? Colors.red : Colors.darkgrey }]}>
          <LargeText style={{ textAlign: 'center', }}>{threeLetterDays[i].toUpperCase()}</LargeText>
        </View>
        </TouchableOpacity>
        <View style={{ width: 16 }} />
        <View style={{ flex: 1 }}>
          {
            typeof text === 'string' ?
              <TouchableOpacity onPress={() => { navigation.navigate('Service1', { dayIndex: i, serviceIndex: 0 }) }}>
                <ServiceRow serviceDay={days[i]} text={text} dayIndex={i} serviceIndex={0} deleteError={deleteError} setDeleteError={setDeleteError} />
              </TouchableOpacity> :
              <View>
                {text.map((service, index) => {
                  return <TouchableOpacity key={index} onPress={() => { navigation.navigate('Service1', { dayIndex: i, serviceIndex: index, return: true }) }}>
                    <ServiceRow serviceDay={days[i]} text={service} dayIndex={i} serviceIndex={index} deleteError={deleteError} setDeleteError={setDeleteError} />
                  </TouchableOpacity>
                })}
                {<TouchableOpacity onPress={() => { navigation.navigate('Service1', { dayIndex: i, serviceIndex: text.length }) }}>
                  <ServiceRow add serviceDay={days[i]} dayIndex={i} serviceIndex={text.length} />
                </TouchableOpacity>}
              </View>
          }
        </View>
      </View>)
    }

    return rows
  }
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} {...!route?.params?.review && { rightText: '5/5' }} />
        <DisablingScrollView>
          <HeaderText style={{ textAlign: 'center', }}>Hours of operation</HeaderText>
          <MainText style={{ textAlign: 'center' }}>Select a day or period to edit its hours</MainText>
          <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', opacity: deleteError ? 1 : 0, marginVertical: Layout.spacer.small }}>ERROR WITH DELETION</LargeText>
          <View style={{ width: Layout.window.width * 0.8, alignSelf: 'center', marginBottom: Layout.spacer.medium }}>
            {generateRows()}
          </View>

          {!!warnings.length && <View style={{ marginBottom: Layout.spacer.medium, width: Layout.window.width * 0.8, alignSelf: 'center', }}>
            <LargeText style={{ color: Colors.red, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center' }}>ERRORS</LargeText>
            {warnings.map(warning => <MainText style={{ textAlign: 'center' }} key={warning}>{warning}</MainText>)}
          </View>}

          {!!cautions.length && <View style={{ marginBottom: Layout.spacer.medium, width: Layout.window.width * 0.8, alignSelf: 'center', }}>
            <LargeText style={{ color: Colors.yellow, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center' }}>CAUTION</LargeText>
            <MainText style={{ textAlign: 'center' }}>Combine hours where you do not physically close the restaurant.</MainText>
            {cautions.map(warning => <MainText style={{ textAlign: 'center' }} key={warning}>{warning}</MainText>)}
          </View>}

          <MenuButton style={{ marginBottom: Layout.spacer.small }} color={warnings.length ? Colors.darkgrey : Colors.purple} text={'Finish'} buttonFn={() => {
            navigation.push('Review')
          }} />
        </DisablingScrollView>
      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  body: {
    width: Layout.window.width * 0.7,
    alignSelf: 'center'
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,

    elevation: 10,
  },
  rectPadding: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  }
});

const ServiceRow = (props) => {
  let { add = false, text, dayIndex, serviceIndex, serviceDay, deleteError, setDeleteError } = props
  if (add) {
    // let last_close = serviceDay.services[serviceDay.services.length - 1].end
    return <View style={[styles.shadow, { flexDirection: 'row', alignItems: 'center', marginBottom: 16, }]}>
      <MaterialIcons name='add-circle' size={40} color={Colors.green} style={{ marginHorizontal: 20, }} />
      <View style={{ flex: 1, paddingVertical: 8, }}>
        <LargeText>Add hours to {fullDays[dayIndex]}</LargeText>
      </View>

    </View>

  }
  return <View style={[styles.shadow, { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }]}>
    <View style={[styles.rectPadding, { flex: 1, backgroundColor: text === 'Closed' ? Colors.red : Colors.darkgrey }]}>
      <LargeText>{text}</LargeText>
    </View>
    {text !== 'Closed' && <TouchableOpacity onPress={() => {
      Alert.alert(`Delete ${threeLetterDays[dayIndex]} ${text}?`, undefined, [
        {
          text: 'Yes', onPress: async () => {
            setDeleteError(false)
            try {
              deleteService(restaurant_id, serviceDay, dayIndex, serviceIndex, text)
            }
            catch (error) {
              console.log(error)
              setTimeout(() => {
                setDeleteError(true)
              }, deleteError ? 100 : 0)
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        },
      ])
    }}><MaterialIcons name='remove-circle' size={40} color={Colors.red} style={{ marginLeft: 20 }} /></TouchableOpacity>}
  </View>
}
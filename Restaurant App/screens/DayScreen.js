import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import { useSelector, } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons, } from '@expo/vector-icons';
import { getMidnight, YYYYMMDD } from '../functions/dateAndTime';
import centsToDollar from '../functions/centsToDollar';
import Plurarize from '../components/Plurarize';
import MenuButton from '../components/MenuButton';
import firebase from '../config/Firebase';
import useRestaurant from '../hooks/useRestaurant';
import { useFocusEffect, } from '@react-navigation/native';

export default function DayScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  const { employees } = useSelector(state => state)

  const [serverWidth, setServerWidth] = useState(null)

  const [todayAsString, setTodayAsString] = useState(YYYYMMDD(new Date()))
  const [showServers, setShowServers] = useState(false)

  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarDate, setCalendarDate] = useState(null)
  const [summariesByDay, setSummariesByDay] = useState({ [todayAsString]: 'loading' })
  const [showDate, setShowDate] = useState(todayAsString)

  useEffect(() => {
    // Adjustments to dates if day changes past midnight (only activated if screen opened after 11:55PM)
    // Probably a little janky tbh

    const tomorrow = getMidnight(1)
    const timeToTomorrow = tomorrow - new Date()

    const timer = timeToTomorrow < 300000 && setTimeout(() => {
      setTodayAsString(YYYYMMDD(tomorrow))
      setCalendarDate(prev => {
        if (prev) {
          return prev
        }
        return todayAsString // This will be the original date
      })
    }, timeToTomorrow)

    return () => clearTimeout(timer)
  }, [])

  useFocusEffect(useCallback(() => {
    // Live listener for today
    firebase.firestore()
      .collection('restaurants')
      .doc(restaurant_id)
      .collection('restaurantDays')
      .where('created', "<=", new Date((new Date()).setHours(23, 59, 59, 999))).orderBy('created', 'desc').limit(1).onSnapshot(docs => {
        if (!docs.size) {
          setSummariesByDay(prev => {
            return {
              ...prev,
              [todayAsString]: 'does-not-exist'
            }
          })
        }
        else {
          const docDate = YYYYMMDD(docs.docs[0].data().created.toDate())
          setSummariesByDay(prev => {
            return {
              ...prev,
              [docDate]: docs.docs[0].data(),
              ...docDate !== todayAsString & { [todayAsString]: 'does-not-exist' }
            }
          })
        }
      })
  }, []))

  const fetchDay = useCallback(async (requestDate) => {
    // Store requestDate in convenient string format
    const requestDateAsString = YYYYMMDD(requestDate)

    setSummariesByDay(prev => {
      if (typeof prev[requestDateAsString] !== 'object') {
        return { ...prev, [requestDateAsString]: 'loading' }
      }
      return prev
    })

    setShowDate(requestDateAsString)

    try {
      firebase.firestore()
        .collection('restaurants')
        .doc(restaurant_id)
        .collection('restaurantDays')
        .where('created', "<=", new Date(requestDate.setHours(23, 59, 59, 999))).orderBy('created', 'desc').limit(1).get().then(docs => {
          if (!docs.size) {
            setSummariesByDay(prev => {
              return {
                ...prev,
                [requestDateAsString]: 'does-not-exist'
              }
            })
          }
          else {
            const docDate = YYYYMMDD(docs.docs[0].data().created.toDate())
            setSummariesByDay(prev => {
              return {
                ...prev,
                [docDate]: docs.docs[0].data(),
                ...docDate !== requestDateAsString & { [requestDateAsString]: 'does-not-exist' }
              }
            })
          }
        })
    }
    catch (error) {
      setSummariesByDay(prev => ({ ...prev, [requestDateAsString]: 'error' }))
    }
  }, [])

  useEffect(() => {
    if (calendarDate) {
      if (YYYYMMDD(calendarDate) === todayAsString || calendarDate >= (new Date()).setHours(0, 0, 0, 0)) {
        setShowDate(todayAsString)
      }
      else {
        fetchDay(calendarDate)
      }
    }
  }, [calendarDate, todayAsString])

  /*
    Horizontal scrollview for period selection
    On selection, must reconvert back into a time suitable to compare against bills

  */

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', margin: 12, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons
                name='arrow-back'
                size={36}
                color={Colors.softwhite}
              />
            </TouchableOpacity>
          </View>
          <HeaderText>{showDate !== todayAsString ? calendarDate.toDateString() : 'Today\'s summary'}</HeaderText>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={() => setShowCalendar(true)}>
              <MainText>{showDate !== todayAsString ? 'Change date' : 'Older days'}</MainText>
            </TouchableOpacity>
          </View>
        </View>

        {typeof summariesByDay[showDate] === 'string' ? <View style={{ flex: 1, paddingTop: 200, }}>
          {summariesByDay[showDate] === 'loading' ? <View style={{ flex: 1, alignItems: 'center', }}>
            <LargeText style={{ marginBottom: 20 }}>Loading day...</LargeText>
            <ActivityIndicator size="large" color={Colors.softwhite} />
          </View> :
            <View style={{ alignItems: 'center' }}>
              <LargeText>{summariesByDay[showDate] === 'does-not-exist' ? 'No records for this day' : 'Error getting day'}</LargeText>
              <MenuButton style={{ marginTop: 30 }} text='Go to today' color={Colors.red} buttonFn={() => setCalendarDate(new Date())} />
              <MenuButton style={{ marginTop: 30 }} text='Change date' buttonFn={() => setShowCalendar(true)} />
            </View>
          }
        </View> :
          <ScrollView style={{ paddingBottom: 80 }}>
            <LargeText center style={{ marginBottom: 20 }}><Plurarize value={summariesByDay[showDate].bill_ids.length} nouns={{ s: 'bill', p: 'bills' }} /></LargeText>

            <SummarySection
              name='ORDERS'
              pluralNouns={{ s: 'order', p: 'orders' }}
              values={{
                Subtotal: { value: centsToDollar(summariesByDay[showDate].orders.subtotals) },
                Tax: { value: centsToDollar(summariesByDay[showDate].orders.taxes) },
                Total: { value: centsToDollar(summariesByDay[showDate].orders.subtotals + summariesByDay[showDate].orders.taxes) },
              }}
              number={summariesByDay[showDate].orders.number ?? 0}
              displayOrder={['Subtotal', 'Tax', 'Total']}
              subtext={summariesByDay[showDate].orders.server_changes ? `${centsToDollar(summariesByDay[showDate].orders.server_changes)} adjusted by servers` : undefined}
            />

            <SummarySection
              name='PAYMENTS'
              pluralNouns={{ s: 'payment', p: 'payments' }}
              values={{
                Subtotal: { value: centsToDollar(summariesByDay[showDate].payments.subtotals) },
                Tax: { value: centsToDollar(summariesByDay[showDate].payments.taxes) },
                Total: { value: centsToDollar(summariesByDay[showDate].payments.subtotals + summariesByDay[showDate].payments.taxes) },
                Tips: { value: centsToDollar(summariesByDay[showDate].payments.tips) },
                Discounts: { value: centsToDollar(summariesByDay[showDate].payments.discounts) },
              }}
              number={summariesByDay[showDate].payments.number ?? 0}
              displayOrder={['Subtotal', 'Tax', 'Total', 'Tips', 'Discounts',]}
              subtext={summariesByDay[showDate].cash_or_card ? `Additional ${centsToDollar(summariesByDay[showDate].cash_or_card)} reported in cash/card (excludes tips)` : 'No cash/card payments were reported'}
            />

            <SummarySection
              name='CHECKOUTS'
              pluralNouns={{ s: 'checkout', p: 'checkouts' }}
              values={{
                Subtotal: { value: centsToDollar(summariesByDay[showDate].checkouts.subtotals) },
                Tax: { value: centsToDollar(summariesByDay[showDate].checkouts.taxes) },
                Total: { value: centsToDollar(summariesByDay[showDate].checkouts.subtotals + summariesByDay[showDate].checkouts.taxes) },
                Tips: { value: centsToDollar(summariesByDay[showDate].checkouts.tips) },
              }}
              number={summariesByDay[showDate].checkouts.number ?? 0}
              displayOrder={['Subtotal', 'Tax', 'Total', 'Tips']}
            />

            <SummarySection
              name='REFUNDS'
              pluralNouns={{ s: 'refund', p: 'refunds' }}
              values={{
                Total: { value: centsToDollar(summariesByDay[showDate].refunds?.amount) },
              }}
              number={summariesByDay[showDate].refunds?.number ?? 0}
              displayOrder={['Total']}
            />


            <SummarySection
              name='FEEDBACK'
              pluralNouns={{ s: 'response', p: 'responses' }}
              values={{
                Overall: {
                  value: feedbackAverage(summariesByDay[showDate].feedback.overall, summariesByDay[showDate].feedback.overall_responses),
                  subnumber: summariesByDay[showDate].feedback.overall_responses,
                },
                Service: {
                  value: feedbackAverage(summariesByDay[showDate].feedback.service, summariesByDay[showDate].feedback.service_responses),
                  subnumber: summariesByDay[showDate].feedback.service_responses,
                },
                Food: {
                  value: feedbackAverage(summariesByDay[showDate].feedback.food, summariesByDay[showDate].feedback.food_responses),
                  subnumber: summariesByDay[showDate].feedback.food_responses,
                },
              }}
              displayOrder={['Overall', 'Service', 'Food']}
            />

            <View style={{ marginHorizontal: Layout.window.width * 0.2, marginBottom: 50 }}>
              {
                Object.keys(summariesByDay[showDate].servers).length ?
                  showServers ?
                    <View>
                      {Object.keys(summariesByDay[showDate].servers).length > 10 && <MenuButton style={{ marginBottom: 30 }} text={'Hide servers'} color={Colors.red} buttonFn={() => setShowServers(false)} />}
                      {Object.keys(summariesByDay[showDate].servers).map(server_id => <ServerSection key={server_id} server={summariesByDay[showDate].servers[server_id]} serverWidth={serverWidth} setServerWidth={setServerWidth} name={server_id === 'none' ? 'No server' : employees[server_id] ? employees[server_id].name : 'Unknown'} />)}
                      <MenuButton style={{ marginTop: 30 }} text={'Hide servers'} color={Colors.red} buttonFn={() => setShowServers(false)} />
                    </View> :
                    <MenuButton text={'Show server summaries'} buttonFn={() => setShowServers(true)} /> :
                  <LargeText center>No server summaries</LargeText>
              }
            </View>
          </ScrollView>
        }
      </SafeAreaView>
      {showCalendar && <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'black',
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
        <DateTimePicker
          mode='date'
          display='inline'
          value={calendarDate || new Date()}
          style={{ width: Layout.window.width * 0.7, }}
          onChange={(_, selectedDate) => {
            setCalendarDate(selectedDate)
            setShowCalendar(false)
          }}
          textColor={Colors.softwhite}
        />
      </View>}
    </View >
  );
}

const ServerSection = ({ server: { orders = {}, payments = {}, checkouts = {}, feedback = {}, cash_or_card = 0 } = {}, name, serverWidth, setServerWidth }) => {
  const [showFullServer, setShowFullServer] = useState(false)
  // orders.server_changes
  const orderTotal = (orders.subtotals ?? 0) + (orders.taxes ?? 0)
  const paymentTotal = (payments.subtotals ?? 0) + (payments.taxes ?? 0)
  const checkoutTotal = (checkouts.subtotals ?? 0) + (checkouts.taxes ?? 0)
  return <View style={{ flexDirection: 'row', marginBottom: 20 }}>
    <LargeText style={{ flex: 1 }}>{name}</LargeText>
    <View style={{ marginLeft: 30, minWidth: serverWidth }} onLayout={({ nativeEvent }) => {
      setServerWidth(prev => {
        if (nativeEvent.layout.width > serverWidth) {
          return nativeEvent.layout.width
        }
        return prev
      })
    }}>
      <MainText>Tips: {centsToDollar((payments.tips ?? 0) + (checkouts.tips ?? 0))}</MainText>
      <MainText>Orders: {centsToDollar(orderTotal)}</MainText>
      <MainText>Unpaid: {centsToDollar(orderTotal - paymentTotal - checkoutTotal - cash_or_card)}</MainText>
      {
        showFullServer && <>
          <MainText>Order edits: {centsToDollar(orders.server_changes ?? 0)}</MainText>
          <MainText>Payments: {centsToDollar(paymentTotal)}</MainText>
          <MainText>Cash / card: {centsToDollar(cash_or_card)}</MainText>
          <MainText>Checkouts: {centsToDollar(checkoutTotal)}</MainText>
          <MainText>Service rating: {feedbackAverage(feedback.service, feedback.service_responses)}</MainText>
        </>
      }
      <TouchableOpacity onPress={() => { setShowFullServer(prev => !prev) }}>
        <MainText style={{ paddingVertical: 10 }}>Show {showFullServer ? 'less' : 'more'}</MainText>
      </TouchableOpacity>

    </View>
  </View>
}



const SummarySection = ({ name, number, pluralNouns, values = {}, displayOrder, subtext }) => {
  const [sectionTitleHeight, setSectionTitleHeight] = useState(null)
  return <View style={{ marginHorizontal: Layout.window.width * 0.12, paddingTop: sectionTitleHeight / 2, marginBottom: 50, }}>
    <View style={{
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 2,
      alignItems: 'center'
    }}>
      <HeaderText onLayout={({ nativeEvent }) => { setSectionTitleHeight(nativeEvent.layout.height) }} center style={{
        fontSize: 40,
        paddingHorizontal: 20,
        backgroundColor: Colors.background
      }} >{name.toUpperCase()}</HeaderText>
    </View>

    <View style={{
      borderWidth: 3,
      borderColor: Colors.softwhite,
      paddingTop: sectionTitleHeight / 2.5,
      paddingBottom: sectionTitleHeight / 3
    }}>
      {typeof number === 'number' && <MainText center ><Plurarize value={number} nouns={pluralNouns} /></MainText>}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        flexWrap: 'wrap'
      }}>
        {displayOrder.map((key,) => {
          if (!values[key]) {
            return null
          }
          return <View key={name + key} style={{ minWidth: '30%', marginTop: 16, }}>
            <MainText center>{key}</MainText>
            <HeaderText center>{values[key].value}</HeaderText>
            {typeof values[key].subnumber === 'number' && <ClarifyingText center><Plurarize value={values[key].subnumber} nouns={pluralNouns} /></ClarifyingText>}
          </View>
        })
        }
      </View>

      {!!subtext && <ClarifyingText center style={{ marginTop: 20 }}>{subtext}</ClarifyingText>}
    </View>
  </View>
}

// const roundTwoDecimals = (num) => {
//   return +(Math.round(num + "e+2") + "e-2");
// }

const feedbackAverage = (overall = 0, responses = 0) => {
  if (!responses) return 0
  return (overall / responses).toFixed(2)
}

const styles = StyleSheet.create({

});



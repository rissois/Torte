import React, { useState, useEffect, useCallback, useMemo, } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SuperLargeText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { YMDToString, dateToYMD } from '../../utils/functions/dateAndTime';
import centsToDollar from '../../utils/functions/centsToDollar';
import DateTimePicker from '@react-native-community/datetimepicker';
import StyledButton from '../../utils/components/StyledButton';
import { useIsRestaurantTestMode } from '../../utils/hooks/useRestaurant';
import { useSelector } from 'react-redux';

const getDaysField = (ymd, isTest) => isTest ? ymd + '_test' : ymd

export default function AnalyticsScreen({ }) {
  const [now] = useState(new Date())
  const [nowYMD] = useState(dateToYMD(now))
  const [nowString] = useState(YMDToString(nowYMD))

  const restaurantRef = useRestaurantRef()
  const isRestaurantTestMode = useIsRestaurantTestMode()
  const dateJoined = useSelector(state => state.privates?.Contact?.date_joined)
  const minimumDate = useMemo(() => dateJoined?.toDate() || new Date('2021-10-21T04:00:00.000Z'), [])

  const [dayYMD, setDayYMD] = useState(nowYMD)
  const [requestDayYMD, setRequestDayYMD] = useState(nowYMD)
  const [calendarDate, setCalendarDate] = useState(now)
  const [showCalendar, setShowCalendar] = useState(false)
  const [days, setDays] = useState({})
  const [showFutureWarning, setShowFutureWarning] = useState(false)
  const [isTest, setIsTest] = useState(isRestaurantTestMode)

  useEffect(() => {
    // Respond to user calendar selection
    const ymd = dateToYMD(calendarDate)
    setDayYMD(ymd)
    setRequestDayYMD(ymd)
  }, [calendarDate])

  const getQuery = useCallback((ymd, is_test = false) => {
    const date = new Date()
    date.setFullYear(ymd.substring(0, 4), ymd.substring(4, 6) - 1, ymd.substring(6))
    date.setHours(23, 59, 59, 999)

    return restaurantRef.collection('Days')
      .where('is_test', '==', is_test)
      .where('timestamps.created', '<=', date)
      .orderBy('timestamps.created', 'desc')
      .limit(1)
  }, [])

  const fetchDay = useCallback(async (ymd, is_test) => {
    console.log('FETCH REQUEST: ', ymd, is_test)
    const daysField = getDaysField(ymd, is_test)
    setDays(prev => prev[daysField] ? prev : ({ ...prev, [daysField]: { fetching: true } }))

    const query = getQuery(ymd, is_test)
    query.get()
      .then(queryDocs => {
        if (!queryDocs.size) setDays(prev => ({ ...prev, [daysField]: { doesNotExist: true } }))
        const day = queryDocs.docs[0].data()
        if (dateToYMD(day.timestamps.created.toDate()) !== ymd) setDays(prev => ({ ...prev, [daysField]: { doesNotExist: true } }))
        else {
          console.log('I mean it exists ', ymd, is_test)
          setDays(prev => ({ ...prev, [daysField]: day }))
        }
      })
      .catch(error => {
        console.log('AnalyticsScreen fetchDay error: ', error)
        setDays(prev => ({ ...prev, [daysField]: { error: true } }))
      })
  }, [])

  useEffect(() => {
    console.log('useEffect; ', requestDayYMD, isTest)
    if (requestDayYMD && requestDayYMD < nowYMD) {
      console.log('run useEffect')
      fetchDay(requestDayYMD, isTest)
    }
    setRequestDayYMD(null)
  }, [requestDayYMD, isTest])

  useEffect(() => {
    const nowYMDtest = nowYMD + '_test'
    setDays(prev => ({ ...prev, [nowYMD]: { fetching: true }, [nowYMDtest]: { fetching: true } }))

    const query = getQuery(nowYMD)
    const listener = query.onSnapshot(querySnapshot => {
      if (!querySnapshot.size) setDays(prev => ({ ...prev, [nowYMD]: { doesNotExist: true } }))
      const day = querySnapshot.docs[0].data()
      if (dateToYMD(day.timestamps.created.toDate()) !== nowYMD) setDays(prev => ({ ...prev, [nowYMD]: { doesNotExist: true } }))
      else setDays(prev => ({ ...prev, [nowYMD]: day }))
    })

    const testQuery = getQuery(nowYMD, true)
    testQuery.onSnapshot(querySnapshot => {
      if (!querySnapshot.size) setDays(prev => ({ ...prev, [nowYMDtest]: { doesNotExist: true } }))
      const day = querySnapshot.docs[0].data()
      if (dateToYMD(day.timestamps.created.toDate()) !== nowYMD) setDays(prev => ({ ...prev, [nowYMDtest]: { doesNotExist: true } }))
      else setDays(prev => ({ ...prev, [nowYMDtest]: day }))
    })

    return () => listener()
  }, [])


  const day = useMemo(() => days[getDaysField(dayYMD, isTest)], [days, dayYMD, isTest])
  const headerRight = useMemo(() => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <MediumText>test </MediumText>
      <Switch
        trackColor={{ false: Colors.darkgrey, true: Colors.green }}
        thumbColor={Colors.white}
        ios_backgroundColor={Colors.darkgrey}
        onValueChange={value => {
          setIsTest(value)
          setRequestDayYMD(dayYMD)
        }}
        value={isTest}
        style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
      />
    </View>
  ), [isTest, dayYMD])

  return <SafeView >
    <Header back right={headerRight}>
      <ExtraLargeText center>Analytics</ExtraLargeText>
      {/* FUTURE SEARCH BAR */}
    </Header>

    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }} />
      <SuperLargeText center>{YMDToString(dayYMD)}{isTest ? ' (test)' : ''}</SuperLargeText>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={{ paddingLeft: 20 }} onPress={() => setShowCalendar(true)}>
          <LargeText bold red>(change)</LargeText>
        </TouchableOpacity>
      </View>
    </View>

    <ScrollView contentContainerStyle={{ paddingTop: 30, paddingBottom: Layout.scrollViewPadBot, marginHorizontal: Layout.marHor }}>
      {
        (!day || day.fetching) ? <ExtraLargeText center>Fetching {YMDToString(dayYMD)}</ExtraLargeText> :
          day.doesNotExist ? <ExtraLargeText center>{YMDToString(dayYMD)} does not exist</ExtraLargeText> :
            day.error ? <ExtraLargeText center>Failed {YMDToString(dayYMD)}</ExtraLargeText> :
              <Day day={day} />
      }
    </ScrollView>


    {
      showCalendar && <View style={[StyleSheet.absoluteFill, styles.calendarBackground]}>
        <View style={{ flex: 1, justifyContent: 'flex-end', }}>
          {showFutureWarning && <View style={{ marginBottom: 30 }}>
            <LargeText center bold red>PLEASE SELECT A VALID DATE</LargeText>
            <LargeText center bold red>BEFORE TODAY: <Text style={{ color: Colors.white }}>{nowString}</Text></LargeText>
          </View>}
        </View>
        <DateTimePicker
          mode='date'
          display='inline'
          value={calendarDate || new Date()}
          minimumDate={minimumDate}
          maximumDate={now}
          style={{ width: Layout.window.width * 0.7, }}
          onChange={(_, selectedDate) => {
            if (selectedDate > now) {
              setShowFutureWarning(true)
            }
            else {
              setCalendarDate(selectedDate)
              setShowCalendar(false)
              setShowFutureWarning(false)
            }
          }}
          textColor={Colors.white}
        />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {dayYMD !== nowYMD && <StyledButton text={`Go to today`} color={Colors.darkgreen} onPress={() => {
            setCalendarDate(now)
            setShowCalendar(false)
          }} />}
          <View style={{ height: 30 }} />
          <StyledButton text={`Return to ${dayYMD === nowYMD ? 'today' : YMDToString(dayYMD)}`} onPress={() => setShowCalendar(false)} />
        </View>
      </View>
    }

  </SafeView>
}

const feedbackAverage = (overall = 0, responses = 0) => {
  if (!responses) return 0
  return (overall / responses).toFixed(2)
}

const Day = ({ day }) => {
  const {
    feedback,
    order_summary,
    orders: {
      user,
      server,
    } = {},
    payments: {
      charge,
      cash,
      swipe,
      manual,
      outside,
      app,
    },
    discounts: {
      source: discounts_by_source
    },
    paid_summary,
    refunds,
    voids,
    comps,
    usage: { devices: { joined: torteUsers }, diners, tables }
  } = day
  const unpaid_total = order_summary.total - paid_summary?.total
  return <View>
    <ExtraLargeText center bold style={{ color: unpaid_total > 0 ? Colors.red : Colors.white }}>{unpaid_total > 0 ? `UNPAID: ${centsToDollar(unpaid_total)}` : 'FULLY PAID'}</ExtraLargeText>

    <View style={styles.analyticGroup}>
      <ExtraLargeText bold>TORTE USAGE</ExtraLargeText>
      <View style={styles.analyticRow}>
        <Analytic text={tables} subtext='tables' />
        <Analytic text={diners} subtext='diners' />
        <Analytic text={torteUsers} subtext='users' />
      </View>
    </View>

    <View style={styles.analyticGroup}>
      <ExtraLargeText bold>ORDERED</ExtraLargeText>
      <View style={styles.analyticRow}>
        <Analytic text={order_summary.quantity} subtext='orders' />
        <Analytic text={order_summary.quantity_asap} subtext='expedited' />
      </View>
      <View style={styles.analyticRow}>
        <Analytic text={centsToDollar(order_summary.subtotal)} subtext='subtotal' />
        <Analytic text={centsToDollar(order_summary.tax)} subtext='tax' />
        <Analytic text={centsToDollar(order_summary.total)} subtext='total' />
      </View>
    </View>

    <View style={styles.analyticGroup}>
      <ExtraLargeText bold>PAID</ExtraLargeText>
      <View style={styles.analyticRow}>
        <Analytic text={app.quantity} subtext='payments' />
        <Analytic text={charge.quantity} subtext='charges' />
        {/* NUMBER OF FREE MEALS? */}
      </View>
      <View style={styles.analyticRow}>
        <Analytic text={swipe.quantity} subtext='swipe' />
        <Analytic text={manual.quantity} subtext='manual' />
        <Analytic text={cash.quantity} subtext='cash' />
      </View>
      {!!outside.quantity && <View style={styles.analyticRow}>
        <Analytic text={outside.quantity} subtext='other' />
      </View>}
      <View style={styles.analyticRow}>
        <Analytic text={centsToDollar(paid_summary?.subtotal)} subtext='subtotal' />
        <Analytic text={centsToDollar(paid_summary?.tax)} subtext='tax' />
        <Analytic text={centsToDollar(paid_summary?.subtotal + paid_summary?.tax)} subtext='total' />
      </View>
      <View style={styles.analyticRow}>
        <Analytic text={centsToDollar(paid_summary?.tips)} subtext='tips' />
        {!!paid_summary?.unremitted && <Analytic text={centsToDollar(paid_summary?.unremitted)} subtext='unremitted' />}
      </View>
      {!!paid_summary?.unremitted && <DefaultText center style={{ marginTop: 10 }}>Unremitted covers rare instances when a user has a negative bill, and pays $0. The extra value is yours!</DefaultText>}
      <View style={[styles.analyticRow, styles.rowSeparator]}>
        <Analytic text={discounts_by_source.torte.quantity} subtext='Torte discounts' />
        <Analytic text={centsToDollar(discounts_by_source.torte.total)} subtext='discounts reimbursement' />
      </View>
    </View>

    <View style={styles.analyticGroup}>
      <ExtraLargeText bold>COMPED, REFUNDED, {'&'} VOIDED</ExtraLargeText>
      <View style={[styles.analyticRow]}>
        <Analytic text={comps?.quantity} subtext='comps' />
        <Analytic text={centsToDollar(comps?.subtotal)} subtext='comped subtotal' />
        <Analytic text={centsToDollar(comps?.tax)} subtext='comped tax' />
      </View>
      <View style={[styles.analyticRow, styles.rowSeparator]}>
        <Analytic text={refunds?.quantity} subtext='refunds' />
        <Analytic text={centsToDollar(refunds?.total)} subtext='refund total' />
      </View>
      <View style={[styles.analyticRow, styles.rowSeparator]}>
        <Analytic text={voids?.quantity} subtext='voided items' />
        <Analytic text={centsToDollar(voids?.subtotal)} subtext='voided subtotal' />
        {/* <Analytic text={centsToDollar(voided?.tax)} subtext='voided tax' /> */}
      </View>
      <DefaultText center style={{ marginTop: 10 }}>(voids only apply to items ordered by guests through their phones)</DefaultText>
    </View>

    <View style={styles.analyticGroup}>
      <ExtraLargeText bold>FEEDBACK</ExtraLargeText>
      <View style={styles.analyticRow}>
        <Analytic text={feedbackAverage(feedback.overall, feedback.overall_responses)} subtext={`overall (${feedback.overall_responses})`} />
        <Analytic text={feedbackAverage(feedback.food, feedback.food_responses)} subtext={`food (${feedback.food_responses})`} />
        <Analytic text={feedbackAverage(feedback.service, feedback.service_responses)} subtext={`service (${feedback.service_responses})`} />
      </View>
    </View>
  </View>
}

const Analytic = ({ text, subtext }) => (
  <View style={{ width: '33%', }}>
    <SuperLargeText center bold>{text || 0}</SuperLargeText>
    <MediumText center>{subtext}</MediumText>
  </View>
)

const styles = StyleSheet.create({
  calendarBackground: {
    backgroundColor: 'black',
    alignItems: 'center',
  },
  analyticGroup: {
    marginTop: 20,
    borderColor: Colors.white,
    borderWidth: 2,
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  analyticRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rowSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.white,
    paddingTop: 20
  },
});
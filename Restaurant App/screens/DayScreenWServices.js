import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useSelector, useDispatch } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons, } from '@expo/vector-icons';
import { dateToMilitary, militaryToClock, YYYYMMDD } from '../functions/dateAndTime';
import { threeLetterDays } from '../constants/DOTW';
import { isDemo } from '../constants/demo';
import centsToDollar from '../functions/centsToDollar';
import Plurarize from '../components/Plurarize';
import MenuButton from '../components/MenuButton';
import firebase from '../config/Firebase';
import useRestaurant from '../hooks/useRestaurant';

export default function DayScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  const { bills, restaurant: { days }, employees } = useSelector(state => state)
  const [scrollWidth, setScrollWidth] = useState(null)

  // Services allows for a per-service breakdown
  const [services, setServices] = useState([])
  const [servicesFromYesterday, setServicesFromYesterday] = useState([])
  const [selectedService, setSelectedService] = useState({
    today: true,
    serviceIndex: -1
  })

  const [nowDay] = useState((new Date()).getDay())
  const [nowMilitary] = useState(dateToMilitary(new Date()))


  const [showComments, setShowComments] = useState(false)
  const [showServers, setShowServers] = useState(false)

  const [numberOfBills, setNumberOfBills] = useState(0)
  const [ordersSummary, setOrdersSummary] = useState({
    number: 0,
    values: {
      Subtotal: { value: centsToDollar(0) },
      Tax: { value: centsToDollar(0) },
      Total: { value: centsToDollar(0) },
    }
  })
  const [cashSummary, setCashSummary] = useState(0)
  const [refundSummary, setRefundSummary] = useState(0)
  const [unpaid, setUnpaid] = useState(0)
  const [paymentsSummary, setPaymentsSummary] = useState({
    number: 0,
    values: {
      Subtotal: { value: centsToDollar(0) },
      Tax: { value: centsToDollar(0) },
      Total: { value: centsToDollar(0) },
      Tips: { value: centsToDollar(0) },
      Discounts: { value: centsToDollar(0) },
    }
  })
  const [feedbackSummary, setFeedbackSummary] = useState({
    values: {
      Overall: { value: 0, subnumber: 0 },
      Service: { value: 0, subnumber: 0 },
      Food: { value: 0, subnumber: 0 },
    },
    comments: []
  })
  const [serverSummaries, setServerSummaries] = useState({
    // [server_id]: {total_ordered, total_paid, total_tips, bill_ids}
  })

  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarDate, setCalendarDate] = useState(null)
  const [oldDates, setOldDates] = useState({})
  const [oldDate, setOldDate] = useState('')

  const fetchOldDay = useCallback(async (date) => {
    const requestDate = YYYYMMDD(date)
    setOldDate(requestDate)

    try {
      setOldDates(prev => {
        if (typeof prev[requestDate] !== 'object') {
          return { ...prev, [requestDate]: 'loading' }
        }
        return prev
      })

      firebase.firestore()
        .collection('restaurants')
        .doc(restaurant_id)
        .collection('restaurantDays')
        .where('created', "<=", new Date(date.setHours(23, 59, 59, 999))).orderBy('created', 'desc').limit(1).get().then(docs => {
          if (!docs.size) {
            setOldDates(prev => {
              return {
                ...prev,
                [requestDate]: 'does-not-exist'
              }
            })
          }
          else {
            const docDate = YYYYMMDD(docs.docs[0].data().created.toDate())
            setOldDates(prev => {
              return {
                ...prev,
                [docDate]: docs.docs[0].data(),
                ...docDate !== requestDate & { [requestDate]: 'does-not-exist' }
              }
            })
          }
        })
    }
    catch (error) {
      setOldDates(prev => ({ ...prev, [requestDate]: 'error' }))
    }
  }, [])

  useEffect(() => {
    setShowComments(false)
    setShowServers(false)
    if (calendarDate) {
      if (calendarDate >= (new Date()).setHours(0, 0, 0, 0)) {
        setCalendarDate(null)
      }
      else {
        fetchOldDay(calendarDate)
      }
    }
    else (setOldDate(''))
  }, [calendarDate])

  useEffect(() => {
    /*
      Get all current services
    */
    if (isDemo()) {
      setServices([{
        startClock: militaryToClock('0930'),
        startDate: exactDateFromMilitary(0, '0930'),
        endClock: militaryToClock('2330'),
        endDate: exactDateFromMilitary(0, '2330'),
      }])
    }
    else {
      console.log('DAYS: ', days)
      let todays = [...days[nowDay].services]
      let yesterday = (nowDay + 6) % 7
      let yesterdays = []

      if (todays[0]?.start === 'prev') {
        // Check whether currently in this service or not

        if (todays[0].end === 'next' || todays[0].end >= nowMilitary) {
          // move the partial first service of today on to yesterday's
          yesterdays = [...days[yesterday].services]
          yesterdays[yesterdays.length - 1].end = todays[0].end
        }

        // Remove this service. Either it was from last night and should be ignored, or it was moved into yesterday's services
        todays.splice(0, 1)
      }

      // Format the services further: convert times into a clock format (4:30PM or if day prior, MON 4:30PM)
      // Also remove and services past the current time

      setServicesFromYesterday(yesterdays.map((service, index) => {
        let hold = [...service]

        if (hold.start === 'prev') {
          hold.start = '0000'
        }
        hold.startClock = militaryToClock(hold.start, threeLetterDays[yesterday])
        hold.startDate = exactDateFromMilitary(-1, hold.start)

        if (hold.end === 'next') {
          hold.endClock = 'Present'
          hold.endDate = exactDateFromMilitary(+1, '0000')
        }
        else {
          hold.endClock = militaryToClock(hold.end, threeLetterDays[index === yesterdays.length - 1 ? nowDay : yesterday])
          hold.endDate = exactDateFromMilitary(index === yesterdays.length - 1 ? 0 : -1, hold.end,)
        }

        return hold
      }))



      setServices(() => {
        // Remove any services from today that have not started
        let reachedThePresent = false
        return todays.reduce((acc, service) => {
          if (!reachedThePresent) {
            if (service.start <= nowMilitary) {
              if (service.end === 'next' || service.end > nowMilitary) {
                // Renames any current service that extends into future with 'present'
                return {
                  ...service,
                  startClock: militaryToClock(service.start),
                  endClock: 'Present',
                  startDate: exactDateFromMilitary(0, service.start),
                  endDate: exactDateFromMilitary(+1, '0000')
                }
              }
              return {
                ...service,
                startClock: militaryToClock(service.start),
                endClock: militaryToClock(service.end),
                startDate: exactDateFromMilitary(0, service.start),
                endDate: exactDateFromMilitary(0, service.end)
              }
            }
          }
          return acc
        }, [])
      })
    }

  }, [])

  useEffect(() => {
    const serverTemplate = () => {
      return {
        orderTotal: 0,
        paymentTotal: 0,
        checkoutTotal: 0,
        tipTotal: 0,
        cashTotal: 0,
        refundTotal: 0,
      }
    }

    let numBills = 0

    let sumCash = 0

    let sumOrders = {
      number: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
    }
    let sumPayments = {
      number: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
      tips: 0,
      discounts: 0,
    }
    let sumRefunds = {
      number: 0,
      total: 0
    }
    let sumFeedback = {
      overall: 0,
      overall_responses: 0,
      service: 0,
      service_responses: 0,
      food: 0,
      food_responses: 0,
      comments: [],
    }
    let byServer = { none: serverTemplate() }

    Object.keys(bills).forEach(bill_id => {
      const bill = bills[bill_id]

      const billDate = bill.timestamps.created.toMillis()
      const cash = bill.cash_or_card.reduce((acc, { amount }) => acc + amount, 0)

      // Collect the selected service as an array
      const selectedServices =
        !~selectedService.serviceIndex ? servicesFromYesterday.concat(services) :
          selectedService.today ? [services[selectedService.serviceIndex]] :
            [servicesFromYesterday[selectedService.serviceIndex]]

      // Skip this bill if it does not fall within any service start or end
      if (!isDemo() && !selectedServices.some(service => {
        // 15 minute grace period. Double negatives required or else treated as a string
        return service.startDate && billDate >= (service.startDate - 900000) && billDate <= (service.endDate - -900000)
      })) {
        return null
      }


      numBills++

      /*
        Orders
      */
      sumOrders.number += Object.keys(bill.user_statuses).reduce((acc, user_id) => acc + 1 * bill.user_statuses[user_id].ordered, 0)
      sumOrders.subtotal += bill.summary.subtotal
      sumOrders.tax += bill.summary.tax
      sumOrders.total += bill.summary.total


      /*
        Payments
      */
      if (bill.paid) {
        sumPayments.number += Object.keys(bill.user_summaries).reduce((acc, user_id) => {
          if (bill.user_summaries[user_id].paid) {
            return acc + 1
          }
          return acc
        }, 0)
        sumPayments.subtotal += bill.paid.subtotal ?? 0
        sumPayments.tax += bill.paid.tax ?? 0
        sumPayments.total += (bill.paid.total ?? 0) - cash
        sumPayments.tips += bill.paid.sum_tip ?? 0
        sumPayments.discounts += bill.paid.discounts ?? 0
        sumRefunds.total += bill.paid.refunds ?? 0
        if (bill.paid.refunds) {
          sumRefunds.number += Object.keys(bill.refunds).reduce((acc, id) => bill.refunds[id].status === 'succeeded' ? acc + 1 : acc, 0)
        }
      }
      sumCash += cash

      /*
        Feedback
      */
      sumFeedback.overall += bill.feedback.overall
      sumFeedback.overall_responses += bill.feedback.overall_responses
      sumFeedback.food += bill.feedback.food
      sumFeedback.food_responses += bill.feedback.food_responses
      sumFeedback.service += bill.feedback.service
      sumFeedback.service_responses += bill.feedback.service_responses
      sumFeedback.comments = sumFeedback.comments.concat(bill.feedback.comments)

      /*
        Server
      */

      let server_id = bill.server_details.id

      if (!server_id) {
        server_id = 'none'
      }
      else if (!byServer[server_id]) {
        byServer[server_id] = serverTemplate()
      }

      byServer[server_id].orderTotal += bill.summary.total
      if (bill.paid) {
        byServer[server_id].paymentTotal += (bill.paid.total ?? 0) - (bill.auto_checkout?.total ?? 0) - cash
        byServer[server_id].checkoutTotal += bill.auto_checkout?.total ?? 0
        byServer[server_id].tipTotal += (bill.paid.sum_tip ?? 0) + (bill.paid.table_tip ?? 0)
        byServer[server_id].refundTotal += bill.paid.refunds ?? 0
      }
      byServer[server_id].cashTotal += cash
    })

    setNumberOfBills(numBills)

    setOrdersSummary({
      number: sumOrders.number,
      values: {
        Subtotal: { value: centsToDollar(sumOrders.subtotal) },
        Tax: { value: centsToDollar(sumOrders.tax) },
        Total: { value: centsToDollar(sumOrders.total) },
      }
    })

    setPaymentsSummary({
      number: sumPayments.number,
      values: {
        Subtotal: { value: centsToDollar(sumPayments.subtotal) },
        Tax: { value: centsToDollar(sumPayments.tax) },
        Total: { value: centsToDollar(sumPayments.total) },
        Tips: { value: centsToDollar(sumPayments.tips) },
        Discounts: { value: centsToDollar(sumPayments.discounts) },
      }
    })

    setRefundSummary({
      number: sumRefunds.number,
      values: {
        Total: { value: centsToDollar(sumRefunds.total) }
      }
    })
    setUnpaid(sumOrders.total - sumPayments.total - sumCash)
    setCashSummary(sumCash)

    setFeedbackSummary({
      values: {
        Overall: {
          value: sumFeedback.overall ? (sumFeedback.overall / sumFeedback.overall_responses).toFixed(2) : 'none',
          subnumber: sumFeedback.overall_responses,
        },
        Service: {
          value: sumFeedback.service ? (sumFeedback.service / sumFeedback.service_responses).toFixed(2) : 'none',
          subnumber: sumFeedback.service_responses,
        },
        Food: {
          value: sumFeedback.food ? (sumFeedback.food / sumFeedback.food_responses).toFixed(2) : 'none',
          subnumber: sumFeedback.food_responses,
        },
      },
      comments: sumFeedback.comments
    })

    setServerSummaries(byServer)

  }, [selectedService, bills, services, servicesFromYesterday])

  /*
    Horizontal scrollview for period selection
    On selection, must reconvert back into a time suitable to compare against bills

  */

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', margin: 12, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            {calendarDate ?
              <TouchableOpacity onPress={() => setCalendarDate(null)}>
                <MainText>Return to live</MainText>
              </TouchableOpacity> :
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialIcons
                  name='arrow-back'
                  size={36}
                  color={Colors.softwhite}
                />
              </TouchableOpacity>
            }
          </View>
          <HeaderText>{calendarDate ? calendarDate.toDateString() : 'Today\'s summary'}</HeaderText>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={() => setShowCalendar(true)}>
              <MainText>{calendarDate ? 'Change date' : 'Older days'}</MainText>
            </TouchableOpacity>
          </View>
        </View>

        {oldDate ?
          typeof oldDates[oldDate] === 'string' ? <View style={{ flex: 1, paddingTop: 200, }}>
            {oldDates[oldDate] === 'loading' ? <View style={{ flex: 1, alignItems: 'center', }}>
              <LargeText style={{ marginBottom: 20 }}>Loading day...</LargeText>
              <ActivityIndicator size="large" color={Colors.softwhite} />

            </View> :
              <View style={{ alignItems: 'center' }}>
                <LargeText>{oldDates[oldDate] === 'does-not-exist' ? 'No records for this day' : 'Error getting day'}</LargeText>
                <MenuButton style={{ marginTop: 30 }} text='Return to live' color={Colors.red} buttonFn={() => setCalendarDate(null)} />
                <MenuButton style={{ marginTop: 30 }} text='Change date' buttonFn={() => setShowCalendar(true)} />
              </View>
            }
          </View> :
            <ScrollView style={{ paddingBottom: 80 }}>
              <LargeText center style={{ marginBottom: 20 }}><Plurarize value={oldDates[oldDate].bill_ids.length} nouns={{ s: 'bill', p: 'bills' }} /></LargeText>

              <SummarySection
                name='ORDERS'
                pluralNouns={{ s: 'order', p: 'orders' }}
                values={{
                  Subtotal: { value: centsToDollar(oldDates[oldDate].orders.subtotals) },
                  Tax: { value: centsToDollar(oldDates[oldDate].orders.taxes) },
                  Total: { value: centsToDollar(oldDates[oldDate].orders.subtotals + oldDates[oldDate].orders.taxes) },
                }}
                number={oldDates[oldDate].orders.number ?? 0}
                displayOrder={['Subtotal', 'Tax', 'Total']}
                subtext='Orders only reported when bill is marked closed or unpaid'
              />

              <SummarySection
                name='PAYMENTS'
                pluralNouns={{ s: 'payment', p: 'payments' }}
                values={{
                  Subtotal: { value: centsToDollar(oldDates[oldDate].payments.subtotals) },
                  Tax: { value: centsToDollar(oldDates[oldDate].payments.taxes) },
                  Total: { value: centsToDollar(oldDates[oldDate].payments.subtotals + oldDates[oldDate].payments.taxes) },
                  Tips: { value: centsToDollar(oldDates[oldDate].payments.tips) },
                  Discounts: { value: centsToDollar(oldDates[oldDate].payments.discounts) },
                }}
                number={oldDates[oldDate].payments.number ?? 0}
                displayOrder={['Subtotal', 'Tax', 'Total', 'Tips', 'Discounts',]}
                subtext={oldDates[oldDate].cash_or_card ? `Additional ${centsToDollar(oldDates[oldDate].cash_or_card)} reported in cash/card (excludes tips)` : 'No cash/card payments were reported'}
              />

              <SummarySection
                name='CHECKOUTS'
                pluralNouns={{ s: 'checkout', p: 'checkouts' }}
                values={{
                  Subtotal: { value: centsToDollar(oldDates[oldDate].checkouts.subtotals) },
                  Tax: { value: centsToDollar(oldDates[oldDate].checkouts.taxes) },
                  Total: { value: centsToDollar(oldDates[oldDate].checkouts.subtotals + oldDates[oldDate].checkouts.taxes) },
                  Tips: { value: centsToDollar(oldDates[oldDate].checkouts.tips) },
                }}
                number={oldDates[oldDate].checkouts.number ?? 0}
                displayOrder={['Subtotal', 'Tax', 'Total', 'Tips']}
              />

              <SummarySection
                name='REFUNDS'
                pluralNouns={{ s: 'refund', p: 'refunds' }}
                values={{
                  Total: { value: centsToDollar(oldDates[oldDate].refunds?.amount) },
                }}
                number={oldDates[oldDate].refunds?.number ?? 0}
                displayOrder={['Total']}
              />


              <SummarySection
                name='FEEDBACK'
                pluralNouns={{ s: 'response', p: 'responses' }}
                values={{
                  Overall: {
                    value: roundTwoDecimals(oldDates[oldDate].feedback.overall / oldDates[oldDate].feedback.overall_responses),
                    subnumber: oldDates[oldDate].feedback.overall_responses,
                  },
                  Service: {
                    value: roundTwoDecimals(oldDates[oldDate].feedback.service / oldDates[oldDate].feedback.service_responses),
                    subnumber: oldDates[oldDate].feedback.service_responses,
                  },
                  Food: {
                    value: roundTwoDecimals(oldDates[oldDate].feedback.food / oldDates[oldDate].feedback.food_responses),
                    subnumber: oldDates[oldDate].feedback.food_responses,
                  },
                }}
                displayOrder={['Overall', 'Service', 'Food']}
              />

              <View style={{ marginHorizontal: Layout.window.width * 0.2, marginBottom: 50 }}>
                {
                  Object.keys(oldDates[oldDate].servers).length ?
                    showServers ?
                      <View>
                        {Object.keys(oldDates[oldDate].servers).length > 10 && <MenuButton style={{ marginBottom: 30 }} text={'Hide servers'} color={Colors.red} buttonFn={() => setShowServers(false)} />}
                        {Object.keys(oldDates[oldDate].servers).map(server_id => {
                          let { orders = {}, payments = {}, checkouts = {}, cash_or_card = 0 } = oldDates[oldDate].servers[server_id]
                          const orderTotal = (orders.subtotals ?? 0) + (orders.taxes ?? 0)
                          const paymentTotal = (payments.subtotals ?? 0) + (payments.taxes ?? 0)
                          const checkoutTotal = (checkouts.subtotals ?? 0) + (checkouts.taxes ?? 0)
                          return <View key={server_id} style={{ flexDirection: 'row' }}>
                            <LargeText style={{ flex: 1 }}>{server_id === 'none' ? 'No server' : employees[server_id] ? employees[server_id].name : 'Unknown'}</LargeText>
                            <View style={{ marginLeft: 30 }}>
                              <MainText>Torte orders: {centsToDollar(orderTotal)}</MainText>
                              <MainText>Torte payments: {centsToDollar(paymentTotal)}</MainText>
                              <MainText>Torte checkouts: {centsToDollar(checkoutTotal)}</MainText>
                              <MainText>Cash / card: {centsToDollar(cash_or_card)}</MainText>
                              <MainText>Unpaid: {centsToDollar(orderTotal - paymentTotal - checkoutTotal - cash_or_card)}</MainText>
                              <MainText>Torte tips: {centsToDollar((payments.tips ?? 0) + (checkouts.tips ?? 0))}</MainText>
                            </View>
                          </View>
                        })}
                        <MenuButton style={{ marginTop: 30 }} text={'Hide servers'} color={Colors.red} buttonFn={() => setShowServers(false)} />
                      </View> :
                      <MenuButton text={'Show server summaries'} buttonFn={() => setShowServers(true)} /> :
                    <LargeText center>No server summaries</LargeText>
                }
              </View>
            </ScrollView> :
          <View style={{ flex: 1 }}>
            {(servicesFromYesterday.length + services.length > 1) && <ScrollView
              horizontal
              onContentSizeChange={(width) => {
                setScrollWidth(prev => {
                  if (width > prev) {
                    return width
                  }
                  return prev
                })
              }}
              contentContainerStyle={{
                paddingHorizontal: 50,
                marginBottom: 20,
                ...(typeof scrollWidth === 'number' && scrollWidth <= Layout.window.width) && { width: Layout.window.width - 1, justifyContent: 'center' }
              }}
            >
              <TimeFrame text='Entire day'
                selected={!~selectedService.serviceIndex}
                onPress={() => { setSelectedService({ today: true, serviceIndex: -1 }) }}
              />

              {
                servicesFromYesterday.map((service, index) => <TimeFrame
                  key={service.startClock}
                  text={service.startClock + ' - ' + service.endClock}
                  selected={!selectedService.today && selectedService.serviceIndex === index}
                  onPress={() => {
                    setSelectedService({ today: false, serviceIndex: index })
                  }}
                />)
              }

              {
                services.map((service, index) => <TimeFrame
                  key={service.startClock}
                  text={service.startClock + ' - ' + service.endClock}
                  selected={selectedService.today && selectedService.serviceIndex === index}
                  onPress={() => {
                    setSelectedService({ today: true, serviceIndex: index })
                  }}
                />)
              }
            </ScrollView>}

            <ScrollView
              style={{ paddingBottom: 80 }}>
              <View style={{ marginBottom: 20 }}>
                <LargeText center ><Plurarize value={numberOfBills} nouns={{ s: 'bill', p: 'bills' }} /></LargeText>
                <HeaderText center style={{ fontWeight: 'bold' }}>UNPAID: {centsToDollar(unpaid)}</HeaderText>
              </View>

              <SummarySection
                name='ORDERS'
                pluralNouns={{ s: 'order', p: 'orders' }}
                {...ordersSummary}
                displayOrder={['Subtotal', 'Tax', 'Total']}
              />

              <SummarySection
                name='PAYMENTS'
                pluralNouns={{ s: 'payment', p: 'payments' }}
                {...paymentsSummary}
                displayOrder={['Subtotal', 'Tax', 'Total', 'Tips', 'Discounts', 'Cash/Card', 'Refunds']}
                subtext={cashSummary ? `Additional ${centsToDollar(cashSummary)} reported in cash/card (excludes tips)` : 'No cash/card payments were reported'}
              />

              <SummarySection
                name='FEEDBACK'
                {...feedbackSummary}
                pluralNouns={{ s: 'response', p: 'responses' }}
                displayOrder={['Overall', 'Service', 'Food']}
              />

              <SummarySection
                name='REFUNDS'
                {...refundSummary}
                pluralNouns={{ s: 'refund', p: 'refunds' }}
                displayOrder={['Total']}
              />

              <View style={{ marginHorizontal: Layout.window.width * 0.1, marginBottom: 50 }}>
                {feedbackSummary.comments.length ?
                  showComments ?
                    <View>
                      {feedbackSummary.comments.length > 10 && <MenuButton style={{ marginBottom: 30 }} text={'Hide comments'} color={Colors.red} buttonFn={() => setShowComments(false)} />}
                      {feedbackSummary.comments.map(comment => <LargeText center key={comment}>{comment}</LargeText>)}
                      <MenuButton style={{ marginTop: 30 }} text={'Hide comments'} color={Colors.red} buttonFn={() => setShowComments(false)} />
                    </View> :
                    <MenuButton text={'Show comments'} buttonFn={() => setShowComments(true)} /> :
                  <LargeText center>No feedback comments</LargeText>}
              </View>

              <View style={{ marginHorizontal: Layout.window.width * 0.2, marginBottom: 50 }}>
                {
                  Object.keys(serverSummaries).length ?
                    showServers ?
                      <View>
                        {Object.keys(serverSummaries).length > 10 && <MenuButton style={{ marginBottom: 30 }} text={'Hide servers'} color={Colors.red} buttonFn={() => setShowServers(false)} />}
                        {Object.keys(serverSummaries).map(server_id => {
                          return <View key={server_id} style={{ flexDirection: 'row' }}>
                            <LargeText style={{ flex: 1 }}>{server_id === 'none' ? 'No server' : employees[server_id] ? employees[server_id].name : 'Unknown'}</LargeText>
                            <View style={{ marginLeft: 30 }}>
                              <MainText>Torte orders: {centsToDollar(serverSummaries[server_id].orderTotal)}</MainText>
                              <MainText>Torte payments: {centsToDollar(serverSummaries[server_id].paymentTotal)}</MainText>
                              <MainText>Torte checkouts: {centsToDollar(serverSummaries[server_id].checkoutTotal)}</MainText>
                              <MainText>Cash / card: {centsToDollar(serverSummaries[server_id].cashTotal)}</MainText>
                              <MainText>Unpaid: {centsToDollar(serverSummaries[server_id].orderTotal - serverSummaries[server_id].paymentTotal - serverSummaries[server_id].checkoutTotal - serverSummaries[server_id].cashTotal)}</MainText>
                              <MainText>Refunds: {centsToDollar(serverSummaries[server_id].refundTotal)}</MainText>
                              <MainText>Torte tips: {centsToDollar(serverSummaries[server_id].tipTotal)}</MainText>
                            </View>
                          </View>
                        })}
                        <MenuButton style={{ marginTop: 30 }} text={'Hide servers'} color={Colors.red} buttonFn={() => setShowServers(false)} />
                      </View> :
                      <MenuButton text={'Show server summaries'} buttonFn={() => setShowServers(true)} /> :
                    <LargeText center>No server summaries</LargeText>
                }
              </View>
            </ScrollView>
          </View>
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

const exactDateFromMilitary = (dayShift = 0, militaryTime) => {
  let now = new Date()

  // Shift days forward or backwards if required
  now.setDate(now.getDate() + dayShift)

  // Convert to midnight (12AM)
  now.setHours(militaryTime.substring(0, 2), militaryTime.substring(2, 4), 0)

  // Return as date object
  return now
}

const TimeFrame = ({ text, selected, onPress }) => {
  return <TouchableOpacity onPress={onPress} style={{ marginHorizontal: 40 }}>
    <View style={{ borderBottomColor: selected ? Colors.green : Colors.background, borderBottomWidth: 3 }}>
      <LargeText style={{ paddingVertical: 4, paddingHorizontal: 12 }}>{text}</LargeText>
    </View>
  </TouchableOpacity>
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

const roundTwoDecimals = (num) => {
  return +(Math.round(num + "e+2") + "e-2");
}


const styles = StyleSheet.create({

});

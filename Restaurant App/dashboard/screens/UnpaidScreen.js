import React, { useState, useEffect, useCallback, } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import firebase from 'firebase';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { ExtraLargeText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
// import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { useBill } from '../../utils/hooks/useBill';
import { useDispatch, useSelector } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import centsToDollar from '../../utils/functions/centsToDollar';
import Bill from '../../bill/components/Bill';
import { TEN_MINUTE_UNPAID_DELAY } from '../../redux/actions/actionsCharges';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
// import { transactVoidBill } from '../../bill/firestore/transactVoidBill';

const IS_CHARGING = 'charging...'

export default function UnpaidScreen({ navigation }) {
  const { pending, recovered, failed, completed } = useSelector(state => state.unpaid)
  const [billID, setBillID] = useState('')

  const closeBill = useCallback(() => setBillID(''), [])

  return <SafeView >
    <Header back>
      <ExtraLargeText center>Unpaid bills</ExtraLargeText>
      {/* FUTURE SEARCH BAR */}
    </Header>

    <SectionList
      sections={[
        { title: 'pending', data: pending },
        { title: 'completed', data: completed },
        { title: 'recovered', data: recovered },
        { title: 'failed', data: failed },
      ]}
      keyExtractor={item => item}
      renderItem={({ item: bill_id, section: { title } }) => <BillHistory bill_id={bill_id} status={title} setBillID={setBillID} />}
      renderSectionHeader={({ section: { title, } }) => {
        return <View style={{ backgroundColor: Colors.background, borderColor: Colors.white, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 10, paddingHorizontal: 20 }}>
          <ExtraLargeText bold>{title.toUpperCase()} UNPAID BILLS</ExtraLargeText>
        </View>
      }}
      renderSectionFooter={({ section: { title, data } }) => {
        if (!data.length) return <MediumText style={{ padding: 20 }}>No {title} bills</MediumText>
        return <View />
      }}
      indicatorStyle='white'
      stickySectionHeadersEnabled
    />

    {/* <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, marginHorizontal: Layout.marHor }}
      data={billIDs}
      ListEmptyComponent={() => {
        return <View style={{ flex: 1, justifyContent: 'center', marginHorizontal: 40 }}>
          <ExtraLargeText center>NO UNPAID BILLS</ExtraLargeText>
        </View>
      }}
      renderItem={({ item: bill_id }) => <TouchableOpacity onPress={() => setBillID(bill_id)}><BillHistory bill_id={bill_id} /></TouchableOpacity>}
      keyExtractor={item => item}
      ListFooterComponentStyle={styles.footerView}
      ListFooterComponent={() => {
        if (billIDs.length) return <MediumText center>No further bills to show</MediumText>
        return null
      }}
    /> */}

    {!!billID && <Bill bill_id={billID} closeBill={closeBill} />}
  </SafeView>
}

const BillHistory = ({ bill_id, status, setBillID }) => {
  const { order_summary, bill_code, table: { name: tableName } = {}, timestamps: { unpaid } = {}, paid_summary, } = useBill(bill_id)
  const timeRemaining = status === 'pending' && unpaid ? useTimeRemaining(unpaid) : null
  const [isSaving, setIsSaving] = useState('')
  // const restaurantRef = useRestaurantRef()
  const dispatch = useDispatch()

  const unpaidTotal = order_summary?.total - paid_summary?.total

  const close = useCallback(async () => {
    dispatch(doAlertAdd(`Close bill #${bill_code}?`, unpaidTotal ? `Users can still return to pay to remaining ${centsToDollar(unpaidTotal)}, but we are unable to collect this for you.` : undefined, [
      {
        text: 'Yes, close',
        onPress: async () => {
          setIsSaving('CLOSING')
          try {
            await firebase.functions().httpsCallable('close-markBillClosed')({ bill_id })
          }
          catch (error) {
            console.log('Unpaid screen close unpaid error: ', error)
            dispatch(doAlertAdd('Cannot close bill', 'Please let Torte know if you see this issue multiple times'))
          }
          finally {
            setIsSaving('')
          }
        }
      }
    ]))
  }, [unpaidTotal,])

  // const voidBill = useCallback(async () => {
  //   dispatch(doAlertAdd(`Void bill #${bill_code} (${centsToDollar(unpaidTotal)})?`, 'If a guest returns to the bill, they will not be able to pay for voided items', [
  //     {
  //       text: 'Yes, void',
  //       onPress: async () => {
  //         setIsSaving('VOIDING')
  //         try {
  //           const { comp, isWithUsers } = await transactVoidBill(restaurantRef, bill_id, true)
  //           if (comp) dispatch(doAlertAdd(`Unable to void ${centsToDollar(comp.subtotal)}`, 'These items were partially paid. Do you want to comp this remainder?', [
  //             {
  //               text: `Yes, comp ${centsToDollar(comp.subtotal)}`,
  //               onPress: async () => {
  //                 try {
  //                   const { isWithUsers: iwu } = await transactVoidBill(restaurantRef, bill_id, true, comp,)
  //                   if (iwu) firebase.functions().httpsCallable('close-deleteOpenBillAlerts')({ bill_id })
  //                   setIsSaving('')
  //                 }
  //                 catch (error) {
  //                   console.log('BillMenuPopUp voidEntireBill comp error: ', error)
  //                   dispatch(doAlertAdd('Failed to comp rest of bill', 'Please try again and let us know if the issue persists'))
  //                 }
  //               }
  //             },
  //             {
  //               text: 'No, I need to make other changes'
  //             }
  //           ]))
  //           else {
  //             if (isWithUsers) firebase.functions().httpsCallable('close-deleteOpenBillAlerts')({ bill_id })
  //             setIsSaving('')
  //           }
  //         }
  //         catch (error) {
  //           console.log('UnpaidScreen void error: ', error)
  //           dispatch(doAlertAdd('Failed to void bill', 'Please try again and let us know if the issue persists'))
  //         }
  //       }
  //     }
  //   ]))
  // }, [unpaidTotal])

  const cancel = useCallback(async () => {
    dispatch(doAlertAdd(`Reopen bill #${bill_code}?`, undefined, [
      {
        text: 'Yes, reopen',
        onPress: async () => {
          setIsSaving('REOPENING')
          try {
            await firebase.functions().httpsCallable('close-markBillOpen')({ bill_id })
          }
          catch (error) {
            console.log('Unpaid screen reopen unpaid error: ', error)
            dispatch(doAlertAdd('Cannot reopen bill', 'Please let Torte know if you see this issue multiple times'))
          }
          finally {
            setIsSaving('')
          }
        }
      },
      {
        text: 'No, cancel',
      }
    ]))
  }, [])

  if (!bill_code) return null

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderColor: Colors.white, borderBottomWidth: 1 }}>
      <TouchableOpacity style={{ flexDirection: 'row', flex: 1 }} onPress={() => setBillID(bill_id)}>
        <View style={{ flex: 1 }}>
          <LargeText bold>{tableName} - #{bill_code}</LargeText>
          <LargeText> </LargeText>
        </View>
        <View style={{ flex: 1 }}>
          <LargeText>ORDER TOTAL: {centsToDollar(order_summary?.total)}</LargeText>
          <LargeText bold red>UNPAID: {centsToDollar(unpaidTotal)}</LargeText>
        </View>
      </TouchableOpacity>

      {status === 'pending' ? <View style={{ flexDirection: 'row' }}>
        <HistoryButton text={timeRemaining} color={Colors.red} />
        <HistoryButton onPress={cancel} text='CANCEL' color={Colors.midgrey} />
      </View> :
        <View style={{ flexDirection: 'row' }}>
          {/* status === 'failed' ?
              <HistoryButton disabled={unpaidTotal <= 0} onPress={voidBill} text='VOID' color={Colors.red} /> : */}
          <HistoryButton onPress={close} text='CLOSE' color={Colors.red} />
          <HistoryButton onPress={cancel} text='Reopen' color={Colors.midgrey} />
        </View>
      }

      {!!isSaving && <IndicatorOverlay horizontal text={isSaving} />}
    </View>
  )
}

const HistoryButton = ({ color, text, disabled, onPress }) => {
  const [minWidth, setMinWidth] = useState(null)

  return <TouchableOpacity disabled={disabled || !onPress} onPress={onPress}>
    <View onLayout={({ nativeEvent: { layout: { width } } }) => setMinWidth(prev => Math.max(prev, width))} style={{ minWidth, marginLeft: 12, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: disabled ? Colors.darkgrey : color }}>
      <LargeText center>{text}</LargeText>
    </View>
  </TouchableOpacity>
}

const useTimeRemaining = (unpaid) => {
  const [remaining, setRemaining] = useState('...')

  /*
  consider useFocusEffect
  consider function for time, fired before interval delay (and timeout delay?)
  consider seconds_elapsed calculated once before setInterval, then ++
  consider tracking minutes and seconds instead, then if seconds >= 60 increment minutes
  */

  const remainingFunction = (unpaid) => {
    const millisRemaining = unpaid?.toMillis() + TEN_MINUTE_UNPAID_DELAY - Date.now()
    if (millisRemaining <= 0) return setRemaining(IS_CHARGING)
    const secondsRemaining = Math.round(millisRemaining / 1000)
    let minutes = parseInt(secondsRemaining / 60, 10);
    let seconds = parseInt(secondsRemaining % 60, 10);

    seconds = seconds < 10 ? "0" + seconds : seconds;

    setRemaining(minutes + ":" + seconds)
  }

  useEffect(() => {
    remainingFunction(unpaid)

    let interval
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        remainingFunction(unpaid)
      }, 1000);
    }, 1000 - (Date.now()) % 1000)

    return () => {
      timeout && clearTimeout(timeout)
      interval && clearInterval(interval)
    }
  }, [unpaid])

  return remaining
}

const styles = StyleSheet.create({
  footerView: {
    paddingVertical: 30,
    alignItems: 'center',
    marginBottom: Layout.window.height / 10
  }
});
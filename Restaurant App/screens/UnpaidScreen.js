import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Alert,
  Text,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import firebase from '../config/Firebase';
import { MainText, LargeText, ClarifyingText } from '../components/PortalText'
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons, } from '@expo/vector-icons';
import centsToDollar from '../functions/centsToDollar';
import { fullDays, months, threeLetterDays } from '../constants/DOTW';
import { dateToClock } from '../functions/dateAndTime';
import { transactMarkClosed, transactUnconfirmUnpaid } from '../transactions/transactTimestamps';
import transactCashCard from '../transactions/transactCashCard';
import { setBill } from '../redux/actionsBills';
import { Audio } from 'expo-av';
const completeSound = require('../assets/Finished.wav')
import useRestaurant from '../hooks/useRestaurant';
import MenuButton from '../components/MenuButton';

const radius = 20
const today = (new Date()).getDay()
const pastWeek = Array.from({ length: 7 }, (_, i) => (today + 7 - i) % 7)

export default function UnpaidScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  const bills = useSelector(state => state.bills)
  const { days: { } } = useSelector(state => state.restaurant)
  // const { closing_tabs = {} } = useSelector(state => state.system)

  const dispatch = useDispatch()

  const [unpaidBills, setUnpaidBills] = useState([])
  const [hasAutoCheckout, setHasAutoCheckout] = useState({})
  const [autoByDay, setAutoByDay] = useState([[], [], [], [], [], [], [],])
  const [autoSummariesByDay, setAutoSummariesByDay] = useState([[], [], [], [], [], [], [],])
  const [closing, setClosing] = useState([])

  const successSound = async () => {
    const { sound } = await Audio.Sound.createAsync(completeSound);
    console.log('DING! Payment Complete');
    await sound.playAsync();
  }

  useFocusEffect(useCallback(() => {
    firebase.firestore().collection('restaurants').doc(restaurant_id)
      .collection('bills')
      .where('timestamps.server_marked_unpaid', '>=', new Date(2020))
      .where('timestamps.auto_checkout', '==', null)
      .onSnapshot(docs => {
        setUnpaidBills(prev => {
          let next = [...prev]

          docs.docChanges().forEach(async function (change) {
            let index = next.indexOf(change.doc.id)
            if (change.type === "added" || change.type === "modified") {
              if (!~index) {
                next.push(change.doc.id)
              }
            }
            if (change.type === "removed") {
              if (~index) {
                successSound()
              }
            }
          });

          return next
        })

        docs.docChanges().forEach(function (change) {
          if (change.type === "added" || change.type === "modified") {
            dispatch(setBill(change.doc.id, change.doc.data()))
          }
          // if (change.type === "removed") {
          //   dispatch(deleteBill(change.doc.id, change.doc.data().table_details.id))
          // }
        });


      })

  }, []))

  useEffect(() => {
    getAutoCheckouts()
  }, [])

  const getAutoCheckouts = useCallback(() => {
    let now = new Date()
    const oneWeekAgo = now.setHours(-24 * 7, 0, 0, 0)

    firebase.firestore().collection('restaurants').doc(restaurant_id)
      .collection('bills').where('timestamps.auto_checkout', '>=', new Date(oneWeekAgo))
      .get().then(docs => {

        setHasAutoCheckout(!!docs.size)

        // JUST GET THE DAY OF THE WEEK OFF THAT, and use 0-6 that way, and start from wherever

        let days = [[], [], [], [], [], [], [],]
        let summary = { subtotal: 0, tax: 0, tip: 0 }
        let summaries = [{ ...summary }, { ...summary }, { ...summary }, { ...summary }, { ...summary }, { ...summary }, { ...summary },]

        docs.forEach(doc => {
          dispatch(setBill(doc.id, doc.data()))
          let day = (doc.data().timestamps.auto_checkout.toDate()).getDay()
          days[day].push(doc.id)

          summaries[day].subtotal += doc.data().auto_checkout?.subtotal ?? 0
          summaries[day].tax += doc.data().auto_checkout?.tax ?? 0
          summaries[day].tip += doc.data().auto_checkout?.tip ?? 0
        })

        setAutoByDay(days)
        setAutoSummariesByDay(summaries)
      })

  }, [])

  const closeWithErrors = useCallback((bill_id) => async (ignoreCart = false) => {
    try {
      await transactMarkClosed(restaurant_id, bill_id, ignoreCart)
    }
    catch (error) {
      console.log('close error: ', error)
      if (error.message) {
        Alert.alert(error.message ?? 'An error occurred.', 'Please contact Torte support if the issue persists')
      }
      else if (error.hasCountdown) {
        Alert.alert('Users are actively placing an order')
      }
      else if (error.arrayUntransferred) {
        Alert.alert('Table has untransferred orders', 'Do you want to mark all as transferred and then close the bill?', [
          {
            text: 'Yes, mark as as transferred',
            onPress: async () => {
              try {
                error.arrayUntransferred.forEach(async order => {
                  await batchOrderTransferred(restaurant_id, bill_id, order.order_id, order.submission_id)
                })
                closeWithErrors(bill_id)()
              }
              catch (error) {
                Alert.alert('Error marking orders as transferred', 'Please mark as transferred through the Dashboard, then come back and try again')
              }
            }
          },
          {
            text: 'No, cancel',
            style: 'cancel'
          }
        ])
      }
      else if (error.hasOrders) {
        Alert.alert('Users have items in their cart(s)', 'Are you sure you want to close this bill? They will be unable to order.', [
          {
            text: 'Yes, close bill',
            onPress: () => {
              closeWithErrors(bill_id)(true)
            }
          },
          {
            text: 'No, cancel',
            style: 'cancel'
          }
        ])
      }
      else if (error.amountUnpaid) {
        Alert.alert('This bill has not been fully paid.', 'You cannot close an unpaid bill. Do you want to add a cash/card payment that matches the unpaid amount?', [
          {
            text: 'Yes, add value and close bill',
            onPress: async () => {
              try {
                await transactCashCard(restaurant_id, bill_id)
                closeWithErrors(bill_id)(ignoreCart)
              }
              catch (error) {
                console.log('amountUnpaid alert error', error)
                Alert.alert('Error adding value', 'Please go back and add a cash/card payment manually, then try again')
              }
            }
          },
          {
            text: 'No, cancel',
            style: 'cancel'
          }
        ])
      }
      else {
        Alert.alert('An unknown error occurred.', 'Please contact Torte support if the issue persists')
      }
    }
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView>
        <View style={{ flexDirection: 'row', margin: 12, marginBottom: 0, alignItems: 'center', }}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons
                name='arrow-back'
                size={36}
                color={Colors.softwhite}
              />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}></View>
        </View>
        <FlatList
          data={unpaidBills.sort((a, b) => bills[a]?.timestamps.created.toMillis() < bills[b]?.timestamps.created.toMillis())}
          keyExtractor={bill_id => bill_id}
          ListHeaderComponent={() => <View style={{ marginBottom: 20 }}>
            <LargeText center>Unpaid bills</LargeText>
          </View>}
          renderItem={({ item: bill_id }) => {
            if (!bills[bill_id]) {
              return null
            }
            return <UnpaidBill bill={bills[bill_id]} close={closeWithErrors(bill_id)} closing={closing.includes(bill_id)} confirm={() => {
              Alert.alert('Did guests leave without paying with cash or credit cards?',
                'Please check with the server that the table has left and did not pay by cash or card.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Charge table',
                    onPress: async () => {
                      try {
                        setClosing(prev => [...prev, bill_id])
                        await firebase.functions().httpsCallable('autoCheckout-closeTab')({ restaurant_id, bill_id })
                      }
                      catch (error) {
                        console.log('Close tab error: ', error)
                        if (bills[bill_id]) {
                          Alert.alert(`Error charging bill #${bills[bill_id]}`, 'Please contact Torte support')
                        }
                        setClosing(prev => {
                          return prev.filter(id => id !== bill_id)
                        })
                      }
                    }
                  }
                ]
              )
            }}
              navigate={() => {
                navigation.navigate('Ticket', { bill_id })
              }} />
          }}
          // ListHeaderComponent={() => <View style={{ marginHorizontal: Layout.window.width * 0.2, marginBottom: 20 }}>
          //   <MainText center>You must confirm unpaid bills before we charge for the remaining amount.</MainText>
          // </View>}
          ListEmptyComponent={() => <LargeText center style={{ paddingVertical: 60 }}>No unpaid bills</LargeText>}
          ListFooterComponent={() => {
            return <View style={{ marginHorizontal: Layout.window.width * 0.05, borderTopColor: Colors.softwhite, borderTopWidth: 1, paddingVertical: 30 }}>
              {
                hasAutoCheckout ?
                  <FlatList
                    data={pastWeek}
                    keyExtractor={item => item.toString()}
                    renderItem={({ item: day }) => {
                      if (!autoByDay[day]?.length) {
                        return null
                      }
                      return <View >
                        <LargeText>{fullDays[day]} morning</LargeText>
                        <View style={{ flexDirection: 'row', marginBottom: 20, }}>
                          <MainText style={{ flex: 1 }}>Subtotals: {centsToDollar(autoSummariesByDay[day]?.subtotal)}</MainText>
                          <MainText style={{ flex: 1 }}>Taxes: {centsToDollar(autoSummariesByDay[day]?.tax)}</MainText>
                          <MainText style={{ flex: 1 }}>Tips: {centsToDollar(autoSummariesByDay[day]?.tip)}</MainText>
                        </View>
                        {
                          autoByDay[day].map(bill_id => {
                            return <UnpaidBill bill={bills[bill_id]} navigate={() => {
                              navigation.navigate('Ticket', { bill_id })
                            }} />
                          })
                        }
                      </View>
                    }}
                    ListHeaderComponent={() => <View style={{ marginBottom: 20 }}>
                      <LargeText center>Previous unpaid bills</LargeText>

                      {/* <MenuButton style={{ marginVertical: 20 }} text='Refresh' buttonFn={() => getAutoCheckouts()} /> */}
                    </View>}
                  /> :
                  <View style={{ paddingVertical: 30 }}>
                    <LargeText center>No unpaid bills from this past week</LargeText>
                    {/* <MenuButton style={{ marginVertical: 20 }} text='Refresh' buttonFn={() => getAutoCheckouts()} /> */}
                  </View>
              }
            </View>
          }}
        />
      </SafeAreaView>
    </View >
  );
}

const UnpaidBill = ({ bill, close = () => { }, confirm = () => { }, closing = false, navigate, }) => {
  let created = bill.timestamps.created.toDate()
  let unpaid = (bill.summary.total ?? 0) - (bill.paid?.total ?? 0)

  if (!bill) {
    return null
  }

  return <View style={{
    width: Layout.window.width * 0.7,
    alignSelf: 'center',
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.30,

    elevation: 13,
  }}>
    <TouchableOpacity onPress={navigate}>
      <View style={{
        backgroundColor: Colors.darkgrey,
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        paddingVertical: radius * 0.5,
        paddingHorizontal: radius
      }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.details}>{threeLetterDays[created.getDay()]} {months[created.getMonth()]} {created.getDate()} @ {dateToClock(created)}</Text>
            <Text style={styles.details}>Bill #{bill.ref_code}</Text>
            <Text style={styles.details}>{bill.table_details.name}</Text>
            <Text style={styles.details}>{bill.server_details.name || 'No server'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', flex: 1, marginHorizontal: 20 }}>
            {
              bill.auto_checkout?.failed?.length ?
                <View style={{ justifyContent: 'center', flex: 1 }}>
                  <MainText style={{ color: Colors.red, fontWeight: 'bold' }}>FAILED</MainText>
                </View> :
                unpaid ?
                  <View style={{ justifyContent: 'center', flex: 1 }}>
                    <MainText style={{ color: Colors.red, fontWeight: 'bold' }}>Unpaid</MainText>
                    <MainText>{centsToDollar(unpaid)}</MainText>
                  </View> :
                  <View style={{ justifyContent: 'space-evenly', flex: 1 }}>
                    <MainText center>Total: {centsToDollar(bill.paid?.total ?? 0)}</MainText>
                    <MainText center>Tips: {centsToDollar(bill.paid?.sum_tip ?? 0)}</MainText>
                  </View>
            }
          </View>
        </View>
      </View>
    </TouchableOpacity>

    {
      bill.timestamps.auto_checkout || bill.auto_checkout ?
        bill.auto_checkout?.failed?.length ?
          <View style={[styles.button, { borderBottomLeftRadius: radius, borderBottomRightRadius: radius, backgroundColor: Colors.red }]}>
            <MainText style={{ fontWeight: 'bold' }}>ERROR contact Torte</MainText>
          </View> :
          unpaid ? <View style={[styles.button, { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }]}>
            <MainText>Processing...</MainText>
          </View> :
            <View style={[styles.button, { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }]}>
              <MainText style={{ color: Colors.green, fontWeight: 'bold' }}>PAID IN FULL</MainText>
            </View>
        :
        closing ?
          <View style={[styles.button, { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }]}>
            <MainText>Connecting...</MainText>
          </View> :
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity containerStyle={{ flexGrow: 1 }} style={[styles.button, { borderBottomLeftRadius: radius, }]} onPress={() => {
              close()
            }}>
              <View >
                <MainText>Close</MainText>
              </View>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: Colors.softwhite }} />
            <TouchableOpacity containerStyle={{ flexGrow: 1 }} style={[styles.button, { borderBottomRightRadius: radius, }]} onPress={() => {
              confirm()
            }}>
              <View >
                <MainText>Confirm unpaid</MainText>
              </View>
            </TouchableOpacity>
          </View>
    }
  </View>
}





const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.darkgrey,
    borderTopWidth: 1,
    borderTopColor: Colors.softwhite

  },
  details: {
    fontSize: 21,
    color: Colors.white
  }
});

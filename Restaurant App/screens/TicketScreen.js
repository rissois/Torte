import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,

  Modal,
  Platform,
  ScrollView,
  LayoutAnimation,
  UIManager,

  Alert as RNAlert,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, LargeText, MainText } from '../components/PortalText'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  TouchableOpacity,
  FlatList,
} from 'react-native-gesture-handler';
import { useSelector, } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import centsToDollar from '../functions/centsToDollar';
import filterTitles from '../constants/filterTitles';
import capitalize from '../functions/capitalize';
import commaList from '../functions/commaList'
import Alert from '../components/Alert'
import batchOrderTransferred from '../transactions/batchOrderTransferred';
import AddItems from '../components/AddItems';
import EditItems from '../components/EditItems';
import CashCardPayments from '../components/CashCardPayments';
import { transactMarkClosed, transactMarkUnpaid, transactReopenBill } from '../transactions/transactTimestamps';
import transactCashCard from '../transactions/transactCashCard';
import RenderOverlay from '../components/RenderOverlay';
import { writeTransferBills } from '../transactions/writeTransferBills';
import RefundSelector from '../components/RefundSelector';
import * as Print from 'expo-print';
import { htmlTicket } from '../functions/printHTML';
import useRestaurant from '../hooks/useRestaurant';
import writeAutoGratuity from '../transactions/writeAutoGratuity';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
const checklist_states = {
  ok: 'ok',
  caution: 'caution',
  warn: 'warn'
}


export default function TicketScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  let { bill_id, tableTransfer, refund_approved } = route.params
  const { restaurant: { gratuities: { auto_gratuity: auto_grat = 0 } }, system: { table_order }, tables, user, employees, privateDocs: { private: { } } } = useSelector(state => state)
  const bill = useSelector(state => state.bills[bill_id] ?? {})
  const cart = useSelector(state => state.carts[bill_id] ?? {})

  let {
    ref_code = '',
    timestamps = {},
    summary = {},
    groups = {},
    paid,
    feedback = {},
    server_details: { id: server_id, name: server_name },
    table_details,
    auto_gratuity,
    untaken_items,
    pay: { format_locked = {} } = {}
  } = bill
  let { submits = {}, orders = {}, payments = {} } = cart

  const [amountUnpaid, setAmountUnpaid] = useState(0)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)
  const [addAlert, setAddAlert] = useState(() => { })
  const [editAlert, setEditAlert] = useState(() => { })
  const [showCashPayments, setShowCashPayments] = useState(false)
  const [initiateRefund, setInitiateRefund] = useState(false)
  const [showMoveTable, setShowMoveTable] = useState(false)
  const [moveTo, setMoveTo] = useState('')
  const [isMoving, setIsMoving] = useState('')
  const [showReassignServer, setShowReassignServer] = useState(false)
  const [reassignTo, setReassignTo] = useState('')

  useEffect(() => {
    if (!employees[user]?.roles.includes('manager') && server_id && server_id !== user) {
      navigation.goBack()
    }
  }, [server_id, employees, user])

  useEffect(() => {
    if (tableTransfer) {
      moveTable(tableTransfer.table_details, tableTransfer.server_details)
      navigation.setParams({ tableTransfer: undefined })
      setMoveTo('')
      setShowMoveTable(false)
      setReassignTo('')
      setShowReassignServer(false)
      onPressCloseTable()
    }
  }, [tableTransfer])

  let numWaitingSubmits = Object.keys(submits).filter(key => submits[key].submission_time && !submits[key].transferred).length
  let hasCountdown = Object.keys(submits).some(key => submits[key].submission_status === 'countdown_all' || submits[key].submission_status === 'countdown_partial')
  let table_message =
    timestamps.auto_checkout ? `Bill closed out by Torte` :
      timestamps.server_marked_closed ? `Bill closed\nUsers cannot make changes to this bill` :
        timestamps.server_marked_unpaid ? 'Bill marked as unpaid' :
          payments.paid_in_full ? 'Fully paid' :
            payments.paid_users?.length ? 'Partially paid' :
              hasCountdown ? 'About to order' :
                numWaitingSubmits ? `${numWaitingSubmits}${numWaitingSubmits === 1 ? ' order' : ' orders'} waiting` :
                  Object.keys(submits).length > 1 ?
                    Object.keys(orders).length ? 'Adding more items' :
                      'Ordered' :
                    Object.keys(orders).length ? 'Creating order' :
                      'Opened Torte'


  const [validButtons, setValidButtons] = useState({
    reopen: false,
    unpaid: false,
    closed: false,
    add: false,
    edit: false,
  })
  const [showCloseTable, setShowCloseTable] = useState(false)
  const [alert, setAlert] = useState({})

  const onPressCloseTable = useCallback(() => {
    setShowCloseTable(prev => !prev)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [])


  useEffect(() => {
    setValidButtons({
      reopen: Boolean(timestamps.server_marked_closed || timestamps.server_marked_unpaid),
      unpaid: Boolean(Object.keys(groups).length && !timestamps.auto_checkout && !timestamps.server_marked_unpaid && summary.subtotal),
      close: !timestamps.server_marked_closed && !timestamps.auto_checkout,
      change: !payments.paid_in_full && !format_locked.user_all && !format_locked.num_splits && !format_locked.num_seats && (!Object.keys(groups).length || untaken_items),
    })

  }, [timestamps, summary, groups, format_locked, payments, untaken_items])

  useEffect(() => {
    setAmountUnpaid((summary.total ?? 0) - (paid?.total ?? 0))
  }, [summary, paid])

  const moveTable = useCallback(async (new_table_details, server_details) => {
    try {
      setIsMoving(new_table_details ? 'table' : 'bill')
      await writeTransferBills(restaurant_id, bill_id, server_details, new_table_details)
      setShowMoveTable(false)
    }
    catch (error) {
      console.log('Error moving table: ', error)
      RNAlert.alert('Error moving table.', 'Contact Torte Support if the error persists')
    }
    finally {
      setIsMoving('')
    }
  }, [table_details])

  const closeWithErrors = useCallback((bill_id) => async (ignoreCart = false) => {
    try {
      await transactMarkClosed(restaurant_id, bill_id, ignoreCart)
      navigation.goBack()
    }
    catch (error) {
      console.log('close error: ', error)
      if (error.message) {
        RNAlert.alert(error.message ?? 'An error occurred.', 'Please contact Torte support if the issue persists')
      }
      else if (error.hasCountdown) {
        RNAlert.alert('Users are actively placing an order')
      }
      else if (error.arrayUntransferred) {
        RNAlert.alert('Table has untransferred orders', 'Do you want to mark all as transferred and then close the bill?', [
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
                RNAlert.alert('Error marking orders as transferred', 'Please mark as transferred through the Dashboard, then come back and try again')
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
        RNAlert.alert('Users have items in their cart(s)', 'Are you sure you want to close this bill? They will be unable to order.', [
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
        RNAlert.alert('This bill has not been fully paid.', 'You cannot close an unpaid bill. Do you want to add a cash/card payment that matches the unpaid amount?', [
          {
            text: 'Yes, add value and close bill',
            onPress: async () => {
              try {
                await transactCashCard(restaurant_id, bill_id)
                closeWithErrors(bill_id)(ignoreCart)
              }
              catch (error) {
                console.log(error)
                RNAlert.alert('Error adding cash/card payment', 'Please go back and add a cash/card payment manually, then try again')
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
        RNAlert.alert('An unknown error occurred.', 'Please contact Torte support if the issue persists')
      }
    }
  }, [])

  const unpaidWithErrors = useCallback((bill_id) => async (ignoreCart = false, ignorePaid = false) => {
    try {
      await transactMarkUnpaid(restaurant_id, bill_id, ignoreCart, ignorePaid)
      navigation.goBack()
    }
    catch (error) {
      console.log('unpaid error: ', error)
      if (error.message) {
        RNAlert.alert(error.message ?? 'An error occurred.', 'Please contact Torte support if the issue persists')
      }
      else if (error.hasCountdown) {
        RNAlert.alert('Users are actively placing an order')
      }
      else if (error.arrayUntransferred) {
        RNAlert.alert('Table has untransferred orders', 'Do you want to mark all as transferred and then set the bill to unpaid?', [
          {
            text: 'Yes, mark as as transferred',
            onPress: async () => {
              try {
                error.arrayUntransferred.forEach(async order => {
                  await batchOrderTransferred(restaurant_id, bill_id, order.order_id, order.submission_id)
                })
                unpaidWithErrors(bill_id)()
              }
              catch (error) {
                RNAlert.alert('Error marking orders as transferred', 'Please mark as transferred through the Dashboard, then come back and try again')
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
        RNAlert.alert('Users have items in their cart(s)', 'Are you sure you want to mark as unpaid? They will be unable to order.', [
          {
            text: 'Yes, mark unpaid',
            onPress: () => {
              unpaidWithErrors(bill_id)(true)
            }
          },
          {
            text: 'No, cancel',
            style: 'cancel'
          }
        ])
      }
      else if (error.isPaid) {
        RNAlert.alert('Is this bill really unpaid?', 'Our data shows this bill as fully paid.', [
          {
            text: 'Yes, mark as unpaid',
            onPress: async () => {
              try {
                unpaidWithErrors(bill_id)(ignoreCart, true)
              }
              catch (error) {
                RNAlert.alert('Error marking as unpaid after overriding fully paid', 'Please contact Torte support if this issue persists.')
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
        RNAlert.alert('An unknown error occurred.', 'Please contact Torte support if the issue persists')
      }
    }
  }, [])

  const reopenWithErrors = useCallback((bill_id) => async (ignorePaid = false) => {
    try {
      await transactReopenBill(restaurant_id, bill_id, ignorePaid)
      navigation.goBack()
    }
    catch (error) {
      console.log('reopen error: ', error)
      if (error.message) {
        RNAlert.alert(error.message ?? 'An error occurred.', 'Please contact Torte support if the issue persists')
      }
      else if (error.isPaid) {
        RNAlert.alert('Are you sure you want to reopen this bill?', undefined, [
          {
            text: 'Yes, reopen bill',
            onPress: async () => {
              try {
                reopenWithErrors(bill_id)(true)
              }
              catch (error) {
                RNAlert.alert('Error reopening bill', 'Please contact Torte support if this issue persists.')
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
        RNAlert.alert('An unknown error occurred.', 'Please contact Torte support if the issue persists')
      }
    }
  }, [])

  const invalidAlert = (edit) => () => {
    if (payments.paid_in_full) {
      RNAlert.alert(
        'Bill already paid',
        edit ?
          'We cannot edit a bill after it has been paid. Ask the guests to create a new bill if you need to charge them further.'
          :
          'We cannot add items once a bill was paid. Ask the guests to create a new bill if you need to charge them further.'
      )
      return null
    }

    if (format_locked.user_all || format_locked.num_splits || format_locked.num_seats) {
      RNAlert.alert(
        `Cannot ${edit ? 'edit' : 'add'} items`,
        'Users have already started to pay in a way that prevents this. ' + (payments.paid_users.length ? 'Ask guests to create a new bill if you need to add more for them.' : 'Ask guests to undo their selections, or have them create a new bill if you need to add more for them.')
      )
      return null
    }

    if (Object.keys(groups).length && !untaken_items) {
      RNAlert.alert(
        `Cannot ${edit ? 'edit' : 'add'} items`,
        'All users have paid or are about to pay. Ask the guests to undo their selections or create a new bill if you need to charge them further')
      return null
    }
    return null
  }



  return (
    <View style={{ flex: 1 }}>
      <View style={{
        width: "100%",
        height: STATUS_BAR_HEIGHT,
        backgroundColor: Colors.background
      }}>
        <StatusBar
          style="light"
        />
      </View>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <Modal
          visible={!!Object.keys(alert).length}
          transparent={true}
        >
          <Alert
            {...alert}
            clearAlert={() => { setAlert({}) }}
          />

        </Modal>

        <Modal
          visible={showAddItem}
          transparent
        >
          <AddItems
            bill_id={bill_id}
            closeModal={() => { setShowAddItem(false) }}
            valid={validButtons.change}
            invalidAlert={invalidAlert()}
          />
        </Modal>

        <Modal
          visible={showCashPayments}
          transparent
        >
          <CashCardPayments
            bill_id={bill_id}
            closeModal={() => { setShowCashPayments(false) }}
          />
        </Modal>

        <Modal
          visible={showEditItem}
          transparent
        >
          <EditItems
            bill_id={bill_id}
            valid={validButtons.change}
            invalidAlert={invalidAlert(true)}
            closeModal={() => { setShowEditItem(false) }}
          />
        </Modal>


        <View style={styles.header}>
          <View style={{ flex: 1, }}>
            <TouchableOpacity onPress={() => {
              if (showCloseTable) {
                onPressCloseTable()
              }
              else {
                navigation.goBack()
              }
            }}>
              <MaterialIcons
                name='arrow-back'
                size={50}
                color={Colors.white}
              />
            </TouchableOpacity>
          </View>

          <View styles={styles.header}>
            <HeaderText center style={{ fontSize: 48 }}>Bill #{ref_code}</HeaderText>
            <HeaderText center style={{
              fontSize: 30,
              ...(validButtons.reopen || numWaitingSubmits) && {
                color: Colors.red,
                fontWeight: 'bold'
              }
            }}>Status: {table_message}</HeaderText>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end', flexShrink: 0 }}>
            <LargeText >{server_name}</LargeText>
            <MainText >{table_details?.name || 'no table'}</MainText>
          </View>
        </View>

        <View style={{ flexDirection: 'row', margin: 30 }}>
          <View style={styles.paymentView}>
            <Text style={styles.paymentLabel}>Subtotal</Text>
            <Text style={styles.paymentAmount}>{centsToDollar(summary.subtotal ?? 0)}</Text>
          </View>

          <View style={styles.paymentView}>
            <Text style={styles.paymentLabel}>Tax</Text>
            <Text style={styles.paymentAmount}>{centsToDollar(summary.tax ?? 0)}</Text>
          </View>

          {/* <View style={styles.paymentView}>
            <Text style={styles.paymentLabel}>Cash / Card</Text>
            <Text style={styles.paymentAmount}>{centsToDollar(0)}</Text>
          </View> */}
          {/* <View style={styles.paymentView}>
        <Text style={styles.paymentLabel}>Tip</Text>
        <Text style={styles.paymentAmount}>{centsToDollar((paid?.sum_tip ?? 0) + (paid?.table_tip ?? 0))}</Text>
      </View> */}
          <View style={styles.paymentView}>
            <Text style={[styles.paymentLabel, { color: amountUnpaid > 0 ? Colors.red : Colors.white, fontWeight: 'bold' }]}>Unpaid</Text>
            <Text style={[styles.paymentAmount, { color: amountUnpaid > 0 ? Colors.red : Colors.white, fontWeight: 'bold' }]}>{centsToDollar(amountUnpaid > 0 ? amountUnpaid : 0)}</Text>
          </View>

          <View style={styles.paymentView}>
            <Text style={styles.paymentLabel}>Tips</Text>
            <Text style={styles.paymentAmount}>{centsToDollar((paid?.sum_tip ?? 0) + (paid?.table_tip ?? 0))}</Text>
            {/* <MainText center>( {paid.subtotal ? (100 * ((paid?.sum_tip ?? 0) + (paid?.table_tip ?? 0))) / paid.subtotal + '%' : '0%'} )</MainText> */}
          </View>
        </View>


        <View style={{ flex: 1, flexDirection: 'row', }}>
          <View style={{ width: showCloseTable ? 0 : Layout.window.width, flexDirection: 'row', marginBottom: 30, overflow: 'hidden' }} >
            <View style={{ flex: 1, marginHorizontal: 50, backgroundColor: Colors.white }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, }}>
                </View>
                <Text style={[styles.ticketText, { marginVertical: 14 }]}>All orders</Text>
                <View style={{ flex: 1 }} />
              </View>
              <ScrollView contentContainerStyle={{}}>
                {
                  Object.keys(groups).sort((a, b) => groups[a].position - groups[b].position).map(group_id => {
                    let group = groups[group_id]
                    return <View key={group_id} style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', marginRight: 24 }}>
                        <Text style={[styles.ticketItemText, { width: 60, textAlign: 'center' }]}>{group.quantity}</Text>
                        <Text style={[styles.ticketItemText, { textTransform: 'uppercase', flex: 1 }]}>{group.name}</Text>
                        <Text style={[styles.ticketItemText,]}>{centsToDollar(group.total)}</Text>
                      </View>
                      <View style={{ marginLeft: 60 }}>
                        {
                          // Each filter gets it's own line
                          !!group.filters && Object.keys(group.filters).map(filter => <Text key={filter} style={[styles.ticketItemText, { fontWeight: 'bold', color: Colors.red }]}>{filterTitles[filter]}</Text>)
                        }
                        {
                          !!group.specifications && Object.keys(group.specifications).map(spec_id => <Text key={spec_id} style={styles.ticketItemText}>{capitalize(group.specifications[spec_id].name)}: {commaList(group.specifications[spec_id].options.map(option => (option.quantity > 1 ? option.quantity + 'X ' : '') + option.name))}</Text>)
                        }
                        {
                          !!group.modifications && Object.keys(group.modifications).map(mod_id => <Text key={mod_id} style={styles.ticketItemText}>{(group.modifications[mod_id].quantity > 1 ? group.modifications[mod_id].quantity + 'X ' : '') + group.modifications[mod_id].name}</Text>)
                        }
                        {
                          !!group.comment && <Text key={'comment'} style={styles.ticketItemText}>{group.comment}</Text>
                        }
                      </View>

                    </View>
                  })
                }
              </ScrollView>
              <View style={{ marginHorizontal: 24, borderTopColor: Colors.black, borderTopWidth: 3, padding: 12, alignItems: 'center' }}>
                <View style={{ width: '70%' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.summaryText}>Subtotal: </Text>
                    <Text style={styles.summaryText}>{centsToDollar(summary.subtotal ?? 0)}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.summaryText}>Tax: </Text>
                    <Text style={styles.summaryText}>{centsToDollar(summary.tax ?? 0)}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.summaryText}>Total: </Text>
                    <Text style={styles.summaryText}>{centsToDollar(summary.total ?? 0)}</Text>
                  </View>

                  {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.summaryText}>Tips: </Text>
              <Text style={styles.summaryText}>{centsToDollar(summary.sum_tip ?? 0 + summary.table_tip ?? 0)}</Text>
            </View> */}
                </View>
              </View>
            </View>

            <View style={{ marginRight: 50, justifyContent: 'space-evenly', minWidth: 256 }}>
              <View style={{}}>
                <TouchableOpacity onPress={() => {
                  onPressCloseTable()
                }}>
                  <View style={[styles.sideButtonView, { backgroundColor: Colors.darkgreen }]}>
                    <Text adjustsFontSizeToFit style={styles.sideButtonText}>CLOSE / MOVE</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {!timestamps.server_marked_closed && !timestamps.server_marked_unpaid &&
                <View style={{}}>
                  <TouchableOpacity onPress={() => {
                    if (validButtons.change) {
                      setShowAddItem(true)
                    }
                    else {
                      invalidAlert()()
                    }
                  }}>
                    <View style={[styles.sideButtonView, { backgroundColor: validButtons.change ? Colors.purple : Colors.darkgrey }]}>
                      <Text style={styles.sideButtonText}>ADD ITEMS</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => {
                    if (validButtons.change) {
                      setShowEditItem(true)
                    }
                    else {
                      invalidAlert(true)()
                    }
                  }}>
                    <View style={[styles.sideButtonView, { backgroundColor: validButtons.change ? Colors.purple : Colors.darkgrey }]}>
                      <Text style={styles.sideButtonText}>EDIT ITEMS</Text>
                    </View>
                  </TouchableOpacity>

                  {/* <TouchableOpacity onPress={() => {
              }}>
                <View style={[styles.sideButtonView, { backgroundColor: Colors.purple }]}>
                  <Text style={styles.sideButtonText}>DELETE ITEMS</Text>
                </View>
              </TouchableOpacity> */}
                </View>
              }

              <View>
                {!!auto_grat && !timestamps.server_marked_closed && !timestamps.server_marked_unpaid && !timestamps.auto_checkout &&
                  <TouchableOpacity onPress={() => {
                    if (auto_gratuity) {
                      RNAlert.alert(`Remove ${auto_grat}% gratuity?`, undefined, [
                        {
                          text: 'Yes',
                          onPress: () => { writeAutoGratuity(restaurant_id, bill_id, 0) }
                        },
                        {
                          text: 'No',
                          style: 'cancel'
                        }
                      ])
                    }
                    else {
                      writeAutoGratuity(restaurant_id, bill_id, auto_grat)
                    }
                  }}>
                    <View style={[styles.sideButtonView, { backgroundColor: auto_gratuity ? Colors.purple : Colors.midgrey }]}>
                      <Text style={styles.sideButtonText}>{auto_gratuity ? `${auto_grat}% ON` : 'AUTO GRAT'}</Text>
                    </View>
                  </TouchableOpacity>}
                {!timestamps.server_marked_closed && !timestamps.server_marked_unpaid && !timestamps.auto_checkout && <TouchableOpacity onPress={() => { setShowCashPayments(true) }}>
                  <View style={[styles.sideButtonView, { backgroundColor: Colors.midgrey }]}>
                    <Text style={styles.sideButtonText}>CASH / CREDIT</Text>
                  </View>
                </TouchableOpacity>}
                {/* <TouchableOpacity onPress={() => { }}>
                    <View style={[styles.sideButtonView, { backgroundColor: Colors.midgrey }]}>
                      <Text style={styles.sideButtonText}>COMP</Text>
                    </View>
                  </TouchableOpacity> */}
                {/* <TouchableOpacity onPress={() => { 
                    // Alert adding gratuity for party of _ or more
                    // NOTE: this must be posted to users at the bottom of the menu
                  }}>
                    <View style={[styles.sideButtonView, { backgroundColor: summary.table_tip ? Colors.darkgreen : Colors.midgrey }]}>
                      <Text style={styles.sideButtonText}>{true ? '##%' : 'ADD'} GRATUITY</Text>
                    </View>
                  </TouchableOpacity> */}
                <TouchableOpacity onPress={() => {
                  if (paid?.total) {
                    setInitiateRefund(true)
                  }
                  else {
                    RNAlert.alert('No payments capable of being refunded.')
                  }
                }}>
                  <View style={[styles.sideButtonView, { backgroundColor: Colors.midgrey }]}>
                    <Text style={styles.sideButtonText}>REFUND</Text>
                  </View>
                </TouchableOpacity>

                {false && <TouchableOpacity onPress={async () => {
                  try {
                    let printer = await Print.selectPrinterAsync()

                    Print.printAsync({
                      html: htmlTicket(bill),
                      printerUrl: printer.url
                    })
                  }
                  catch (error) {
                    console.log('print error: ', error)
                  }

                }}>
                  <View style={[styles.sideButtonView, { backgroundColor: Colors.midgrey }]}>
                    <Text style={styles.sideButtonText}>PRINT ORDER</Text>
                  </View>
                </TouchableOpacity>}
              </View>
            </View>
          </View>

          <View style={{ width: showCloseTable ? Layout.window.width : 0, flex: 1, padding: 20, }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 2, justifyContent: 'space-around', flexDirection: 'row', marginHorizontal: 20 }}>
                <View>
                  <Text style={styles.subLabel}>Discounts</Text>
                  <Text style={styles.subAmount}>{centsToDollar(paid?.discounts ?? 0)}</Text>
                </View>
                <View>
                  <Text style={styles.subLabel}>Refunds</Text>
                  <Text style={styles.subAmount}>{centsToDollar(paid?.refunds ?? 0)}</Text>
                </View>
              </View>
              <View style={{ flex: 3, justifyContent: 'space-evenly', flexDirection: 'row', marginRight: 30, paddingVertical: 14, borderColor: Colors.white, borderWidth: 2 }}>
                <View >
                  <Text style={styles.subLabel}>Overall</Text>
                  <Text style={styles.subAmount}>{feedback.overall_responses ? (feedback.overall / feedback.overall_responses).toFixed(2) : 'N/A'}</Text>
                </View>
                <View>
                  <Text style={styles.subLabel}>Food</Text>
                  <Text style={styles.subAmount}>{feedback.food_responses ? (feedback.food / feedback.food_responses).toFixed(2) : 'N/A'}</Text>
                </View>
                <View>
                  <Text style={styles.subLabel}>Service</Text>
                  <Text style={styles.subAmount}>{feedback.service_responses ? (feedback.service / feedback.service_responses).toFixed(2) : 'N/A'}</Text>
                </View>
              </View>


            </View>

            {showCloseTable && <><View style={{ flexGrow: 3, marginTop: 30, alignSelf: 'center', justifyContent: 'center' }}>
              <CheckList
                state={hasCountdown ? checklist_states.warn : Object.keys(orders).length ? checklist_states.caution : checklist_states.ok}
                ok_text='Table cart is empty'
                caution_text='Table has items in cart'
                warn_text='Table is about to place an order'
                bill_closed={validButtons.reopen}
              // failed_subtext={!pendingSubmission && 'This cart may have been abandoned'}
              />
              <CheckList
                state={numWaitingSubmits ? checklist_states.warn : checklist_states.ok}
                ok_text='All orders transferred'
                warn_text='Order(s) waiting to be transferred'
                bill_closed={validButtons.reopen}
              />
              <CheckList
                state={payments.paid_in_full || !summary.subtotal ? checklist_states.ok : checklist_states.warn}
                ok_text='Bill is fully paid'
                warn_text='Bill has not been fully paid'
                bill_closed={validButtons.reopen}
              />
            </View>

              <View style={{ flexGrow: 2, }}>
                <Text style={styles.headerText}>{
                  timestamps.auto_checkout ? 'Bill was closed out by Torte' :
                    timestamps.server_marked_closed ? 'Bill has been marked closed' :
                      timestamps.server_marked_unpaid ? 'Bill has been marked as unpaid' :
                        'Bill is still open'
                }</Text>
              </View>

              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 30, }}>

                  <TouchableOpacity disabled={validButtons.reopen || timestamps.auto_checkout} containerStyle={[styles.endButtonView, { borderWidth: 2, borderColor: validButtons.reopen || timestamps.auto_checkout ? Colors.darkgrey : Colors.white }]} onPress={() => {
                    setShowMoveTable(true)
                  }}>
                    <Text style={[styles.sideButtonText, { color: validButtons.reopen || timestamps.auto_checkout ? Colors.lightgrey : Colors.white }]}>MOVE TABLE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity disabled={timestamps.auto_checkout} containerStyle={[styles.endButtonView, { backgroundColor: timestamps.auto_checkout ? Colors.darkgrey : Colors.purple }]} onPress={() => {
                    if (validButtons.reopen) {
                      if (timestamps.created.toMillis() <= Date.now() - 86400000) {
                        RNAlert.alert('Cannot reopen', 'Bill is over 24 hours old')
                      }
                      else {
                        reopenWithErrors(bill_id)()
                      }
                    }
                    else {
                      setShowReassignServer(true)
                    }
                  }}>
                    <Text style={[styles.sideButtonText, { color: timestamps.auto_checkout ? Colors.lightgrey : Colors.white }]}>{validButtons.reopen ? 'REOPEN BILL' : server_id ? 'REASSIGN BILL' : 'ASSIGN BILL'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 50 }}>

                  <TouchableOpacity disabled={!validButtons.unpaid} containerStyle={[styles.endButtonView, { backgroundColor: validButtons.unpaid ? Colors.red : Colors.darkgrey }]} onPress={unpaidWithErrors(bill_id)}>
                    <Text style={[styles.sideButtonText, { color: validButtons.unpaid ? Colors.white : Colors.lightgrey }]}>MARK AS UNPAID</Text>
                  </TouchableOpacity>


                  <TouchableOpacity disabled={!validButtons.close} containerStyle={[styles.endButtonView, { backgroundColor: validButtons.close ? Colors.darkgreen : Colors.darkgrey }]} onPress={() => {
                    if (Object.keys(groups).length) {
                      closeWithErrors(bill_id)()
                    }
                    else {
                      RNAlert.alert('Delete bill?', 'This cannot be undone.', [
                        {
                          text: 'Yes',
                          onPress: () => closeWithErrors(bill_id)()
                        },
                        {
                          text: 'No',
                          style: 'cancel'
                        }
                      ])
                    }
                  }}>
                    <Text style={[styles.sideButtonText, { color: validButtons.close ? Colors.white : Colors.lightgrey }]}>{Object.keys(groups).length ? 'MARK AS CLOSED' : 'DELETE BILL'}</Text>
                  </TouchableOpacity>

                </View>
              </View></>}

          </View>
        </View>
      </View>

      {
        showMoveTable && <View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,0.9)`,
            justifyContent: 'center',
            padding: Layout.window.width * 0.1
          },
        ]}>
          <View style={{ backgroundColor: Colors.background, flex: 1, marginBottom: Layout.spacer.medium, }}>
            <View style={{ paddingVertical: 20 }}>
              <LargeText center>Move to table:</LargeText>
            </View>

            <View style={{ marginHorizontal: 20, flex: 1 }}>
              <FlatList
                data={table_order.filter(id => id !== bill.table_details.id)}
                keyExtractor={item => item}
                ListFooterComponent={() => <View style={{ height: 30 }} />}
                renderItem={({ item: table_id }) => {
                  return <TouchableOpacity onPress={() => setMoveTo(prev => {
                    if (prev === table_id) {
                      return ''
                    }
                    return table_id
                  })} style={{ backgroundColor: Colors.darkgrey, padding: 20, margin: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons
                      name='checkbox-marked-circle-outline'
                      color={moveTo === table_id ? Colors.green : Colors.darkgrey}
                      size={40}
                      style={{ marginRight: 20, }}
                    />
                    <LargeText style={{ flex: 1 }}>{tables[table_id].table_details.name}</LargeText>
                    <LargeText>{tables[table_id].server_details.name || '(no server)'}</LargeText>
                  </TouchableOpacity>
                }}
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <TouchableOpacity styles={styles.serverButton} onPress={() => {
              setMoveTo('')
              setShowMoveTable(false)
            }}>
              <LargeText style={{ color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
            </TouchableOpacity>
            <TouchableOpacity disabled={!moveTo} styles={styles.serverButton}
              onPress={() => {
                let table_name = tables[moveTo].table_details.name
                let new_server_name = tables[moveTo].server_details.name
                RNAlert.alert('Move to ' + tables[moveTo].table_details.name + '?', undefined, [
                  {
                    text: 'Yes',
                    onPress: () => {
                      let currentServer = bill.server_details.id
                      let moveToServer = tables[moveTo].server_details.id
                      if (!moveToServer) {
                        RNAlert.alert('No server on ' + table_name + '. Proceed?', `A bil cannot be abandoned, so this bill will still be assigned to ${currentServer === user ? 'you' : bill.server_details.name}. Once someone claims ${table_name}, you can reassign this bill.`, [
                          {
                            text: 'Yes, move to ' + table_name,
                            onPress: () => {
                              moveTable({ id: moveTo, name: table_name })
                            }
                          },
                          {
                            text: 'Cancel, do not move',
                            style: 'cancel',
                          }
                        ])
                      }
                      else if (moveToServer === currentServer) {
                        moveTable({ id: moveTo, name: table_name })
                      }
                      else {
                        const notManager = employees[user]?.roles.includes('manager')
                        RNAlert.alert(new_server_name + '\'s table', 'Do you want to transfer the bill over to ' + new_server_name + '?' + (notManager ? ' This requires their pin.' : ''), [
                          {
                            text: 'Yes, give to ' + new_server_name,
                            onPress: () => {
                              if (notManager) {
                                navigation.navigate('Pin', {
                                  employee_id: moveToServer,
                                  tableTransfer: {
                                    table_details: { id: moveTo, name: table_name },
                                    server_details: { id: moveToServer, name: new_server_name },
                                    screen: 'Ticket'
                                  }
                                })
                              }
                              else {
                                moveTable({ id: moveTo, name: table_name }, { id: moveToServer, name: new_server_name })
                              }

                            }
                          },
                          {
                            text: 'Move tables, do not swap server',
                            onPress: () => {
                              moveTable({ id: moveTo, name: table_name })
                            }
                          },
                          {
                            text: 'Cancel, do not move',
                            style: 'cancel',
                          }
                        ])
                      }
                    }
                  },
                  {
                    text: 'No, cancel',
                    style: 'cancel',
                  }
                ])
              }}
            >
              <LargeText style={{ color: moveTo ? Colors.green : Colors.lightgrey, fontWeight: 'bold' }}>CONFIRM</LargeText>
            </TouchableOpacity>
          </View>
        </View>
      }
      {
        showReassignServer && <View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,0.9)`,
            justifyContent: 'center',
            padding: Layout.window.width * 0.1
          },
        ]}>
          <View style={{ backgroundColor: Colors.background, flex: 1, marginBottom: Layout.spacer.medium, }}>
            <View style={{ paddingVertical: 20 }}>
              <LargeText center>Reassign to:</LargeText>
            </View>

            <View style={{ marginHorizontal: 20, flex: 1 }}>
              <FlatList
                data={Object.keys(employees).filter(id => id !== server_id)}
                keyExtractor={item => item}
                ListFooterComponent={() => server_id === user || employees[user].roles.includes('manager') ? <TouchableOpacity onPress={() => setReassignTo(prev => {
                  if (prev === 'none') {
                    return ''
                  }
                  return 'none'
                })} style={{ marginBottom: 20, backgroundColor: Colors.darkgrey, padding: 20, margin: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name='checkbox-marked-circle-outline'
                    color={reassignTo === 'none' ? Colors.green : Colors.darkgrey}
                    size={40}
                    style={{ marginRight: 20, }}
                  />
                  <LargeText style={{ flex: 1 }}>Remove {server_id === user ? 'self' : server_name}</LargeText>
                </TouchableOpacity> : <View style={{ marginBottom: 30 }} />
                }
                renderItem={({ item: employee_id }) => {
                  return <TouchableOpacity onPress={() => setReassignTo(prev => {
                    if (prev === employee_id) {
                      return ''
                    }
                    return employee_id
                  })} style={{ backgroundColor: Colors.darkgrey, padding: 20, margin: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons
                      name='checkbox-marked-circle-outline'
                      color={reassignTo === employee_id ? Colors.green : Colors.darkgrey}
                      size={40}
                      style={{ marginRight: 20, }}
                    />
                    <LargeText style={{ flex: 1 }}>{employees[employee_id].name}</LargeText>
                  </TouchableOpacity>
                }}
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <TouchableOpacity styles={styles.serverButton} onPress={() => {
              setReassignTo('')
              setShowReassignServer(false)
            }}>
              <LargeText style={{ color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
            </TouchableOpacity>
            <TouchableOpacity disabled={!reassignTo} styles={styles.serverButton}
              onPress={() => {
                if (reassignTo === 'none') {
                  RNAlert.alert('Remove ' + (server_id === user ? 'self' : server_name) + ' from bill?', undefined, [
                    {
                      text: 'Yes',
                      onPress: () => {
                        navigation.setParams({
                          tableTransfer: {
                            server_details: { id: '', name: '' },
                          }
                        })
                      }
                    },
                    {
                      text: 'No, cancel',
                      style: 'cancel',
                    }
                  ])
                }
                else {
                  RNAlert.alert('Reassign to ' + employees[reassignTo].name + '?', employees[user].roles.includes('manager') ? undefined : 'This requires their PIN.', [
                    {
                      text: 'Yes',
                      onPress: () => {
                        if (employees[user].roles.includes('manager')) {
                          navigation.setParams({
                            tableTransfer: {
                              server_details: { id: reassignTo, name: employees[reassignTo].name },
                            }
                          })
                        }
                        else {
                          navigation.navigate('Pin', {
                            employee_id: reassignTo,
                            tableTransfer: {
                              server_details: { id: reassignTo, name: employees[reassignTo].name },
                              screen: 'Ticket'
                            }
                          })
                        }
                      }
                    },
                    {
                      text: 'No, cancel',
                      style: 'cancel',
                    }
                  ])
                }
              }}
            >
              <LargeText style={{ color: reassignTo ? Colors.green : Colors.lightgrey, fontWeight: 'bold' }}>CONFIRM</LargeText>
            </TouchableOpacity>
          </View>
        </View>
      }

      {
        initiateRefund && <View style={StyleSheet.absoluteFill}>
          <RefundSelector
            bill_id={bill_id}
            cancelRefund={() => {
              setInitiateRefund(false)
              navigation.setParams({ refund_approved: false })
            }}
            navigation={navigation}
            refund_approved={refund_approved}
          />
        </View>
      }


      { !!isMoving && <RenderOverlay text={isMoving === 'table' ? 'Moving table' : 'Reassigning bill'} opacity={0.92} />}
    </View >
  );
}


const CheckList = ({ state, ok_text, caution_text, warn_text, bill_closed }) => {
  let name, color, text = ''

  switch (state) {
    case checklist_states.ok:
      name = 'checkbox-marked-circle-outline'
      color = Colors.green
      text = ok_text
      break;
    case checklist_states.caution:
      name = 'alert-circle-outline'
      color = Colors.yellow
      text = caution_text
      break;
    case checklist_states.warn:
      name = 'close-circle-outline'
      color = Colors.red
      text = warn_text
      break;
  }

  return <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, opacity: bill_closed ? 0.5 : 1 }}>
    <MaterialCommunityIcons
      name={name}
      size={50}
      color={color}
    />
    <Text style={{ color: Colors.white, fontSize: 38, marginLeft: 20 }}>{text}</Text>
  </View>
}


const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    margin: 16,
  },
  headerText: {
    color: Colors.white,
    fontSize: 48,
    textAlign: 'center'
  },
  paymentView: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 28,
    color: Colors.white,
    textAlign: 'center'
  },
  paymentAmount: {
    fontSize: 44,
    color: Colors.white,
    textAlign: 'center'
  },
  subLabel: {
    fontSize: 22,
    color: Colors.white,
    textAlign: 'center'
  },
  subAmount: {
    fontSize: 38,
    color: Colors.white,
    textAlign: 'center'
  },
  mainText: {
    color: Colors.white,
    fontSize: 34
  },
  buttonView: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    marginVertical: 12,
  },
  buttonText: {
    fontSize: 30,
    color: Colors.white,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  sideButtonView: {
    paddingVertical: 17,
    paddingHorizontal: 30,
    marginBottom: 20
  },
  sideButtonText: {
    fontSize: 26,
    color: Colors.white,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  ticketText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  ticketItemText: {
    fontSize: 24
  },
  summaryText: {
    fontSize: 30
  },
  endButtonView: {
    paddingVertical: 24,
    justifyContent: 'center',
    flex: 1,
    maxWidth: '34%',
  },
});

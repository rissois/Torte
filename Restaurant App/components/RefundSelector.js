import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { useSelector } from 'react-redux';
import { MainText, LargeText, HeaderText } from '../components/PortalText'
import { MaterialIcons, } from '@expo/vector-icons';
import capitalize from '../functions/capitalize';
import commaList from '../functions/commaList';
import {
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';
import centsToDollar from '../functions/centsToDollar';
import firebase from '../config/Firebase';
import MenuButton from './MenuButton';
import Cursor from '../components/Cursor';
import { dateToClock } from '../functions/dateAndTime';
import transactRefund from '../transactions/transactRefund';
import RenderOverlay from './RenderOverlay';
import useRestaurant from '../hooks/useRestaurant';

export default function RefundSelector(props) {
  const restaurant_id = useRestaurant()
  const { bill_id, cancelRefund, navigation, refund_approved } = props
  const { user_summaries, user_statuses, refunds = {} } = useSelector(state => state.bills[bill_id] ?? {})
  const employees = useSelector(state => state.employees)
  const user = useSelector(state => state.user)
  const [selectedRefundUser, setSelectedRefundUser] = useState('')
  const [userGroups, setUserGroups] = useState({})
  const [userPaid, setUserPaid] = useState({})
  const [refundable, setRefundable] = useState(0)
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState(0)
  const [amountFocused, setAmountFocused] = useState(false)
  const amountRef = useRef(null)

  const [instructionsHeight, setInstructionsHeight] = useState(null)

  const [initiatingRefund, setInitiatingRefund] = useState(false)

  // { id: status, amount, reason , user_id, completed}

  useEffect(() => {
    if (refund_approved) {
      Alert.alert(`Refund ${centsToDollar(amount)}?`, 'This is not reversible. The user will not be able to redo payment through the app', [
        {
          text: 'Yes, refund',
          onPress: () => { initiateRefund() }
        },
        {
          text: 'No, cancel',
          style: 'cancel',
          onPress: () => navigation.setParams({ refund_approved: false })
        }
      ])
    }
  }, [refund_approved])

  const initiateRefund = async (ignoreRepeat) => {
    setInitiatingRefund(true)
    try {
      await transactRefund(restaurant_id, bill_id, selectedRefundUser, amount, reason, user, ignoreRepeat)
      setAmount(0)
      setReason('')
      setSelectedRefundUser('')
      cancelRefund()
      setInitiatingRefund(false)
      Alert.alert('Refund request has been received', 'Please check back later to make sure the refund succeeded. Please note: it may take 5-10 business days for the refund to appear on the customer\'s bank statement.')
    }
    catch (error) {
      console.log('Refund error: ', error)
      setInitiatingRefund(false)
      if (error.repeat) {
        Alert.alert('Already requested ' + centsToDollar(amount) + ' refund', 'Are you sure you want to create a new request?', [
          {
            text: 'Yes, repeat refund',
            onPress: () => { initiateRefund(true) }
          },
          {
            text: 'No, cancel',
            style: 'cancel'
          }
        ])
      }
      else {
        Alert.alert(error.message ?? 'Error creating request', 'Please try again and contact Torte support if the error persists.')
      }
    }
    finally {
      navigation.setParams({ refund_approved: false })
    }
  }

  useEffect(() => {
    if (selectedRefundUser) {
      setUserPaid(user_summaries[selectedRefundUser].paid)
      setRefundable(user_summaries[selectedRefundUser].paid.final - (user_summaries[selectedRefundUser].paid.discounts ?? 0) - (user_summaries[selectedRefundUser].paid.refunds ?? 0))
    }
    else {
      setReason('')
      setAmount(0)
    }
  }, [user_summaries, selectedRefundUser])


  if (selectedRefundUser) {
    return <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} style={{ flex: 1 }} containerStyle={{ flex: 1, backgroundColor: Colors.black + 'EF' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{
        flexShrink: 1,
        marginHorizontal: Layout.window.width * 0.1,
        marginVertical: Layout.window.width * 0.1,
        backgroundColor: Colors.darkgrey,
      }}>
        <View style={{ flexDirection: 'row', padding: 16 }}>
          <View>
            <TouchableOpacity onPress={() => {
              setSelectedRefundUser('')
            }}>
              <MaterialIcons
                name='arrow-back'
                size={34}
                color={Colors.white}
              />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <LargeText center style={{ textDecorationLine: 'underline' }}>Refund Account #{user_statuses[selectedRefundUser].acct_no}</LargeText>
          </View>

          <View style={{ opacity: 0 }}>
            <MaterialIcons
              name='arrow-back'
              size={34}
              color={Colors.white}
            />
          </View>
        </View>
        <View style={{ flexShrink: 1 }}>
          <FlatList
            style={{ flexGrow: 0 }}
            data={Object.keys(refunds).filter(r_id => refunds[r_id].user_id === selectedRefundUser).sort((a, b) => {
              return (refunds[a]?.initiated?.toMillis() ?? Date.now()) - (refunds[b]?.initiated?.toMillis() ?? Date.now())
            })}
            keyExtractor={item => item}
            renderItem={({ item: refund_id }) => {
              return <MainText center style={{ color: refunds[refund_id].status === 'failed' ? Colors.red : Colors.softwhite }}>{centsToDollar(refunds[refund_id].amount)} at {dateToClock(refunds[refund_id]?.initiated?.toDate() ?? new Date())} ({refunds[refund_id].status.toUpperCase()})</MainText>
            }}
            ListEmptyComponent={() => <MainText center>(No prior refund attempts)</MainText>}
          />
        </View>
        <View style={{ paddingBottom: 20, flexShrink: 1, }}>
          {
            typeof userGroups[selectedRefundUser] === 'object' ?
              <ScrollView style={{ marginVertical: 20, marginHorizontal: 60 }}>
                {
                  Object.keys(userGroups[selectedRefundUser] ?? {}).map(group_id => {
                    let group = userGroups[selectedRefundUser][group_id]
                    return <View key={group_id} style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row' }}>
                        <View style={{ width: 40, flexDirection: 'row' }}>
                          <MainText>{group.num}</MainText>
                          {
                            group.denom > 1 && <MainText>/{group.denom}</MainText> // User denom
                          }
                        </View>
                        <MainText style={{ textTransform: 'uppercase', flex: 1 }}>{group.name}</MainText>
                        <MainText>{centsToDollar(group.total)}</MainText>
                      </View>
                      <View style={{ marginLeft: 40 }}>
                        {
                          // Each filter gets it's own line
                          !!group.filters && Object.keys(group.filters).map(filter => <MainText key={filter} style={styles.ticketItemText}>{filterTitles[filter]}</MainText>)
                        }
                        {
                          !!group.specifications && Object.keys(group.specifications).map(spec_id => <MainText key={spec_id} style={styles.ticketItemText}>{capitalize(group.specifications[spec_id].name)}: {commaList(group.specifications[spec_id].options.map(option => (option.quantity > 1 ? option.quantity + 'X ' : '') + option.name))}</MainText>)
                        }
                        {
                          !!group.modifications && Object.keys(group.modifications).map(mod_id => <MainText key={mod_id} style={styles.ticketItemText}>{(group.modifications[mod_id].quantity > 1 ? group.modifications[mod_id].quantity + 'X ' : '') + group.modifications[mod_id].name}</MainText>)
                        }
                        {
                          !!group.comment && <MainText key={'comment'} style={styles.ticketItemText}>{group.comment}</MainText>
                        }
                      </View>
                    </View>
                  })
                }
              </ScrollView> :
              userGroups[selectedRefundUser] === 'fetching' ?
                <View style={{ marginVertical: 20 }}>
                  <MainText center>Fetching line items</MainText>
                  <ActivityIndicator size='small' color={Colors.softwhite} />
                </View> :
                <View style={{ marginVertical: 20 }}>
                  {userGroups[selectedRefundUser] === 'failed' && <MainText center>Failed getting line items</MainText>}
                  <MenuButton text='User line items' color={Colors.darkgreen} buttonFn={() => {
                    setUserGroups(prev => ({ ...prev, [selectedRefundUser]: 'fetching' }))
                    firebase.firestore()
                      .collection('restaurants').doc(restaurant_id)
                      .collection('bills').doc(bill_id)
                      .collection('billUsers').doc(selectedRefundUser)
                      .get().then(doc => {
                        setUserGroups(prev => ({ ...prev, [selectedRefundUser]: doc.data().groups }))
                      })
                      .catch(error => {
                        console.log(error)
                        setUserGroups(prev => ({ ...prev, [selectedRefundUser]: 'failed' }))
                      })
                  }} />
                </View>
          }

          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <View style={{}}>
              <MainText>Subtotal {centsToDollar(userPaid.subtotal)}</MainText>
              <MainText>Tax {centsToDollar(userPaid.tax)}</MainText>
              <MainText>Total {centsToDollar(userPaid.total)}</MainText>
            </View>
            <View style={{}}>
              <MainText>Tips {centsToDollar(userPaid.tip + userPaid.table_tip)}</MainText>
              <MainText>{userPaid.discounts ? `Refunds ${centsToDollar(userPaid.discounts)}` : 'No discounts'}</MainText>
              <MainText>{userPaid.refunds ? `Refunds ${centsToDollar(userPaid.refunds)}` : 'No refunds'}</MainText>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, paddingVertical: 14, marginVertical: 40, alignSelf: 'center', borderColor: Colors.softwhite, borderWidth: 2 }}>
            <HeaderText >MAX REFUNDABLE: {centsToDollar(refundable)}</HeaderText>
          </View>

          <View style={{ paddingHorizontal: 30 }}>

            <View style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' }}>
              <LargeText>Refund amount: </LargeText>
              <TouchableWithoutFeedback onPress={() => {
                amountRef?.current?.focus()
              }}>
                <View style={{ marginHorizontal: Layout.spacer.small, flexDirection: 'row' }}>
                  <HeaderText style={{ fontSize: 40 }}>{centsToDollar(amount)}</HeaderText>

                  <Cursor cursorOn={amountFocused} />
                </View>
              </TouchableWithoutFeedback>

              <TextInput
                style={{ height: 0, width: 0, color: Colors.backgroundColor }}
                enablesReturnKeyAutomatically
                selectTextOnFocus
                keyboardType='number-pad'
                onChangeText={text => {
                  if (!text) {
                    setAmount(0)
                  }
                  else {
                    let asNum = parseInt(text)
                    if (asNum) {
                      setAmount(asNum)
                    }
                  }
                }}
                ref={amountRef}
                value={amount.toString()}
                onFocus={() => {
                  setAmountFocused(true)
                }}
                onBlur={() => {
                  setAmountFocused(false)
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' }}>
              <LargeText>Reason: </LargeText>
              <TextInput
                style={{
                  flex: 1,
                  borderBottomColor: Colors.softwhite,
                  borderBottomWidth: 2,
                  paddingBottom: 3,
                  fontSize: 30,
                  color: Colors.softwhite,
                }}
                autoCapitalize='sentences'
                autoCorrect
                blurOnSubmit
                // editable={commentsAllowed}
                enablesReturnKeyAutomatically
                onChangeText={text => setReason(text)}
                onSubmitEditing={() => Keyboard.dismiss()}
                placeholder='(optional)'
                placeholderTextColor={Colors.lightgrey}
                value={reason}
                multiline
              />
            </View>
          </View>

          <MenuButton disabled={!amount || amount < 0}
            color={!amount || amount > refundable || amount < 0 ? Colors.red : Colors.purple}
            text={!amount ? 'Missing amount' : amount > refundable ? 'Amount too large' : amount < 0 ? 'Cannot be negative' : `Refund ${centsToDollar(amount)}`}
            buttonFn={() => {
              Keyboard.dismiss()
              if (amount > refundable) {
                Alert.alert('Amount is too large', 'Max refund available is ' + centsToDollar(refundable), [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: "Set to " + centsToDollar(refundable),
                    onPress: () => setAmount(refundable)
                  }
                ])
              }
              else if (employees[user].roles.includes('manager')) {
                navigation.setParams({ refund_approved: true })
              }
              else {
                navigation.navigate('Pin', { managerApproval: { screen: 'Ticket', success_param: { refund_approved: true } } })
              }
            }}
          />
        </View>
      </KeyboardAvoidingView>
      {initiatingRefund && <RenderOverlay text='Initiating refund...' opacity={0.94} />}
    </TouchableWithoutFeedback >
  }

  return <View style={{ flex: 1, backgroundColor: Colors.black + 'EF' }}>
    <View style={{
      marginHorizontal: Layout.window.width * 0.1,
      marginVertical: Layout.window.width * 0.1,
      backgroundColor: Colors.darkgrey,
    }}
    >
      <View onLayout={({ nativeEvent }) => setInstructionsHeight(nativeEvent.layout.height)}>
        <View style={{ flexDirection: 'row', padding: 16 }}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => {
              setSelectedRefundUser('')
              cancelRefund()
            }}>
              <MaterialIcons
                name='close'
                size={34}
                color={Colors.white}
              />
            </TouchableOpacity>
          </View>
          <LargeText center>Select a payment to refund</LargeText>
          <View style={{ flex: 1 }}></View>
        </View>
        <View style={{ marginHorizontal: Layout.window.width * 0.1 }}>
          <MainText style={{ marginBottom: 12 }} center>If there are multiple payments, ask the table which account number to refund</MainText>
          <MainText style={{ marginBottom: 12 }} center>Account numbers can be found in their app's Settings menu</MainText>
        </View>
      </View>

      <ScrollView style={{ maxHeight: Layout.window.height - (Layout.window.width * 0.2) - instructionsHeight }} >
        {
          Object.keys(user_summaries).filter(user_id => user_summaries[user_id].paid?.total).map(user_id => {
            const { total, tip = 0, table_tip = 0, discounts = 0, refunds = 0 } = user_summaries[user_id].paid
            return <TouchableOpacity key={user_id} onPress={() => {
              setSelectedRefundUser(prev => {
                if (prev === user_id) {
                  return ''
                }
                return user_id
              })
            }}>
              <View style={{
                flexDirection: 'row',
                borderTopColor: Colors.softwhite,
                borderTopWidth: 1,
                paddingVertical: 12
              }}>
                <View style={{ flex: 8, justifyContent: 'center' }}>
                  <LargeText center>Account #{user_statuses[user_id].acct_no}</LargeText>
                </View>
                <View style={{ flex: 5 }}>
                  <MainText style={{ flex: 1 }}>Total: {centsToDollar(total)}</MainText>
                  <MainText style={{ flex: 1 }}>Tips: {centsToDollar(tip + table_tip)}</MainText>
                  {!!discounts && <MainText style={{ flex: 1 }}>Discounts: {centsToDollar(discounts)}</MainText>}
                  {!!refunds && <MainText style={{ flex: 1 }}>Refunds: {centsToDollar(refunds)}</MainText>}
                  <MainText style={{ flex: 1 }}>Refundable: {centsToDollar(total + tip + table_tip - discounts - refunds)}</MainText>
                </View>
              </View>
            </TouchableOpacity>
          })
        }
      </ScrollView>
    </View>
  </View>
}

const styles = StyleSheet.create({

});
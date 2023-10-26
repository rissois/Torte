import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView
} from 'react-native';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { useSelector, useDispatch } from 'react-redux';
import { ClarifyingText, HeaderText, LargeText, MainText } from './PortalText';
import { MaterialIcons, } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import centsToDollar from '../functions/centsToDollar';
import Cursor from './Cursor';
import MenuButton from './MenuButton';
import transactCashCard from '../transactions/transactCashCard';
import useRestaurant from '../hooks/useRestaurant';

export default function CashCardPayments({ closeModal, bill_id }) {
  let { bills = {} } = useSelector(state => state)
  const restaurant_id = useRestaurant()
  let { [bill_id]: bill = {} } = bills
  let { cash_or_card = [] } = bill

  const [payments, setPayments] = useState([])
  const [isAlteredPayment, setIsAlteredPayment] = useState(false)
  const [nameWidth, setNameWidth] = useState(null)


  useEffect(() => {
    setPayments([...cash_or_card])
  }, [])
  // useEffect(() => {
  //   console.log('oops')
  //   setPayments(cash_or_card)
  // }, [cash_or_card])

  useEffect(() => {
    setIsAlteredPayment(payments.length !== cash_or_card.length || payments.some((payment, index) => {
      return payment.name !== cash_or_card[index].name || payment.amount !== cash_or_card[index].amount
    }))
  }, [cash_or_card, payments])

  const [add, setAdd] = useState({
    name: '',
    amount: 0,
    // tip: 0
  })


  return <View style={{ flex: 1, backgroundColor: Colors.background }}>
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', margin: 20, alignItems: 'center', }}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => {
            if (!isAlteredPayment) {
              closeModal()
            }
            else {
              Alert.alert('Exit without saving?', undefined, [{
                text: 'Yes',
                onPress: () => {
                  closeModal()
                }
              },
              {
                text: 'No, cancel',
                style: 'cancel',
              },])
            }
          }}>
            <MaterialIcons
              name='arrow-back'
              color={Colors.softwhite}
              size={50}
            />
          </TouchableOpacity>
        </View>
        <HeaderText>Cash or card payments</HeaderText>
        <View style={{ flex: 1 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <ScrollView>
          <LargeText center style={{ color: Colors.red, fontWeight: 'bold' }}>DO NOT INCLUDE TIP.</LargeText>
          {!!nameWidth && <View style={{ flexDirection: 'row', marginHorizontal: 40, alignItems: 'flex-end' }}>
            <MainText style={{ width: nameWidth ?? 0, marginRight: 14 }}>Name (e.g. Discover card, cash 1)</MainText>
            <View>
              <MainText>Amount</MainText>
            </View>
            {/* <MainText>Tip (optional)</MainText> */}
          </View>}
          <Cash {...add} setAdd={setAdd} setNameWidth={setNameWidth} setPayments={setPayments} index={payments.length + 1} />

          {!!add.amount && <View style={{ marginTop: 25 }}>
            <MainText center style={{ color: Colors.green, fontWeight: 'bold' }}>Press the green + to add this payment</MainText>
            <MainText center style={{ color: Colors.green, fontWeight: 'bold' }}>Then press the save button below to save</MainText>
          </View>}

          {
            !!payments.length && <View style={{ marginTop: 25, paddingTop: 20, borderTopColor: Colors.lightgrey, borderTopWidth: 1 }}>
              <LargeText center style={{ marginBottom: 30 }}>Previous cash or card payments</LargeText>
              {payments.map((payment, index) => <Cash key={payment.name + index} {...payment} setPayments={setPayments} index={index} />)}
            </View>
          }
        </ScrollView>

        <View style={{ marginBottom: Layout.spacer.small, marginTop: Layout.spacer.medium, flexDirection: 'row', justifyContent: 'space-evenly' }}>
          <MenuButton text={!isAlteredPayment ? 'No changes' : 'Reset'}
            disabled={!isAlteredPayment}
            color={!isAlteredPayment ? Colors.darkgrey : Colors.red}
            buttonFn={() => {
              setPayments([...cash_or_card])
            }} />
          <MenuButton text={isAlteredPayment ? 'Save changes' : 'No changes'}
            buttonFn={async () => {
              try {
                await transactCashCard(restaurant_id, bill_id, payments)
              }
              catch (error) {
                console.log(error)
                if (error === 'auto') {
                  Alert.alert('Bill already checked out', 'We\'ve already automatically checked out the bill. No further changes can be made')
                }
                else if (error === 'closed') {
                  Alert.alert('Bill closed', 'Please reopen the bill to make cash or card payments')
                }
                else {
                  Alert.alert('Error saving payments', 'Please try again or contact Torte support if the error persists')
                }
              }
            }}
            disabled={!isAlteredPayment} color={!isAlteredPayment ? Colors.darkgrey : Colors.purple} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
}

const Cash = ({ name, amount, setPayments, index, setAdd, setNameWidth }) => {
  let isNewPayment = !!setAdd

  const [amountFocused, setAmountFocused] = useState(false)
  const amountRef = useRef(null)
  // const [tipFocused, setTipFocused] = useState(false)
  // const tipRef = useRef(null)

  return <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, alignSelf: 'center', marginHorizontal: 40 }}>
    <TextInput
      style={[styles.input, {
        flex: 1,
        marginRight: 14,
        color: Colors.softwhite,
        fontSize: 24,
        paddingHorizontal: 16,
      }]}
      autoCapitalize='sentences'
      autoCorrect
      autoFocus
      blurOnSubmit
      enablesReturnKeyAutomatically
      selectTextOnFocus
      onChangeText={text => {
        if (isNewPayment) {
          setAdd(prev => ({ ...prev, name: text }))
        }
        else {
          setPayments(prev => {
            let hold = [...prev]
            hold[index] = { ...hold[index], name: text }
            return hold
          })
        }
      }}
      onSubmitEditing={() => amountRef.current.focus()}
      placeholder='Name'
      placeholderTextColor={Colors.lightgrey}
      value={name || undefined}
      defaultValue={'Cash / card ' + index}
      onLayout={({ nativeEvent }) => {
        if (isNewPayment) {
          setNameWidth(nativeEvent.layout.width)
        }
      }}
    />

    <TouchableWithoutFeedback onPress={() => {
      amountRef?.current?.focus()
    }}>
      <View style={[styles.input, { width: Layout.window.width * 0.15, flexDirection: 'row', justifyContent: 'center', marginRight: 14, }]}>
        <MainText>{centsToDollar(amount)}</MainText>
        <Cursor cursorOn={amountFocused} />
      </View>
    </TouchableWithoutFeedback>

    <TextInput
      style={{ height: 0, width: 0, color: Colors.backgroundColor }}
      enablesReturnKeyAutomatically
      keyboardType='number-pad'
      blurOnSubmit
      enablesReturnKeyAutomatically
      onSubmitEditing={() => Keyboard.dismiss()}
      onChangeText={text => {
        if (!text) {
          text = '0'
        }

        let num = Number(text)

        if (Number.isInteger(num)) {
          if (isNewPayment) {
            setAdd(prev => ({ ...prev, amount: num }))
          }
          else {
            setPayments(prev => {
              let hold = [...prev]
              hold[index] = { ...hold[index], amount: num }
              return hold
            })
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

    {/* <TouchableWithoutFeedback onPress={() => {
      tipRef?.current?.focus()
    }}>
      <View style={[styles.input, { width: Layout.window.width * 0.15, flexDirection: 'row', justifyContent: 'center', marginRight: 14, }]}
        onLayout={({ nativeEvent }) => {
          if (isNewPayment) {
            setNameWidth((prev = {}) => ({ ...prev, tip: nativeEvent.layout.width }))
          }
        }}
      >
        <MainText>{centsToDollar(tip)}</MainText>
        <Cursor cursorOn={tipFocused} />
      </View>
    </TouchableWithoutFeedback>

    <TextInput
      style={{ height: 0, width: 0, color: Colors.backgroundColor }}
      enablesReturnKeyAutomatically
      keyboardType='number-pad'
      blurOnSubmit
      enablesReturnKeyAutomatically
      onSubmitEditing={() => Keyboard.dismiss()}
      onChangeText={text => {
        if (!text) {
          text = '0'
        }

        let num = Number(text)

        if (Number.isInteger(num)) {
          if (isNewPayment) {
            setAdd(prev => ({ ...prev, tip: num }))
          }
          else {
            setPayments(prev => {
              let hold = [...prev]
              hold[index] = { ...hold[index], tip: num }
              return hold
            })
          }
        }


      }}
      ref={tipRef}
      value={tip.toString()}
      onFocus={() => {
        setTipFocused(true)
      }}
      onBlur={() => {
        setTipFocused(false)
      }}
    /> */}

    <TouchableOpacity style={{ marginRight: 14 }} onPress={() => {
      if (isNewPayment) {
        if (!amount) {
          Alert.alert('Missing amount')
        }
        else {
          // Add new payments
          setPayments(prev => [...prev, { amount, name: name || 'Cash / card ' + index }])
          setAdd({ amount: 0, name: '', })
        }
      }
      else {
        Alert.alert('Delete payment?', undefined, [{
          text: 'Yes',
          onPress: () => {
            setPayments(prev => {
              let next = [...prev]
              next.splice(index, 1)
              return next
            })
          }
        },
        {
          text: 'No, cancel',
          style: 'cancel',
        },])
      }
    }}>
      {
        isNewPayment ?
          <MaterialIcons name='add-circle' size={50} color={Colors.green} /> :
          <MaterialIcons name='remove-circle' size={50} color={Colors.red} />
      }
    </TouchableOpacity>
  </View>
}



const styles = StyleSheet.create({
  input: {
    borderRadius: 16,
    paddingVertical: 10,
    backgroundColor: Colors.darkgrey,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.30,
    shadowRadius: 5.30,

    elevation: 7,
  }
});


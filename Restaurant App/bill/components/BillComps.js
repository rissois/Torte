import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { DefaultText, ExtraLargeText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import { FlatList } from 'react-native-gesture-handler';
import centsToDollar from '../../utils/functions/centsToDollar';
import { useDispatch, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import StyledButton from '../../utils/components/StyledButton';
import { PortalTextField } from '../../portal/components/PortalFields';
import { useBillItem, useCompableBillItemIDs } from '../../utils/hooks/useBillItem';
import { EditLineItemBox } from './EditLineItemBox';
import plurarize from '../../utils/functions/plurarize';
import { transactComp } from '../firestore/transactComp';
import useBillNestedFields from '../../hooks/useBillNestedFields';
import { transactCompRemainder } from '../firestore/transactCompRemainder';
import firebase from 'firebase';

const QUICK_COMPS = [10, 25, 50, 100]

export default function BillComps({ bill_id, setShowComps, animateCloseBill }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const [subtotal, setSubtotal] = useState(0)
  const [percent, setPercent] = useState(10)
  const [compChanges, setCompChanges] = useState({})
  const sortedBillItems = useCompableBillItemIDs(bill_id)
  const orderSubtotal = useBillNestedFields(bill_id, 'order_summary', 'subtotal')
  const orderTax = useBillNestedFields(bill_id, 'order_summary', 'tax')
  const paidSubtotal = useBillNestedFields(bill_id, 'paid_summary', 'subtotal')
  const paidTax = useBillNestedFields(bill_id, 'paid_summary', 'tax')

  const setSubtotalOnly = useCallback(num => {
    setSubtotal(num)
    setPercent(0)
  }, [])
  const setPercentOnly = useCallback(num => {
    setSubtotal(0)
    setPercent(num)
  }, [])

  const save = async () => {
    try {
      const failedToComp = await transactComp(restaurantRef, bill_id, compChanges)
      if (failedToComp) dispatch(doAlertAdd(`Failed to comp ${plurarize(failedToComp, 'item', 'items')}`, 'Please try again and let Torte know if the issue persists'))
      setShowComps(false)
    }
    catch (error) {
      console.log('BillComps save error: ', error)
      dispatch(doAlertAdd('Failed to comp', 'Please try again and let Torte know if the issue persists'))
    }
  }

  const compRemainder = useCallback(() => {
    const deltaSubtotal = orderSubtotal - paidSubtotal
    const deltaTax = orderTax - paidTax
    dispatch(doAlertAdd('Comp remainder of bill?', [`Subtotal: ${centsToDollar(deltaSubtotal)}`, `Tax: ${centsToDollar(deltaTax)}`], [
      {
        text: 'Yes, comp remainder and close bill',
        onPress: async () => {
          try {
            const isWithUsers = await transactCompRemainder(restaurantRef, bill_id, deltaSubtotal, deltaTax, true)
            console.log('IWU: ', isWithUsers)
            if (isWithUsers) firebase.functions().httpsCallable('close-deleteOpenBillAlerts')({ bill_id })
            setShowComps(false)
            animateCloseBill()
          }
          catch (error) {
            console.log('BillComps compRemainder error: ', error)
            dispatch(doAlertAdd('Failed to comp bill', 'Please try again and let Torte know if the issue persists'))
          }
        }
      },
      {
        text: 'Yes, comp remainder',
        onPress: async () => {
          try {
            console.log('BillComps')
            await transactCompRemainder(restaurantRef, bill_id, deltaSubtotal, deltaTax,)
            setShowComps(false)
          }
          catch (error) {
            console.log('BillComps compRemainder error: ', error)
            dispatch(doAlertAdd('Failed to comp bill', 'Please try again and let Torte know if the issue persists'))
          }
        }
      },
      {
        text: 'No, cancel'
      }
    ]))

  }, [orderSubtotal, orderTax, paidSubtotal, paidTax])

  const remainderOfBill = orderSubtotal + orderTax - paidSubtotal - paidTax

  return <View style={{ flex: 1, paddingHorizontal: 20, }}>
    <View style={{ flexDirection: 'row' }}>
      {
        QUICK_COMPS.map(quickPercent => <EditLineItemBox
          key={quickPercent.toString()}
          isPurple={percent === quickPercent}
          text={`${quickPercent}% OFF`}
          onPress={() => setPercentOnly(quickPercent)}
          isFifth />)
      }
      <EditLineItemBox
        isPurple={!percent && !subtotal}
        text='CLEAR'
        onPress={() => setPercentOnly(0)}
        isFifth
      />
    </View>

    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20, marginBottom: 10 }}>
      <PortalTextField
        text='By percent'
        backgroundColor={percent && !QUICK_COMPS.includes(percent) && Colors.purple}
        value={percent}
        onChangeText={setPercentOnly}
        isNumber
        afterCursor='%'
        max={100}
      />
      <PortalTextField
        text='By amount'
        value={subtotal}
        backgroundColor={subtotal && Colors.purple}
        onChangeText={setSubtotalOnly}
        isNumber
        format={centsToDollar}
      />

    </View>

    <FlatList
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={{ marginHorizontal: 40 }}
      keyExtractor={bill_item_id => bill_item_id}
      data={sortedBillItems}
      renderItem={({ item: bill_item_id }) => <BillItem bill_id={bill_id} bill_item_id={bill_item_id} compChange={compChanges[bill_item_id]} setCompChanges={setCompChanges} percent={percent} subtotal={subtotal} />}
      ListHeaderComponent={() => {
        if (!orderSubtotal && !orderTax) return null
        return <TouchableOpacity disabled={remainderOfBill < 0} onPress={compRemainder}>
          <View style={{ borderColor: remainderOfBill < 0 ? Colors.midgrey : Colors.white, borderWidth: 1, paddingVertical: 8, marginBottom: 10, backgroundColor: Colors.darkgrey }}>
            {
              paidSubtotal || paidTax ?
                <ExtraLargeText center style={{ color: remainderOfBill < 0 ? Colors.midgrey : Colors.white }}>COMP REMAINDER OF BILL {centsToDollar(remainderOfBill)}</ExtraLargeText> :
                <ExtraLargeText center>COMP ENTIRE BILL</ExtraLargeText>
            }
          </View>
        </TouchableOpacity>
      }}
    />
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 20 }}>
      <StyledButton text={Object.keys(compChanges).length ? 'Save' : 'No changes'} disabled={!Object.keys(compChanges).length} onPress={save} />
    </View>
    {/* Probably some save button, where save > !showComps */}
  </View>
}

function BillItem({ bill_id, bill_item_id, compChange, setCompChanges, percent, subtotal }) {
  const {
    name,
    captions: { one_line } = {},
    comped,
    summary: { subtotal: oldPrice } = {},
    units: { paid = [], claimed = [] } = {}
  } = useBillItem(bill_id, bill_item_id)

  const isDisabled = !!(paid.length || claimed.length)
  const isAlreadyComped = !!comped.subtotal

  useEffect(() => {
    // Remove comps for items that become paid or claimed
    // Missing some notification... !!compChange?
    setCompChanges(prev => {
      if (isDisabled && prev[bill_item_id]) {
        const { [bill_item_id]: discard, ...rest } = prev
        return rest
      }
      return prev
    })
  }, [isDisabled])

  const fullPrice = useMemo(() => {
    return oldPrice + comped.subtotal
  }, [comped, oldPrice])

  const newPrice = useMemo(() => {
    return fullPrice - (compChange?.percent ? Math.round(compChange.percent * fullPrice / 100) : compChange?.subtotal || 0)
  }, [fullPrice, compChange])

  const onPress = useCallback(() => {
    setCompChanges(prev => {
      if (!percent && !subtotal) {
        if (isAlreadyComped) return ({ ...prev, [bill_item_id]: { is_comped: false, subtotal: 0, percent: 0, } })

        let { [bill_item_id]: discard, ...rest } = prev
        return rest
      }
      if (percent) return ({ ...prev, [bill_item_id]: { is_comped: true, subtotal: 0, percent, } })
      return ({ ...prev, [bill_item_id]: { is_comped: true, subtotal, percent: 0, } })
    })
  }, [percent, isAlreadyComped, subtotal])



  const isPriceAltered = fullPrice !== oldPrice || fullPrice !== newPrice

  return <TouchableOpacity style={{ marginTop: 12 }} disabled={isDisabled} onPress={onPress}>
    <View style={{ backgroundColor: compChange ? comped.subtotal || comped.percent ? Colors.red : Colors.purple : Colors.darkgrey, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row' }}>
        <LargeText style={styles.fullText}>{name}</LargeText>
        <LargeText style={isPriceAltered && styles.strikeThrough}>{centsToDollar(fullPrice)}</LargeText>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {isDisabled ? <MediumText bold red style={styles.fullText}>CANNOT CHANGE COMP, users have claimed/paid already</MediumText> :
          compChange ?
            <LargeText style={[styles.fullText, styles.altered]} bold>COMP {compChange.percent ? `${compChange.percent}%` : centsToDollar(compChange.subtotal)}</LargeText> :
            <LargeText style={[styles.fullText, styles.unaltered]}>(no comp change)</LargeText>
        }
        {isPriceAltered && <LargeText bold >{centsToDollar(compChange ? newPrice : oldPrice)}</LargeText>}
      </View>
      <DefaultText style={{ paddingTop: 4 }}>{one_line}</DefaultText>
    </View>
  </TouchableOpacity>
}



const styles = StyleSheet.create({
  fullText: {
    flex: 1,
    marginRight: 20,
  },
  altered: {
    fontWeight: 'bold',
  },
  unaltered: {
    color: Colors.midgrey,
  },
  strikeThrough: {
    textDecorationLine: 'line-through'
  },
});


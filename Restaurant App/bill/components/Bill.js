import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  UIManager,
  TouchableWithoutFeedback,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { DefaultText, LargeText, } from '../../utils/components/NewStyledText';
import { FlatList } from 'react-native-gesture-handler';
import centsToDollar from '../../utils/functions/centsToDollar';
import Header from '../../utils/components/Header';
import BackIcon from '../../utils/components/BackIcon';
import { MaterialIcons, MaterialCommunityIcons, } from '@expo/vector-icons';
import useBillNestedFields from '../../hooks/useBillNestedFields';
import { useBillIsWithItems, useBillIsWithOrder, } from '../../utils/hooks/useBill';
import { useTableName } from '../../utils/hooks/useTable';
import Layout from '../../utils/constants/Layout';
import { useDispatch, useSelector, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { BillButton, PartySizeButton } from './BillButtons';
import { PartySizePopUp } from './PartySizePopUp';
import { useLineItemIDsOnBillByPrintStatus, } from '../../hooks/useLineItems4';
import LineItemEditor from './LineItemEditor';
import BillLineItem from './BillLineItem';
import AddItem from './AddItem';
import { BillMenuPopUp, } from './BillMenuPopUp';
import BillComps from './BillComps';
import StyledButton from '../../utils/components/StyledButton';
import { doPrintKitchen } from '../../redux/actions/actionsPrint';
import BillResend from './BillResend';
import { useNavigation } from '@react-navigation/native';
import BillPrint from './BillPrint';
import BillPayments from './BillPayments';
import useSlideIn from '../../utils/hooks/useSlideIn';
import firebase from 'firebase';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { doCategoryDelete, doCategorySet } from '../../redux/actions/actionsAll';
import { doBillItemsTempClear, doBillItemsTempSet } from '../../redux/actions/actionsHistory';
// import { selectIsTableWithMultipleBills } from '../../redux/selectors/selectorsTableStatus';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Bill({ bill_id, closeBill, setOrderTableID, isDashboard, isHistory }) {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const [showBill, animateCloseBill] = useSlideIn(closeBill)

  const [showPrint, setShowPrint] = useState(false)
  const isWithOrder = useBillIsWithOrder(bill_id)
  const party_size = useBillNestedFields(bill_id, 'party', 'party_size')
  const table_id = useBillNestedFields(bill_id, 'table', 'id')
  const orderSubtotal = useBillNestedFields(bill_id, 'order_summary', 'subtotal')
  const orderTax = useBillNestedFields(bill_id, 'order_summary', 'tax')
  const paidTotal = useBillNestedFields(bill_id, 'paid_summary', 'total')
  const billCode = useBillNestedFields(bill_id, 'bill_code')
  const tableName = useTableName(table_id)
  const restaurantRef = useRestaurantRef()
  const isUnpaid = !!useBillNestedFields(bill_id, 'timestamps', 'unpaid')
  const isClosed = useBillNestedFields(bill_id, 'timestamps', 'closed')

  const [editLineItemID, setEditLineItemID] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [isFetchingItems, setIsFetchingItems] = useState(isHistory)

  useEffect(() => {
    if (isHistory) {
      restaurantRef.collection('Bills').doc(bill_id).collection('BillItems').get()
        .then(querySnapshot => {
          let billItems = {}
          querySnapshot.forEach(doc => {
            billItems[doc.id] = doc.data()
          })
          dispatch(doBillItemsTempSet(billItems))
          setIsFetchingItems(false)
        })
        .catch(error => {
          console.log('Bill fetch billItems failed: ', error)
          setIsFetchingItems(false)
        })
      // fetch the bill items
    }
  }, [])

  useEffect(() => {
    return () => dispatch(doBillItemsTempClear(bill_id))
  }, [])

  useEffect(() => {
    setEditLineItemID('')
    setShowAddItem(false)
  }, [bill_id])

  const unpaid = useMemo(() => orderSubtotal + orderTax - paidTotal, [orderSubtotal, orderTax, paidTotal])

  const [showPartySize, setShowPartySize] = useState(!party_size)
  const [showBillMenu, setShowBillMenu] = useState(false)
  const [showBillPayments, setShowBillPayments] = useState(false)
  const [showComps, setShowComps] = useState(false)
  const [showReprint, setShowReprint] = useState(false)

  const warnUnpaid = useCallback((isInvalidClose) => {
    dispatch(doAlertAdd(isInvalidClose ? 'Bill is not paid, mark as unpaid?' : 'Mark bill as unpaid?', 'Guests will have 10 minutes to complete payment before being charged', [
      {
        text: 'Yes, mark as unpaid',
        onPress: async () => {
          try {
            await firebase.functions().httpsCallable('close-markBillUnpaid')({ bill_id })
            animateCloseBill()
          }
          catch (error) {
            console.log('Bill warnUnpaid error: ', error)
            dispatch(doAlertAdd('Unable to mark bill as unpaid', 'Please try again and let Torte know if the issue persists'))
          }
        }
      },
      {
        text: 'Add an outside (cash/card) payment',
        onPress: () => setShowBillPayments(true)
      },
      {
        text: 'No, cancel'
      },
    ]))
  }, [])

  const setTableLeft = useCallback(() => {
    if (!bill_id) return

    if (isUnpaid || isClosed) {
      dispatch(doAlertAdd('Reopen bill?', undefined, [
        {
          text: 'Yes, reopen',
          onPress: async () => {
            try {
              await firebase.functions().httpsCallable('close-markBillOpen')({ bill_id })
              animateCloseBill()
              navigation.navigate('Dashboard')
            }
            catch (error) {
              console.log('Bill setTableLeft unpaid error: ', error)
              dispatch(doAlertAdd('Unable to mark reopen bill', 'Please try again and let Torte know if the issue persists'))
            }
          },
        },
        {
          text: 'No, cancel'
        },
      ]))
    }
    else if (unpaid > 0) {
      warnUnpaid()
    }
    else {
      dispatch(doAlertAdd('Close bill?', undefined, [
        {
          text: 'Yes, close bill',
          onPress: async () => {
            try {
              const { data } = await firebase.functions().httpsCallable('close-markBillClosed')({ bill_id })
              if (data?.unpaid) warnUnpaid(true)
              else animateCloseBill()
            }
            catch (error) {
              console.log('Bill setTableLeft close error: ', error)
              dispatch(doAlertAdd('Unable to mark table', 'Please try again and contact Torte support if the error persists'))
            }
          },
        },
        {
          text: 'No, cancel'
        }
      ]))
    }
  }, [unpaid, bill_id, isUnpaid, isClosed])

  const isBack = showComps || showReprint

  const returnToLineItems = useCallback(() => {
    setEditLineItemID('')
    setShowComps(false)
    setShowBillMenu(false)
    setShowBillPayments(false)
    setShowAddItem(false)
    setShowReprint(false)
  }, [])

  const closeAll = useCallback(() => {
    returnToLineItems()
    animateCloseBill()
  }, [])

  return (
    <View style={{ flexDirection: 'row', position: 'absolute', top: 0, bottom: 0, right: 0, width: showBill ? '100%' : 0, overflow: 'hidden', zIndex: 20 }}>
      <TouchableWithoutFeedback onPress={closeAll}>
        <View style={{ width: 150, backgroundColor: Colors.black + 'AA' }} />
      </TouchableWithoutFeedback>
      <View style={{
        flex: 1,
        backgroundColor: Colors.background,
        shadowColor: "#000",
        shadowOffset: {
          width: -5
        },
        shadowOpacity: 0.81,
        shadowRadius: 15.16,

        elevation: 20,
      }}>
        <View style={{ paddingVertical: 10 }}>
          <Header left={<BackIcon name={isBack ? 'arrow-back' : 'close'} iconSize={30} backFn={isBack ? returnToLineItems : closeAll} />}>
            <LargeText center>{tableName} - #{billCode}</LargeText>
          </Header>
          {isWithOrder && <TouchableOpacity disabled={!isDashboard} onPress={() => setOrderTableID(table_id)}>
            <View style={styles.orderAlert}>
              <LargeText center bold style={{ letterSpacing: 1 }}>Bill has a new order!</LargeText>
              {!isDashboard && <DefaultText center>(you can open this order from the Dashboard)</DefaultText>}
            </View>
          </TouchableOpacity>}
        </View>

        <View style={{ flex: 1 }}>
          {
            showReprint ?
              <BillResend bill_id={bill_id} setShowReprint={setShowReprint} /> :
              showComps ?
                <BillComps bill_id={bill_id} setShowComps={setShowComps} animateCloseBill={animateCloseBill} /> :
                <>
                  <BillLineItems
                    bill_id={bill_id}
                    disabled={!!(isUnpaid || isClosed)}
                    editLineItemID={editLineItemID}
                    setEditLineItemID={setEditLineItemID}
                  />
                  {isFetchingItems && <IndicatorOverlay text='Fetching items' opacity='FF' />}
                </>}
        </View>


        {!showComps && <View style={{ maxHeight: '30%', flexDirection: 'row', borderColor: Colors.white, borderTopWidth: 1, paddingVertical: 4 }}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <BillSummary bill_id={bill_id} unpaid={unpaid} />
          </View>
          <View style={{ flex: 1, }}>
            <BillNavigation
              bill_id={bill_id}
              disabled={!!(isUnpaid || isClosed)}
              setShowPartySize={setShowPartySize}
              setShowBillMenu={setShowBillMenu}
              setTableLeft={setTableLeft}
              setShowAddItem={setShowAddItem}
              setShowPrint={setShowPrint}
              setShowBillPayments={setShowBillPayments}
            />
          </View>
        </View>}
      </View>

      {!!showBillPayments && <BillPayments setShowBillPayments={setShowBillPayments} bill_id={bill_id} billCode={billCode} tableName={tableName} isRefundOnly={showBillPayments === 'refunds'} />}
      {showPrint && <BillPrint setShowPrint={setShowPrint} bill_id={bill_id} />}
      {showPartySize && <PartySizePopUp bill_id={bill_id} table_id={table_id} showPartySize={showPartySize} setShowPartySize={setShowPartySize} />}
      {showBillMenu && <BillMenuPopUp bill_id={bill_id} closeBill={closeAll} setShowBillMenu={setShowBillMenu} setShowBillPayments={setShowBillPayments} setShowComps={setShowComps} setShowReprint={setShowReprint} />}
      {!!editLineItemID && <LineItemEditor lineItemID={editLineItemID} bill_id={bill_id} close={() => setEditLineItemID('')} tableName={tableName} />}
      {showAddItem && <AddItem showAddItem={showAddItem} setShowAddItem={setShowAddItem} bill_id={bill_id} billCode={billCode} tableName={tableName} />}
    </View>
  )
}


const BillLineItems = ({ bill_id, disabled, editLineItemID, setEditLineItemID, }) => {
  const dispatch = useDispatch()
  const printedLineItemIDs = useLineItemIDsOnBillByPrintStatus(bill_id, true)
  const unprintedLineItemIDs = useLineItemIDsOnBillByPrintStatus(bill_id)

  return <FlatList
    contentContainerStyle={{
      backgroundColor: Colors.background,
      paddingBottom: Layout.scrollViewPadBot
    }}
    data={printedLineItemIDs}
    ListEmptyComponent={() => <LargeText center style={{ marginVertical: 20 }}>No items</LargeText>}
    ListHeaderComponent={() => (
      unprintedLineItemIDs.length ?
        <FlatList
          contentContainerStyle={{
            backgroundColor: Colors.darkgrey,
          }}
          data={unprintedLineItemIDs}
          keyExtractor={item => item}
          renderItem={({ item: lineItemID }) => <BillLineItem
            bill_id={bill_id}
            lineItemID={lineItemID}
            isEditing={editLineItemID === lineItemID}
            setEditLineItemID={setEditLineItemID}
            disabled={disabled}
          />}
          ListHeaderComponent={() => <LargeText bold center style={{ marginTop: 10 }}>UNSENT ITEMS</LargeText>}
          ListFooterComponent={() => {
            return <View style={{ marginVertical: 10 }}>
              <StyledButton center text='SEND ABOVE ITEMS' onPress={() => dispatch(doPrintKitchen(unprintedLineItemIDs, bill_id))} />
            </View>
          }}
        /> : null
    )}
    keyExtractor={item => item}
    renderItem={({ item: lineItemID }) => <BillLineItem
      bill_id={bill_id}
      lineItemID={lineItemID}
      isEditing={editLineItemID === lineItemID}
      setEditLineItemID={setEditLineItemID}
      disabled={disabled}
    />}
  />
}

const BillSummary = ({ bill_id, unpaid, }) => {
  const orderSubtotal = useBillNestedFields(bill_id, 'order_summary', 'subtotal')
  const orderTax = useBillNestedFields(bill_id, 'order_summary', 'tax')
  const paidTip = useBillNestedFields(bill_id, 'paid_summary', 'tips')

  return <View style={{ marginHorizontal: 30, marginVertical: 12, }}>
    <SummaryLine text='Subtotal' amount={orderSubtotal} />
    <SummaryLine text='Tax' amount={orderTax} />
    <SummaryLine text='Total' amount={orderSubtotal + orderTax} />
    <View style={{ marginTop: 8 }}>
      <SummaryLine isBold text='TIPS' amount={paidTip} />
      <SummaryLine isBold isRed text='UNPAID' amount={unpaid} />
    </View>
  </View>
}

const BillNavigation = ({ bill_id, disabled, setShowPartySize, setTableLeft, setShowAddItem, setShowPrint, setShowBillMenu, setShowBillPayments }) => {
  const isBillWithItems = useBillIsWithItems(bill_id)

  return <View style={{ flexDirection: 'row', flex: 1 }}>

    <View style={{ flex: 1 }}>
      <PartySizeButton bill_id={bill_id} setShowPartySize={setShowPartySize} />
      <BillButton icon={<MaterialIcons name='print' size={36} color={Colors.white} />} text='Print' onPress={() => setShowPrint(true)} />
      <BillButton icon={<MaterialCommunityIcons name='door' size={36} color={Colors.white} />} text={disabled ? 'Reopen bill' : isBillWithItems ? 'Table left' : 'Cancel bill'} onPress={setTableLeft} />

    </View>
    <View style={{ flex: 1, }}>
      <BillButton disabled={disabled} icon={<MaterialIcons name='add' size={36} color={disabled ? Colors.midgrey : Colors.white} />} text='Add item' onPress={() => setShowAddItem(true)} />
      <BillButton icon={<MaterialIcons name='payment' size={36} color={Colors.white} />} text='Payments' onPress={() => setShowBillPayments(true)} />
      <BillButton icon={<MaterialCommunityIcons name='dots-vertical' size={36} color={Colors.white} />} text='Other' onPress={() => setShowBillMenu(true)} />
    </View>
  </View>
}

const SummaryLine = ({ text, amount, isBold, isRed }) => (
  <View style={{ flexDirection: 'row', marginVertical: 2, }}>
    <LargeText style={{ flex: 1, fontWeight: isBold ? 'bold' : undefined, color: isRed ? Colors.red : Colors.white }}>{text}:</LargeText>
    <LargeText style={{ fontWeight: isBold ? 'bold' : undefined, color: isRed ? Colors.red : Colors.white }}>{centsToDollar(amount)}</LargeText>
  </View>
)



const styles = StyleSheet.create({

  orderAlert: {
    backgroundColor: Colors.red,
    marginHorizontal: Layout.marHor * 2,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: {
      height: 10,
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,

    elevation: 20,
  }
});


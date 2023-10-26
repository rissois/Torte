import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  LayoutAnimation,
  TouchableWithoutFeedback,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, LargeText, } from '../../utils/components/NewStyledText';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FlatList } from 'react-native-gesture-handler';
import { selectOpenBillsOnTable, } from '../../redux/selectors/selectorsTableStatus';
import useTable from '../../hooks/useTable';
import Header from '../../utils/components/Header';
import BackIcon from '../../utils/components/BackIcon';
import OrderBill from './OrderBill';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import StyledButton from '../../utils/components/StyledButton';
import { doPrintKitchen } from '../../redux/actions/actionsPrint';
import Layout from '../../utils/constants/Layout';
import LineItemEditor from '../../bill/components/LineItemEditor';
import useSlideIn from '../../utils/hooks/useSlideIn';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/*
  QUESTION: will there be odd effects holding these orders separately?
  QUESTION: How to automatically make changes and avoid and alerts (altering the displayedItems)
*/

// Both trim and re-merge line items; enforced consistent output with for print / mark with that of Bill
const trimSelectedLineItems = lineItemsByBill => {
  let selectedLineItems = {}
  Object.keys(lineItemsByBill).forEach(bill_id => {
    lineItemsByBill[bill_id].forEach(lineItem => {
      if (lineItem.isSelected) {
        if (selectedLineItems[lineItem.lineItemID]) {
          selectedLineItems[lineItem.lineItemID].bill_item_ids = [...selectedLineItems[lineItem.lineItemID].bill_item_ids, ...lineItem.bill_item_ids]
        }
        else {
          selectedLineItems[lineItem.lineItemID] = { ...lineItem }
        }
      }
    })
  })
  return selectedLineItems
}

export default function Order({ table_id, closeOrder }) {
  const dispatch = useDispatch()
  const [showOrder, animateCloseOrder] = useSlideIn(closeOrder)
  const { name: tableName = '' } = useTable(table_id)

  const openBills = useSelector(selectOpenBillsOnTable(table_id), shallowEqual)
  const [tableVisibleLineItems, setVisibleLineItems] = useState({})
  const [changingBills, setChangingBills] = useState([])
  const [editLineItem, setEditLineItem] = useState(null)

  const hasASelection = useMemo(() => Object.keys(tableVisibleLineItems).some(bill_id => tableVisibleLineItems[bill_id].some(lineItem => lineItem.isSelected)), [tableVisibleLineItems])

  const headerLeft = useMemo(() => (
    <BackIcon name='close' iconSize={36} backFn={animateCloseOrder} />
  ), [])

  return (
    <View style={{ flexDirection: 'row', position: 'absolute', top: 0, bottom: 0, left: 0, width: showOrder ? '100%' : 0, overflow: 'hidden', zIndex: 30 }}>
      <View style={{
        flex: 1,
        backgroundColor: Colors.background,
        shadowColor: "#FFF",
        shadowOffset: {
          width: 5
        },
        shadowOpacity: 0.81,
        shadowRadius: 15.16,

        elevation: 20,
      }}>
        <View style={{ paddingVertical: 10 }}>
          <Header left={headerLeft}>
            <ExtraLargeText center>{tableName.toUpperCase()} ORDERS</ExtraLargeText>
          </Header>
        </View>
        <FlatList
          contentContainerStyle={{ backgroundColor: Colors.background, paddingHorizontal: 20, }}
          // ListHeaderComponent={header}
          data={openBills}
          ListFooterComponent={() => <View style={{ height: Layout.scrollViewPadBot }} />}
          ListEmptyComponent={() => <LargeText center style={{ marginVertical: 20 }}>No bills found</LargeText>}
          keyExtractor={item => item}
          renderItem={({ item: bill_id }) => <OrderBill
            visibleLineItems={tableVisibleLineItems[bill_id]}
            setVisibleLineItems={setVisibleLineItems}
            isChanging={changingBills.includes(bill_id)}
            setChangingBills={setChangingBills}
            bill_id={bill_id}
            setEditLineItem={setEditLineItem}
          />}
        />
        <View style={{ flexDirection: 'row', marginHorizontal: 40, marginVertical: 20, }}>
          <StyledButton text=' Select all ' center onPress={() => setVisibleLineItems(prev => Object.keys(prev).reduce((acc, bill_id) => {
            return {
              ...acc,
              [bill_id]: prev[bill_id].map(lineItem => ({ ...lineItem, isSelected: true }))
            }
          }, {}))} />
          <StyledButton
            style={{ flex: 1, marginLeft: 50 }}
            disabled={!hasASelection}
            color={hasASelection ? Colors.darkgreen : Colors.darkgrey}
            text={`SEND SELECTED ITEMS`}
            onPress={() => {
              dispatch(doPrintKitchen(trimSelectedLineItems(tableVisibleLineItems)))
              animateCloseOrder()
            }} />
          {/* <StyledButton
            style={{ marginLeft: 40 }}
            disabled={!hasASelection}
            color={hasASelection ? Colors.midgrey : Colors.darkgrey}
            text='only mark'
            onPress={() => {
              dispatch(doTransactMarkLineItems(trimSelectedLineItems(tableVisibleLineItems)))
              closeOrder()
            }} /> */}
        </View>
        {!!changingBills.length && <IndicatorOverlay text={"Some items have changed\nWe've unselected any affected items"} opacity='90' />}

      </View>
      <TouchableWithoutFeedback onPress={animateCloseOrder}>
        <View style={{ width: 150, backgroundColor: Colors.background + 'AA' }} />
      </TouchableWithoutFeedback>

      {
        !!editLineItem && <LineItemEditor lineItemID={editLineItem.lineItemID} bill_id={editLineItem.bill_id} close={() => setEditLineItem(null)} tableName={tableName} isOrder />
      }
    </View>
  )
}


const styles = StyleSheet.create({
});


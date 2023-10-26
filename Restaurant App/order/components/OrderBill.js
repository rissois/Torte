import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  UIManager,
  Animated,
  LayoutAnimation,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, LargeText, } from '../../utils/components/NewStyledText';
import { useDispatch, } from 'react-redux';
import { FlatList } from 'react-native-gesture-handler';
import useBillNestedFields from '../../hooks/useBillNestedFields';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import OrderLineItem from './OrderLineItem';
import { useLineItemsonOrder } from '../../hooks/useLineItems4';
import { isMatchingLineItem } from '../../redux/reducers/reducerLineItems4';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INITIAL_HIDDEN_ARRAY = []
const FADE_IN_TIME = 500
const FADE_OUT_TIME = 1200
const FADE_DELAY = 200

const findChangesToVisible = (visibleLineItems, currentLineItems) => {
  return visibleLineItems.map(visibleLineItem => {
    const { lineItemID: visibleLineItemID, bill_item_ids: [visibleKey, ...visibleOtherIDs] } = visibleLineItem

    /*
      Changes to items will automatically generate new lineItemIDs
      If this behavior is not accounted for, bill items will always appear to be deleted and recreated

      bill_item_ids[0] serves as the FlatList key
      Determine the lineItemID of this bill item, or else any others in the visibleLineItem
      To track updates accordingly
    */
    let lineItemID = null
    if (currentLineItems[visibleLineItemID]?.bill_item_ids.includes(visibleKey)) lineItemID = visibleLineItemID
    else {
      lineItemID = Object.keys(currentLineItems).find(id => currentLineItems[id].bill_item_ids.includes(visibleKey))
      if (!lineItemID) {
        for (let i = 0, keys = Object.keys(currentLineItems); i < keys.length && !lineItemID; i++) {
          const id = keys[i]
          if (visibleOtherIDs.some(bill_item_id => currentLineItems[id].bill_item_ids.includes(bill_item_id))) lineItemID = id
        }
      }
    }

    if (!lineItemID) return { ...visibleLineItem, color: Colors.red, isDeleted: true, }

    const currentLineItem = currentLineItems[lineItemID]

    // These will be the NEW bill_item_ids in use (helps to maintain visibleKey this way)
    const bill_item_ids = visibleLineItem.bill_item_ids.filter(bill_item_id => currentLineItem.bill_item_ids.includes(bill_item_id))
    if (lineItemID !== visibleLineItemID || !isMatchingLineItem(visibleLineItem, currentLineItem) || bill_item_ids.length < visibleLineItem.bill_item_ids.length) return { ...visibleLineItem, color: Colors.yellow, current: { ...currentLineItem, lineItemID, color: Colors.yellow, bill_item_ids } }
    return { ...visibleLineItem, color: undefined }

    /*
      BILL ITEM IDS
      You must remove any bill_item_ids that are no longer a part of this group (e.g. if they were moved to another group)

      = There is no need to change if the bill_item_ids are perfectly identical
      ↑ There is no need to change if currentLineItems has extra bill_item_ids, these will be picked up by hidden
      ↓ You should yellow alert if the visible has lost bill_item_ids
      ∆ There is no such thing as delta. You cannot "replace" a new bill_item_id for an old one. That is simply a ↓ followed by a ↑
    */
  })
}

const findHidden = (pendingVisible, currentLineItems) => {
  /*
  So the pendingVisible is not correct... is it because you are not using CURRENT?
  */
  return Object.keys(currentLineItems).reduce((acc, lineItemID) => {
    const currentLineItem = currentLineItems[lineItemID]

    // Determine what bill item IDs have been ordered, but are not being displayed
    const hiddenBillItemIDs = currentLineItem.bill_item_ids.filter(bill_item_id => (
      !pendingVisible.some(visibleLineItem => !visibleLineItem.isDeleted && (visibleLineItem.current || visibleLineItem).bill_item_ids.includes(bill_item_id))
    ))

    if (hiddenBillItemIDs.length) return [...acc, {
      ...currentLineItem,
      lineItemID,
      bill_item_ids: hiddenBillItemIDs,
      color: Colors.green,
    }]
    return acc
  }, [])
    .sort((a, b) => a.position.localeCompare(b.position))
}

export default function OrderBill({
  visibleLineItems = [],
  setVisibleLineItems,
  isChanging,
  setChangingBills,
  bill_id,
  setEditLineItem,
}) {
  const currentLineItems = useLineItemsonOrder(bill_id)
  const dispatch = useDispatch()
  const bill_code = useBillNestedFields(bill_id, 'bill_code')

  const [hiddenLineItems, setHiddenLineItems] = useState(INITIAL_HIDDEN_ARRAY)
  const [isHiddenMuted, setIsHiddenMuted] = useState(false)

  /*
  REMAINING:
  Animante change (red if formerly selected or is deleted, yellow if not selected or added)
    similar to EUL
  */
  const [animateColor] = useState(new Animated.Value(0))

  const animateAddAndColorLineItems = useCallback((pendingVisible, pendingHidden = []) => {
    // Timeout required to disconnect these animations from others
    // what these were I do not know
    setTimeout(() => {
      LayoutAnimation.configureNext({ ...LayoutAnimation.Presets.easeInEaseOut, duration: FADE_IN_TIME });
      setVisibleLineItems(prev => ({
        ...prev,
        [bill_id]: [...(pendingVisible || prev[bill_id] || []), ...pendingHidden]
      }))

      Animated.timing(
        animateColor,
        {
          toValue: 1,
          delay: 0,
          duration: FADE_IN_TIME,
          useNativeDriver: false,
        }
      ).start(animateRemoveAndReplaceLineItems) // COMPLETION CALLBACK
    }, 1)
  }, [])

  const animateRemoveAndReplaceLineItems = useCallback(() => {
    // Remove any deleted line items and swap in the altered version
    LayoutAnimation.configureNext({ ...LayoutAnimation.Presets.easeInEaseOut, duration: FADE_OUT_TIME + FADE_DELAY });
    setVisibleLineItems(prev => ({
      ...prev,
      [bill_id]: prev[bill_id].filter(lineItem => !lineItem.isDeleted).map((lineItem) => lineItem.current || lineItem)
    }))

    Animated.timing(
      animateColor,
      {
        toValue: 0,
        delay: FADE_DELAY,
        duration: FADE_OUT_TIME,
        useNativeDriver: false
      }
    ).start(() => setChangingBills(prev => prev.filter(id => id !== bill_id))) // COMPLETION CALLBACK
  }, [])

  useEffect(() => {

    if (!isChanging) {
      // Check the visible for any changes (color && (isDeleted || current))
      const pendingVisible = findChangesToVisible(visibleLineItems, currentLineItems)

      // Extract line items not curently displayed
      const pendingHidden = findHidden(pendingVisible, currentLineItems)

      // You MUST make immediate changes if pendingVisible were altered
      if (pendingVisible.some(lineItem => lineItem.color)) {
        // Corrections dispalyed an alert, which you can use to expand the hidden line items
        setHiddenLineItems(INITIAL_HIDDEN_ARRAY)

        // Displays a IndicatorOverlay and prevents multiple calls until this animation has finished
        setChangingBills(prev => [...prev, bill_id])

        // Performs the background change without impacting the IndicatorOverlay
        animateAddAndColorLineItems(pendingVisible, pendingHidden)
      }
      else {
        setHiddenLineItems(pendingHidden)
      }
    }
  }, [visibleLineItems, currentLineItems, isChanging])

  useEffect(() => {
    // INITIALIZE THE DISPLAYED BILL ITEMS
    setVisibleLineItems(prev => ({
      ...prev,
      [bill_id]: Object.keys(currentLineItems).map(lineItemID => ({ lineItemID, ...currentLineItems[lineItemID] }))
    }))

    // CANCEL THE PREVIOUS USEEFFFECT
    setHiddenLineItems(INITIAL_HIDDEN_ARRAY)
  }, [])

  useEffect(() => {
    // Alert new items, but prevent 
    if (hiddenLineItems.length && !isHiddenMuted) {
      dispatch(doAlertAdd('Table just ordered more items', 'Do you want to see them now?', [
        {
          text: 'Yes',
          onPress: () => animateAddAndColorLineItems(undefined, hiddenLineItems)
        },
        {
          text: 'No'
        }
      ]))
    }
    setIsHiddenMuted(!!hiddenLineItems.length)
  }, [hiddenLineItems, isHiddenMuted])

  return <View>
    <FlatList
      data={visibleLineItems}
      ListHeaderComponent={() => (
        <View style={{ flexDirection: 'row', margin: 10, padding: 6, borderBottomColor: Colors.white, borderBottomWidth: 1 }}>
          <ExtraLargeText style={{ flex: 1 }}>Bill #{bill_code}</ExtraLargeText>
          <TouchableOpacity disabled={!visibleLineItems.length} onPress={() => setVisibleLineItems(prev => ({
            ...prev,
            [bill_id]: prev[bill_id].map(lineItem => ({ ...lineItem, isSelected: true }))
          }))}>
            <LargeText>Select all</LargeText>
          </TouchableOpacity>
        </View>
      )}
      ListFooterComponent={() => hiddenLineItems?.length
        ? <TouchableOpacity onPress={() => animateAddAndColorLineItems(undefined, hiddenLineItems)}>
          <View>
            <LargeText center>A new order just came in</LargeText>
            <LargeText center>Press here to view those items</LargeText>
          </View>
        </TouchableOpacity>
        : null
      }
      keyExtractor={item => item.bill_item_ids[0]}
      renderItem={({ item }) => {
        return <OrderLineItem
          animateColor={animateColor}
          setVisibleLineItems={setVisibleLineItems}
          bill_id={bill_id}
          bill_item_ids={item.bill_item_ids}
          quantity={item.bill_item_ids.length}
          subtotal={item.summary.subtotal}
          name={item.name}
          captions={item.captions}
          isSelected={!!item.isSelected}
          color={item.color}
        />
      }}
    />
    {/* {isCorrectingLineItems && <IndicatorOverlay text={"Some items have changed\nWe've unselected any affected items"} opacity='D4' />} */}
  </View>
}



const styles = StyleSheet.create({
});


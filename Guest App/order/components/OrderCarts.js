import React, { useState, useCallback, } from 'react';
import {
  StyleSheet,
  View,
  SectionList,
} from 'react-native';
import { useSelector } from 'react-redux';
import { ExtraLargeText, } from '../../utils/components/NewStyledText';
import Layout from '../../utils/constants/Layout';
import plurarize from '../../utils/functions/plurarize';
import CartOwner from './CartOwner';
import BillGroup from './BillGroup';
import { useFocusEffect } from '@react-navigation/native';
import StyledButton from '../../utils/components/StyledButton';
import OrderTimer from './OrderTimer';
import { selectIsSoloBill, } from '../../redux/selectors/selectorsBill';
import { selectCurrentBillOrderID, selectIsOrderOccupied, selectIsOrderPaused, } from '../../redux/selectors/selectorsBillOrders';
import OrderGroups from './OrderGroups';
import { useBillCarts } from '../../utils/hooks/useBillGroups';
import { useMyID } from '../../utils/hooks/useUser';
import { useRestaurantID, useBillID } from '../../utils/hooks/useBill';
import functions from '@react-native-firebase/functions'
import { useDispatch, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';


export default function OrderCarts({ navigatorHeight, sendOrder }) {
  const myID = useMyID()
  const restaurant_id = useRestaurantID()
  const bill_id = useBillID()
  const bill_order_id = useSelector(selectCurrentBillOrderID)
  const dispatch = useDispatch()

  // Bill user details
  const isSoloBill = useSelector(selectIsSoloBill)

  // Bill order status
  const isOrderOccupied = useSelector(selectIsOrderOccupied)
  const isOrderPaused = useSelector(selectIsOrderPaused)

  const orderedCarts = useBillCarts(true)

  const [selectedGroups, setSelectedGroups] = useState([])
  const [isSendingASAP, setIsSendingASAP] = useState(false)

  useFocusEffect(useCallback(() => {
    setSelectedGroups([])
  }, []))

  const sendASAP = useCallback(async () => {
    try {
      setIsSendingASAP(true)
      await functions().httpsCallable('order2-itemizeASAP')({
        restaurant_id,
        bill_id,
        bill_order_id,
        asap_bill_group_ids: selectedGroups,
      })
    }
    catch (error) {
      dispatch(doAlertAdd('Error simulating order', error.message))
      console.log('itemize error: ', error)
    }
    finally {
      setIsSendingASAP(false)
    }
  }, [restaurant_id, bill_id, bill_order_id, selectedGroups])

  return (
    <SectionList
      style={{ paddingHorizontal: Layout.window.width * 0.1 }}
      sections={orderedCarts}
      keyExtractor={item => item}
      ListHeaderComponent={() => {
        return <View>
          <OrderTimer sendOrder={sendOrder} />
          {
            !isSoloBill && <OrderGroups />
          }
          {
            !isOrderOccupied &&
            <View style={{ margin: 50 }}>
              <ExtraLargeText center>No new orders</ExtraLargeText>
            </View>
          }
        </View>
      }}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section: { user_id, data } }) => (
        <CartOwner
          user_id={user_id}
          selectAll={() => setSelectedGroups(prev => {
            if (prev.length) return []
            return [...data]
          })}
          isPaused={isOrderPaused}
          isOneSelected={selectedGroups.length} />
      )}
      renderSectionFooter={({ section: { user_id, } }) => {
        if (user_id !== myID || !isOrderPaused) return null
        return <View style={{ marginHorizontal: 30, marginTop: 20, }}>
          <StyledButton onPress={sendASAP} small disabled={isSendingASAP || !isOrderPaused || !selectedGroups.length} text={isSendingASAP ? 'Sending item(s) ASAP' : `Prepare ${plurarize(selectedGroups.length, 'item', 'items')} ASAP`} />
        </View>
      }}
      renderItem={({ item: bill_group_id }) => (
        <BillGroup
          bill_group_id={bill_group_id}
          select={() => setSelectedGroups(prev => {
            if (prev.includes(bill_group_id)) {
              return prev.filter(id => id !== bill_group_id)
            }
            return [...prev, bill_group_id]
          })}
          isPaused={isOrderPaused}
          isSelected={selectedGroups.includes(bill_group_id)}
        />
      )}
      ListFooterComponent={() => <View style={{ height: 40 + Layout.scrollViewPadBot }} />}
    // navigatorHeight was unreliable in practice :(
    />

  )
}



const styles = StyleSheet.create({

});
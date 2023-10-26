import React, { useState, useCallback, } from 'react';
import {
  StyleSheet,
  View,
  SectionList,
} from 'react-native';
import { useSelector } from 'react-redux';
import { ExtraLargeText, MediumText, SmallText } from '../../utils/components/NewStyledText';
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
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useDispatch, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import firebaseApp from '../../firebase/firebase';
import { useIsRestaurantOffline } from '../../utils/hooks/useRestaurant';

const functions = getFunctions(firebaseApp)

export default function OrderCarts({ navigatorHeight, sendOrder }) {
  const myID = useMyID()
  const restaurant_id = useRestaurantID()
  const isRestaurantOffline = useIsRestaurantOffline()
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
      await httpsCallable(functions, 'order2-itemizeASAP')({
        restaurant_id,
        bill_id,
        bill_order_id,
        asap_bill_group_ids: selectedGroups,
      })
    }
    catch (error) {
      console.log('OrderCarts sendASAP error: ', error)
      dispatch(doAlertAdd('Error ASAPing items', error.message))
    }
    finally {
      setIsSendingASAP(false)
    }
  }, [restaurant_id, bill_id, bill_order_id, selectedGroups])

  return (
    <View style={{ flex: 1 }}>
      {
        isRestaurantOffline && <View style={{ marginHorizontal: Layout.marHor, paddingBottom: 20 }}>
          <MediumText center bold red>RESTAURANT OFFLINE</MediumText>
          <SmallText center>This may be temporary, orders will submit when the system is back online.</SmallText>
        </View>
      }
      <SectionList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Layout.scrollViewPadBot + navigatorHeight, paddingHorizontal: Layout.window.width * 0.1, }}
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
      />
    </View>

  )
}



const styles = StyleSheet.create({

});
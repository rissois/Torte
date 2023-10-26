import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { LargeText, } from '../../utils/components/NewStyledText';

import { useBillUserIDs, useBillUserName } from '../../utils/hooks/useBill';
import { useLineItemUserSummary, } from '../../hooks/useLineItems4';
import { LineItemBillItem } from './LineItemBillItem';





export const LineItemUsers = ({ add, setAdd, edit, setEdit, remove, setRemove, unvoid, setUnvoid, pressType, bill_id, lineItemID, onNoPressType, isOrder }) => {

  const userBillItems = useLineItemUserSummary(bill_id, lineItemID, isOrder)

  const user_ids = useBillUserIDs(bill_id)

  return (
    <ScrollView style={{ flex: 1, marginTop: 20 }}>
      {
        !!(userBillItems.server || add.length) && <View>
          <BillUserName isServer />
          <View style={{ flexWrap: 'wrap', flexDirection: 'row' }}>
            {
              userBillItems.server?.map((bill_item_id, index) => <LineItemBillItem
                key={bill_item_id}
                bill_id={bill_id}
                bill_item_id={bill_item_id}
                text={'Item #' + (index + 1)}
                isEdit={edit.includes(bill_item_id)}
                setEdit={setEdit}
                isRemove={remove.includes(bill_item_id)}
                setRemove={setRemove}
                isUnvoid={unvoid.includes(bill_item_id)}
                setUnvoid={setUnvoid}
                pressType={pressType}
                onNoPressType={onNoPressType}
              />)
            }
            {
              // Do you want to put these in a new section for NEW ITEMS?
              add.map((bill_item_id, index) => <LineItemBillItem
                key={bill_item_id}
                bill_id={bill_id}
                bill_item_id={bill_item_id}
                text={'Item #' + (index + 1) + ' (NEW)'}
                isAdd
                setAdd={setAdd}
                isEdit={edit.includes(bill_item_id)}
                setEdit={setEdit}
                pressType={pressType}
                onNoPressType={onNoPressType}
              />)
            }
          </View>
        </View>
      }
      {
        user_ids.map(user_id => {
          if (!userBillItems[user_id]) return null
          return <View key={user_id}>
            <BillUserName key={user_id} user_id={user_id} bill_id={bill_id} lineItemID={lineItemID} />
            <View style={{ flexWrap: 'wrap', flexDirection: 'row' }}>
              {
                userBillItems[user_id].map((bill_item_id, index) => <LineItemBillItem
                  key={bill_item_id}
                  bill_id={bill_id}
                  bill_item_id={bill_item_id}
                  text={'Item #' + (index + 1)}
                  isEdit={edit.includes(bill_item_id)}
                  setEdit={setEdit}
                  isRemove={remove.includes(bill_item_id)}
                  setRemove={setRemove}
                  isUnvoid={unvoid.includes(bill_item_id)}
                  setUnvoid={setUnvoid}
                  pressType={pressType}
                  onNoPressType={onNoPressType}
                />)
              }
            </View>
          </View>
        })
      }
    </ScrollView>
  )
}

export const BillUserName = ({ bill_id, user_id, isServer }) => {
  const userName = useBillUserName(bill_id, user_id)

  return (
    <View style={{ flexDirection: 'row', borderColor: Colors.white, borderBottomWidth: 1, paddingBottom: 2, marginTop: 8 }}>
      <LargeText style={{ flex: 1 }}>{isServer ? 'Server-added' : userName}</LargeText>
      {/* <LargeText style={{ flex: 1 }}>Select all</LargeText> */}
    </View>
  )
}


const styles = StyleSheet.create({

});


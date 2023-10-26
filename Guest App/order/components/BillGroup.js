import React, { useCallback } from 'react';
import {
  View,
  PixelRatio,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { doDeleteBillGroup, doOpenBillGroup } from '../../menu/redux-actions/actionsBillGroup';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { MediumText, DefaultText } from '../../utils/components/NewStyledText';
import centsToDollar from '../../utils/functions/centsToDollar';
import Colors from '../../utils/constants/Colors';
import { useBillGroup } from '../../utils/hooks/useBillGroups';
import { useIsSoldOutVariant } from '../../utils/hooks/useItems';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useMyID } from '../../utils/hooks/useUser';

const twoDigitWidth = 30 * PixelRatio.getFontScale()

export default function BillGroup({ bill_group_id, select, isSelected, isCart, isPaused, }) {
  const dispatch = useDispatch()
  const isGroupPending = useSelector(state => !!state.firestore.pending_bill_group_ids?.includes(bill_group_id))
  const myID = useMyID()

  const {
    name,
    summary: {
      subtotal,
    } = {},
    quantity,
    captions: { line_break: caption },
    reference_ids: { item_id, variant_id } = {},
    user_id,
  } = useBillGroup(bill_group_id)

  const isSoldOutVariant = useIsSoldOutVariant(item_id, variant_id)

  const remove = useCallback(() => {
    dispatch(doAlertAdd(`Delete ${name}?`, quantity > 1 ? `This will delete all ${quantity} of this item.` : undefined, [
      {
        text: 'Yes',
        onPress: () => dispatch(doDeleteBillGroup(bill_group_id))
      },
      {
        text: 'No, cancel',
        style: 'cancel'
      }
    ]))
  }, [name, quantity, bill_group_id])


  return (
    <TouchableOpacity disabled={!isCart} onPress={() => dispatch(doOpenBillGroup(bill_group_id))}>
      <View style={styles.billGroup}>
        <MediumText center style={{ minWidth: twoDigitWidth, }}>{quantity}</MediumText>
        <View style={{ flex: 1, }}>
          <MediumText style={{ paddingTop: 2 }}>{name}</MediumText>
          {isSoldOutVariant && <DefaultText red bold>ITEM MAY BE SOLD OUT</DefaultText>}
          {!!caption && <DefaultText lightgrey>{caption}</DefaultText>}
          {/* {!!discount && <DefaultText style={{ color: Colors.yellow, fontStyle: 'italic' }}>{centsToDollar(discount * quantity)} DISCOUNT!</DefaultText>} */}
        </View>
        {
          isCart ?
            <View style={{ alignItems: 'flex-end' }}>
              <MediumText>{centsToDollar(subtotal * quantity)}</MediumText>
              {user_id === myID && <TouchableOpacity style={{ paddingVertical: 6, paddingLeft: 20, }} onPress={() => remove(bill_group_id, name, quantity)}>
                <DefaultText red>Remove</DefaultText>
              </TouchableOpacity>}
            </View> :
            user_id === myID && isPaused && <TouchableOpacity disabled={!isPaused} onPress={select} >
              <View style={[styles.asapButton, {
                backgroundColor: isSelected ? Colors.darkgreen : Colors.darkgrey
              }]}>
                <MediumText style={{ color: isSelected ? Colors.white : Colors.midgrey }}>ASAP</MediumText>
              </View>
            </TouchableOpacity>
        }

        {isGroupPending && <IndicatorOverlay horizontal text='Still saving...' opacity='EA' />}
      </View>
    </TouchableOpacity >
  )

}


const styles = StyleSheet.create({
  billGroup: {
    flexDirection: 'row',
    marginTop: 10,
  },
  asapButton: {
    marginLeft: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  }

});
import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text
} from 'react-native';
import { LargeText, MediumText, } from '../../utils/components/NewStyledText';
import centsToDollar from '../../utils/functions/centsToDollar';
import Layout from '../../utils/constants/Layout';
import { useLineItem } from '../../hooks/useLineItems4';
import Colors from '../../utils/constants/Colors';
import { MaterialCommunityIcons, } from '@expo/vector-icons';

// import { selectIsTableWithMultipleBills } from '../../redux/selectors/selectorsTableStatus';

// See https://reactnative.dev/docs/layoutanimation



// Very redundant with OrderLineItem
export default function BillLineItem({
  bill_id,
  lineItemID,
  disabled,
  setEditLineItemID,
}) {
  const {
    bill_item_ids = [],
    name,
    captions: { size, filters, modifiers, upsells, custom, comped } = {},
    summary: { subtotal },
    voided: { is_voided },
    timestamps,
    user_id
  } = useLineItem(bill_id, lineItemID)

  const quantity = bill_item_ids.length || 0

  //  ...isEditing / isSimilar && { backgroundColor: Colors.yellow + '8A' }

  return <TouchableOpacity disabled={disabled} style={{ borderColor: Colors.lightgrey, borderBottomWidth: StyleSheet.hairlineWidth }} onPress={() => setEditLineItemID(lineItemID)}>
    <View style={{ flexDirection: 'row', paddingVertical: 12, paddingHorizontal: Layout.marHor, }}>
      <View style={{ width: 50 }}>
        <LargeText center style={is_voided && styles.voided}><Text>{quantity}</Text></LargeText>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
          <LargeText style={is_voided && styles.voided}>{size ? `(${size.toUpperCase()}) ` : ''}{name}</LargeText>
          <MaterialCommunityIcons name='printer-off' size={20} color={Colors.white} style={{ marginLeft: 6, opacity: Number(!!(timestamps.marked && !timestamps.printed)) }} />
        </View>
        {!!is_voided && <MediumText red bold>{user_id === 'server' ? 'DELETED' : 'VOIDED'}</MediumText>}
        {!!comped && <MediumText bold>{comped}</MediumText>}
        {!!filters && <MediumText bold style={{ color: is_voided ? Colors.white : Colors.red, ...is_voided && styles.voided, }}>{filters.toUpperCase()}</MediumText>}
        {!!modifiers && <MediumText style={is_voided && styles.voided} >{modifiers}</MediumText>}
        {!!upsells && <MediumText style={is_voided && styles.voided} >{upsells}</MediumText>}
        {!!custom && <MediumText style={is_voided && styles.voided}>CUSTOM: {custom}</MediumText>}
      </View>
      <LargeText style={is_voided && styles.voided}>{centsToDollar(subtotal * quantity)}</LargeText>
    </View>
  </TouchableOpacity >
}

const styles = StyleSheet.create({
  voided: {
    textDecorationLine: 'line-through'
  }
});


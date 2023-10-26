import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { MediumText, SuperLargeText } from '../../utils/components/NewStyledText';
import { FontAwesome, } from '@expo/vector-icons';
import useBillNestedFields from '../../hooks/useBillNestedFields';
import plurarize from '../../utils/functions/plurarize';
import useRestaurantNestedFields from '../../hooks/useRestaurantNestedField';


export const PartySizeButton = ({ bill_id, setShowPartySize }) => {
  const is_automatic_gratuity_on = useBillNestedFields(bill_id, 'gratuities', 'is_automatic_gratuity_on')
  const partyBoundary = useRestaurantNestedFields('gratuities', 'automatic', 'party_size')
  const party_size = useBillNestedFields(bill_id, 'party', 'party_size')

  const icon = useMemo(() => (
    // <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
    <SuperLargeText style={{ paddingHorizontal: 5 }}>{party_size || 0}</SuperLargeText>
    // <FontAwesome
    //   name={party_size < partyBoundary ? 'user' : 'group'}
    //  size={30}
    //   color={Colors.white}
    //  />
    // </View>
  ), [party_size, partyBoundary])

  return <BillButton onPress={() => setShowPartySize(true)} icon={icon} text={party_size === 1, 'Guest', 'Guests'} color={typeof party_size === 'number' ? is_automatic_gratuity_on ? Colors.purple : undefined : Colors.red} />
}

export const BillButton = ({ color: backgroundColor, icon, text, onPress, disabled }) => {
  const color = disabled ? Colors.midgrey : Colors.white
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={{ flex: 1, }}>
      <View style={{ backgroundColor, minHeight: 48, flexDirection: 'row', alignItems: 'center', margin: 3, borderColor: Colors.white, borderWidth: 1, flex: 1, borderRadius: 4 }}>
        <View style={{ paddingHorizontal: 6 }}>
          {icon}
        </View>
        <MediumText style={{ flex: 1, color }}>{text}</MediumText>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    margin: 2,
    // alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 20
  }
});


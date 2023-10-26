import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import centsToDollar from '../../utils/functions/centsToDollar';
import { getNameOfUser } from '../../utils/functions/names';
import Colors from '../../utils/constants/Colors';
import { LargeText, MediumText } from '../../utils/components/NewStyledText';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useBillUserNames } from '../../utils/hooks/useBillUsers';
import { useMyID } from '../../utils/hooks/useUser';

export default function CartOwner({ subtotal, isCart, selectAll, isOneSelected, isPaused, user_id }) {
  const myID = useMyID()
  const billUserNames = useBillUserNames()

  return (
    <View style={styles.cartOwner}>
      <LargeText style={{ flex: 1 }}>{myID === user_id ? 'Your' : `${getNameOfUser(user_id, billUserNames, true)}'s`} {isCart ? 'cart' : 'order'}</LargeText>
      {
        isCart ?
          <LargeText>{centsToDollar(subtotal)}</LargeText> :
          <TouchableOpacity disabled={!isPaused} onPress={selectAll}>
            <MediumText style={{ color: !isPaused ? Colors.darkgrey : Colors.white }}>{isOneSelected ? 'Unselect' : 'Select all'}</MediumText>
          </TouchableOpacity>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  cartOwner: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomColor: Colors.white,
    borderBottomWidth: 1,
    marginTop: 25,
  },

});
import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  UIManager,

  Animated,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, LargeText, MediumText, SuperLargeText } from '../../utils/components/NewStyledText';
import centsToDollar from '../../utils/functions/centsToDollar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

const QUANTITY_WIDTH = 50


export default function OrderLineItem({
  animateColor,
  color = Colors.background,
  bill_id,
  quantity,
  subtotal,
  bill_item_ids,
  isSelected,
  setVisibleLineItems,
  name,
  captions: { size = '', filters = '', upsells = '', modifiers = '', custom = '', },
}) {
  const [nameLeftPosition, setNameLeftPosition] = useState(null)
  return <TouchableOpacity onPress={() => setVisibleLineItems(prev => ({
    ...prev,
    [bill_id]: prev[bill_id].map(lineItem => {
      if (lineItem.bill_item_ids[0] === bill_item_ids[0]) {
        return ({ ...lineItem, isSelected: !lineItem.isSelected })
      }
      return lineItem
    })
  }))}>
    <Animated.View style={{
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginVertical: 2,
      backgroundColor: animateColor.interpolate({
        inputRange: [0, 1.2],
        outputRange: [Colors.background, color]
      })
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View onLayout={({ nativeEvent }) => setNameLeftPosition(nativeEvent.layout.width + QUANTITY_WIDTH)}>
          <MaterialCommunityIcons
            name='checkbox-marked-circle-outline'
            color={isSelected ? Colors.green : Colors.darkgrey}
            size={30}
          />
        </View>
        <View style={{ width: QUANTITY_WIDTH }}>
          <LargeText center>{quantity}</LargeText>
        </View>
        <View style={{ flex: 1 }}>
          <LargeText>{size ? `(${size.toUpperCase()}) ` : ''}{name}</LargeText>
          {/* <LargeText>{size ? `(${size.toUpperCase()}) ` : ''}{name}   (@{centsToDollar(subtotal)})</LargeText> */}
          {/* {!!size && <MediumText bold>{size.toUpperCase()}</MediumText>} */}

        </View>
        <LargeText>{centsToDollar(subtotal * quantity)}</LargeText>
        {/* <TouchableOpacity style={{ paddingLeft: 16 }} onPress={() => setEditLineItem({ bill_id, lineItemID })}>
          <MaterialCommunityIcons name='square-edit-outline' color={Colors.red} size={30} />
        </TouchableOpacity> */}
      </View>
      <View style={{ marginLeft: nameLeftPosition }}>
        {!!filters && <MediumText red bold>{filters.toUpperCase()}</MediumText>}
        {!!modifiers && <MediumText>{modifiers}</MediumText>}
        {!!upsells && <MediumText>{upsells}</MediumText>}
        {!!custom && <MediumText>CUSTOM: {custom}</MediumText>}
      </View>
    </Animated.View>
  </TouchableOpacity>
}

const styles = StyleSheet.create({
});


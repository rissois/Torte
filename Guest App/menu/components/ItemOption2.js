import React, { } from 'react';
import {
  PixelRatio,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../utils/constants/Colors';
import { DefaultText, MediumText } from '../../utils/components/NewStyledText';
import { useSelector } from 'react-redux';
import { selectIsEditableByMe, } from '../../redux/selectors/selectorsBillGroups';


// htps://react-redux.js.org/api/hooks#useselector-examples

export function ItemOption2({ onToggle, disabled, isSelected, text, }) {
  const isEditableByMe = useSelector(selectIsEditableByMe)

  const isGrey = disabled || (!isEditableByMe && !isSelected) // keep white for appearance if selected

  return (
    <TouchableOpacity disabled={disabled || !isEditableByMe} onPress={onToggle}>
      <View style={{ paddingVertical: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons
            name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
            size={PixelRatio.getFontScale() * 17}
            color={isGrey ? Colors.lightgrey : Colors.white}
            style={{ marginLeft: 4, marginRight: 6 }}
          />
          <MediumText style={{ color: isGrey ? Colors.lightgrey : Colors.white, }}>{text}</MediumText>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export const ItemOptionQuantity2 = ({ max, quantity, onIncrement, modifierMax, modifierQuantity }) => {
  const isEditableByMe = useSelector(selectIsEditableByMe)

  const isUpsell = modifierMax === undefined
  const showMax = isUpsell || max < modifierMax
  const isDisabled = isUpsell ? quantity >= max : quantity >= max || modifierQuantity >= modifierMax

  return <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
    <MaterialIcons
      name='radio-button-checked'
      size={PixelRatio.getFontScale() * 17}
      style={{ opacity: 0, marginRight: 6 }}
    />

    <TouchableOpacity disabled={!isEditableByMe} onPress={() => onIncrement(-1)}>
      <MaterialIcons
        name="remove-circle-outline"
        color={Colors.white}
        size={21 * PixelRatio.getFontScale()}
      />
    </TouchableOpacity>

    <View style={{ width: 40 * PixelRatio.getFontScale() }}>
      <MediumText center>{quantity}</MediumText>
    </View>

    <TouchableOpacity disabled={isDisabled || !isEditableByMe} onPress={() => onIncrement(1)}>
      <MaterialIcons
        name="add-circle-outline"
        color={isDisabled ? Colors.midgrey : Colors.white}
        size={21 * PixelRatio.getFontScale()}
      />
    </TouchableOpacity>

    {showMax && <DefaultText style={{ marginLeft: 16 * PixelRatio.getFontScale() }}>(max {max})</DefaultText>}
  </View>
}


const styles = StyleSheet.create({

});


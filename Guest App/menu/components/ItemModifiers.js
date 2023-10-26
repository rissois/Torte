import React, { useState, useMemo, useCallback, } from 'react';
import {
  StyleSheet,
  View,
  PixelRatio,
  TouchableOpacity,
  Animated,
} from 'react-native';

import { useSelector, useDispatch } from 'react-redux';
import { DefaultText, MediumText } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { doSelectionsModifierToggle } from '../../redux/actions/actionsSelections';
import { appendPriceToName } from '../functions/appendPriceToName';
import plurarize from '../../utils/functions/plurarize';
import { useModifier } from '../../utils/hooks/useModifiers';
import { selectTrackedItemModiferIDs } from '../../redux/selectors/selectorsItems';
import { useModifierSelectedQuantity, useModSelectedQuantity } from '../../utils/hooks/useSelections';
import { useOptionOrItemOption } from '../../utils/hooks/useOptions';
import { useActiveFilterKeys } from '../../utils/hooks/useFilters';
import { ItemOption2, ItemOptionQuantity2 } from './ItemOption2';


export default function ItemModifiers({ incompleteModifiers, animateRed, setModifierHeights }) {
  const modifiersIDs = useSelector(selectTrackedItemModiferIDs)

  if (!modifiersIDs.length) return null

  return (
    <View style={{ marginTop: 6 }}>
      {
        modifiersIDs.map((modifier_id, index) => <View key={modifier_id} onLayout={({ nativeEvent }) => setModifierHeights(prev => ({
          ...prev, [modifier_id]: {
            modifier_id,
            height: nativeEvent.layout.height,
            index,
          }
        }))}>
          <Modifier modifier_id={modifier_id} index={index} animateRed={animateRed} incompleteModifier={incompleteModifiers.some(modifier => modifier.modifier_id === modifier_id)} />
        </View>
        )
      }
    </View>
  )
}

const Modifier = ({ modifier_id, index, incompleteModifier, animateRed }) => {
  const { name, min, max, mods, modifier_first_free, is_minimized } = useModifier(modifier_id)
  const quantity = useModifierSelectedQuantity(modifier_id)

  const dispatch = useDispatch()
  const handleModifierToggle = useCallback(option => () => dispatch(doSelectionsModifierToggle({ modifier_id, name, modifier_first_free, index }, max === 1, option,)), [modifier_id, name, index, modifier_first_free, max,])
  const handleModifierIncrement = useCallback(option => increment => dispatch(doSelectionsModifierToggle({ modifier_id, name, modifier_first_free, index }, max === 1, option, increment)), [modifier_id, name, index, modifier_first_free, max,])

  const [isMinimized, setIsMinimized] = useState(is_minimized && !min)

  return <View style={{ marginVertical: 6 }}>
    <TouchableOpacity onPress={() => setIsMinimized(prev => !prev)}>
      <Animated.View style={[styles.modifierHeader, {
        backgroundColor: incompleteModifier ? animateRed.current.interpolate({
          inputRange: [0, 1],
          outputRange: [Colors.darkgrey, Colors.red]
        }) : Colors.darkgrey,
      }]}>
        <MaterialIcons
          name={isMinimized ? 'chevron-right' : 'expand-more'}
          size={20 * PixelRatio.getFontScale()}
          color={Colors.white}
          style={{ marginRight: 6 }}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', }}>
            <MediumText bold style={{ flex: 1 }}>{name.toUpperCase()}</MediumText>
            {min ? <DefaultText bold red>REQUIRED</DefaultText> : <DefaultText>optional</DefaultText>}
          </View>
          {!!modifier_first_free && <DefaultText>FIRST {modifier_first_free} FREE</DefaultText>}
          {
            min === max ?
              <DefaultText>Select exactly {max}:</DefaultText> :
              min ?
                max === Infinity ?
                  <DefaultText>Select at least {min}:</DefaultText> :
                  <DefaultText>Select between {min} and {max}:</DefaultText> :
                max === Infinity ?
                  <DefaultText>Select any number:</DefaultText> :
                  <DefaultText>Select up to {max}:</DefaultText>
          }
        </View>

      </Animated.View>

    </TouchableOpacity>

    <View style={{ marginLeft: 20 * PixelRatio.getFontScale() + 6, paddingHorizontal: 6, marginTop: 8 }}>
      {isMinimized && !quantity && <MediumText>No {plurarize(min, 'option', 'options', true)} selected</MediumText>}
      {
        mods.map((mod, modIndex) => (
          <Mod
            key={mod.item_id + mod.option_id + mod.variant_id}
            {...mod}
            index={modIndex}
            handleModifierToggle={handleModifierToggle}
            handleModifierIncrement={handleModifierIncrement}
            isMinimized={isMinimized}
            modifierQuantity={quantity}
            modifierMax={max}
            modifierID={modifier_id}
          />
        ))
      }
    </View>
  </View>
}


export function Mod({ item_id = '', option_id = '', variant_id = '', index, handleModifierToggle, handleModifierIncrement, modifierID, isMinimized, modifierQuantity, modifierMax }) {
  const { filters, max = 1, name, price } = useOptionOrItemOption({ item_id, option_id, variant_id })
  const activeFilterKeys = useActiveFilterKeys()

  const quantity = useModSelectedQuantity(modifierID, { item_id, option_id, variant_id, })

  const onToggle = useCallback(handleModifierToggle({ item_id, option_id, variant_id, name, price, index },), [item_id, option_id, variant_id, name, price, handleModifierToggle, index])
  const onIncrement = useCallback(handleModifierIncrement({ item_id, option_id, variant_id, name, price, index }), [item_id, option_id, variant_id, name, price, handleModifierIncrement, index])

  if (isMinimized && !quantity) return null
  return (
    <View>
      <ItemOption2
        onToggle={onToggle}
        isSelected={!!quantity}
        text={appendPriceToName(name, price)}
        disabled={!quantity && modifierMax > 1 && modifierQuantity >= modifierMax}
      />
      {!!quantity && max > 1 && <ItemOptionQuantity2
        max={max}
        modifierMax={modifierMax}
        modifierQuantity={modifierQuantity}
        quantity={quantity}
        onIncrement={onIncrement} />}
    </View>
  )
}

const styles = StyleSheet.create({
  modifierHeader: {
    flexDirection: 'row',
    borderRadius: 6,
    padding: 6,
    borderColor: Colors.white,
    borderWidth: 1,
  },
});


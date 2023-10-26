import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
} from 'react-native';
import useCategoryChild from '../../portal/hooks/useCategoryChild';
import { EditLineItemBox } from './EditLineItemBox';
import { Pages } from '../../utils/components/Pages';
import { OptionQuantity } from './EditModifiers';

// import { selectIsTableWithMultipleBills } from '../../redux/selectors/selectorsTableStatus';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Upsell = ({ id: { item_id, variant_id, option_id, upsell_first_free }, selected = [], index, setSelected }) => {
  const { name, price, max = 1 } = useCategoryChild(item_id ? 'items' : 'options', item_id || option_id, variant_id)

  const quantity = useMemo(() => (selected.find(upsell => item_id === upsell.item_id && variant_id === upsell.variant_id && option_id === upsell.option_id))?.quantity ?? 0, [item_id, variant_id, option_id, selected])
  const onToggle = useCallback(() => setSelected(incrementUpsell({ name, item_id, variant_id, option_id, upsell_first_free, index, price })), [item_id, variant_id, option_id, index, price, upsell_first_free, name])
  const onIncrement = useCallback((increment = 0) => setSelected(incrementUpsell({ name, item_id, variant_id, option_id, upsell_first_free, index, price }, increment)), [item_id, variant_id, option_id, index, price, upsell_first_free, name])

  return <>
    <EditLineItemBox
      isPurple={!!quantity}
      text={name}
      subtext={max > 1 && `(max ${max})`}
      onPress={onToggle}
    />
    {!!quantity && max > 1 && <OptionQuantity max={max} quantity={quantity} onIncrement={onIncrement} />}
  </>
}

// itemUpsells = reference setUpsells = selections
export const EditUpsells = ({ itemUpsells = [], upsells = [], setUpsells, }) => {
  const upsell = useMemo(() => <Upsell setSelected={setUpsells} />)
  return <Pages ids={itemUpsells} selected={upsells} child={upsell} category='upsells' />
}

const incrementUpsell = (upsell, increment = 0) => (prev) => {
  const index = prev.findIndex(existing => existing.item_id === upsell.item_id && existing.option_id === upsell.option_id && existing.variant_id === upsell.variant_id)

  if (~index) {
    let next = [...prev]
    if (!increment || prev[index].quantity + increment <= 0) {
      next.splice(index, 1)
      return next
    }
    next[index].quantity += increment
    return next
  }
  return [...prev, { ...upsell, quantity: 1 }]
}





// export const EditLineItemBox = ({ isPurple, text, onPress, isField, isDisabled }) => {
//   return <View style={[styles.editBoxContainer, { width: isField ? '20%' : '25%', }]}><TouchableOpacity disabled={isDisabled} style={[styles.editBox, { backgroundColor: isDisabled ? Colors.background : isPurple ? Colors.purple : Colors.darkgrey, borderColor: isDisabled ? Colors.darkgrey : Colors.white }]} onPress={onPress}>
//     <LargeText numberOfLines={2} ellipsizeMode='tail' center style={{ fontWeight: isField ? 'bold' : 'normal', color: isDisabled ? Colors.darkgrey : Colors.white }}>{text}</LargeText>
//   </TouchableOpacity>
//   </View>
// }

const styles = StyleSheet.create({
  editBoxContainer: {
    marginTop: 12,
  },
  editBox: {
    justifyContent: 'center',
    borderWidth: 2,
    padding: 8,
    minHeight: 90,
    marginHorizontal: 8,
  },
  editText: {

  }
});


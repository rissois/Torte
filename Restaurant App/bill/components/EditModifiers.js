import React, { useCallback, useEffect, useMemo, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, } from '../../utils/components/NewStyledText';
import { MaterialIcons, } from '@expo/vector-icons';
import useCategoryChild from '../../portal/hooks/useCategoryChild';
import { EditLineItemBox, } from './EditLineItemBox';
import { Pages } from '../../utils/components/Pages';

export const EditModifiers = ({ itemModifierIDs = [], modifiers = {}, setModifiers, selectedModifier, setSelectedModifier, setIncompleteModifiers }) => {

  const modifier = useMemo(() => <Modifier setSelected={setSelectedModifier} setIncompleteModifiers={setIncompleteModifiers} />, [])

  return <View>
    <Pages ids={itemModifierIDs} isCollapsible selected={selectedModifier} modifiers={modifiers} child={modifier} category='modifiers' />
    {!!selectedModifier && <EditMods modifier_id={selectedModifier} modifier={modifiers[selectedModifier]} setModifiers={setModifiers} index={itemModifierIDs.indexOf(selectedModifier)} />}
  </View>
}

const countModifierQuantity = (modifier) => modifier?.mods?.reduce((acc, option) => acc + option.quantity, 0) ?? 0

const Modifier = ({ id, selected, setSelected, modifier, setIncompleteModifiers }) => {
  const { name, max = 1, min } = useCategoryChild('modifiers', id)

  const quantity = useMemo(() => {
    if (!min) return 0
    return countModifierQuantity(modifier)
  }, [min, modifier])

  const range = useMemo(() => max ? min ? max === min ? `(exactly ${max})` : ` (${min} - ${max})` : max === Infinity ? '(any)' : ` (max ${max})` : min ? ` (min ${min})` : '', [max, min])

  useEffect(() => {
    setIncompleteModifiers(prev => ({ ...prev, [id]: quantity < min ? name : false }))
  }, [min, quantity, id, name])

  return <EditLineItemBox
    isPurple={selected === id}
    isRed={!!min && quantity < min}
    text={name}
    subtext={range}
    onPress={() => setSelected(prev => prev === id ? null : id)}
  />
}


const EditMods = ({ modifier_id, modifier, setModifiers, index }) => {
  const { mods, name, max: modifierMax, modifier_first_free } = useCategoryChild('modifiers', modifier_id)

  const modifierQuantity = useMemo(() => countModifierQuantity(modifier), [modifier])
  const handleModifierToggle = useCallback(option => () => setModifiers(incrementModifier({ modifier_id, name, modifier_first_free, index }, modifierMax === 1, option,)), [modifier_id, name, index, modifier_first_free, modifierMax,])
  const handleModifierIncrement = useCallback(option => increment => setModifiers(incrementModifier({ modifier_id, name, modifier_first_free, index }, modifierMax === 1, option, increment)), [modifier_id, name, index, modifier_first_free, modifierMax,])

  const mod = useMemo(() => <Mod />, [])

  return <Pages ids={mods} selected={modifier?.mods} child={mod} modifierQuantity={modifierQuantity} modifierMax={modifierMax} handleModifierToggle={handleModifierToggle} handleModifierIncrement={handleModifierIncrement} category='mods' />
}


const incrementModifier = (modifier, isMaxOfOne, mod, increment,) => (prev) => {
  const { modifier_id } = modifier

  if (!prev[modifier_id] || isMaxOfOne) {
    return {
      ...prev,
      [modifier_id]: {
        ...modifier,
        mods: [{ ...mod, quantity: 1 }]
      }
    }
  }

  let mods = [...prev[modifier_id].mods]
  const index = mods.findIndex(existing => existing.item_id === mod.item_id && existing.option_id === mod.option_id && existing.variant_id === mod.variant_id)

  if (~index) {
    if (!increment || mods[index].quantity + increment <= 0) {
      if (mods.length === 1) {
        const { [modifier_id]: discard, ...keep } = prev
        return keep
      }
      mods.splice(index, 1)
    }
    else {
      mods[index].quantity += increment
    }

    return {
      ...prev,
      [modifier_id]: {
        ...prev[modifier_id],
        mods
      }
    }
  }
  return {
    ...prev,
    [modifier_id]: {
      ...prev[modifier_id],
      mods: [...mods, { ...mod, quantity: 1 }]
    }
  }
}

export const Mod = ({ id: { item_id, variant_id, option_id, }, selected = [], index, handleModifierIncrement, handleModifierToggle, modifierQuantity, modifierMax }) => {
  const { name, price, max = 1 } = useCategoryChild(item_id ? 'items' : 'options', item_id || option_id, variant_id)

  const quantity = useMemo(() => (selected.find(mod => item_id === mod.item_id && variant_id === mod.variant_id && option_id === mod.option_id))?.quantity ?? 0, [item_id, variant_id, option_id, selected])
  const onToggle = useCallback(handleModifierToggle({ item_id, option_id, variant_id, name, price, index },), [item_id, option_id, variant_id, name, price, handleModifierToggle, index])
  const onIncrement = useCallback(handleModifierIncrement({ item_id, option_id, variant_id, name, price, index }), [item_id, option_id, variant_id, name, price, handleModifierIncrement, index])

  return <>
    <EditLineItemBox
      isPurple={!!quantity}
      text={name}
      subtext={max > 1 && `(max ${max})`}
      onPress={onToggle}
      isDisabled={modifierMax > 1 && !quantity && modifierQuantity >= modifierMax}
    />
    {!!quantity && max > 1 && <OptionQuantity max={max} quantity={quantity} onIncrement={onIncrement} modifierMax={modifierMax}
      modifierQuantity={modifierQuantity} />}
  </>
}

export const OptionQuantity = ({ max, quantity, onIncrement, modifierMax, modifierQuantity }) => {
  const isUpsell = modifierMax === undefined
  const isDisabled = isUpsell ? quantity >= max : quantity >= max || modifierQuantity >= modifierMax

  return <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 20, justifyContent: 'center' }}>
    <TouchableOpacity onPress={() => onIncrement(-1)}>
      <MaterialIcons
        name="remove-circle-outline"
        color={Colors.white}
        size={30}
      />
    </TouchableOpacity>

    <View style={{ width: 70 }}>
      <ExtraLargeText center>{quantity}</ExtraLargeText>
    </View>

    <TouchableOpacity disabled={isDisabled} onPress={() => onIncrement(1)}>
      <MaterialIcons
        name="add-circle-outline"
        color={isDisabled ? Colors.midgrey : Colors.white}
        size={30}
      />
    </TouchableOpacity>
  </View>
}

const styles = StyleSheet.create({

});


import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,

} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { LargeText, MediumText, } from '../../utils/components/NewStyledText';

import centsToDollar from '../../utils/functions/centsToDollar';
import { ScrollView } from 'react-native-gesture-handler';
import { customToArray, filtersToArray, optionsToArray, optionsToCaption } from '../../utils/functions/summarizeSelections';
import useCategoryChild from '../../portal/hooks/useCategoryChild';
import { singleSubtotal } from '../../utils/functions/singleSubtotal';
// import { selectIsTableWithMultipleBills } from '../../redux/selectors/selectorsTableStatus';

// See https://reactnative.dev/docs/layoutanimation

const commaPrefix = (index, length) => length === 1 ? ''
  : length === 2 ? (index ? ' and ' : '')
    : index === length - 1 ? ', and ' : index ? ', ' : ''

const NoField = ({ field, isRedBold }) => <MediumText style={{ marginTop: 1, ...isRedBold && { color: Colors.red, fontWeight: 'bold' } }}>(no {field})</MediumText>


// Very redundant with OrderLineItem
export default function LineItemChanges({
  comped, size, filters, modifiers, upsells, quantity, custom,
  currentSize, currentFilters, currentModifiers, currentUpsells, currentQuantity, currentSubtotal, currentCustom,
  editQuantity, item_id, variant_id
}) {
  const { modifier_ids, } = useCategoryChild('items', item_id, variant_id)
  const subtotal = useMemo(() => singleSubtotal({ size, filters, modifiers, upsells, custom, comped, }), [size, filters, modifiers, upsells, custom, comped])

  const quantityBeforeAfter = useMemo(() => (
    <BeforeAndAfter
      before={<LargeText>Quantity: {currentQuantity}</LargeText>}
      after={<LargeText>Quantity: <Text style={[quantity < currentQuantity ? styles.redBold : quantity > currentQuantity && styles.greenBold]}>{quantity}<Text style={styles.greenBold}>{editQuantity && editQuantity !== quantity ? ` (editing ${editQuantity})` : ''}</Text></Text></LargeText>}
    />
  ), [quantity, currentQuantity, editQuantity])

  const priceBeforeAfter = useMemo(() => {
    const currentTotal = currentQuantity * currentSubtotal
    const total = quantity * subtotal
    const editedTotal = editQuantity * subtotal
    const uneditedTotal = total - editedTotal

    return <BeforeAndAfter
      before={<View>
        <LargeText>{centsToDollar(currentSubtotal)} each ({centsToDollar(currentTotal)} TOTAL)</LargeText>
        {!!comped.is_comped && <LargeText>COMPED {comped.percent ? `${comped.percent}%` : centsToDollar(comped.subtotal)}</LargeText>}
      </View>}
      after={editQuantity && quantity !== editQuantity ?
        <View>
          <LargeText>{centsToDollar(currentSubtotal)} each ({centsToDollar(uneditedTotal)} TOTAL)</LargeText>
          <LargeText style={styles.greenBold}>{centsToDollar(subtotal)} each ({centsToDollar(editedTotal)} TOTAL)</LargeText>
          {!!comped.is_comped && <LargeText>COMPED {comped.percent ? `${comped.percent}%` : centsToDollar(comped.subtotal)}</LargeText>}
        </View> :
        <View>
          <LargeText><Text style={[subtotal < currentSubtotal ? styles.redBold : subtotal > currentSubtotal && styles.greenBold]}>{centsToDollar(subtotal)}</Text> each (<Text style={[total < currentTotal ? styles.redBold : total > currentTotal && styles.greenBold]}>{centsToDollar(total)}</Text> TOTAL)</LargeText>
          {!!comped.is_comped && <LargeText>COMPED {comped.percent ? `${comped.percent}%` : centsToDollar(comped.subtotal)}</LargeText>}
        </View>
      }
    />
  }, [quantity, currentQuantity, subtotal, currentSubtotal, editQuantity, comped])

  const sizeBeforeAfter = useMemo(() => {
    if (!currentSize?.code && !size?.code) return null
    const isSizeAltered = currentSize?.code !== size?.code
    return <BeforeAndAfter
      before={currentSize?.name ? <LargeText><Text style={[isSizeAltered && styles.strikeThrough]}>{currentSize.name}</Text></LargeText> : <NoField field='size' />}
      after={size?.name ? <LargeText><Text style={[isSizeAltered && styles.bold]}>{size.name}</Text></LargeText> : <NoField isRedBold field='size' />}
    />
  }, [size, currentSize])

  const filtersBeforeAfter = useMemo(() => {
    if (!Object.keys(filters).length && !Object.keys(currentFilters).length) return null

    const currentArray = filtersToArray(currentFilters)
    const array = filtersToArray(filters)

    return <BeforeAndAfter
      before={currentArray.length
        ? <LargeText>{currentArray.map((text, index) => <Text key={text} style={[!array.includes(text) && styles.strikeThrough]}>{commaPrefix(index, currentArray.length)}{text}</Text>)}</LargeText>
        : <NoField field='filters' />}
      after={array.length
        ? <LargeText red>{array.map((text, index) => <Text key={text} style={[!currentArray.includes(text) && styles.bold]}>{commaPrefix(index, array.length)}{text}</Text>)}</LargeText>
        : <NoField field='filters' />}
    />
  }, [filters, currentFilters])

  const modifiersBeforeAfter = useMemo(() => {
    if (!Object.keys(modifiers).length && !Object.keys(currentModifiers).length) return null

    let modifierOrder = {}
    Object.keys(currentModifiers).forEach(modifier_id => modifierOrder[modifier_id] = currentModifiers[modifier_id].index)
    Object.keys(modifiers).forEach(modifier_id => modifierOrder[modifier_id] = modifiers[modifier_id].index)

    let modifierArray = []
    Object.keys(modifierOrder).sort((a, b) => modifierOrder[a] - modifierOrder[b]).forEach(modifier_id => {
      const name = modifiers[modifier_id]?.name || currentModifiers[modifier_id]?.name
      if (!currentModifiers[modifier_id]) {
        modifierArray.push(<BeforeAndAfter key={modifier_id}
          before={<NoField field={name} />}
          after={<LargeText style={styles.greenBold}>{name.toUpperCase()}: {optionsToCaption(modifiers[modifier_id].mods)}</LargeText>}
        />)
      }
      else if (!modifiers[modifier_id]) {
        modifierArray.push(<BeforeAndAfter key={modifier_id}
          before={<LargeText style={styles.strikeThrough}>{name.toUpperCase()}: {optionsToCaption(currentModifiers[modifier_id].mods)}</LargeText>}
          after={<NoField field={name} isRedBold />}
        />)
      }
      else {
        const modArray = optionsToArray(modifiers[modifier_id].mods)
        const currentModArray = optionsToArray(currentModifiers[modifier_id].mods)

        modifierArray.push(<BeforeAndAfter key={modifier_id}
          before={<LargeText key={name}>{name.toUpperCase()}: {currentModArray.length
            ? currentModArray.map((text, index) => <Text key={text} style={[!modArray.includes(text) && styles.strikeThrough]}>{commaPrefix(index, currentModArray.length)}{text}</Text>)
            : <NoField field='mods' />}</LargeText>}
          after={<LargeText>{name.toUpperCase()}: {modArray.length
            ? modArray.map((text, index) => <Text key={text} style={[!currentModArray.includes(text) && styles.bold]}>{commaPrefix(index, modArray.length)}{text}</Text>)
            : <NoField field='mods' />}</LargeText>}
        />)
      }
    })

    return modifierArray
  }, [modifiers, currentModifiers, modifier_ids])

  const upsellsBeforeAfter = useMemo(() => {
    if (!upsells.length && !currentUpsells.length) return null

    // Alternatively, copy modifier above to simplify when one of arrays is empty

    const currentArray = optionsToArray(currentUpsells)
    const array = optionsToArray(upsells)

    return <BeforeAndAfter
      before={currentArray.length
        ? <LargeText>{currentArray.map((text, index) => <Text key={text} style={[!array.includes(text) && styles.strikeThrough]}>{commaPrefix(index, currentArray.length)}{text}</Text>)}</LargeText>
        : <NoField field='upsells' />}
      after={array.length
        ? <LargeText>{array.map((text, index) => <Text key={text} style={[!currentArray.includes(text) && styles.bold]}>{commaPrefix(index, array.length)}{text}</Text>)}</LargeText>
        : <NoField field='upsells' />}
    />
  }, [upsells, currentUpsells])

  const customBeforeAfter = useMemo(() => {
    if (!custom.length && !currentCustom.length) return null

    const currentArray = customToArray(currentCustom)
    const array = customToArray(custom)

    return <BeforeAndAfter
      before={currentArray.length
        ? <LargeText>{currentArray.map((text, index) => <Text key={text} style={[!array.includes(text) && styles.strikeThrough]}>{commaPrefix(index, currentArray.length)}{text}</Text>)}</LargeText>
        : <NoField field='custom' />}
      after={array.length
        ? <LargeText>{array.map((text, index) => <Text key={text} style={[!currentArray.includes(text) && styles.bold]}>{commaPrefix(index, array.length)}{text}</Text>)}</LargeText>
        : <NoField field='custom' />}
    />
  }, [custom, currentCustom])

  return <ScrollView style={{ maxHeight: '25%', flex: 0, flexGrow: 0, marginBottom: 20 }} >
    <View style={styles.row}>
      <View style={[styles.before, styles.box, { paddingTop: 0, paddingBottom: 6, borderTopWidth: 2 }]} />
      <View style={[styles.after, styles.box, { paddingTop: 0, paddingBottom: 6, borderTopWidth: 2 }]} />
    </View>
    <BeforeAndAfter
      before={<LargeText center bold style={{ letterSpacing: 1 }}>BEFORE</LargeText>}
      after={<LargeText center bold style={{ letterSpacing: 1 }}>AFTER</LargeText>}
    />
    {quantityBeforeAfter}
    {priceBeforeAfter}
    {sizeBeforeAfter}
    {filtersBeforeAfter}
    {modifiersBeforeAfter}
    {upsellsBeforeAfter}
    {customBeforeAfter}
    <View style={styles.row}>
      <View style={[styles.before, styles.box, { paddingTop: 6, paddingBottom: 0, borderBottomWidth: 2 }]} />
      <View style={[styles.after, styles.box, { paddingTop: 6, paddingBottom: 0, borderBottomWidth: 2 }]} />
    </View>
  </ScrollView>
}

const BeforeAndAfter = ({ before, after }) => (
  <View style={styles.row}>
    <View style={[styles.box, styles.before]}>
      {before}
    </View>
    <View style={[styles.box, styles.after]}>
      {after}
    </View>
  </View>
)

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row'
  },
  before: {
    backgroundColor: Colors.darkgrey,
    borderColor: Colors.darkgrey
  },
  after: {
    borderColor: Colors.green
  },
  box: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 1,
    marginHorizontal: 8,
    borderRightWidth: 2,
    borderLeftWidth: 2,
  },
  redBold: {
    color: Colors.red,
    fontWeight: 'bold'
  },
  greenBold: {
    color: Colors.green,
    fontWeight: 'bold'
  },
  strikeThrough: {
    textDecorationLine: 'line-through'
  },
  bold: {
    fontWeight: 'bold'
  },
  none: {}
});


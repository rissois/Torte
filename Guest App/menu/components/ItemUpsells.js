import React, { useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  PixelRatio,
} from 'react-native';
import { MediumText } from '../../utils/components/NewStyledText';
import { useDispatch, useSelector } from 'react-redux';
import { doSelectionsUpsellToggle } from '../../redux/actions/actionsSelections';
import { appendPriceToName } from '../functions/appendPriceToName';
import { selectTrackedItem } from '../../redux/selectors/selectorsItems';
import { useOptionOrItemOption } from '../../utils/hooks/useOptions';
// import checkIsOptionFilteredOut from '../functions/checkIsOptionFilteredOut';
import { ItemOption2, ItemOptionQuantity2 } from './ItemOption2';
import { useActiveFilterKeys } from '../../utils/hooks/useFilters';
import { useUpsellSelectedQuantity } from '../../utils/hooks/useSelections';


export default function ItemUpsells() {
  const {
    upsells = [],
  } = useSelector(selectTrackedItem)

  if (!upsells.length) return null

  return (
    <View style={{ marginTop: 20 }}>
      <MediumText bold style={{ paddingBottom: 4 }}>Recommended add-ons:</MediumText>
      <View style={{ marginLeft: 20 * PixelRatio.getFontScale() + 6 }}>
        {
          upsells.map((upsell, index) => <Upsell key={upsell.item_id + upsell.option_id + upsell.variant_id} {...upsell} index={index} />)
        }
      </View>
    </View>
  )
}


export function Upsell({ item_id = '', option_id = '', variant_id = '', upsell_first_free = 0, index }) {
  const dispatch = useDispatch()

  const { filters, max = 1, name, price } = useOptionOrItemOption({ item_id, option_id, variant_id })
  const activeFilterKeys = useActiveFilterKeys()

  const quantity = useUpsellSelectedQuantity({ item_id, option_id, variant_id })

  const onToggle = useCallback(() => dispatch(doSelectionsUpsellToggle({ item_id, option_id, variant_id, name, price, upsell_first_free, index },)), [item_id, option_id, variant_id, name, price, upsell_first_free, index])
  const onIncrement = useCallback((increment) => dispatch(doSelectionsUpsellToggle({ item_id, option_id, variant_id, name, price, upsell_first_free, index }, increment)), [item_id, option_id, variant_id, name, price, upsell_first_free, index])

  return (
    <View>
      <ItemOption2
        onToggle={onToggle}
        isSelected={!!quantity}
        text={quantity >= upsell_first_free ? appendPriceToName(name, price) : `${name} (first ${upsell_first_free} free)`}
      />
      {!!quantity && max > 1 && <ItemOptionQuantity2 max={max} quantity={quantity} onIncrement={onIncrement} />}
    </View>
  )
}

const styles = StyleSheet.create({

});


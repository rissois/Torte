import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import useCategoryChild from '../../portal/hooks/useCategoryChild';
import { EditFilters } from './EditFilters';
import { EditSize } from './EditSize';
import { EditLineItemBox } from './EditLineItemBox';
import { EditUpsells } from './EditUpsells';
import { EditModifiers } from './EditModifiers';
import { EditCustom } from './EditCustom';
import { shallowEqual, useSelector } from 'react-redux';
import { selectRequiredModifiers } from '../../redux/selectors/selectorsModifiers';

export const EditLineItem = ({ item_id, variant_id, size, setSize, filters, setFilters, modifiers, setModifiers, upsells, setUpsells, incompleteModifiers, setIncompleteModifiers, custom, setCustom, setEditCustomIndex, isNew }) => {
  /*
    ITEM_ID and VARIANT_ID
    size, filters, modifiers, upsells
  */
  const [selectedModifier, setSelectedModifier] = useState('')

  const {
    sizes: itemSizes = [],
    filters: itemFilters = {},
    modifier_ids: itemModifierIDs = [],
    upsells: itemUpsells = [],
    is_filter_list_approved = false,
  } = useCategoryChild('items', item_id, variant_id)
  const requiredModifiers = useSelector(selectRequiredModifiers, shallowEqual)

  const [field, setField] = useState('')

  useEffect(() => {
    if (isNew) {
      if (itemSizes.length === 1) {
        setSize(itemSizes[0])
      }
      else setSize(null)
      setFilters({})
      setModifiers({})
      setUpsells([])
      setIncompleteModifiers(itemModifierIDs.filter(modifier_id => requiredModifiers.includes(modifier_id)).reduce((acc, curr) => ({ ...acc, [curr]: true }), {}))
      setCustom([])
    }
  }, [item_id, isNew])

  useEffect(() => {
    const isItemWithSelectableFitlers = is_filter_list_approved && Object.values(itemFilters).some(value => typeof value === 'number')
    setField(itemSizes.length > 1 ? 'size' : isItemWithSelectableFitlers ? Object.keys(itemModifierIDs).length ? 'modifiers' : 'filters' : itemUpsells.length ? 'upsells' : 'custom')
  }, [item_id])

  return <View style={{ flex: 1 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 12, borderBottomColor: Colors.white, borderBottomWidth: 1 }}>
      <EditLineItemBox text='SIZE' isPurple={field === 'size'} isRed={itemSizes.length > 1 && !size?.name} onPress={() => setField('size')} isDisabled={itemSizes.length < 2} isFifth />
      <EditLineItemBox text={`DIET & ALLERGY`} isPurple={field === 'filters'} onPress={() => setField('filters')} isDisabled={!is_filter_list_approved} isFifth />
      <EditLineItemBox text='MODIFIERS'
        isPurple={field === 'modifiers'}
        isRed={itemModifierIDs.some(id => (isNew && requiredModifiers.includes(id)) && incompleteModifiers[id] !== false)}
        onPress={() => {
          setField('modifiers')
          setSelectedModifier(Object.keys(itemModifierIDs).length === 1 ? itemModifierIDs[0] : '')
        }}
        isDisabled={!Object.keys(itemModifierIDs).length}
        isFifth />
      <EditLineItemBox text='UPSELLS' isPurple={field === 'upsells'} onPress={() => setField('upsells')} isDisabled={!itemUpsells.length} isFifth />
      <EditLineItemBox text='CUSTOM' isRed={custom.some(c => !c.name)} isPurple={field === 'custom'} onPress={() => setField('custom')} isFifth />
    </View>
    {
      field === 'size' && <EditSize itemSizes={itemSizes} size={size} setSize={setSize} />
    }
    {
      field === 'filters' && <EditFilters itemFilters={itemFilters} filters={filters} setFilters={setFilters} />
    }
    {
      field === 'upsells' && <EditUpsells itemUpsells={itemUpsells} upsells={upsells} setUpsells={setUpsells} />
    }
    {
      field === 'modifiers' && <EditModifiers itemModifierIDs={itemModifierIDs} modifiers={modifiers} setModifiers={setModifiers} selectedModifier={selectedModifier} setSelectedModifier={setSelectedModifier} setIncompleteModifiers={setIncompleteModifiers} />
    }
    {
      field === 'custom' && <EditCustom custom={custom} setCustom={setCustom} setEditCustomIndex={setEditCustomIndex} />
    }
  </View>
}

const styles = StyleSheet.create({

});


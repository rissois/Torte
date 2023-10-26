import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, LargeText, SuperLargeText } from '../../utils/components/NewStyledText';
import Header from '../../utils/components/Header';
import Layout from '../../utils/constants/Layout';
import { useDispatch, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { useLineItemNestedField, } from '../../hooks/useLineItems4';
import StyledButton from '../../utils/components/StyledButton';
import { TypeButton, SelectAll } from './LineItemSelectorButtons';
import { LineItemUsers } from './LineItemUsers';
import { useBillItem, useBillItemComped, useBillItemCustom, useBillItemFilters, useBillItemModifiers, useBillItemSize, useBillItemTaxRateID, useBillItemUpsells } from '../../utils/hooks/useBillItem';
import LineItemChanges from './LineItemChanges';
import { transactEditBillItem } from '../firestore/transactEditBillItems';
import arrayToCommaList from '../../utils/functions/arrayToCommaList';
import plurarize from '../../utils/functions/plurarize';
import { EditLineItem } from './EditLineItem';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import equalArrays from '../../utils/functions/equalArrays';
import { EditCustomPopUp } from './EditCustom';
import useBillNestedFields from '../../hooks/useBillNestedFields';

// import { selectIsTableWithMultipleBills } from '../../redux/selectors/selectorsTableStatus';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const identicalObjects = (a = {}, b = {}) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => a[key] === b[key])
const identicalOptions = (a = [], b = []) => a.length === b.length &&
  a.every(a_upsell => b.some(b_upsell => identicalObjects(a_upsell, b_upsell)))

const isSizeIdentical = (a, b) => a?.code === b?.code && a?.name === b?.name && a?.price === b?.price
const isFiltersIdentical = (a = {}, b = {}) => identicalObjects(a, b)
const isModifiersIdentical = (a = {}, b = {}) => Object.keys(a).length === Object.keys(b).length &&
  Object.keys(a).every(modifier_id => {
    const { mods: a_mods = [], ...a_modifier } = a[modifier_id]
    const { mods: b_mods = [], ...b_modifier } = b[modifier_id]
    return identicalOptions(a_mods, b_mods) && identicalObjects(a_modifier, b_modifier)
  })

const isUpsellsIdentical = (a = [], b = []) => identicalOptions(a, b)

export default function LineItemEditor({ bill_id, lineItemID, close, isOrder, tableName }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const billCode = useBillNestedFields(bill_id, 'bill_code')

  const [add, setAdd] = useState([])
  const [edit, setEdit] = useState([])
  const [remove, setRemove] = useState([])
  const [unvoid, setUnvoid] = useState([])
  const [inspectNewBillItemIDs, setInspectNewBillItemIDs] = useState(false)

  const reference_ids = useLineItemNestedField(bill_id, lineItemID, isOrder, 'reference_ids')
  const position = useLineItemNestedField(bill_id, lineItemID, isOrder, 'position')
  const item_id = useLineItemNestedField(bill_id, lineItemID, isOrder, 'reference_ids', 'item_id')
  const variant_id = useLineItemNestedField(bill_id, lineItemID, isOrder, 'reference_ids', 'variant_id')
  const is_voided = useLineItemNestedField(bill_id, lineItemID, isOrder, 'voided', 'is_voided')

  const [pressType, setPressType] = useState(is_voided ? 'unvoid' : '')


  const name = useLineItemNestedField(bill_id, lineItemID, isOrder, 'name')
  const tax_rate_id = useLineItemNestedField(bill_id, lineItemID, isOrder, 'tax_rate', 'id')
  const currentSubtotal = useLineItemNestedField(bill_id, lineItemID, isOrder, 'summary', 'subtotal')
  const billItemIDs = useLineItemNestedField(bill_id, lineItemID, isOrder, 'bill_item_ids')

  const currentSize = useBillItemSize(bill_id, billItemIDs?.[0])
  const currentFilters = useBillItemFilters(bill_id, billItemIDs?.[0])
  // const currentFilters = useBillItemFilters(bill_id, billItemIDs?.[0])
  const currentModifiers = useBillItemModifiers(bill_id, billItemIDs?.[0])
  const currentUpsells = useBillItemUpsells(bill_id, billItemIDs?.[0])
  const currentCustom = useBillItemCustom(bill_id, billItemIDs?.[0])
  const comped = useBillItemComped(bill_id, billItemIDs?.[0])

  const [startEdit, setStartEdit] = useState(false)
  const [size, setSize] = useState(currentSize)
  const [filters, setFilters] = useState(currentFilters)
  const [modifiers, setModifiers] = useState(currentModifiers)
  const [custom, setCustom] = useState(currentCustom)
  const [incompleteModifiers, setIncompleteModifiers] = useState({})
  const [upsells, setUpsells] = useState(currentUpsells)
  const [noPressType, setNoPressType] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editCustomIndex, setEditCustomIndex] = useState(-1)

  const onNoPressType = useCallback(isTrue => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setNoPressType(isTrue)
  }, [])

  useEffect(() => {
    if (noPressType) {
      setTimeout(() => onNoPressType(false), 1000)
    }
  }, [noPressType])

  const isAltered = useMemo(() => {
    return !!unvoid.length
      || !!add.length
      || !!remove.length
      || !isSizeIdentical(size, currentSize)
      || !isFiltersIdentical(filters, currentFilters)
      || !isModifiersIdentical(modifiers, currentModifiers)
      || !isUpsellsIdentical(upsells, currentUpsells)
      || !equalArrays(custom, currentCustom)
  }, [add, remove, unvoid, size, currentSize, filters, currentFilters, modifiers, currentModifiers, upsells, currentUpsells, custom, currentCustom])

  useEffect(() => {
    if (inspectNewBillItemIDs && !isSaving) {
      const isEditOutdated = edit.some(bill_item_id => !billItemIDs.includes(bill_item_id))
      const isRemoveOutdated = remove.some(bill_item_id => !billItemIDs.includes(bill_item_id))
      if (isEditOutdated || isRemoveOutdated) dispatch(doAlertAdd('Some items no longer exist', 'We have removed them'))
      if (isEditOutdated) setEdit(prev => prev.filter(id => billItemIDs.includes(id)))
      if (isRemoveOutdated) setRemove(prev => prev.filter(id => billItemIDs.includes(id)))
    }
    setInspectNewBillItemIDs(false)
  }, [isSaving, inspectNewBillItemIDs, billItemIDs, edit, remove])

  useEffect(() => {
    setInspectNewBillItemIDs(true)
  }, [billItemIDs])

  const selectAll = useCallback(() => {
    if (!pressType) {
      if (edit.length || remove.length) {
        setEdit([])
        setRemove([])
      }
      else onNoPressType(true)
    }
    else if (pressType === 'edit') {
      setEdit([...add, ...billItemIDs])
      setRemove([])
    }
    else if (pressType === 'remove') {
      setAdd([])
      setEdit([])
      setRemove(billItemIDs)
    }
    else if (pressType === 'unvoid') {
      if (unvoid.length) setUnvoid([])
      else setUnvoid(billItemIDs)
    }
  }, [pressType, billItemIDs, add, edit, remove, unvoid])

  const isIncomplete = useMemo(() => Object.values(incompleteModifiers).some(incomplete => incomplete), [incompleteModifiers])

  const discard = useCallback(() => {
    setAdd([])
    setEdit([])
    setRemove([])
    setSize(currentSize)
    setFilters(currentFilters)
    setModifiers(currentModifiers)
    setUpsells(currentUpsells)
    setCustom(currentCustom)
  }, [currentSize, currentFilters, currentModifiers, currentUpsells, currentCustom])

  const save = useCallback(() => {
    const confirmSave = async () => {
      try {
        setIsSaving(true)
        // redundant use of item_id and variant_id given reference_ids...
        const documentChanges = { add, edit, remove, unvoid, }
        const itemChanges = {
          // ...item_id === 'custom' && {...currentItem},
          size,
          filters,
          upsells,
          modifiers,
          custom,
          comped,
          reference_ids,
          position,
          name,
          tax_rate_id,
        }
        const [failedToEdit, failedToRemove, failedToUnvoid] = await transactEditBillItem(
          restaurantRef,
          bill_id,
          item_id,
          variant_id,
          documentChanges,
          itemChanges,
          isOrder
        )
        if (failedToUnvoid || failedToEdit || failedToRemove) dispatch(doAlertAdd('Unable to make all changes',
          failedToUnvoid ? `Failed to unvoid ${failedToUnvoid} items` :
            failedToEdit && failedToRemove ? `Failed to edit ${failedToEdit} and failed to void/remove ${failedToRemove}`
              : failedToEdit ? `Failed to edit ${failedToEdit} items` : `Failed to void/remove ${failedToRemove} items`
        ))
        close()
      }
      catch (error) {
        setIsSaving(false)
        console.log('LineItemEditor save error: ', error)
        dispatch(doAlertAdd('Unable to save changes', 'Please try again and contact Torte support if you see this screen multiple times'))
      }
    }

    const incompleteModifierNames = Object.values(incompleteModifiers).filter(name => name)
    if (incompleteModifierNames.length) dispatch(doAlertAdd('Incomplete modifiers', `Please correct these modifiers: ${arrayToCommaList(incompleteModifierNames)}`, [
      {
        text: 'Save anyways',
        onPress: () => confirmSave()
      },
      {
        text: 'Cancel and go back',
      }
    ], undefined, true))
    else {
      let actions = []
      if (is_voided) {
        if (unvoid.length) actions.push(`Unvoid ${plurarize(unvoid.length, 'item', 'items')}.`)
      }
      else {
        if (add.length) actions.push(`Add ${plurarize(add.length, 'new item', 'new items')}.`)
        if (edit.length) actions.push(`Edit ${plurarize(edit.length, 'item', 'items')}.`)
        if (remove.length) actions.push(`Void or delete ${plurarize(remove.length, 'item', 'items')}.`)
      }
      dispatch(doAlertAdd('Save changes?', actions, [
        {
          text: 'Yes',
          onPress: () => confirmSave()
        },
        {
          text: 'No',
        }
      ]))
    }
  }, [add, remove, edit, unvoid, is_voided, size, filters, upsells, modifiers, custom, comped, bill_id, item_id, variant_id, incompleteModifiers, reference_ids, position])

  return (
    <View style={{ flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: Colors.background }}>
      <View style={{ marginTop: 10 }}>
        <Header backFn={() => {
          if (startEdit) setStartEdit(false)
          else if (isAltered) dispatch(doAlertAdd('Leave without saving changes?', undefined, [
            {
              text: 'Yes, leave without saving',
              onPress: () => close()
            },
            {
              text: 'No, continue editing'
            }
          ]))
          else close()
        }}>
          <LargeText center>{tableName} - #{billCode}</LargeText>
          <ExtraLargeText center>{name}</ExtraLargeText>
        </Header>
        {/* ... why did you want a segment here if !lineItemID? */}
      </View>

      <View style={{ marginHorizontal: Layout.marHor, flex: 1, }}>


        <LineItemChanges
          comped={comped} size={size} filters={filters} modifiers={modifiers} upsells={upsells} quantity={billItemIDs.length - remove.length + add.length}
          currentSize={currentSize} currentFilters={currentFilters} currentModifiers={currentModifiers} currentUpsells={currentUpsells} currentQuantity={billItemIDs.length} currentSubtotal={currentSubtotal}
          editQuantity={edit.length}
          custom={custom} currentCustom={currentCustom}
          item_id={item_id} variant_id={variant_id}
        />

        {
          startEdit ?
            <EditLineItem item_id={item_id} variant_id={variant_id}
              size={size} setSize={setSize}
              filters={filters} setFilters={setFilters}
              modifiers={modifiers} setModifiers={setModifiers} incompleteModifiers={incompleteModifiers} setIncompleteModifiers={setIncompleteModifiers}
              upsells={upsells} setUpsells={setUpsells}
              custom={custom} setCustom={setCustom} setEditCustomIndex={setEditCustomIndex}
            />
            : <View style={{ flex: 1 }}>
              {is_voided ?
                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
                  <TypeButton type='unvoid' pressType={pressType} color={Colors.darkgreen} />
                </View> :
                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
                  <TypeButton type='add' pressType={pressType} setPressType={setPressType} color={Colors.darkgreen} setAdd={setAdd} />
                  <TypeButton type='edit' pressType={pressType} setPressType={setPressType} color={Colors.purple} />
                  <TypeButton type='remove' pressType={pressType} setPressType={setPressType} color={Colors.red} />
                </View>}

              <SelectAll
                text={(is_voided ? !unvoid.length : (pressType === 'edit' || pressType === 'remove' || (!edit.length && !remove.length))) ? 'SELECT ALL ITEMS' : 'CLEAR ALL SELECTIONS'}
                onPress={selectAll}
              />
              {!is_voided && <View style={{
                width: '62%',
                paddingTop: 12,
                alignSelf: 'center',
              }}>
                <StyledButton text={edit.length ? 'EDIT SELECTED ITEMS' : 'no items selected for edit'} onPress={() => setStartEdit(true)} disabled={!edit.length} />
              </View>}


              <LineItemUsers
                add={add}
                setAdd={setAdd}
                edit={edit}
                setEdit={setEdit}
                remove={remove}
                setRemove={setRemove}
                unvoid={unvoid}
                setUnvoid={setUnvoid}

                bill_id={bill_id}
                lineItemID={lineItemID}

                pressType={pressType}
                onNoPressType={onNoPressType}
                isOrder={isOrder}
              />
            </View>
        }

        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 30 }}>
          <StyledButton disabled={!isAltered} color={Colors.red} text={isAltered ? 'Discard changes' : 'No changes'} onPress={discard} />
          <StyledButton disabled={!isAltered} text={isIncomplete ? 'Missing modifier(s)' : isAltered ? 'Save changes' : 'No changes'} color={isIncomplete ? Colors.darkgrey : Colors.purple} onPress={save} />
        </View>

      </View>

      {!!~editCustomIndex && <EditCustomPopUp custom={custom} index={editCustomIndex} setCustom={setCustom} setEditCustomIndex={setEditCustomIndex} />}
      {noPressType && <NoPressType />}
      {isSaving && <IndicatorOverlay text='Saving...' />}
    </View>
  )
}

const NoPressType = () => <View style={styles.noPressType}>
  <SuperLargeText>EDIT or VOID?</SuperLargeText>
</View>


const styles = StyleSheet.create({
  noPressType: {
    position: 'absolute',
    top: Layout.window.height * 0.4,
    alignSelf: 'center',
    backgroundColor: Colors.black + 'AA',
    paddingVertical: 20,
    paddingHorizontal: 40,
    shadowColor: "#000",
    shadowOffset: {
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 13.16,
    elevation: 20,
  }
});


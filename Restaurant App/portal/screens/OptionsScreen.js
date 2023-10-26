import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useDispatch, } from 'react-redux';
import firebase from 'firebase';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import PortalForm from '../components/PortalForm';
import { PortalEnumField, PortalTextField } from '../components/PortalFields';
import PortalGroup from '../components/PortalGroup';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import centsToDollar from '../../utils/functions/centsToDollar';
import Colors from '../../utils/constants/Colors';


import PortalDelete from '../components/PortalDelete';
import { LargeText, MediumText } from '../../utils/components/NewStyledText';
import { initialFilters as filterNames } from '../../redux/selectors/selectorsBillItems';
import ItemFilters from '../components/ItemFilters';
import useCategoryChild from '../hooks/useCategoryChild';
import { PortalVariants } from '../components/PortalRow';
import StyledButton from '../../utils/components/StyledButton';



const initialFilters = Object.keys(filterNames).reduce((acc, filter) => ({ ...acc, [filter]: false }), {})
const equalFilters = (f1, f2) => Object.keys(f1).every(filter => f1[filter] === f2[filter])


export default function OptionsScreen({ navigation, route }) {

  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const { id, item_id, variant_id, item_id: upsell_item_id, item_name: upsell_item_name, modifier_id, modifier_name } = route.params ?? {}

  // const tax_rates = useRestaurantNestedFields('tax_rates')

  const option = useCategoryChild('options', id)

  const {
    is_deleted,
    name: currentName = '',
    internal_name: currentInternalName = '',
    description: currentDescription = '',
    is_visible: currentIsVisible = false,

    price: currentPrice = 0,
    filters: currentFilters = initialFilters,
    is_filter_list_approved: currentIsFilterListApproved = false,
    // is_raw: currentIsRaw = true,
    is_sold_out: currentIsSoldOut = false,
    // variants: currentOptionVariants = [],
    tax_rate_id: currentTaxRateID = '',

    max: currentMax = 1,
    option_group_id: currentOptionGroupID = '',
    variants = {}
  } = { ...option, ...option.variants?.[variant_id] }

  const [name, setName] = useState(currentName)
  const [internal_name, setInternalName] = useState(variant_id && !variants[variant_id]?.internal_name ? '' : currentInternalName)
  // const [description, setDescription] = useState(currentDescription)
  const [is_visible, setIsVisible] = useState(currentIsVisible)

  const [price, setPrice] = useState(currentPrice)
  const [filters, setFilters] = useState(currentFilters)
  const [is_filter_list_approved, setIsFilterListApproved] = useState(currentIsFilterListApproved)
  // const [is_raw, setIsRaw] = useState(currentIsRaw)
  const [is_sold_out, setIsSoldOut] = useState(currentIsSoldOut)
  // const [tax_rate_id, setTaxRateID] = useState(currentTaxRateID)
  const [max, setMax] = useState(currentMax)
  const [option_group_id, setOptionGroupID] = useState(currentOptionGroupID)


  const isAltered = name !== currentName
    || internal_name !== currentInternalName
    // || description !== currentDescription
    || is_visible !== currentIsVisible
    || price !== currentPrice
    || !equalFilters(filters, currentFilters)
    || is_filter_list_approved !== currentIsFilterListApproved
    // || is_raw !== currentIsRaw
    || is_sold_out !== currentIsSoldOut
    // || tax_rate_id !== currentTaxRateID
    || max !== currentMax
    || option_group_id !== currentOptionGroupID

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setName(currentName)
          setInternalName(currentInternalName)
          // setDescription(currentDescription)
          setIsVisible(currentIsVisible)
          setPrice(price)

          setFilters(currentFilters)
          setIsFilterListApproved(currentIsFilterListApproved)
          // setTaxRateID(currentTaxRateID)
          setIsSoldOut(currentIsSoldOut)
          setMax(currentMax)
          setOptionGroupID(currentOptionGroupID)
        }
      },
      {
        text: 'No'
      }
    ]))
  }

  const save = () => {
    let failed = []
    if (!name) failed.push('Missing name')
    if (variant_id && !internal_name) failed.push('Missing internal name')
    // if (!tax_rate_id) failed.push('Missing tax rate')

    if (failed.length) {
      dispatch(doAlertAdd('Incorrect fields', [...failed]))
    }
    else {
      const batch = firebase.firestore().batch()

      const optionRef = id ? restaurantRef.collection('Options').doc(id) : restaurantRef.collection('Options').doc()

      let packet = {}
      if (!id || name !== currentName) packet.name = name
      if (!id || internal_name !== currentInternalName) packet.internal_name = internal_name
      if (!id || is_visible !== currentIsVisible) packet.is_visible = is_visible
      // if (!id || description !== currentDescription) packet.description = description
      if (!id || price != currentPrice) packet.price = Number(price)
      if (!id || !equalFilters(filters, currentFilters)) packet.filters = filters
      if (!id || is_filter_list_approved !== currentIsFilterListApproved) packet.is_filter_list_approved = is_filter_list_approved
      // if (is_raw !== currentIsRaw) packet.is_raw = is_raw
      if (!id || is_sold_out !== currentIsSoldOut) packet.is_sold_out = is_sold_out
      // if (!id || tax_rate_id !== currentTaxRateID) packet.tax_rate_id = tax_rate_id
      if (!id || max !== currentMax) packet.max = max
      if (!id || option_group_id !== currentOptionGroupID) packet.option_group_id = option_group_id

      const true_variant_id = variant_id === 'new' ? (restaurantRef.collection('fake').doc()).id : variant_id

      batch.set(optionRef, {
        ...true_variant_id ? { variants: { [true_variant_id]: { ...packet } } } : { ...packet },
        ...!id && {
          id: optionRef.id,
          is_deleted: false,
          restaurant_id: restaurantRef.id,
          variants: {},
        },
      }, { merge: true })

      if (!id) {
        if (item_id) {
          batch.set(restaurantRef.collection('Items').doc(item_id), {
            upsells: firebase.firestore.FieldValue.arrayUnion({ item_id: '', option_id: optionRef.id, variant_id: '', })
          }, { merge: true })
        }

        if (modifier_id) {
          batch.set(restaurantRef.collection('Modifiers').doc(modifier_id), {
            mods: firebase.firestore.FieldValue.arrayUnion({ item_id: '', option_id: optionRef.id, variant_id: '', preselected: 0 })
          }, { merge: true })
        }
      }


      return batch.commit().then(() => {
        dispatch(doSuccessAdd())
        // if (menu_id) navigation.goBack()
        if (!id) navigation.setParams({ id: optionRef.id })
        if (variant_id === 'new') navigation.setParams({ variant_id: true_variant_id })
        if (variant_id && upsell_item_id) dispatch(doAlertAdd('Upsell already given root item', `If you want ${upsell_item_name} to have this variant (${internal_name}), please go back and edit the item's upsells directly.`))
        if (variant_id && modifier_id) dispatch(doAlertAdd('Modifier already given root item', `If you want ${modifier_name} to have this variant (${internal_name}), please go back and edit the modifier directly.`))
      }).catch(error => {
        console.log('OptionsScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new details', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }

  const isDuplicateInternalName = useMemo(() => {
    if (variant_id && internal_name === option.internal_name) return true
    if (Object.keys(variants).some(v_id => v_id !== variant_id && variants[v_id].internal_name === internal_name)) return true
    return false
  }, [variants, variant_id, internal_name])

  const replaceVariant = useCallback(variant_id => {
    navigation.replace('Options', { id, variant_id, item_id: upsell_item_id, item_name: upsell_item_name, modifier_id, modifier_name })
  }, [id, upsell_item_id, upsell_item_name, modifier_id, modifier_name])

  const isVariantDeleted = useMemo(() => !!variant_id && variant_id !== 'new' && !variants[variant_id], [variant_id, variants])

  useEffect(() => {
    if (is_deleted) navigation.goBack()
    else if (isVariantDeleted) replaceVariant('')
  }, [is_deleted, isVariantDeleted, replaceVariant])

  return (
    <>
      <PortalForm
        headerText={variant_id ? `Variant: ${internal_name || '(no name yet)'}` : id ? `Edit ${name}` : 'Create option'}
        save={save}
        reset={reset}
        isAltered={isAltered}
        saveText='Save option'
      >
        <PortalEnumField
          text='Is this option visible?'
          subtext='You can hide options while you work on them'
          isRed={!is_visible}
          value={is_visible ? 'YES' : 'HIDDEN'}
          options={[true, false]}
          setValue={setIsVisible}
          isDelta={!!variant_id && is_visible !== option.is_visible}
        />


        <PortalEnumField
          text='Is this option sold out?'
          isRed={is_sold_out}
          value={is_sold_out ? 'YES' : 'NO'}
          options={[true, false]}
          setValue={setIsSoldOut}
          isDelta={!!variant_id && is_sold_out !== option.is_sold_out}
        />

        {/* IS SOLD OUT??? */}

        <PortalGroup text='Basic info'>
          <PortalTextField
            text='Name'
            value={name}
            onChangeText={setName}
            isRequired
            placeholder='(required)'
            isDelta={!!variant_id && name !== option.name}
          />
          <PortalTextField
            text='Internal name'
            value={internal_name}
            onChangeText={setInternalName}
            placeholder='(optional)'
            subtext={`Used to distinguish between two items with similar names`}
            isDelta={!!variant_id && !!internal_name && internal_name !== option.internal_name}
            isRed={isDuplicateInternalName}
          />
          {/* <PortalTextField
            text='Description'
            value={description}
            onChangeText={setDescription}
            placeholder='(recommended)'
          /> */}

          {/* <PortalDropdownField
            text='Tax rate'
            subtext='You can edit these back in the MANAGE drawer'
            value={tax_rate_id}
            options={tax_rates}
            setValue={setTaxRateID}
            format={taxRate => taxRate ? `${taxRate?.name} (${taxRate?.percent}%)` : 'MISSING'}
            isRequired
          /> */}
        </PortalGroup>

        <PortalGroup text='Price'>
          <PortalTextField
            text='Price'
            value={price}
            onChangeText={setPrice}
            isNumber
            format={centsToDollar}
            isDelta={!!variant_id && price !== option.price}
          />
        </PortalGroup>

        <PortalGroup text='Quantity'>
          <PortalTextField
            text='How many can be ordered?'
            value={max}
            onChangeText={setMax}
            isNumber
            isDelta={!!variant_id && max !== option.max}
          />

          {/* {
            max > 1 && <PortalTextField
              text='First # free?'
              value={upsell_first_free}
              onChangeText={setUpsellFirstFree}
              isNumber
            />
          } */}
        </PortalGroup>

        <PortalGroup text='Dietary, nutrition, and health information'>
          {/* <PortalEnumField
            text='Show raw warning?'
            isRed={!is_raw}
            value={is_raw ? 'YES' : 'NO'}
            options={[true, false]}
            setValue={setIsRaw}
          /> */}

          <View style={{ marginVertical: 20, }}>
            <LargeText center>Nearly 1/3 of diners follow some special diet.</LargeText>
            <LargeText center>Dietary filters are a favorite feature of Torte users,</LargeText>
            <LargeText center>and we highly recommend you use them.</LargeText>
            <View style={{ marginVertical: 10 }}>
              <MediumText center bold>YOU ARE RESPONSIBLE FOR THIS CONTENT.</MediumText>
              <MediumText center bold>Please remember to update this information regularly.</MediumText>
            </View>
          </View>

          <PortalEnumField
            text='Show dietary filters?'
            isRed={!is_filter_list_approved}
            value={is_filter_list_approved ? 'YES' : 'NO'}
            subtext={!is_filter_list_approved && 'Guests with dietary restrictions will not see this item'}
            options={[true, false]}
            setValue={setIsFilterListApproved}
            isDelta={!!variant_id && is_filter_list_approved !== option.is_filter_list_approved}
          />



          <ItemFilters filters={filters} setFilters={setFilters} isVariant={!!variant_id} rootFilters={option.filters} />

        </PortalGroup>

        <PortalGroup text='Variants'>
          <View style={{ marginBottom: 10 }}>
            <MediumText>Do you have an almost identical listing of this options, with only a few changes?</MediumText>
            <MediumText>For example: a lunch price and a dinner price?</MediumText>
            <LargeText bold>Create a variant!</LargeText>
            <MediumText>Variants can also be used as mods or upsells.</MediumText>
          </View>
          {(!!variant_id || !!Object.keys(variants)?.length) && <PortalVariants key={'root'} isAltered={isAltered} id={id} replaceVariant={replaceVariant} category='options' currentVariantID={variant_id} internal_name={option.internal_name || '(no internal name)'} isRoot />}
          {Object.keys(variants).map(v_id => <PortalVariants key={v_id} isAltered={isAltered} id={id} variant_id={v_id} replaceVariant={replaceVariant} category='options' currentVariantID={variant_id} internal_name={variants[v_id].internal_name} />)}
          <StyledButton text='Add a variant' onPress={() => {
            if (!id) {
              dispatch(doAlertAdd('No item for variants', 'Finish creating the root item before starting a variant.'))
            }
            else if (isAltered) {
              dispatch(doAlertAdd('You have unsaved changes', 'You must save or discard all changed before creating a new variant.'))
            }
            else {
              replaceVariant('new')
            }
          }} style={{ alignSelf: Object.keys(variants).length ? 'center' : 'flex-start', marginVertical: 10 }} color={!id || isAltered ? Colors.darkgrey : Colors.purple} />
        </PortalGroup>

        {!!id && <PortalDelete category='options' id={id} isWithVariants={!!Object.keys(variants).length} />}
      </PortalForm>


    </>
  )
}


const styles = StyleSheet.create({

});


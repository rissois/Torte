import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import firebase from 'firebase';
import Layout from '../../utils/constants/Layout';
import { ExtraLargeText, LargeText, MediumText, SuperLargeText, } from '../../utils/components/NewStyledText';
import Header from '../../utils/components/Header';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import useCategoryChild from '../../portal/hooks/useCategoryChild';
import { selectAlphabeticalMenuIDs } from '../../redux/selectors/selectorsMenus';
import { Pages } from '../../utils/components/Pages';
import { EditLineItemBox } from './EditLineItemBox';
import { useRestaurant, useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { dateToMilitary } from '../../functions/dateAndTime';
import { indexesToPosition } from '../../utils/functions/indexesToPosition';
import Colors from '../../utils/constants/Colors';
import { EditLineItem } from './EditLineItem';
import StyledButton from '../../utils/components/StyledButton';
import centsToDollar from '../../utils/functions/centsToDollar';
import { MaterialIcons, } from '@expo/vector-icons';
import { EditCustomPopUp } from './EditCustom';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { transactEditBillItem } from '../firestore/transactEditBillItems';
import plurarize from '../../utils/functions/plurarize';
import { singleSubtotal } from '../../utils/functions/singleSubtotal';
import { PortalCheckField, PortalDropdownField, PortalTextField } from '../../portal/components/PortalFields';
import useRestaurantNestedFields from '../../hooks/useRestaurantNestedField';
import usePrivateNestedField from '../../hooks/usePrivateNestedField';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Menu = ({ id, selected, setSelected }) => {
  const { name, internal_name } = useCategoryChild('menus', id)
  return <EditLineItemBox isPurple={selected === id} text={name} subtext={internal_name} onPress={() => setSelected(prev => prev === id ? null : id)} />
}

const Section = ({ id, selected, setSelected }) => {
  const { name, internal_name } = useCategoryChild('sections', id)
  return <EditLineItemBox isPurple={selected === id} text={name} subtext={internal_name} onPress={() => setSelected(prev => prev === id ? null : id)} />
}

const isItemSelected = (i1, i2) => i1?.item_id === i2?.item_id && i1.variant_id === i2.variant_id
const Item = ({ id: item, selected, setSelected }) => {
  const { name, internal_name, } = useCategoryChild('items', item.item_id, item.variant_id)
  // price={`${centsToDollar(sizes[0].price)}${sizes.length > 1 ? '+' : ''}`} 
  return <EditLineItemBox isPurple={isItemSelected(selected, item)} text={name} subtext={internal_name} onPress={() => setSelected(prev => isItemSelected(prev, item) ? null : item)} />
}

const formatTaxRates = taxRate => taxRate ? `${taxRate?.name} (${taxRate?.percent}%)` : 'MISSING'
const formatPrinters = printer => printer?.station ?? 'UNK'


const UNKNOWN_MENU_POSITION = '9999999'


export default function AddItem({ showAddItem, setShowAddItem, bill_id, tableName, billCode }) {
  const restaurant = useRestaurant()
  const restaurantRef = useRestaurantRef()
  const dispatch = useDispatch()
  const tax_rates = useRestaurantNestedFields('tax_rates')
  const printers = usePrivateNestedField('Printers', 'printers') ?? {}
  const [isAddingItem, setIsAddingItem] = useState(false)

  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [tax_rate_id, setTaxRateID] = useState('')
  const [isPrinted, setIsPrinted] = useState(!!Object.keys(printers).length)
  const [printer_id, setPrinterID] = useState('')

  const menuIDs = useSelector(selectAlphabeticalMenuIDs, shallowEqual)
  const [menuID, setMenuID] = useState(menuIDs.length === 1 ? menuIDs[0] : null)
  const { section_order } = useCategoryChild('menus', menuID)
  const [sectionID, setSectionID] = useState(null)
  const { item_order } = useCategoryChild('sections', sectionID)
  const [itemIDs, setItemIDs] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAddingItem(true)
  }, [showAddItem])

  const animateClose = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut, () => setShowAddItem(false));
    setIsAddingItem(false)
  }, [])


  const menuPosition = useMemo(() => {
    if (!menuID || !restaurant.days) return ''
    const now = new Date()
    const nowMilitary = dateToMilitary(now)
    const dayIndex = now.getDay()
    const periods = restaurant.days[dayIndex].hours
    const periodIndex = periods.findIndex(period => period.start <= nowMilitary && nowMilitary <= period.end)
    if (!~periodIndex) return UNKNOWN_MENU_POSITION
    const { meal_order } = periods[periodIndex]
    const { meals } = restaurant
    let mealIndex = -1
    let menuIndex = -1
    for (let i = 0; i < meal_order.length && !~menuIndex; i++) {
      menuIndex = meals[meal_order[i]].menus.findIndex(menu => menu.id === menuID)
      if (~menuIndex) mealIndex = i
    }
    if (!~menuIndex) return UNKNOWN_MENU_POSITION
    return dayIndex + indexesToPosition(periodIndex, mealIndex, menuIndex)
  }, [menuID, restaurant])


  const sectionPosition = useMemo(() => sectionID && section_order?.length ? indexesToPosition(section_order.indexOf(sectionID)) : '', [section_order, sectionID])
  const itemPosition = useMemo(() => itemIDs && item_order?.length ? indexesToPosition(item_order.findIndex(item => item.item_id === itemIDs.item_id && item.variant_id === itemIDs.variant_id)) : '', [item_order, itemIDs])
  const position = useMemo(() => itemPosition ? menuPosition + sectionPosition + itemPosition : '', [menuPosition, sectionPosition, itemPosition])
  const reference_ids = useMemo(() => ({ dotw_id: '', period_id: '', meal_id: '', menu_id: menuID, section_id: sectionID, panel_id: '', item_id: itemIDs?.item_id, variant_id: itemIDs?.variant_id, }), [itemIDs, menuID, sectionID])

  useEffect(() => {
    setSectionID(null)
  }, [menuID])

  useEffect(() => {
    setItemIDs(null)
  }, [sectionID])

  useEffect(() => {
    setName('')
    setPrice(0)
    setTaxRateID('')
    setPrinterID('')
    setIsPrinted(!!Object.keys(printers).length)
  }, [itemIDs])



  const orderedTaxRateIDs = useMemo(() => Object.keys(tax_rates).sort((a, b) => {
    return tax_rates[a].percent - tax_rates[b].percent || (tax_rates[a].name.toLowerCase() < tax_rates[b].name.toLowerCase() ? -1 : 1)
  }), [tax_rates])
  const orderedPrinterIDs = useMemo(() => Object.keys(printers).sort((a, b) => {
    return (printers[a].station.toLowerCase() < printers[b].station.toLowerCase() ? -1 : 1)
  }), [printers])

  const menu = useMemo(() => <Menu setSelected={setMenuID} />, [])
  const section = useMemo(() => <Section setSelected={setSectionID} />, [])
  const item = useMemo(() => <Item setSelected={setItemIDs} />, [])

  const [size, setSize] = useState(null)
  const [filters, setFilters] = useState({})
  const [modifiers, setModifiers] = useState({})
  const [upsells, setUpsells] = useState([])
  const [incompleteModifiers, setIncompleteModifiers] = useState({})
  const [custom, setCustom] = useState([])
  // const [comped, setComped] = useState({ subtotal: 0, percent: 0 })
  const [editCustomIndex, setEditCustomIndex] = useState(-1)

  const [quantity, setQuantity] = useState(1)

  const save = () => {
    const confirmSave = async () => {
      try {
        setIsSaving(true)
        let add = []
        for (let i = 0; i < quantity; i++) {
          add.push((firebase.firestore().collection('fake').doc()).id)
        }
        const documentChanges = { add }
        const itemChanges = {
          size: size || { price, name: '', code: '' },
          filters,
          upsells,
          modifiers,
          custom,
          reference_ids,
          position,
          printer_id: isPrinted ? printer_id : '',
          ...itemIDs?.item_id === 'custom' && { tax_rate_id, name }
        }
        await transactEditBillItem(
          restaurantRef,
          bill_id,
          reference_ids.item_id,
          reference_ids.variant_id,
          documentChanges,
          itemChanges,
        )
        setIsSaving(false)
        animateClose()
      }
      catch (error) {
        setIsSaving(false)
        console.log('AddItems save error: ', error)
        dispatch(doAlertAdd('Unable to add items', 'Please try again and contact Torte support if you see this screen multiple times'))
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
      dispatch(doAlertAdd(`Add ${quantity} items?`, undefined, [
        {
          text: 'Yes',
          onPress: () => confirmSave()
        },
        {
          text: 'No',
        }
      ]))
    }
  }

  useEffect(() => setQuantity(1), [itemIDs])
  const isIncomplete = useMemo(() => Object.values(incompleteModifiers).some(incomplete => incomplete), [incompleteModifiers])
  const subtotal = useMemo(() => singleSubtotal({ size: size || { price }, filters, modifiers, upsells, custom }), [size, filters, modifiers, upsells, custom, price])

  return <View style={[styles.container, StyleSheet.absoluteFill, { top: isAddingItem ? 0 : '100%' }]}>
    <Header backFn={() => {
      if (itemIDs) {
        setItemIDs(null)
      }
      else {
        animateClose()
      }
    }}>
      <LargeText center>{tableName} - #{billCode}</LargeText>
    </Header>
    {/* Not sure if best to pass props until last second, or create a useMemo... */}
    {(!itemIDs || itemIDs.item_id === 'custom') && <TouchableOpacity onPress={() => {
      setItemIDs(prev => prev?.item_id === 'custom' ? null : ({ item_id: 'custom', variant_id: '', option_id: '' }))
    }}>
      <View style={{ backgroundColor: itemIDs?.item_id === 'custom' ? Colors.green : Colors.background, paddingVertical: 8, paddingHorizontal: 20, marginBottom: 4, borderColor: Colors.green, borderWidth: 2, alignSelf: 'center' }}>
        <MediumText center bold>ADD A CUSTOM ITEM</MediumText>
      </View>
    </TouchableOpacity>}

    {
      itemIDs?.item_id === 'custom' && <View>
        <PortalTextField
          text='Name'
          value={name}
          onChangeText={setName}
          isRequired
          placeholder='(required)'
        />

        <PortalTextField
          text='Price'
          value={price}
          onChangeText={setPrice}
          isNumber
          format={centsToDollar}
          isNegativeAllowed
        />

        {price < 0 && <MediumText bold style={{ marginVertical: 2 }}>NOTE: Negative prices generally need a 0% tax rate</MediumText>}

        <PortalDropdownField
          text='Tax rate'
          subtext='Tax rates can be edited in the MANAGE drawer'
          value={tax_rate_id}
          options={tax_rates}
          orderedKeys={orderedTaxRateIDs}
          setValue={setTaxRateID}
          format={formatTaxRates}
          isRequired
          placeholder='(required)'
        // isLocked={!!variant_id}
        />

        <PortalCheckField value={isPrinted} text='Print this item?' onPress={() => setIsPrinted(prev => !prev)} />

        {isPrinted && <PortalDropdownField
          text='Printer'
          subtext='Printers can be added in the MANAGE drawer'
          value={printer_id}
          options={printers}
          orderedKeys={orderedPrinterIDs}
          setValue={setPrinterID}
          format={formatPrinters}
          isRequired
          placeholder='Select a printer'
        // noOptionText='NO PRINTER'
        // isLocked={!!variant_id}
        />}
      </View>
    }

    {menuIDs.length > 1 && !itemIDs && <Pages ids={menuIDs} isCollapsible selected={menuID} child={menu} category='menus' />}
    {!!menuID && !itemIDs && <Pages ids={section_order} isCollapsible selected={sectionID} child={section} category='sections' />}
    {!!sectionID && <Pages ids={item_order} isCollapsible selected={itemIDs} child={item} category='items' />}

    {
      !!itemIDs && <EditLineItem {...itemIDs}
        // comped={comped} setComped={setComped}
        size={size} setSize={setSize}
        filters={filters} setFilters={setFilters}
        modifiers={modifiers} setModifiers={setModifiers} incompleteModifiers={incompleteModifiers} setIncompleteModifiers={setIncompleteModifiers}
        upsells={upsells} setUpsells={setUpsells}
        custom={custom} setCustom={setCustom} setEditCustomIndex={setEditCustomIndex}
        isNew />
    }

    {
      !!itemIDs && <View>
        <View style={{ paddingHorizontal: Layout.marHor, paddingVertical: 6, alignItems: 'center', marginVertical: 10, flexDirection: 'row', borderWidth: 2, borderColor: Colors.white, marginHorizontal: Layout.marHor }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <ExtraLargeText center>QUANTITY</ExtraLargeText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Layout.marHor }}>
              <TouchableOpacity isDisabled={quantity === 1} onPress={() => setQuantity(prev => prev - 1)}>
                <MaterialIcons
                  name="remove-circle-outline"
                  color={quantity === 1 ? Colors.darkgrey : Colors.white}
                  size={30}
                />
              </TouchableOpacity>

              <View style={{ width: 100 }}>
                <SuperLargeText center>{quantity}</SuperLargeText>
              </View>

              <TouchableOpacity onPress={() => setQuantity(prev => prev + 1)}>
                <MaterialIcons
                  name="add-circle-outline"
                  color={Colors.white}
                  size={30}
                />
              </TouchableOpacity>
            </View>
          </View>
          <ExtraLargeText center>{centsToDollar(subtotal * quantity)}</ExtraLargeText>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 20 }}>
          <StyledButton text='Clear' color={Colors.red} onPress={() => {
            setSize(null)
            setFilters({})
            setModifiers({})
            setUpsells([])
            setIncompleteModifiers({})
            setCustom([])
            setQuantity(1)
          }} />
          <StyledButton
            disabled={itemIDs?.item_id === 'custom' ? (!name || !tax_rate_id || (isPrinted && !printer_id)) : !size}
            text={
              itemIDs?.item_id === 'custom' ?
                !name ? 'Missing name' :
                  !tax_rate_id ? 'Missing tax rate' :
                    (isPrinted && !printer_id) ? 'Missing printer' :
                      `Add ${plurarize(quantity, 'item', 'items')}` :
                !size ? 'Missing size' :
                  isIncomplete ? 'Missing modifier(s)' :
                    `Add ${plurarize(quantity, 'item', 'items')}`}
            color={(itemIDs?.item_id === 'custom' ? (!name || !tax_rate_id || (isPrinted && !printer_id)) : !size) || isIncomplete ? Colors.darkgrey : Colors.purple} onPress={save} />
        </View>
      </View>
    }

    {!!~editCustomIndex && <EditCustomPopUp custom={custom} index={editCustomIndex} setCustom={setCustom} setEditCustomIndex={setEditCustomIndex} />}
    {isSaving && <IndicatorOverlay text='Saving...' />}
  </View>
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.marHor,
    paddingVertical: 20,
    backgroundColor: Colors.background,
    overflow: 'hidden'
  }
});

/*
const AllItemVariants = () => {
  const itemVariants = useSelector(selectAlphaveticalItemVariants)

  return <FlatList
    keyExtractor={item => item.item_id + item.variant_id}
    data={itemVariants}
    renderItem={({ item: { item_id, variant_id } }) => <Render id={item_id} variant_id={variant_id} category='items' />}
    numColumns={4}
    contentContainerStyle={{ paddingBottom: Layout.scrollViewPadBot }}
  />
}
*/
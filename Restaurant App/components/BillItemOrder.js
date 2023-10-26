import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  SafeAreaView,
  Alert,
} from 'react-native';

import { useSelector } from 'react-redux';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { MaterialIcons, } from '@expo/vector-icons';
import centsToDollar from '../functions/centsToDollar';
import commaList from '../functions/commaList';
import { ClarifyingText, LargeText, HeaderText, MainText } from './PortalText';
import filterTitles from '../constants/filterTitles';
import MenuButton from './MenuButton';
import RadioButton from '../components/RadioButton';
import identicalCartItems from '../functions/identicalCartItems'
import transactEditBill from '../transactions/transactEditBill';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Cursor from './Cursor';
import Plurarize from './Plurarize';
import useRestaurant from '../hooks/useRestaurant';

const QUANTITY_RANGE = 4

const sections = {
  filters: 'f',
  specs: 's',
  mods: 'm',
  comment: 'q',
  custom: 'c',
  none: 'n',
}

export default function BillItemOrder({

  /*
  There are three ways this component is called:
    Adding a new item or group of items
    Editing an item already ordered (cannot edit as a group)
    Creating a one-time item
  */
  valid,
  invalidAlert = () => { },
  validSeat = true,

  create, // CREATE ONLY. Boolean for one-time item

  existing_id, // EDIT ONLY. The billItems doc id
  billItem,  // EDIT ONLY. The saved details from the billItems doc

  menu_id, // ADD / EDIT. The restaurantMenus doc id (for menu_reference)
  section_id, // ADD / EDIT. The restaurantSections doc id (for menu_reference)
  item_id, // ADD / EDIT. The restaurantItems doc id (for viewing the full item options)

  bill_id, // ALL Essential to track which bill
  full_item_position, // ALL Maintains display order. 000000000 for one-time item
  close, // ALL Return / close function
}) {

  const restaurant_id = useRestaurant()
  const {
    restaurant: { taxRates = {} },
    items,
    specifications,
    modifications,
  } = useSelector(state => state)

  const scrollViewRef = useRef(null)

  /* 
      Hydrate variables with any existing data. Save the initial values for resetting
      The billItem data takes precendence
  */
  const initialName = billItem?.name ?? items[item_id]?.name ?? ''
  const [name, setName] = useState(initialName)

  const [num, setNum] = useState(1) // Edit is always a single item, add/create starts at 1

  const initialSingleTotal = billItem?.total ?? items[item_id]?.price ?? 0
  const [singleTotal, setSingleTotal] = useState(initialSingleTotal)

  const initialPrice = billItem?.price ?? items[item_id]?.price ?? 0
  const [price, setPrice] = useState(Math.abs(initialPrice))
  const [isPriceNegative, setIsPriceNegative] = useState(initialPrice < 0)

  const initialTaxRate = billItem?.taxRate.taxRate_id ?? items[item_id]?.taxRate ?? ''
  const [taxRate, setTaxRate] = useState(initialTaxRate)

  // Text summaries of filters, specs, and mods
  const [quickSummary, setQuickSummary] = useState({})

  const initialSelectedFilters = billItem?.filters ?? {}
  const [selectedFilters, setSelectedFilters] = useState(initialSelectedFilters)
  const initialFilters = { ...initialSelectedFilters, ...(items[item_id]?.filters ?? {}) }
  const [filters, setFilters] = useState(initialFilters)

  const initialSelectedSpecs = billItem?.specifications ?? {}
  const [selectedOptionsBySpec, setSelectedOptionsBySpec] = useState(initialSelectedSpecs)
  // ### HYPOTHETICALLY allows for adding specs not assigned to this item
  const initalSpecOrder = (items[item_id]?.specOrder ?? []).concat(Object.keys(initialSelectedSpecs).filter(spec_id => !items[item_id]?.specOrder.includes(spec_id)))
  const [specOrder, setSpecOrder] = useState(initalSpecOrder)

  const initialSelectedMods = billItem?.modifications ?? {}
  const [selectedMods, setSelectedMods] = useState(initialSelectedMods)
  // ### HYPOTHETICALLY allows for adding mods not assigned to this item
  const initialModOrder = (items[item_id]?.modOrder ?? []).concat(Object.keys(initialSelectedMods).filter(mod_id => !items[item_id]?.modOrder.includes(mod_id)))
  const [modOrder, setModOrder] = useState(initialModOrder)

  const initialComment = billItem?.comment ?? ''
  const [comment, setComment] = useState(initialComment)

  /*
    CREATE
  */

  //SHOUlD JUST STORE THE ROOT PRICE IN EACH ITEM

  const [priceFocused, setPriceFocused] = useState(false)
  const priceRef = useRef(null)
  // const [price, setPrice] = useState(initialSingleTotal - 
  //   Object.values(initialSelectedFilters).reduce((acc, curr) => acc+curr, 0) -
  //   Object.values(initialSelectedMods).reduce((acc, curr) => acc+(curr.price ?? 0), 0) -

  //   )

  const [showTaxRates, setShowTaxRates] = useState(true)

  const toggleTaxRates = useCallback(() => {
    setShowTaxRates(prev => !prev)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [])

  /*
  FILTERS
  */

  const [availableFilters, setAvailableFilters] = useState([])
  const [alwaysFilters, setAlwaysFilters] = useState('')
  const [neverFilters, setNeverFilters] = useState('')

  // Isolate the selectable filters
  // Build text for describe the filters that always / never comply
  useEffect(() => {
    let available = []
    let always = []
    let never = []
    Object.keys(filters).forEach(key => {
      if (typeof filters[key] === 'number') {
        available.push(key)
      }
      else if (filters[key] === true) {
        always.push(filterTitles[key])
      }
      else if (filters[key] === false) {
        never.push(filterTitles[key])
      }
    })
    setAvailableFilters(available)
    setAlwaysFilters(always.length ? 'Item is always ' + commaList(always).toLowerCase() : '')
    setNeverFilters(never.length ? 'Item is never ' + commaList(never).toLowerCase() : '')
  }, [filters])

  const toggleFilter = useCallback((filter_key, filterPrice) => {
    if (selectedFilters.hasOwnProperty(filter_key)) { // Remove filter
      setSingleTotal(prev => prev - selectedFilters[filter_key])
      setSelectedFilters(prev => {
        let next = { ...prev }
        delete next[filter_key]
        return next
      })
    }
    else { // Add filter
      setSingleTotal(prev => prev + filterPrice)
      setSelectedFilters(prev => ({ ...prev, [filter_key]: filterPrice }))
    }
  }, [selectedFilters])


  /*
  MODIFICATIONS
  */

  const [activeMod, setActiveMod] = useState('')

  const editMod = useCallback((mod_id, mod) => {
    const modTotal = mod.price * mod.quantity
    const previousTotal = selectedMods[mod_id] ? selectedMods[mod_id].price * selectedMods[mod_id].quantity : 0

    if (mod.quantity) { // add / replace mod
      setSingleTotal(prev => prev - previousTotal + modTotal)
      setSelectedMods(prev => ({ ...prev, [mod_id]: mod }))
    }
    else { // remove mod
      setSingleTotal(prev => prev - previousTotal)
      setSelectedMods(prev => {
        let next = { ...prev }
        delete next[mod_id]
        return next
      })
    }
  }, [selectedMods])


  /*
  SPECIFICATIONS
  */

  const [activeSpec, setActiveSpec] = useState('') // Holds the ID for specifications
  const [selectedActiveSpec, setSelectedActiveSpec] = useState(null) // Holds a copy of the selected specification, with added claimed field
  const [activeSpecOption, setActiveSpecOption] = useState(null) // Holds the entire option as presented in specifications
  const [selectedActiveSpecOption, setSelectedActiveSpecOption] = useState(null) // Holds a copy of the selected option

  useEffect(() => {
    if (activeSpec) {
      setSelectedActiveSpec({ ...selectedOptionsBySpec[activeSpec], claimed: selectedOptionsBySpec[activeSpec]?.options.reduce((acc, { quantity = 1 }) => acc + quantity, 0) ?? 0 })
    }
    else {
      setSelectedActiveSpec(null)
    }

    if (activeSpec && activeSpecOption) {
      setSelectedActiveSpecOption(selectedOptionsBySpec[activeSpec]?.options.find(o => o.name === activeSpecOption.name) ?? null)
    }
    else {
      setSelectedActiveSpecOption(null)
    }
  }, [selectedOptionsBySpec, activeSpec, activeSpecOption])


  const editSpecOption = useCallback((spec_id, spec, option) => {
    const optTotal = option.price * option.quantity
    const previousIndex = selectedOptionsBySpec[spec_id]?.options.findIndex(o => o.name === option.name) ?? -1
    const previousTotal = ~previousIndex ? selectedOptionsBySpec[spec_id].options[previousIndex].price * selectedOptionsBySpec[spec_id].options[previousIndex].quantity : 0

    if (option.quantity) {
      if (spec.max === 1) { // Switch
        setSingleTotal(prev => prev + optTotal - (selectedOptionsBySpec[spec_id]?.options[0].price ?? 0))

        setSelectedOptionsBySpec(prev => {
          return {
            ...prev, [spec_id]: {
              name: spec.name,
              options: [option]
            }
          }
        })
      }
      else { // Add or edit
        setSingleTotal(prev => prev + optTotal - previousTotal)
        setSelectedOptionsBySpec(prev => {
          const newOptions = selectedOptionsBySpec[spec_id] ? [...selectedOptionsBySpec[spec_id].options] : []

          if (~previousIndex) {
            newOptions[previousIndex] = option
          }
          else {
            newOptions.push(option)
          }
          return {
            ...prev,
            [spec_id]: {
              name: spec.name,
              options: newOptions
            }
          }
        })
      }
    }
    else {
      setSingleTotal(prev => prev - previousTotal)
      setSelectedOptionsBySpec(prev => {
        if (selectedOptionsBySpec[spec_id].options.length === 1) {
          let next = { ...prev }
          delete next[spec_id]
          return next
        }

        const newOptions = [...selectedOptionsBySpec[spec_id].options]
        newOptions.splice(previousIndex, 1)

        return {
          ...prev,
          [spec_id]: {
            name: spec.name,
            options: newOptions
          }
        }
      })
    }
  }, [selectedOptionsBySpec,])

  /*
  VISIBILITY CONTROLS
  */

  const [showSection, setShowSection] = useState(sections.none)

  const toggleSection = useCallback((section) => {
    setShowSection(prev => {
      if (prev === section) {
        return sections.none
      }
      return section
    })
    setActiveMod('')
    setActiveSpec('')
    setActiveSpecOption(null)
  }, [])

  /*
  QUICK SUMMARY
  */

  useEffect(() => {
    setQuickSummary(prev => ({
      ...prev,
      filters: commaList(Object.keys(selectedFilters).map(filter => filterTitles[filter]))
    }))
  }, [selectedFilters])

  useEffect(() => {
    setQuickSummary(prev => ({
      ...prev,
      mods: commaList(Object.keys(selectedMods).map(mod_id => (selectedMods[mod_id].quantity > 1 ? selectedMods[mod_id].quantity + 'X ' : '') + selectedMods[mod_id].name))
    }))
  }, [selectedMods])

  useEffect(() => {
    setQuickSummary(prev => ({
      ...prev,
      specs: Object.keys(selectedOptionsBySpec).map(spec_id => {
        return selectedOptionsBySpec[spec_id].name.toUpperCase() + ': ' + commaList(selectedOptionsBySpec[spec_id].options.map(option => (option.quantity > 1 ? option.quantity + 'X ' : '') + option.name))
      }).join('; ')
    }))
  }, [selectedOptionsBySpec])

  /*
  BILL CHANGES AND SUBMISSION
  */

  const [isBillItemAltered, setIsBillItemAltered] = useState(false)

  useEffect(() => {
    if (billItem) { // i.e. editing
      setIsBillItemAltered(
        name !== billItem.name ||
        price * (isPriceNegative ? -1 : 1) !== billItem.price ||
        taxRates[taxRate]?.percent !== billItem.taxRate.percent
        || taxRates[taxRate].name !== billItem.taxRate.name
        || !identicalCartItems({
          comment: initialComment,
          specifications: initialSelectedSpecs,
          filters: initialSelectedFilters,
          modifications: initialSelectedMods
        }, {
          comment,
          specifications: selectedOptionsBySpec,
          filters: selectedFilters,
          modifications: selectedMods
        }))
    }
    else {
      setIsBillItemAltered(
        name ||
        price ||
        isPriceNegative ||
        Boolean(num !== 1 || comment ||
          Object.keys(selectedOptionsBySpec).length ||
          Object.keys(selectedFilters).length ||
          Object.keys(selectedMods).length))
    }
  }, [name, price, isPriceNegative, num, selectedOptionsBySpec, selectedFilters, selectedMods, comment, taxRates, taxRate])

  const commitItem = (override) => {
    // Determine if any specifications are invalid
    let failedSpecs = specOrder.filter(spec_id => {
      const sumQuantities = selectedOptionsBySpec[spec_id]?.options?.reduce((acc, { quantity = 1 }) => acc + quantity, 0) ?? 0
      return sumQuantities < specifications[spec_id].min || sumQuantities > specifications[spec_id].max
    }).map(spec_id => specifications[spec_id].name)

    if (failedSpecs.length) {
      Alert.alert('Specifications not properly set', commaList(failedSpecs) + '. You can override this warning, but we recommend you fix the errors', [
        {
          text: 'Override',
          onPress: () => commitItem(true)
        },
        {
          text: 'Go back and fix',
          style: 'cancel'
        }
      ])
    }
    else if (!valid) {
      invalidAlert()
    }
    else if (existing_id && (
      Object.keys(billItem.seats?.paidUnits).length ||
      Object.keys(billItem.users?.paidUnits).length
    )) {
      Alert.alert('Item has already been paid for', 'Cannot change an item that has been paid for')
    }
    else if (existing_id && (
      // Object.keys(billItem.seats?.takenUnits).some(seat_id => ) CANNOT REALLY DO THIS UNFORTUNATELY
      Object.keys(billItem.users?.takenUnits).length ||
      !validSeat
    )) {
      Alert.alert('Item has already been claimed', 'Cannot change an item that has been claimed')
    }
    else {
      transactEditBill(restaurant_id, bill_id, {
        name,
        num,
        price: price * (isPriceNegative ? -1 : 1),
        taxRate: (taxRate && taxRates[taxRate] && { ...taxRates[taxRate], taxRate_id: taxRate }) ?? { ...billItem?.taxRate, taxRate_id: taxRate } ?? { name: 'undefined', percent: 0, taxRate_id: null },
        total: singleTotal * num,
        position: full_item_position,
        ...Object.keys(selectedOptionsBySpec).length && { specifications: selectedOptionsBySpec },
        ...Object.keys(selectedFilters).length && { filters: selectedFilters },
        ...Object.keys(selectedMods).length && { modifications: selectedMods },
        ...!!comment && { comment },
        menu_reference: { menu_id, section_id, item_id },
      }, existing_id)
        .then(() => {
          close(name)
        })
        .catch(error => {
          console.log('MenuItem transactEditBill error: ', error)
          Alert.alert(existing_id ? 'Error changing ' + name.toLowerCase() : 'Error adding ' + name.toLowerCase())
        })
    }
  }


  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
    <View style={{ flexDirection: 'row', margin: 16, alignItems: 'center' }}>
      <View>
        <TouchableOpacity onPress={() => {
          if (isBillItemAltered) {
            Alert.alert(`Leave without ${billItem ? 'editing' : 'adding'}?`, undefined, [
              {
                text: 'Yes',
                onPress: close
              },
              {
                text: 'No, cancel',
                style: 'cancel'
              }
            ])
          }
          else {
            close()
          }
        }}>
          <MaterialIcons
            name='arrow-back'
            size={36}
            color={Colors.softwhite}
          />
        </TouchableOpacity>
      </View>
      <HeaderText adjustsFontSizeToFit style={{ flex: 1, textAlign: 'center' }}>{create ? 'One-time item' : (billItem ? 'Edit ' : 'Add ') + name}</HeaderText>
      <View style={{ opacity: 0 }}>
        <MaterialIcons
          name='arrow-back'
          size={36}
          color={Colors.softwhite}
        />
      </View>
    </View>

    <ScrollView
      contentContainerStyle={{ marginHorizontal: 40, paddingBottom: 40 }}
      ref={scrollViewRef}
      keyboardShouldPersistTaps='always'
    >

      {
        full_item_position === '000000000' && <View>
          <View style={styles.itemSection}>
            <View key={'name'} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
              <LargeText>Item name: </LargeText>

              <TextInput
                style={{ fontSize: 34, color: Colors.softwhite, }}
                enablesReturnKeyAutomatically
                selectTextOnFocus
                onChangeText={text => {
                  setName(text)
                }}
                value={name}
                placeholder={'(enter a name)'}
                placeholderTextColor={Colors.lightgrey}
              />
            </View>
          </View>

          <View style={styles.itemSection}>
            <View key={'price'} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
              <LargeText>Item price: </LargeText>
              <TouchableWithoutFeedback onPress={() => {
                priceRef?.current?.focus()
              }}>
                <View style={{ marginHorizontal: Layout.spacer.small, flexDirection: 'row' }}>
                  {isPriceNegative && <HeaderText >-</HeaderText>}
                  <HeaderText >{centsToDollar(price)}</HeaderText>
                  <Cursor cursorOn={priceFocused} />
                </View>
              </TouchableWithoutFeedback>

              <TextInput
                style={{ height: 0, width: 0, color: Colors.backgroundColor }}
                enablesReturnKeyAutomatically
                selectTextOnFocus
                keyboardType='number-pad'
                onChange={({ nativeEvent: { text } }) => {
                  if (text.slice(-1) === '-') {
                    setSingleTotal(prev => prev + 2 * (isPriceNegative ? price : -price))
                    setIsPriceNegative(prev => !prev)
                  }
                  else if (!text) {
                    if (price) {
                      setSingleTotal(prev => prev - (isPriceNegative ? -price : price))
                      setIsPriceNegative(false)
                    }
                    setPrice(0)
                  }
                  else {
                    let asNum = parseInt(text)
                    if (asNum) {
                      setSingleTotal(prev => prev - (isPriceNegative ? -price : price) + (isPriceNegative ? -asNum : asNum))
                      setPrice(asNum)
                    }
                  }
                }}
                ref={priceRef}
                value={price.toString()}
                onFocus={() => {
                  setPriceFocused(true)
                }}
                onBlur={() => {
                  setPriceFocused(false)
                }}
              />
            </View>
          </View>

          <View key={'tax'} style={styles.itemSection}>
            <TouchableOpacity onPress={toggleTaxRates} style={{ flexDirection: 'row' }}>
              <LargeText style={{ paddingRight: Layout.spacer.small }}>Item tax: </LargeText>
              {
                !!taxRates[taxRate] ?
                  <LargeText>{taxRates[taxRate].percent}% ({taxRates[taxRate].name})</LargeText> :
                  <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>No tax applied</LargeText>
              }
              <ClarifyingText style={{ marginHorizontal: 20, color: Colors.lightgrey, lineHeight: 30, }}>(edit)</ClarifyingText>
            </TouchableOpacity>

            <View style={{ height: showTaxRates ? undefined : 0, marginVertical: showTaxRates ? 12 : 0, marginLeft: 12 }}>
              {Object.keys(taxRates).map(key => <TouchableOpacity key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => {
                setTaxRate(key)
                toggleTaxRates()
              }}>
                {showTaxRates && <RadioButton on={taxRate === key} />}
                <LargeText style={{ marginLeft: 12 }}>{taxRates[key].percent}% ({taxRates[key].name})</LargeText>
              </TouchableOpacity>)}
            </View>

          </View>
        </View>
      }

      <View style={[styles.itemSection, { flexDirection: 'row', alignItems: 'center', }]}>
        <View style={{ flex: 1, }}>
          <HeaderText center style={{ fontSize: 50, fontWeight: 'bold' }}>{centsToDollar(singleTotal * num)}</HeaderText>
          <MainText center>{billItem ? initialSingleTotal !== singleTotal ? `was ${centsToDollar(initialSingleTotal)}` : ' ' : `(${centsToDollar(singleTotal)} each)`}</MainText>
        </View>

        {!billItem && <View style={{}}>
          <LargeText center style={{ marginBottom: 8 }}>Quantity</LargeText>
          <QuantitySelector val={num} setVal={setNum} range={QUANTITY_RANGE} />
        </View>}
      </View>


      <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderTopColor: Colors.softwhite, borderBottomColor: Colors.softwhite, marginVertical: 20, paddingVertical: 20 }}>
        {!!quickSummary.filters && <LargeText center >{quickSummary.filters}</LargeText>}
        {!!quickSummary.specs && <LargeText center >{quickSummary.specs}</LargeText>}
        {!!quickSummary.mods && <LargeText center >{quickSummary.mods}</LargeText>}
        {!Object.keys(quickSummary).some(k => quickSummary[k].length) && <LargeText center >No extra details</LargeText>}

        {!!comment && <LargeText center style={{ marginTop: 8 }}>User comment: {comment}</LargeText>}
      </View>

      <View style={{ flexDirection: 'row', marginTop: 20, }} >
        <BoxSelector
          active={showSection === sections.filters}
          header={<Plurarize value={Object.keys(selectedFilters).length} nouns={{ s: 'diet', p: 'diets' }} />}
          main={<Plurarize value={availableFilters.length} nouns={{ s: 'filter', p: 'filters' }} />}
          onPress={() => { toggleSection(sections.filters) }}
          disabled={!availableFilters.length}
        />

        <BoxSelector
          active={showSection === sections.specs}
          header={<Plurarize value={Object.keys(selectedOptionsBySpec).length} nouns={{ s: 'spec', p: 'specs' }} />}
          main={<Plurarize value={specOrder.length} nouns={{ s: 'option', p: 'options' }} />}
          onPress={() => {
            toggleSection(sections.specs)
            if (specOrder.length === 1) {
              setActiveSpec(specOrder[0])
            }
          }}
          disabled={!specOrder.length}
        />

        <BoxSelector
          active={showSection === sections.mods}
          header={<Plurarize value={Object.keys(selectedMods).length} nouns={{ s: 'add-on', p: 'add-ons' }} />}
          main={<Plurarize value={modOrder.length} nouns={{ s: 'option', p: 'options' }} />}
          onPress={() => { toggleSection(sections.mods) }}
          disabled={!modOrder.length}
        />

        <BoxSelector
          active={showSection === sections.custom}
          header='CUSTOM'
          onPress={() => { toggleSection(sections.custom) }}
          disabled
        />
      </View>

      {
        showSection === sections.filters && <View style={{ marginTop: 20 }}>
          {!!alwaysFilters && <MainText style={{ marginBottom: 8 }}>{alwaysFilters}</MainText>}
          {!!neverFilters && <MainText style={{ marginBottom: 8 }}>{neverFilters}</MainText>}
          <View style={{ flexWrap: 'wrap', flexDirection: 'row', marginTop: 20 }}>
            {
              availableFilters.map(key => {
                return <BoxSelector
                  key={key}
                  selected={selectedFilters.hasOwnProperty(key)}
                  header={filterTitles[key]}
                  // main={filters[key] === 0 ? '(free)' : centsToDollar(filters[key])}
                  onPress={() => toggleFilter(key, filters[key])}
                />
              })
            }
          </View>
        </View>
      }

      {
        showSection === sections.specs && <View style={{ marginTop: 14, borderTopWidth: 1, paddingTop: 30, borderTopColor: Colors.softwhite }}>
          <View style={{ flex: 1, flexWrap: 'wrap', flexDirection: 'row', }}>
            {
              specOrder.map(spec_id => {
                return <BoxSelector
                  key={spec_id}
                  active={activeSpec === spec_id}
                  header={specifications[spec_id].name}
                  main={specifications[spec_id].max > 1 && specifications[spec_id].max !== Infinity ? '(max ' + specifications[spec_id].max + ')' : undefined}
                  selected={!!selectedOptionsBySpec[spec_id]}
                  onPress={() => {
                    if (activeSpec === spec_id) {
                      setActiveSpec('')
                    }
                    else {
                      setActiveSpec(spec_id)
                    }
                  }}
                />
              })
            }
          </View>

          {
            !!activeSpec && <View style={{ marginTop: 14, borderTopWidth: 1, paddingTop: 30, borderTopColor: Colors.softwhite }}>
              {(specifications[activeSpec].min - selectedActiveSpec?.claimed > 0) && <MainText center style={{ color: Colors.red, marginBottom: 8, fontWeight: 'bold', }}>{specifications[activeSpec].min - selectedActiveSpec?.claimed} BELOW THE MINIMUM FOR {specifications[activeSpec].name.toUpperCase()}</MainText>}
              <View style={{ flex: 1, flexWrap: 'wrap', flexDirection: 'row', }}>
                {
                  specifications[activeSpec].options.map(option => {
                    const selected = selectedOptionsBySpec[activeSpec]?.options.find(o => o.name === option.name)
                    return <BoxSelector
                      key={option.name}
                      active={activeSpecOption?.name === option.name}
                      header={option.name}
                      main={option.max > 1 ? '(max ' + option.max + ')' : undefined}
                      selected={!!selected}
                      disabled={specifications[activeSpec].max !== 1 && !selected && selectedActiveSpec?.claimed >= specifications[activeSpec].max}
                      onPress={() => {
                        if (activeSpecOption?.name === option.name) {
                          setActiveSpecOption(null)
                        }
                        else if (option.max > 1) {
                          editSpecOption(activeSpec, specifications[activeSpec], { name: option.name, price: option.price, quantity: selected?.quantity ?? 1 })
                          setActiveSpecOption(option)
                          scrollViewRef.current.scrollToEnd({ animated: true })
                        }
                        else {
                          editSpecOption(activeSpec, specifications[activeSpec], { name: option.name, price: option.price, quantity: selected ? 0 : 1 })
                          setActiveSpecOption(null)
                        }
                      }}
                    />
                  })
                }
              </View>

              <View style={{ opacity: activeSpecOption ? 1 : 0 }}>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 }}>
                  <View style={{ alignItems: 'center' }}>
                    <LargeText center style={{ marginBottom: 8 }}>{activeSpecOption?.name} quantity</LargeText>
                    <QuantitySelector
                      val={selectedActiveSpecOption?.quantity ?? 0}
                      setVal={(quantity) => {
                        if (activeSpecOption) {
                          editSpecOption(activeSpec, specifications[activeSpec], { name: activeSpecOption.name, price: activeSpecOption.price, quantity })
                          setActiveSpecOption(null)
                        }
                      }}
                      range={5}
                      max={activeSpecOption?.max - selectedActiveSpec?.claimed + (selectedActiveSpecOption?.quantity ?? 0)}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  disabled={!selectedActiveSpecOption}
                  style={{ opacity: selectedActiveSpecOption ? 1 : 0, alignSelf: 'center', marginTop: 40, backgroundColor: Colors.red, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 6 }}
                  onPress={() => {
                    editSpecOption(activeSpec, specifications[activeSpec], { name: activeSpecOption.name, price: activeSpecOption.price, quantity: 0 })
                    setActiveSpecOption(null)
                  }}
                >
                  <LargeText center>Remove option</LargeText>
                </TouchableOpacity>
              </View>
            </View>
          }
        </View>
      }

      {
        showSection === sections.mods && <View style={{ marginTop: 14, borderTopWidth: 1, paddingTop: 30, borderTopColor: Colors.softwhite }}>
          <View style={{ flex: 1, flexWrap: 'wrap', flexDirection: 'row', }}>
            {
              modOrder.map(mod_id => {
                return <BoxSelector
                  key={mod_id}
                  active={activeMod === mod_id}
                  header={modifications[mod_id].name}
                  main={modifications[mod_id].max > 1 ? '(max ' + modifications[mod_id].max + ')' : undefined}
                  selected={!!selectedMods[mod_id]}
                  onPress={() => {
                    if (activeMod === mod_id) {
                      setActiveMod('')
                    }
                    else if (modifications[mod_id].max > 1) {
                      editMod(mod_id, { name: modifications[mod_id].name, price: modifications[mod_id].price, quantity: selectedMods[mod_id]?.quantity ?? 1 })
                      setActiveMod(mod_id)
                      scrollViewRef.current.scrollToEnd({ animated: true })
                    }
                    else {
                      editMod(mod_id, { name: modifications[mod_id].name, price: modifications[mod_id].price, quantity: selectedMods[mod_id] ? 0 : 1 })
                      setActiveMod('')
                    }
                  }}
                />
              })
            }
          </View>
          <View style={{ opacity: activeMod ? 1 : 0 }}>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 }}>
              <View style={{ alignItems: 'center' }}>
                <LargeText center style={{ marginBottom: 8 }}>{modifications[activeMod]?.name} quantity</LargeText>
                <QuantitySelector
                  val={selectedMods[activeMod]?.quantity ?? 0}
                  setVal={(quantity) => {
                    if (activeMod) {
                      editMod(activeMod, { name: modifications[activeMod].name, price: modifications[activeMod].price, quantity })
                      setActiveMod('')
                    }
                  }}
                  range={5}
                  max={modifications[activeMod]?.max}
                />
              </View>
            </View>
            <TouchableOpacity
              disabled={!selectedMods[activeMod]}
              style={{ opacity: selectedMods[activeMod] ? 1 : 0, alignSelf: 'center', marginTop: 40, backgroundColor: Colors.red, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 6 }}
              onPress={() => {
                editMod(activeMod, { quantity: 0 })
                setActiveMod('')
              }}
            >
              <LargeText center>Remove add-on</LargeText>
            </TouchableOpacity>
          </View>
        </View>
      }

      {
        showSection === sections.custom && <View>

        </View>
      }


    </ScrollView>

    {create ?
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 20 }}>
        <MenuButton text={'Reset'}
          disabled={!isBillItemAltered}
          color={isBillItemAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
            Alert.alert('Reset item?', undefined, [
              {
                text: 'Yes',
                onPress: () => {
                  setNum(1)
                  setComment('')
                  setName('')
                  setPrice(Math.abs(initialPrice))
                  setIsPriceNegative(initialPrice < 0)
                  setTaxRate('')
                  setSingleTotal(initialSingleTotal)
                  setSelectedOptionsBySpec(initialSelectedSpecs)
                  setSelectedFilters(initialFilters)
                  setSelectedMods(initialSelectedMods)
                }
              },
              {
                text: 'No',
                style: 'cancel'
              }
            ])
          }} />
        <MenuButton text={!name ? 'Missing name' : !price ? 'Missing price' : !taxRate ? 'Missing tax rate' : (num > 1 ? 'Add items ' : 'Add item ') + centsToDollar(singleTotal * num)} buttonFn={() => {
          Alert.alert('Add item to bill?', undefined, [
            {
              text: 'Yes',
              onPress: commitItem
            },
            {
              text: 'Cancel',
              style: 'cancel',
            }
          ])
        }} disabled={!taxRate || !name || !price} color={!taxRate || !name || !price || !valid || !validSeat ? Colors.darkgrey : Colors.purple} />
      </View> :
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 20 }}>
        {billItem && <MenuButton text={billItem && !isBillItemAltered ? 'No changes' : 'Reset'}
          disabled={billItem && !isBillItemAltered}
          color={(billItem && !isBillItemAltered) || !valid || !validSeat ? Colors.darkgrey : Colors.red} buttonFn={() => {
            Alert.alert('Reset item?', undefined, [
              {
                text: 'Yes',
                onPress: () => {
                  setNum(1)
                  setComment(initialComment)
                  setSingleTotal(initialSingleTotal)
                  setSelectedOptionsBySpec(initialSelectedSpecs)
                  setSelectedFilters(initialSelectedFilters)
                  setSelectedMods(initialSelectedMods)

                  // Really just for first-time items
                  setName(initialName)
                  setPrice(Math.abs(initialPrice))
                  setIsPriceNegative(initialPrice < 0)
                  setTaxRate(initialTaxRate)
                }
              },
              {
                text: 'No',
                style: 'cancel'
              }
            ])
          }} />}
        <MenuButton text={(billItem ? isBillItemAltered ? 'Edit item' : 'No changes' : 'Add item') + (num > 1 ? 's ' : ' ') + centsToDollar(num * singleTotal)} buttonFn={() => {
          if (!valid) {
            invalidAlert()
          }
          else {
            Alert.alert(billItem ? 'Edit item on bill?' : 'Add item to bill?', undefined, [
              {
                text: 'Yes',
                onPress: commitItem
              },
              {
                text: 'Cancel',
                style: 'cancel',
              }
            ])
          }
        }} disabled={billItem && !isBillItemAltered} color={(billItem && !isBillItemAltered) || !valid || !validSeat ? Colors.darkgrey : Colors.purple} />
      </View>
    }




  </SafeAreaView>
}

function BoxSelector({ header, main, selected, active, onPress, disabled }) {
  return <View style={{ width: '25%', marginBottom: 16, opacity: disabled ? 0.2 : 1 }}>
    <TouchableOpacity disabled={disabled} style={[styles.box, { backgroundColor: active ? Colors.red : selected ? Colors.purple : undefined }]} onPress={() => onPress(active)}>
      <LargeText numberOfLines={2} adjustsFontSizeToFit center>{header}</LargeText>
      {!!main && <MainText numberOfLines={1} adjustsFontSizeToFit center>{main}</MainText>}
    </TouchableOpacity>
  </View>
}

function QuantitySelector({ val, setVal, range, max = Infinity }) {
  const [quantityStart, setQuantityStart] = useState(1)

  if (max < range) {
    range = max
  }

  return <View style={{ flexDirection: 'row', }}>
    <View style={{ flexDirection: 'row' }}>
      <TouchableOpacity onPress={() => setQuantityStart(prev => prev - 1)} disabled={quantityStart < 2} style={[styles.quantitySelector, { borderColor: Colors.background }]}>
        <MaterialIcons name='keyboard-arrow-left' size={40} color={Colors.softwhite} style={{ opacity: quantityStart > 1 ? 1 : 0.2 }} />
      </TouchableOpacity>
      {[...Array(range)].map((_, i) => {
        let curr = i + quantityStart

        if (val && val < quantityStart && i === 0) {
          return <View key={i} onPress={() => setVal(val)} style={[styles.quantitySelector, { borderColor: Colors.softwhite, backgroundColor: Colors.purple }]}>
            <LargeText center style={{ fontWeight: 'bold' }}>{val}</LargeText>
          </View>
        }
        else if (val > quantityStart + range - 1 && i === range - 1) {
          return <View key={i} onPress={() => setVal(val)} style={[styles.quantitySelector, { borderColor: Colors.softwhite, backgroundColor: Colors.purple }]}>
            <LargeText center style={{ fontWeight: 'bold' }}>{val}</LargeText>
          </View>
        }
        let selected = val === curr
        return <TouchableOpacity key={i} onPress={() => setVal(curr)} style={[styles.quantitySelector, { borderColor: Colors.softwhite, backgroundColor: selected ? Colors.purple : undefined }]}>
          <LargeText center style={{ color: Colors.softwhite, fontWeight: 'bold' }}>{curr}</LargeText>
        </TouchableOpacity>
      }
      )}
      <TouchableOpacity disabled={quantityStart + range > max} onPress={() => setQuantityStart(prev => prev + 1)} style={[styles.quantitySelector, { borderColor: Colors.background }]}>
        <MaterialIcons name='keyboard-arrow-right' size={40} color={Colors.softwhite} style={{ opacity: quantityStart + range <= max ? 1 : 0.2 }} />
      </TouchableOpacity>
    </View>
  </View>
}



const styles = StyleSheet.create({
  itemSection: {
    paddingVertical: 20,
  },

  commentBox: {
    minHeight: 60,
    width: '100%',
    backgroundColor: Colors.keygrey + '44',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 16,
    borderRadius: 4,
  },
  commentText: {
    flex: 1,
    color: Colors.white,
    fontSize: 24,
    padding: 0,
    minHeight: 150
  },

  box: {
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: Colors.softwhite,
    borderWidth: 1,
    minHeight: 120,
  },

  quantitySelector: {
    width: 60,
    height: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
});

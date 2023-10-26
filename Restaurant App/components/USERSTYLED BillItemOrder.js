import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  UIManager,
  LayoutAnimation,
  Alert as RNAlert,
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
import capitalize from '../functions/capitalize';
import identicalCartItems from '../functions/identicalCartItems'
import transactEditBill from '../transactions/transactEditBill';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Cursor from './Cursor';
import useRestaurant from '../hooks/useRestaurant';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BillItemOrder({ menu_id, changeItem, billItem, bill_id, item_id, existing_id, full_item_position, create }) {
  const scrollviewRef = useRef(null)
  /*
  REDUX
  */
  const {
    items,
    specifications,
    modifications,
    restaurant: { taxRates = {} }
  } = useSelector(state => state)
  const restaurant_id = useRestaurant()




  let {
    name,
    specOrder = [],
    modOrder = [],
    filters = {},
    // sold_out = false,
    // live = false,
  } = items[item_id || billItem?.menu_reference.item_id] ?? {}
  let taxRate = billItem?.taxRate.taxRate_id ?? items[item_id]?.taxRate ?? ''
  let price = billItem?.total ?? items[item_id]?.price ?? 0


  /*
  GENERAL
  */
  const [width, setWidth] = useState(null)
  const [comment, setComment] = useState('') // #### cart of ''
  const [num, setNum] = useState(1) // #### initialize cart or 1
  const [singleTotal, setSingleTotal] = useState(price)

  const [createName, setCreateName] = useState('')
  const [createPrice, setCreatePrice] = useState(0)
  const [priceFocused, setPriceFocused] = useState(false)
  const priceRef = useRef(null)
  const [createTaxRate, setCreateTaxRate] = useState('')
  const [showTaxOptions, setShowTaxOptions] = useState(true)
  const toggleTaxOptions = () => {
    setShowTaxOptions(prev => !prev)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }


  /*
  SPECIFICATIONS
  Only those selected
  {
    [spec_id]: {name, options: {name, price}}
  }
  */
  const [selectedOptionsBySpec, setSelectedOptionsBySpec] = useState({})

  const editSpecOption = useCallback((spec_id, spec, option, selectedSpecOptions, increment) => {
    let optionIndex = selectedSpecOptions.findIndex(selectedOption => selectedOption.name === option.name)
    const sumQuantities = selectedSpecOptions.reduce((acc, { quantity = 1 }) => acc + quantity, 0)

    if (increment) {
      if (increment < 0 || sumQuantities < spec.max) {
        setSingleTotal(prev => prev + (option.price * increment))
        selectedSpecOptions[optionIndex].quantity += increment
        setSelectedOptionsBySpec(prev => {
          return {
            ...prev,
            [spec_id]: {
              ...prev[spec_id],
              options: selectedSpecOptions
            }
          }
        })
      }
    }
    else if (~optionIndex) { // Toggle off
      setSelectedOptionsBySpec(prev => {
        let next = { ...prev }
        if (selectedSpecOptions.length === 1) { // delete entire spec_id
          delete next[spec_id]
        }
        else {
          let nextOptions = [...selectedSpecOptions]
          nextOptions.splice(optionIndex, 1)
          next[spec_id].options = nextOptions
        }
        return next
      })
      setSingleTotal(prev => prev - (option.price * (selectedSpecOptions[optionIndex].quantity ?? 1)))
    }
    else if (spec.max === 1) { // Switch
      setSelectedOptionsBySpec(prev => {
        return {
          ...prev, [spec_id]: {
            name: spec.name,
            options: [option]
          }
        }
      })

      setSingleTotal(prev => prev + option.price - (selectedSpecOptions[0]?.price ?? 0))
    }
    else if (sumQuantities < spec.max) { // Add ONLY IF below max
      setSingleTotal(prev => prev + option.price)
      setSelectedOptionsBySpec(prev => {
        return {
          ...prev, [spec_id]: {
            name: spec.name,
            options: [...selectedSpecOptions, option]
          }
        }
      })
    }
  }, [])


  /*
  FILTERS
  Only those selected
  {
    [filter_key]: price
  }
  */
  const [selectedFilters, setSelectedFilters] = useState({})
  const [availableFilters] = useState(Object.keys(filters).filter(filter => typeof filters[filter] === 'number'))

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
  Only those selected

  {
    [mod_id]: {name, price}
  }
  */
  const [selectedMods, setSelectedMods] = useState({})

  const editMod = useCallback((mod_id, mod, increment) => {
    if (increment) {
      setSingleTotal(prev => prev + (mod.price * increment))
      setSelectedMods(prev => ({
        ...prev,
        [mod_id]: {
          ...prev[mod_id],
          quantity: prev[mod_id].quantity + (1 * increment)
        }
      }))
    }
    else if (selectedMods.hasOwnProperty(mod_id)) { // remove mod
      setSingleTotal(prev => prev - (mod.price * mod.quantity))
      setSelectedMods(prev => {
        let next = { ...prev }
        delete next[mod_id]
        return next
      })
    }
    else { // add mod
      setSingleTotal(prev => prev + mod.price)
      setSelectedMods(prev => ({ ...prev, [mod_id]: mod }))
    }
  }, [selectedMods])

  /*
    INITIALIZATION and LIVE UPDATES
    Edit the item if other user edits their cart
  */

  useEffect(() => {
    if (billItem) {
      setComment(billItem.comment || '')
      setSingleTotal(billItem.total / billItem.num || price)
      setSelectedOptionsBySpec(billItem.specifications || {})
      setSelectedFilters(billItem.filters || {})
      setSelectedMods(billItem.modifications || {})

      setCreateName(billItem.name)
      setCreatePrice(billItem.total)
      setCreateTaxRate(billItem.taxRate.taxRate_id)
    }
  }, [billItem])

  /*
  SUBMISSION
  */
  const [isBillItemAltered, setIsBillItemAltered] = useState(false)
  const [invalidSpecs, setInvalidSpecs] = useState([])

  useEffect(() => {
    if (billItem) {
      setIsBillItemAltered(taxRates[taxRate]?.percent !== billItem.taxRate.percent
        || taxRates[taxRate].name !== billItem.taxRate.name
        || !identicalCartItems({
          comment: billItem.comment || '',
          specifications: billItem.specifications || {},
          filters: billItem.filters || {},
          modifications: billItem.modifications || {}
        }, {
          comment,
          specifications: selectedOptionsBySpec,
          filters: selectedFilters,
          modifications: selectedMods
        }))
    }
    else {
      setIsBillItemAltered(Boolean(num !== 1 || comment ||
        Object.keys(selectedOptionsBySpec).length ||
        Object.keys(selectedFilters).length ||
        Object.keys(selectedMods).length))
    }
  }, [num, selectedOptionsBySpec, selectedFilters, selectedMods, comment, taxRates, taxRate])

  const addItemToBill = () => {
    // Determine if any specifications are invalid
    let failedSpecs = specOrder.filter(spec_id => {
      const sumQuantities = selectedOptionsBySpec[spec_id]?.options?.reduce((acc, { quantity = 1 }) => acc + quantity, 0) ?? 0
      return sumQuantities < specifications[spec_id].min || sumQuantities > specifications[spec_id].max
    })

    if (failedSpecs.length) {
      setInvalidSpecs(failedSpecs)
      RNAlert.alert('Missing specifications', 'Please make sure all specifications are marked')
    }
    else {
      transactEditBill(restaurant_id, bill_id, {
        name,
        num,
        price: existing_id ? billItem.price : price,
        taxRate: (taxRate && taxRates[taxRate] && { ...taxRates[taxRate], taxRate_id: taxRate }) ?? { ...billItem?.taxRate, taxRate_id: taxRate } ?? { name: 'undefined', percent: 0, taxRate_id: null },
        total: singleTotal * num,
        position: full_item_position,
        ...Object.keys(selectedOptionsBySpec).length && { specifications: selectedOptionsBySpec },
        ...Object.keys(selectedFilters).length && { filters: selectedFilters },
        ...Object.keys(selectedMods).length && { modifications: selectedMods },
        ...!!comment && { comment },
        menu_reference: billItem?.menu_reference ?? { menu_id, item_id },
      }, existing_id)
        .then(() => {
          RNAlert.alert(capitalize(name) + ' successfully added to bill')
          changeItem(true)
        })
        .catch(error => {
          console.log('MenuItem transactEditBill error: ', error)
          RNAlert.alert(item_id ? 'Error changing ' + name.toLowerCase() : 'Error adding ' + name.toLowerCase())
        })
    }
  }

  const changeAddOneTimeItem = () => {
    let missing = []
    if (!createName) { missing.push('name') }
    else if (!createPrice) { missing.push('price') }
    else if (!createTaxRate) { missing.push('taxRate') }

    if (missing.length) {
      RNAlert.alert('Missing ' + commaList(missing), 'Please make sure all fields are complete')
    }
    else {
      transactEditBill(restaurant_id, bill_id, {
        name: createName,
        num,
        price: createPrice,
        taxRate: (createTaxRate && taxRates[createTaxRate] && { ...taxRates[createTaxRate], taxRate_id: createTaxRate }) || { name: 'undefined', percent: 0, taxRate_id: null },
        total: createPrice * num,
        position: '0000000000',
        ...!!comment && { comment },
        menu_reference: { menu_id: '', item_id: '' },
      }, existing_id)
        .then(() => {
          RNAlert.alert(capitalize(createName) + ' successfully added to bill')
          changeItem(true)
        })
        .catch(error => {
          console.log('MenuItem transactEditBill error: ', error)
          RNAlert.alert('Error adding ' + createName.toLowerCase())
        })
    }
  }



  if (create || (billItem && !billItem.menu_reference.item_id)) {
    // CREATE A NEW ITEM
    return <View style={{ flex: 1 }}>
      <ScrollView
        style={{ height: '100%' }}
        contentContainerStyle={{ marginTop: 20, marginHorizontal: 40, paddingBottom: Layout.window.height * 0.3 }}
        ref={scrollviewRef}
        keyboardShouldPersistTaps='always'
      >
        <TouchableOpacity onPress={() => {
          changeItem()
        }}>
          {create ?
            <View onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.height)} style={styles.dropBox}>
              <HeaderText center style={{ paddingHorizontal: 12, paddingVertical: 4 }}>One-time item</HeaderText>
              <View style={[styles.dropBoxButton, { width }]}>
                <MaterialIcons
                  name='arrow-drop-down'
                  color={Colors.softwhite}
                  size={30} />
              </View>
            </View> :
            <View>
              <HeaderText center style={{ paddingHorizontal: 12, paddingVertical: 4 }}>{createName}</HeaderText>
              <MainText center style={{ marginTop: 8 }}>This is a one-time item</MainText>
            </View>
          }
        </TouchableOpacity>

        <View style={styles.itemSection}>
          <View key={'name'} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
            <LargeText>Item name: </LargeText>

            <TextInput
              style={{ fontSize: 34, color: Colors.softwhite, }}
              enablesReturnKeyAutomatically
              selectTextOnFocus
              onChangeText={text => {
                setCreateName(text)
              }}
              value={createName}
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
                <HeaderText >{centsToDollar(createPrice)}</HeaderText>
                <Cursor cursorOn={priceFocused} />
              </View>
            </TouchableWithoutFeedback>

            <TextInput
              style={{ height: 0, width: 0, color: Colors.backgroundColor }}
              enablesReturnKeyAutomatically
              selectTextOnFocus
              keyboardType='number-pad'
              onChangeText={text => {
                if (!text) {
                  setCreatePrice(0)
                }
                else {
                  let asNum = parseInt(text)
                  if (asNum) {
                    setCreatePrice(asNum)
                  }
                }
              }}
              ref={priceRef}
              value={createPrice.toString()}
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
          <TouchableOpacity onPress={toggleTaxOptions} style={{ flexDirection: 'row' }}>
            <LargeText style={{ paddingRight: Layout.spacer.small }}>Item tax: </LargeText>
            {
              !!taxRates[createTaxRate] ?
                <LargeText>{taxRates[createTaxRate].percent}% ({taxRates[createTaxRate].name})</LargeText> :
                <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>No tax applied</LargeText>
            }
            <ClarifyingText style={{ marginHorizontal: 20, color: Colors.lightgrey, lineHeight: 30, }}>(edit)</ClarifyingText>
          </TouchableOpacity>

          <View style={{ height: showTaxOptions ? undefined : 0, marginVertical: showTaxOptions ? 12 : 0, marginLeft: 12 }}>
            {Object.keys(taxRates).map(key => <TouchableOpacity key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => {
              setCreateTaxRate(key)
              toggleTaxOptions()
            }}>
              {showTaxOptions && <RadioButton on={taxRate === key} />}
              <LargeText style={{ marginLeft: 12 }}>{taxRates[key].percent}% ({taxRates[key].name})</LargeText>
            </TouchableOpacity>)}
          </View>

        </View>

        {!billItem && <View style={styles.itemSection}>
          <LargeText>Quantity</LargeText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20, marginTop: 12 }}>
            <TouchableOpacity disabled={num === 1} onPress={() => setNum(prev => prev - 1)}>
              <MaterialIcons
                name='remove-circle-outline'
                color={Colors.softwhite}
                size={36}
                style={{ paddingVertical: 6, paddingHorizontal: 20 }}
              />
            </TouchableOpacity>
            <HeaderText style={{ width: 50 }} center>{num}</HeaderText>
            <TouchableOpacity onPress={() => setNum(prev => prev + 1)}>
              <MaterialIcons
                name='add-circle-outline'
                color={Colors.softwhite}
                size={36}
                style={{ paddingVertical: 6, paddingHorizontal: 20 }}
              />
            </TouchableOpacity>
          </View>
        </View>}


        <View style={styles.itemSection}>
          <LargeText>Comment</LargeText>
          <View style={{ marginLeft: 40 }}><View style={styles.commentBox}>
            <TextInput
              style={styles.commentText}
              multiline={true}
              placeholder={'Add a comment? This will be visible to guests.'}
              placeholderTextColor={Colors.white + 'AA'}
              onChangeText={text => {
                if (text.length <= 100) {
                  setComment(text)
                }
              }}
              value={comment}

              keyboardAppearance='dark'
              returnKeyType={'done'}

              autoCorrect={true}
              selectTextOnFocus={true}
              autoFocus={false}
              blurOnSubmit={true}
              onFocus={() => { scrollviewRef.current.scrollToEnd() }}
              onSubmitEditing={() => {
              }}
            />
          </View>
            <ClarifyingText style={{ marginTop: 4 }}>Maximum 100 characters. Remaining: {100 - comment.length}</ClarifyingText>
          </View>
        </View>
      </ScrollView>

      <View style={{ marginBottom: Layout.spacer.large, marginTop: Layout.spacer.medium, flexDirection: 'row', justifyContent: 'space-evenly' }}>
        <MenuButton text={'Reset'}
          color={Colors.red} buttonFn={() => {
            setNum(1)
            setComment('')
            setCreateName('')
            setCreatePrice(0)
            setCreateTaxRate('')
          }} />
        <MenuButton text={(num > 1 ? 'Add items ' : 'Add item ') + centsToDollar(createPrice * num)} buttonFn={() => {
          changeAddOneTimeItem()
        }} color={Colors.purple} />
      </View>
    </View>
  }

  return <View style={{ flex: 1 }}>
    <ScrollView
      contentContainerStyle={{ marginTop: 20, marginHorizontal: 40, paddingBottom: Layout.window.height * 0.3 }}
      ref={scrollviewRef}
      keyboardShouldPersistTaps='always'
    >
      <TouchableOpacity onPress={() => {
        changeItem()
      }}>
        <View onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.height)} style={styles.dropBox}>
          <HeaderText center style={{ paddingHorizontal: 12, paddingVertical: 4 }}>{name}</HeaderText>
          <View style={[styles.dropBoxButton, { width }]}>
            <MaterialIcons
              name='arrow-drop-down'
              color={Colors.softwhite}
              size={30} />
          </View>
        </View>
      </TouchableOpacity>

      {!billItem && <View style={styles.itemSection}>
        <LargeText>Quantity ({centsToDollar(singleTotal * num)} each)</LargeText>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20, marginTop: 12 }}>
          <TouchableOpacity disabled={num === 1} onPress={() => setNum(prev => prev - 1)}>
            <MaterialIcons
              name='remove-circle-outline'
              color={Colors.softwhite}
              size={36}
              style={{ paddingVertical: 6, paddingHorizontal: 20 }}
            />
          </TouchableOpacity>
          <HeaderText style={{ width: 50 }} center>{num}</HeaderText>
          <TouchableOpacity onPress={() => setNum(prev => prev + 1)}>
            <MaterialIcons
              name='add-circle-outline'
              color={Colors.softwhite}
              size={36}
              style={{ paddingVertical: 6, paddingHorizontal: 20 }}
            />
          </TouchableOpacity>
        </View>
      </View>}

      {specOrder.length > 0 && <View style={styles.itemSection}>
        <LargeText>Specifications</LargeText>
        {
          specOrder.map((spec_id) => <View style={{ marginTop: 16, flexDirection: 'row', }} key={spec_id}>
            <View style={{ width: 40, alignItems: 'center' }}>
              {invalidSpecs.includes(spec_id) && <HeaderText style={{ color: Colors.red, fontWeight: '800', fontSize: 32, }}>*</HeaderText>}
            </View>
            <Spec

              spec_id={spec_id}
              spec={specifications[spec_id]}
              selectedSpecOptions={selectedOptionsBySpec[spec_id]?.options}
              editSpecOption={editSpecOption}
            /></View>)
        }
      </View>}


      {availableFilters.length > 0 && <View style={styles.itemSection}>
        <LargeText>Dietary restrictions</LargeText>
        {
          availableFilters.map(filter_key => {
            let selected = selectedFilters.hasOwnProperty(filter_key)
            return <View key={filter_key} style={{ marginLeft: 40, }}><Filter
              filter_key={filter_key}
              filterPrice={selected ? selectedFilters[filter_key] : filters[filter_key]}
              selected={selected}
              toggleFilter={toggleFilter}
            />
            </View>
          })
        }
      </View>}

      {modOrder.length > 0 && <View style={styles.itemSection}>
        <LargeText>Add-ons</LargeText>
        {
          modOrder.map(mod_id => {
            let selected = selectedMods.hasOwnProperty(mod_id)
            return <View key={mod_id} style={{ marginLeft: 40, }}>
              <Mod
                key={mod_id}
                mod_id={mod_id}
                {...modifications[mod_id]}
                {...selectedMods[mod_id]}
                selected={selected}
                editMod={editMod}
              />
            </View>
          })
        }
      </View>}

      <View style={styles.itemSection}>
        <LargeText>Comment</LargeText>
        <View style={{ marginLeft: 40 }}><View style={styles.commentBox}>
          <TextInput
            style={styles.commentText}
            multiline={true}
            placeholder={'Add a comment? This will be visible to guests.'}
            placeholderTextColor={Colors.white + 'AA'}
            onChangeText={text => {
              if (text.length <= 100) {
                setComment(text)
              }
            }}
            value={comment}

            keyboardAppearance='dark'
            returnKeyType={'done'}

            autoCorrect={true}
            selectTextOnFocus={true}
            autoFocus={false}
            blurOnSubmit={true}
            onFocus={() => { scrollviewRef.current.scrollToEnd() }}
            onSubmitEditing={() => {
            }}
          />
        </View>
          <ClarifyingText style={{ marginTop: 4 }}>Maximum 100 characters. Remaining: {100 - comment.length}</ClarifyingText>
        </View>
      </View>
    </ScrollView>

    <View style={{ marginBottom: Layout.spacer.large, marginTop: Layout.spacer.medium, flexDirection: 'row', justifyContent: 'space-evenly' }}>
      <MenuButton text={billItem && !isBillItemAltered ? 'No changes' : 'Reset'}
        disabled={billItem && !isBillItemAltered}
        color={billItem && !isBillItemAltered ? Colors.darkgrey : Colors.red} buttonFn={() => {
          setNum(1)
          setComment(billItem?.comment || '')
          setSingleTotal(billItem?.total / billItem?.num || price)
          setSelectedOptionsBySpec(billItem?.specifications || {})
          setSelectedFilters(billItem?.filters || {})
          setSelectedMods(billItem?.modifications || {})
        }} />
      <MenuButton text={(billItem ? isBillItemAltered ? 'Edit item' : 'No changes' : 'Add item') + (num > 1 ? 's ' : ' ') + centsToDollar(num * singleTotal)} buttonFn={() => {
        addItemToBill()
      }} disabled={billItem && !isBillItemAltered} color={billItem && !isBillItemAltered ? Colors.darkgrey : Colors.purple} />
    </View>
  </View>
}

function Spec({ spec_id, spec, selectedSpecOptions = [], editSpecOption, error = false, }) {
  if (!spec) {
    return null
  }

  const sumQuantities = selectedSpecOptions.reduce((acc, { quantity = 1 }) => acc + quantity, 0)

  return <View style={{ flex: 1, }}>
    {
      spec.min && spec.max ?
        spec.min === spec.max ?
          <MainText>Select exactly {spec.max} {spec.name}:</MainText> :
          <MainText>Select between {spec.min} and {spec.max} {spec.name}:</MainText> :
        spec.min ?
          <MainText>Select at least {spec.min} {spec.name}:</MainText> :
          <MainText>Select up to {spec.max} {spec.name}:</MainText>
    }

    <View style={{ paddingLeft: 28, }}>
      {
        spec.options.map(({ name, price, max = 1 }) => {
          let selectedIndex = selectedSpecOptions.findIndex(selectedOption => selectedOption.name === name)
          let selectedPrice = ~selectedIndex ? selectedSpecOptions[selectedIndex].price : price
          let selectedQuantity = selectedSpecOptions[selectedIndex]?.quantity ?? 1

          return <View
            style={{}}
            key={name}
          >
            <TouchableOpacity
              disabled={spec.max > 1 && (sumQuantities >= spec.max && !~selectedIndex) || (spec.max > 1 && selectedSpecOptions?.length === spec.max && !~selectedIndex)}
              onPress={() => editSpecOption(spec_id, spec, { name, price, quantity: 1 }, selectedSpecOptions)}><View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <RadioButton on={~selectedIndex} opacity={sumQuantities >= spec.max && !~selectedIndex ? 0.25 : 1} />
                <MainText style={{ paddingLeft: 20, fontWeight: '300' }}><MainText style={{ textTransform: 'capitalize' }}>{name}</MainText> {selectedPrice ? '(+' + centsToDollar(selectedPrice) + ')' : ''}</MainText>
              </View>
            </TouchableOpacity>
            {!!~selectedIndex && max > 1 && <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <View style={styles.modalOptionCounter}>
                <TouchableOpacity disabled={selectedQuantity <= 1} style={styles.icon} onPress={() => {
                  editSpecOption(spec_id, spec, { name, price }, selectedSpecOptions, -1)
                }}>
                  <MaterialIcons
                    name="remove-circle-outline"
                    color={selectedQuantity <= 1 ? Colors.lightgrey : Colors.white}
                    size={28}
                  />
                </TouchableOpacity>

                <LargeText style={{ fontWeight: '300' }}>{selectedQuantity}</LargeText>

                <TouchableOpacity
                  style={styles.icon}
                  disabled={selectedQuantity >= max || sumQuantities >= spec.max}
                  onPress={() => {
                    editSpecOption(spec_id, spec, { name, price }, selectedSpecOptions, +1)
                  }}>
                  <MaterialIcons
                    name="add-circle-outline"
                    color={sumQuantities >= spec.max || selectedQuantity >= max ? Colors.lightgrey : Colors.white}
                    size={28}
                  />
                </TouchableOpacity>
              </View>

              <LargeText style={{ marginLeft: 50, fontWeight: '300', }}>(max {max})</LargeText>


            </View>}
          </View>
        })}
    </View>
  </View>
}

function Filter({ filter_key, filterPrice, selected, toggleFilter, }) {
  return <TouchableOpacity onPress={() => toggleFilter(filter_key, filterPrice)}><View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
    <RadioButton on={selected} />
    <MainText style={{ paddingLeft: 20, fontWeight: '300' }}>{filterTitles[filter_key]} {filterPrice ? '(+' + centsToDollar(filterPrice) + ')' : ''}</MainText>
  </View>
  </TouchableOpacity>
}

function Mod({ mod_id, name, price, quantity = 1, max = 1, selected, editMod, }) {
  if (!name) {
    return null
  }

  return <View>
    <TouchableOpacity onPress={() => editMod(mod_id, { name, price, quantity })}><View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
      <RadioButton on={selected} />
      <MainText style={{ paddingLeft: 20, fontWeight: '300' }}><MainText style={{ textTransform: 'capitalize' }}>{name}</MainText> {price ? '(+' + centsToDollar(price) + ')' : ''}</MainText>
    </View>
    </TouchableOpacity>
    {selected && max > 1 && <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
      <View style={styles.modalOptionCounter}>
        <TouchableOpacity disabled={quantity <= 1} style={styles.icon} onPress={() => {
          editMod(mod_id, { price }, -1)
        }}>
          <MaterialIcons
            name="remove-circle-outline"
            color={quantity <= 1 ? Colors.lightgrey : Colors.white}
            size={28}
          />
        </TouchableOpacity>

        <LargeText style={{ fontWeight: '300' }}>{quantity}</LargeText>

        <TouchableOpacity
          style={styles.icon}
          disabled={quantity >= max}
          onPress={() => {
            editMod(mod_id, { price, }, +1)
          }}>
          <MaterialIcons
            name="add-circle-outline"
            color={quantity >= max ? Colors.lightgrey : Colors.white}
            size={28}
          />
        </TouchableOpacity>
      </View>
      <LargeText style={{ marginLeft: 50, fontWeight: '300', }}>(max {max})</LargeText>

    </View>}
  </View>
}

function RadioButton({ on, opacity = 1 }) {
  return <View style={{ opacity, height: 18, width: 18, borderRadius: 9, borderColor: Colors.white, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ height: 12, width: 12, borderRadius: 6, backgroundColor: on ? Colors.white : null }} />
  </View>
}

const styles = StyleSheet.create({
  itemSection: {
    borderTopColor: Colors.softwhite,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 30,
    paddingTop: 10,
  },
  actionContainer: {
    // width: Layout.window.width * 0.8,
    width: '100%',
    // paddingHorizontal: 16,
    alignSelf: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionItem: {
    // paddingLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionCounter: {
    flexDirection: 'row',
    width: 140,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalEntire: {
    width: Layout.window.width * 0.85,
    borderRadius: 15,
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  modalItemRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  modalItemDetails: {
    flex: 1,

  },
  modalContainer: {
    backgroundColor: Colors.darkgrey,
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderRadius: 15,
  },
  modalSplitRow: {
    flexDirection: 'row',
  },
  modalSplitSection: {
    flex: 1,
    alignItems: 'center',
  },
  modalSplitSectionText: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: Layout.fontWeight.semibold,
  },

  modalSplitSectionWays: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: Layout.fontWeight.light,
    marginHorizontal: 16,
    marginTop: -8,
  },

  icon: {
    padding: 8,
  },
  modalSectionSeparator: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.white,
    marginHorizontal: 8,
  },

  modalItem: {
    // backgroundColor: 'orange',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalOptionCounter: {
    marginLeft: 100,
    flexDirection: 'row',
    width: 160,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalButtonText: {
    fontSize: 20,
    fontWeight: Layout.fontWeight.regular,
    color: Colors.white,
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
  modificationDrawerCloser: {
    position: 'absolute',
    width: Layout.window.width,
    height: Layout.window.height,
    zIndex: 3,
    backgroundColor: Colors.background + '77'
  },
  modificationDrawer: {
    position: 'absolute',
    width: Layout.window.width,
    maxHeight: Layout.window.height * 0.7,
    zIndex: 4,
    backgroundColor: Colors.white,
    borderTopRightRadius: 40,
    borderTopLeftRadius: 40,
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  xButton: {
    position: 'absolute',

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 1,
    shadowRadius: 9.51,

    elevation: 15,
  },
  dropBox: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 8,
    borderColor: Colors.softwhite,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    backgroundColor: Colors.darkgrey,
  },
  dropBoxButton: {
    borderLeftColor: Colors.softwhite,
    borderLeftWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

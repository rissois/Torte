import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Switch,
  Keyboard,
  Dimensions,
  Alert,
  ScrollView,
  UIManager,
  LayoutAnimation,
  Platform,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import { DraggableList, StaticList } from '../components/PortalRow';
import ImageUploader from '../components/ImageUploader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';
import DisablingScrollView from '../components/DisablingScrollview';
import filterTitles from '../constants/filterTitles';
import centsToDollar from '../functions/centsToDollar';
import MenuButton from '../components/MenuButton';
import RadioButton from '../components/RadioButton';
import { removeTracker, setTracker } from '../redux/actionsTracker';
import firebase from '../config/Firebase';
import identicalArrays from '../functions/identicalArrays';
import { useFocusEffect } from '@react-navigation/native';
import RenderOverlay from '../components/RenderOverlay';
import Cursor from '../components/Cursor';
import useRestaurant from '../hooks/useRestaurant';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


export default function ItemScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()
  const { items = {}, specifications = {}, modifications = {}, photos = {}, photoAds = {}, tracker: { item: item_id }, restaurant: { taxRates = {} } } = useSelector(state => state)
  // Extract item
  // console.log(item_id)
  let { [item_id]: item = {} } = items
  let {
    price: fsPrice,
    taxRate: fsTaxRate,
    description: fsDescription,
    specOrder: fsSpecOrder,
    modOrder: fsModOrder,
    filtersAllowed: fsFiltersAllowed,
    filters: fsFilters,
    commentsAllowed: fsCommentsAllowed,
    commentNote: fsCommentNote,
    live = false,
    raw: fsRaw,
  } = item
  let {
    name = item.name,
    internal_name = item.internal_name,
    new_mod,
    new_spec,
  } = (route.params || {})
  // Extract photo
  let { [item_id]: photo = {} } = photos

  const [price, setPrice] = useState(fsPrice)
  const priceRef = useRef(null)
  const [priceFocused, setPriceFocused] = useState(false)
  const [isPriceNegative, setIsPriceNegative] = useState(fsPrice < 0)

  const [taxRate, setTaxRate] = useState(fsTaxRate)
  const [taxTitleOffset, setTaxTitleOffset] = useState(null)
  const [showTaxOptions, setShowTaxOptions] = useState(!fsTaxRate)


  const [description, setDescription] = useState(fsDescription)

  const [raw, setRaw] = useState(fsRaw)

  const [specOrder, setSpecOrder] = useState(fsSpecOrder)
  const [newSpecOrder, setNewSpecOrder] = useState([])
  const [modOrder, setModOrder] = useState(fsModOrder)
  const [newModOrder, setNewModOrder] = useState([])
  const [filters, setFilters] = useState(fsFilters)
  const [filterWidth, setFilterWidth] = useState(null)
  const [filtersAllowed, setFiltersAllowed] = useState(fsFiltersAllowed)
  const [filterCosts, setFilterCosts] = useState(Object.keys(fsFilters ?? {}).reduce((obj, key) => {
    return { ...obj, [key]: typeof fsFilters[key] === 'number' ? fsFilters[key] : 0 }
  }, {}))

  const [commentsAllowed, setCommentsAllowed] = useState(fsCommentsAllowed)
  const [commentWidth, setCommentWidth] = useState(null)
  const [commentNote, setCommentNote] = useState(fsCommentNote)
  const commentNoteRef = useRef(null)

  const [isItemAltered, setIsItemAltered] = useState(false)

  const [showSpecList, setShowSpecList] = useState(false)
  const [showModList, setShowModList] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // append new mod to the modOrder
    if (new_mod) {
      setModOrder(prev => [...prev, new_mod])
      navigation.setParams({ new_mod: null })
    }
  }, [new_mod])

  useEffect(() => {
    // append new spec to the specOrder
    if (new_spec) {
      setSpecOrder(prev => [...prev, new_spec])
      navigation.setParams({ new_spec: null })
    }
  }, [new_spec])

  useEffect(() => {
    setIsItemAltered(
      name !== item.name ||
      internal_name !== item.internal_name ||
      price * (isPriceNegative ? -1 : 1) !== item.price ||
      taxRate !== item.taxRate ||
      description !== item.description ||
      !identicalArrays(specOrder, item.specOrder) ||
      filtersAllowed !== item.filtersAllowed ||
      (filtersAllowed && !identicalFilters(filters, item.filters)) ||
      !identicalArrays(modOrder, item.modOrder) ||
      commentsAllowed !== item.commentsAllowed ||
      (commentsAllowed && commentNote !== item.commentNote) ||
      raw !== item.raw
    )
  }, [item, specOrder, modOrder, filtersAllowed, filters, commentsAllowed, commentNote, name, internal_name, taxRate, description, price, isPriceNegative, raw])

  const identicalFilters = (a, b) => {
    if (!a && !b) {
      return true
    }
    else if (!a && b || a && !b) {
      return false
    }
    return !~Object.keys(a).findIndex(filter => {
      return a[filter] !== b[filter]
    })
  }

  const switchLive = async (isLive) => {
    try {
      firebase.firestore().collection('restaurants').doc(restaurant_id)
        .collection('restaurantItems').doc(item_id)
        .update({
          live: isLive
        })
    }
    catch (error) {
      console.log('itemScreen switch error: ', error)
      Alert.alert(`Could not ${isLive ? 'turn on' : 'turn off'}`, 'Please try again. Contact Torte support if the issue persists.')
    }
  }

  const toggleTaxOptions = () => {
    setShowTaxOptions(prev => !prev)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  const passesFilterCheck = useCallback((filters) => {
    const filterCheck = (filters, child, parent, array) => {
      if (filters[child] === true && filters[parent] !== true) {
        array.push(`Always ${filterTitles[child]} but ${filters[parent] === false ? 'never' : 'can be'} ${filterTitles[parent]}`)
      }
      else if (typeof filters[child] === 'number' && filters[parent] === false) {
        array.push(`Can be ${filterTitles[child]} but never ${filterTitles[parent]}`)
      }
    }

    let errors = []

    filterCheck(filters, 'vegan', 'vegetarian', errors)
    filterCheck(filters, 'vegan', 'pescatarian', errors)
    filterCheck(filters, 'vegan', 'dairyFree', errors)
    filterCheck(filters, 'vegan', 'shellfishFree', errors)
    filterCheck(filters, 'vegan', 'eggFree', errors)
    filterCheck(filters, 'vegetarian', 'pescatarian', errors)
    filterCheck(filters, 'vegetarian', 'shellfishFree', errors)

    if (errors.length) {
      Alert.alert('Dietary filter error', 'Please correct the following: ' + errors.join('\n'))
      return false
    }
    return true
  }, [])

  const saveChanges = async (override = false) => {
    /*
      New names
      New filters
      New comments
      New orders
      Probably go back if this is section tracker?
    */

    if (isItemAltered && (!filtersAllowed || passesFilterCheck(filters))) {
      try {
        setIsSaving(true)
        await firebase.firestore().collection('restaurants').doc(restaurant_id)
          .collection('restaurantItems').doc(item_id)
          .update({
            name,
            internal_name,
            commentsAllowed,
            commentNote,
            specOrder,
            modOrder,
            filtersAllowed,
            filters,
            description,
            price: price * (isPriceNegative ? -1 : 1),
            taxRate,
            raw,
          })
        setIsSaving(false)
      }
      catch (error) {
        setIsSaving(false)
        console.log('saveChanges ItemScreen error: ', error)
        Alert.alert('Could not save item', 'Please try again. Contact Torte support if the issue persists.')
      }
    }
  }


  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => {
          if (isItemAltered) {
            Alert.alert(`Save changes before you leave?`, 'If you leave without saving, all changes on this page will be lost.', [
              {
                text: 'Yes', onPress: async () => {
                  if (!photo && !!~Object.keys(photoAds).findIndex(photoAd_id => {
                    return photoAds[photoAd_id].topOrder.includes[item_id] ||
                      photoAds[photoAd_id].bottomOrder.includes[item_id] ||
                      photoAds[photoAd_id].largeOrder.includes[item_id]
                  })) {
                    Alert.alert('Missing photo', 'You have photo ads that require an image for this item. You will want to either add an image, or remove this item from your photo ads', [
                      {
                        text: 'Leave anyways',
                        onPress: () => {
                          saveChanges()
                          dispatch(removeTracker('item'))
                          navigation.goBack()
                        }
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      }
                    ])
                  }
                  else {
                    saveChanges()
                    dispatch(removeTracker('item'))
                    navigation.goBack()
                  }
                }
              },
              {
                text: 'No',
                onPress: async () => {
                  dispatch(removeTracker('item'))
                  navigation.goBack()
                }
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },

            ])
          }
          else {
            dispatch(removeTracker('item'))
            navigation.goBack()
          }

        }} />

        <DisablingScrollView onScrollBeginDrag={() => { Keyboard.dismiss() }} style={{ flex: 1 }}>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }} />
            <HeaderText>{name}</HeaderText>
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => navigation.push('Create', { category: 'item', name, internal_name })}>
                <ClarifyingText style={{ marginHorizontal: 20, color: Colors.lightgrey }}>(edit)</ClarifyingText>
              </TouchableOpacity>
            </View>

          </View>

          <MainText center>{internal_name || '(no internal name)'}</MainText>

          <View style={{ marginVertical: Layout.spacer.medium }}>
            <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
              <LargeText>Show customers this item</LargeText>
              <Switch
                trackColor={{ false: Colors.purple, true: Colors.green }}
                thumbColor={live ? Colors.white : Colors.lightgrey}
                ios_backgroundColor={Colors.midgrey}
                onValueChange={switchLive}
                value={live}
                style={{
                  marginLeft: 20,
                  transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                }}
              />
            </View>
            <MainText center style={{ color: live ? Colors.green : Colors.red }}>Customers can{live ? '' : 'not'} see this item</MainText>
          </View>

          <View key={'price'} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.medium }}>
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
              onChangeText={text => {
                if (text.slice(-1) === '-') {
                  setIsPriceNegative(prev => !prev)
                }
                else if (!text) {
                  setPrice(0)
                }
                else {
                  let asNum = parseInt(text)
                  if (asNum) {
                    setPrice(asNum)
                  }
                }
              }}
              ref={priceRef}
              value={price.toString() === '-' ? 0 : price.toString()}
              onFocus={() => {
                setPriceFocused(true)
              }}
              onBlur={() => {
                setPriceFocused(false)
              }}
            />
          </View>

          <View key={'tax'} style={{ flex: 1, marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.medium }}>
            <TouchableOpacity onPress={toggleTaxOptions} style={{ flexDirection: 'row' }}>
              <LargeText onLayout={({ nativeEvent }) => { setTaxTitleOffset(nativeEvent.layout.width) }} style={{ paddingRight: Layout.spacer.small }}>Item tax: </LargeText>
              {
                !!taxRates[taxRate] ?
                  <LargeText>{taxRates[taxRate].percent}% ({taxRates[taxRate].name})</LargeText> :
                  <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>No tax applied</LargeText>
              }
              <ClarifyingText style={{ marginHorizontal: 20, color: Colors.lightgrey, lineHeight: 30, }}>(edit)</ClarifyingText>
            </TouchableOpacity>

            <View style={{ height: showTaxOptions ? undefined : 0, marginLeft: taxTitleOffset, marginVertical: showTaxOptions ? 12 : 0 }}>
              {Object.keys(taxRates).map(key => <TouchableOpacity key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => {
                setTaxRate(key)
                toggleTaxOptions()
              }}>
                {showTaxOptions && <RadioButton on={taxRate === key} />}
                <LargeText>{taxRates[key].percent}% ({taxRates[key].name})</LargeText>
              </TouchableOpacity>)}
            </View>

          </View>

          <View key={'description'} style={{ flex: 1, marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.medium }}>
            <View style={{ marginBottom: Layout.spacer.small }}>
              <LargeText>Item description</LargeText>
            </View>
            <TextInput
              style={{
                backgroundColor: Colors.darkgrey,
                color: Colors.softwhite,
                height: 130,
                fontSize: 24,
                paddingHorizontal: 10,
                paddingVertical: 16
                // flex: 1,
                // fontSize: 30,
                // paddingHorizontal: 4,
                // color: !commentsAllowed ? Colors.darkgrey : Colors.softwhite,
              }}
              autoCapitalize='sentences'
              autoCorrect
              blurOnSubmit
              // editable={commentsAllowed}
              enablesReturnKeyAutomatically
              onChangeText={text => setDescription(text)}
              onSubmitEditing={() => Keyboard.dismiss()}
              placeholder='[add description here]'
              placeholderTextColor={Colors.lightgrey}
              value={description}
              multiline
            />

          </View>

          <View key={'advisory'} style={{ flex: 1, marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.medium }}>
            <View style={{ marginBottom: Layout.spacer.small }}>
              <LargeText>Show raw or undercooked warning?</LargeText>
            </View>

            <View style={{ flexDirection: 'row', marginVertical: Layout.spacer.small, }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Layout.spacer.large }}
                onPress={() => {
                  setRaw(true)
                }}
              >
                <RadioButton on={raw} />
                <MainText>Yes</MainText>
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Layout.spacer.large }} onPress={() => {
                setRaw(false)
              }}>
                <RadioButton on={!raw} />
                <MainText>No</MainText>
              </TouchableOpacity>
            </View>
          </View>

          <View key={'filters'} style={{ flex: 1, marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.small, }}>
            <View style={{ marginBottom: Layout.spacer.small }}>
              <LargeText>Item dietary needs</LargeText>
              <ClarifyingText>We highly recommend you add dietary information. You are responsible for the content of this section. Use “No” if you are not 100% certain of the dietary content.</ClarifyingText>
            </View>

            <View style={{ marginVertical: Layout.spacer.small, paddingVertical: 30, paddingHorizontal: 60, borderColor: Colors.white, borderWidth: 2, alignSelf: 'center' }}>
              <View onLayout={({ nativeEvent }) => setFilterWidth(nativeEvent.layout.width)}>
                <MainText center>Do you want to verify and show{'\n'}the below dietary information?</MainText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: Layout.spacer.medium, width: filterWidth }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => {
                    setFiltersAllowed(true)
                    // commentNoteRef.current.focus()
                  }}
                >
                  <RadioButton on={filtersAllowed} />
                  <MainText>Yes</MainText>
                </TouchableOpacity>

                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => {
                  setFiltersAllowed(false)
                }}>
                  <RadioButton on={!filtersAllowed} />
                  <MainText>No</MainText>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ overflow: 'hidden' }}>
              {/* This is not the right way, but cannot format it correctly otherwise */}
              {
                filtersAllowed ?
                  <View style={{}}>
                    <MainText center style={{ marginVertical: 10 }}>(accomodations can include an extra charge using the $ input)</MainText>
                    {Object.keys(filterTitles).map(key => {
                      return <Filter
                        key={key}
                        title={filterTitles[key]}
                        value={filters[key]}
                        cost={filterCosts[key]}
                        setFilter={val => setFilters(prev => ({ ...prev, [key]: val }))}
                        onChangeText={(text) => {
                          if (!text) {
                            text = '0'
                          }

                          let num = Number(text)

                          if (Number.isInteger(num)) {
                            setFilterCosts(prev => ({ ...prev, [key]: num }))
                            setFilters(prev => ({ ...prev, [key]: num }))
                          }
                        }}
                      />
                    })}
                  </View>
                  :
                  <View style={{ marginHorizontal: Layout.window.width * 0.1 }}>
                    <LargeText center style={{ color: Colors.red, fontWeight: 'bold' }}>NO DIETARY INFORMATION</LargeText>
                    <MainText center style={{ marginTop: Layout.spacer.small }}>Customers see this text:</MainText>
                    <MainText center style={{ color: Colors.red, fontWeight: 'bold' }}>"This restaurant has not provided any dietary information for this item. Please ask your server if you have questions."</MainText>
                  </View>
              }
            </View>
          </View>

          <View key={'specs'} style={{ flex: 1, marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.small }}>
            <View style={{ marginBottom: Layout.spacer.small }}>
              <LargeText>Item specifications</LargeText>
              <ClarifyingText>A specification is a single question with multiple answers</ClarifyingText>
              <ClarifyingText>E.g. Choose  a spice level, choose up to two flavors</ClarifyingText>
              <ClarifyingText>Press and hold the arrows to drag into desired order</ClarifyingText>
            </View>
            <DraggableList
              data={specOrder}
              setData={(order) => setSpecOrder(order)}
              dataReference={specifications}
              mainTextKey='name'
              rightTextKey='internal_name'
              onPress={(doc_id) => {
                dispatch(setTracker({ specification: doc_id }))
                navigation.navigate('Spec', { item_name: name })
              }}
              del={(doc_id, rightText) => {
                Alert.alert(`Remove ${rightText || 'specification'}?`, undefined, [
                  {
                    text: 'No, cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Yes', onPress: async () => {
                      setSpecOrder(prev => {
                        let next = [...prev]
                        next.splice(next.indexOf(doc_id), 1)
                        return next
                      })
                    }
                  },

                ])
              }}
              addNew={() => navigation.navigate('Spec', { item_name: name })}
              {...Object.keys(specifications).length && {
                addExisting: () => {
                  setNewSpecOrder([])
                  setShowSpecList(true)
                }
              }}
              category='specification'
            />

          </View>

          <View key={'mods'} style={{ flex: 1, marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.small }}>
            <View style={{ marginBottom: Layout.spacer.small }}>
              <LargeText>Item add-ons</LargeText>
              <ClarifyingText>A user can select any number of add-ons. (e.g. Lettuce, Tomato, onions)</ClarifyingText>
              <ClarifyingText>Press and hold the arrows to drag into desired order</ClarifyingText>
            </View>
            <DraggableList
              data={modOrder}
              setData={(order) => setModOrder(order)}
              dataReference={modifications}
              mainTextKey='name'
              rightTextKey='price'
              onPress={(doc_id) => {
                dispatch(setTracker({ modification: doc_id }))
                navigation.navigate('Mod', { item_name: name })
              }}
              del={(doc_id, mainText) => {
                Alert.alert(`Remove ${mainText || 'add-on'}?`, undefined, [
                  {
                    text: 'No, cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Yes', onPress: async () => {
                      setModOrder(prev => {
                        let next = [...prev]
                        next.splice(next.indexOf(doc_id), 1)
                        return next
                      })
                    }
                  },

                ])
                // firebase.firestore().collection('restaurants').doc(restaurant_id)
                //   .collection('restaurantMenus').doc(menu_id)
                //   .update({
                //     sectionOrder: firebase.firestore.FieldValue.arrayRemove(doc_id)
                //   })
              }}
              addNew={() => navigation.navigate('Mod', { item_name: name })}
              {...Object.keys(modifications).length && {
                addExisting: () => {
                  setNewModOrder([])
                  setShowModList(true)
                }
              }}
              category='modification'
            />
          </View>

          <View key={'comments'} style={{ marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.small }}>
            <View style={{ marginBottom: Layout.spacer.small }}>
              <LargeText>Comments</LargeText>
              <View onLayout={({ nativeEvent }) => setCommentWidth(nativeEvent.layout.width)} style={{ alignSelf: 'flex-start' }}>
                <MainText>Can users add comments when ordering this item?</MainText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: Layout.spacer.small, width: commentWidth }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => {
                    setCommentsAllowed(true)
                    // commentNoteRef.current.focus()
                  }}
                >
                  <RadioButton on={commentsAllowed} />
                  <MainText>Yes</MainText>
                </TouchableOpacity>

                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => {
                  setCommentsAllowed(false)
                }}>
                  <RadioButton on={!commentsAllowed} />
                  <MainText>No</MainText>
                </TouchableOpacity>
              </View>

              <MainText {...!commentsAllowed && { style: { color: Colors.darkgrey } }}>Do you have a note for comments?</MainText>
              <View style={{
                flexDirection: 'row',
                marginTop: Layout.spacer.small,
                borderBottomColor: !commentsAllowed ? Colors.darkgrey : commentNote ? Colors.softwhite : Colors.lightgrey,
                borderBottomWidth: 2,
                paddingBottom: 3,
              }}>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 30,
                    paddingHorizontal: 4,
                    color: !commentsAllowed ? Colors.darkgrey : Colors.softwhite,
                  }}
                  autoCapitalize='sentences'
                  autoCorrect
                  blurOnSubmit
                  // editable={commentsAllowed}
                  enablesReturnKeyAutomatically
                  onChangeText={text => setCommentNote(text)}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  placeholder='[insert note here]'
                  placeholderTextColor={!commentsAllowed ? Colors.darkgrey : Colors.lightgrey}
                  ref={commentNoteRef}
                  selectTextOnFocus
                  value={commentNote}
                />
              </View>
            </View>
          </View>

          <View key={'photo'} style={{ marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.small }}>
            <View style={{ marginBottom: Layout.spacer.small }}>
              {/* <LargeText>Photo</LargeText> upload={ } fetch={ } del={ } uri */}
              <ImageUploader {...photo} item_id={item_id} name={item.name} />
            </View>
          </View>

          <View style={{ height: Dimensions.get('screen').height * 0.55 }} />
        </DisablingScrollView>

        <View style={{ marginBottom: Layout.spacer.small, marginTop: Layout.spacer.medium, flexDirection: 'row', justifyContent: 'space-evenly' }}>
          <MenuButton text='Discard changes' color={isItemAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
            Alert.alert('Discard all changes?', undefined, [
              {
                text: 'Yes', onPress: () => {
                  setDescription(item.description)
                  setPrice(item.price)
                  setIsPriceNegative(item.price < 0)
                  setTaxRate(item.taxRate)
                  setSpecOrder(item.specOrder)
                  setModOrder(item.modOrder)
                  setCommentsAllowed(item.commentsAllowed)
                  setFiltersAllowed(item.filtersAllowed)
                  setFilters(item.filters)
                  setFilterCosts(Object.keys(item.filters).reduce((obj, key) => {
                    return { ...obj, [key]: typeof fsFilters[key] === 'number' ? fsFilters[key] : 0 }
                  }, {}))
                  setCommentNote(item.commentNote)
                  setRaw(item.raw)
                  navigation.setParams({ name: item.name, internal_name: item.internal_name, })
                }
              },
              {
                text: 'Cancel',
                style: 'cancel'
              },
            ])

          }} disabled={!isItemAltered} />
          <MenuButton text={isItemAltered ? 'Save changes' : 'No changes'} color={isItemAltered ? Colors.purple : Colors.darkgrey} buttonFn={() => {
            if (!price) {
              Alert.alert(
                '$0.00 price?',
                'Are you sure this item is free?',
                [
                  {
                    text: 'Yes, it\'s $0.00',
                    onPress: () => { saveChanges() }
                  },
                  {
                    text: 'No, cancel',
                    style: 'cancel'
                  }
                ]
              )
            }
            else {
              saveChanges()
            }
          }} disabled={!isItemAltered} />
        </View>
      </SafeAreaView>


      {
        !!showSpecList && <View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,0.9)`,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
          <LargeText style={{ marginBottom: Layout.spacer.small, fontWeight: 'bold' }}>Select specifications</LargeText>
          <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <StaticList
                data={Object.keys(specifications).filter(spec_id => !specOrder.includes(spec_id)).sort((a, b) => specifications[a].name.toLowerCase() > specifications[b].name.toLowerCase())}
                dataReference={specifications}
                // labelTextKey
                mainTextKey='name'
                rightTextKey='internal_name'
                onPress={(doc_id) => setNewSpecOrder(prev => {
                  let index = prev.indexOf(doc_id)
                  if (~index) {
                    let next = [...prev]
                    next.splice(index, 1)
                    return next
                  }
                  else {
                    return [...prev, doc_id]
                  }
                })}
                selected={newSpecOrder}
                category='specification'
              />
            </ScrollView>
          </View>
          <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
            <TouchableOpacity onPress={() => setShowSpecList(false)}>
              <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setSpecOrder(prev => [...prev, ...newSpecOrder])
              setShowSpecList(false)
            }}>
              <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.green, fontWeight: 'bold' }}>CONFIRM</LargeText>
            </TouchableOpacity>
          </View>
        </View>
      }


      {
        !!showModList && <View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,0.9)`,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
          <LargeText style={{ marginBottom: Layout.spacer.small, fontWeight: 'bold' }}>Select add-on</LargeText>
          <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <StaticList
                data={Object.keys(modifications).filter(mod_id => !modOrder.includes(mod_id)).sort((a, b) => modifications[a].name.toLowerCase() > modifications[b].name.toLowerCase())}
                dataReference={modifications}
                // labelTextKey
                mainTextKey='name'
                onPress={(doc_id) => setNewModOrder(prev => {
                  let index = prev.indexOf(doc_id)
                  if (~index) {
                    let next = [...prev]
                    next.splice(index, 1)
                    return next
                  }
                  else {
                    return [...prev, doc_id]
                  }
                })}
                selected={newModOrder}
                category='modification'
              />
            </ScrollView>
          </View>
          <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
            <TouchableOpacity onPress={() => setShowModList(false)}>
              <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setModOrder(prev => [...prev, ...newModOrder])
              setShowModList(false)
            }}>
              <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.green, fontWeight: 'bold' }}>CONFIRM</LargeText>
            </TouchableOpacity>
          </View>
        </View>
      }

      { isSaving && <RenderOverlay text='Saving changes' opacity={0.9} />}
    </View >
  );
}

const Filter = ({ title, value, cost, onChangeText, setFilter, }) => {
  const [costFocused, setCostFocused] = useState(false)
  const costRef = useRef(null)

  const isNumber = typeof value === 'number'

  return <View style={[styles.filters, {
    backgroundColor: !value && value !== 0 ? Colors.red : Colors.darkgrey,
  }]}>
    <View style={{ flex: 1 }}>
      <LargeText>{title}</LargeText>
    </View>
    <TouchableOpacity style={[styles.filterOption, { backgroundColor: value === true ? Colors.white : undefined }]} onPress={() => setFilter(true)}>
      <MainText style={{ color: value === true ? Colors.darkgrey : Colors.white }}>Always</MainText>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.filterOption, { backgroundColor: value === false ? Colors.white : undefined }]} onPress={() => setFilter(false)}>
      <MainText style={{ color: value === false ? Colors.red : Colors.white }} >Never</MainText>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.filterOption, { backgroundColor: isNumber ? Colors.white : undefined }]} onPress={() => {
      setFilter(cost)
    }}>
      <MainText style={{ color: isNumber ? Colors.darkgrey : Colors.white }}>Can be</MainText>
    </TouchableOpacity>
    <TouchableWithoutFeedback onPress={() => {
      costRef?.current?.focus()
    }}>
      <View style={[styles.cost, {
        opacity: isNumber ? 1 : 0.4,
        backgroundColor: isNumber ? Colors.purple : Colors.black
      }]}>
        <MainText>{centsToDollar(cost)}</MainText>
        <Cursor cursorOn={costFocused} color={Colors.white} />
      </View>
    </TouchableWithoutFeedback>

    <TextInput
      style={{ height: 0, width: 0, color: Colors.backgroundColor }}
      enablesReturnKeyAutomatically
      keyboardType='number-pad'
      blurOnSubmit
      enablesReturnKeyAutomatically
      onSubmitEditing={() => Keyboard.dismiss()}
      onChangeText={onChangeText}
      ref={costRef}
      value={cost.toString()}
      onFocus={() => {
        setFilter(cost)
        setCostFocused(true)
      }}
      onBlur={() => {
        setCostFocused(false)
      }}
    />
  </View>
}


const styles = StyleSheet.create({
  body: {
    width: Layout.window.width * 0.7,
    alignSelf: 'center'
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,

    elevation: 10,
  },
  rectPadding: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,

    elevation: 10,
  },
  cost: {
    width: Layout.window.width * 0.12,
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.30,
    shadowRadius: 2.30,

    elevation: 2,
  },
  filterOption: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginRight: 6,
  }
});

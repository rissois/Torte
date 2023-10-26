import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  Platform,
  Keyboard,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import BoxGenerator from '../components/BoxGenerator';
import { StaticList, DraggableList } from '../components/PortalRow';
import Plurarize from '../components/Plurarize';
import identicalArrays from '../functions/identicalArrays';
import RenderOverlay from '../components/RenderOverlay';
import { removeTracker } from '../redux/actionsTracker';
import useRestaurant from '../hooks/useRestaurant';

const rows = {
  single: 'Single row',
  double: 'Double row',
  large: 'Large',
}

const orientations = {
  left: 'left',
  right: 'right',
  full: 'full'
}

const unitWidthOverride = Layout.window.width / 17

export default function PhotoAdScreen2({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()
  const { photos, photoAds, tracker: { section: section_id, photoAd: photoAd_id } } = useSelector(state => state)

  let { [photoAd_id]: photoAd = {} } = photoAds

  let fsLive = photoAd.live ?? true

  let { rowType = (photoAd.largeOrder?.length ? rows.large : photoAd.bottomOrder?.length ? rows.double : rows.single) } = (route?.params ?? {})

  const [name, setName] = useState(photoAd.name ?? '')

  const [numberHeight, setNumberHeight] = useState(null)

  const [topNumber, setTopNumber] = useState(photoAd.topOrder?.length ?? (rowType === rows.large ? 1 : 0))
  const [topOrientation, setTopOrientation] = useState(photoAd.topOrientation ?? '')
  const [topOrder, setTopOrder] = useState(photoAd.topOrder ?? [])
  const [selectedTop, setSelectedTop] = useState([])

  const [bottomNumber, setBottomNumber] = useState(photoAd.bottomOrder?.length ?? (rowType === rows.large ? 1 : 0))
  const [bottomOrientation, setBottomOrientation] = useState(photoAd.bottomOrientation ?? '')
  const [bottomOrder, setBottomOrder] = useState(photoAd.bottomOrder ?? [])
  const [selectedBottom, setSelectedBottom] = useState([])

  const [largeOrientation, setLargeOrientation] = useState(photoAd.largeOrder?.length ? (photoAd.largeOrientation || orientations.full) : '')
  const [largeOrder, setLargeOrder] = useState(photoAd.largeOrder ?? [])
  const [selectedLarge, setSelectedLarge] = useState([])

  const [showPhotoList, setShowPhotoList] = useState('')

  const [isAdAltered, setIsAdAltered] = useState(false)
  const [invalidOrderLengths, setInvalidOrderLengths] = useState(false)
  const [formIncomplete, setFormIncomplete] = useState('')
  const [saveWithInvalidOrders, setSaveWithInvalidOrders] = useState(false)
  const [live, setLive] = useState(fsLive)

  const [isSaving, setIsSaving] = useState(false)

  // useEffect(() => {
  //   setIsSaving(false)
  // })

  useEffect(() => {
    setLive(fsLive)
  }, [fsLive])

  useEffect(() => {
    if (rowType === rows.large) {
      setIsAdAltered(
        // automatically altered if new photoAd
        !photoAd_id || name !== photoAd.name ||
        // otherwise, check against previous


        (!photoAd.largeOrder.length || // Was not a large rowType
          !identicalArrays(largeOrder, photoAd.largeOrder) ||
          // if left or right, check if either topOrder or bottomOrder is changes
          (largeOrientation !== orientations.full &&
            (!identicalArrays(topOrder, photoAd.topOrder) || !identicalArrays(bottomOrder, photoAd.bottomOrder)))))
      setFormIncomplete(!name ? 'Missing name' : !largeOrientation ? 'Missing orientation' : '')
      setInvalidOrderLengths(largeOrder.length !== 1 || (largeOrientation !== orientations.full && (topOrder.length !== 1 || bottomOrder.length !== 1)))
    }
    else if (rowType === rows.single) {
      setIsAdAltered(!photoAd_id || name !== photoAd.name ||
        (
          photoAd.bottomOrder.length ||
          photoAd.largeOrder.length ||
          topNumber !== photoAd.topOrder.length ||
          (topNumber === 2 && photoAd.topOrientation !== topOrientation) ||
          !identicalArrays(topOrder, photoAd.topOrder)
        ))
      setFormIncomplete(!name ? 'Missing name' : !topNumber ? 'Missing number of photos for top row' :
        topNumber === 2 && !topOrientation ? 'Missing top row orientation' : '')
      setInvalidOrderLengths(topOrder.length !== topNumber)
    }
    else if (rowType === rows.double) {
      setIsAdAltered(!photoAd_id || name !== photoAd.name ||
        (
          photoAd.largeOrder.length ||

          topNumber !== photoAd.topOrder.length ||
          (topNumber === 2 && photoAd.topOrientation !== topOrientation) ||
          !identicalArrays(topOrder, photoAd.topOrder) ||

          bottomNumber !== photoAd.bottomOrder.length ||
          (bottomNumber === 2 && photoAd.bottomOrientation !== bottomOrientation) ||
          !identicalArrays(bottomOrder, photoAd.bottomOrder)
        ))

      setFormIncomplete(!name ? 'Missing name' : !topNumber ? 'Missing number of photos for top row' :
        topNumber === 2 && !topOrientation ? 'Missing top row orientation' : !bottomNumber ? 'Missing number of photos for bottom row' :
          bottomNumber === 2 && !bottomOrientation ? 'Missing bottom row orientation' : '')
      setInvalidOrderLengths(topOrder.length !== topNumber || bottomOrder.length !== bottomNumber)
    }
  }, [photoAd, rowType, name, topNumber, topOrder, topOrientation, bottomNumber, bottomOrder, bottomOrientation, largeOrientation, largeOrder])

  const switchLive = async (isLive) => {
    if (photoAd_id) {
      try {
        firebase.firestore().collection('restaurants').doc(restaurant_id)
          .collection('restaurantPhotoAds').doc(photoAd_id)
          .update({
            live: isLive
          })
      }
      catch (error) {
        console.log('photoadScreen switch error: ', error)
        Alert.alert(`Could not ${isLive ? 'turn on' : 'turn off'}`, 'Please try again. Contact Torte support if the issue persists.')
      }
    }
    else {
      setLive(isLive)
    }
  }

  const Numbers = ({ number, selected, set }) => {
    return <TouchableOpacity onPress={() => set(number)}><View
      onLayout={({ nativeEvent }) => setNumberHeight(nativeEvent.layout.height)}
      style={{ padding: Layout.spacer.small, width: numberHeight, alignItems: 'center', backgroundColor: selected ? Colors.softwhite : Colors.background }}>
      <HeaderText style={{ fontWeight: 'bold', color: selected ? Colors.background : Colors.softwhite }}>{number}</HeaderText>
    </View></TouchableOpacity>
  }

  const SampleAd = () => {
    if (rowType === rows.large && largeOrientation === orientations.full) {
      return <Tile uri={photos[largeOrder[0]]?.uri} widthScale={3} heightScale={2} />
    }
    return <View style={{ flexDirection: 'row' }}>
      {rowType === rows.large && largeOrientation === orientations.left &&
        <Tile uri={photos[largeOrder[0]]?.uri} widthScale={2} heightScale={2} />
      }
      <View>
        <View style={{ flexDirection: 'row' }}>
          <Tile uri={photos[topOrder[0]]?.uri} widthScale={rowType === rows.large ? 1 : topNumber === 1 ? 3 : topNumber === 2 && topOrientation === orientations.left ? 2 : 1} heightScale={1} />
          {rowType !== rows.large && topNumber !== 1 && <Tile uri={photos[topOrder[1]]?.uri} widthScale={topNumber === 2 && topOrientation === orientations.right ? 2 : 1} heightScale={1} />}
          {rowType !== rows.large && topNumber === 3 && <Tile uri={photos[topOrder[2]]?.uri} widthScale={1} heightScale={1} />}
        </View>
        {
          rowType !== rows.single && <View style={{ flexDirection: 'row' }}>
            <Tile uri={photos[bottomOrder[0]]?.uri} widthScale={rowType === rows.large ? 1 : bottomNumber === 1 ? 3 : bottomNumber === 2 && bottomOrientation === orientations.left ? 2 : 1} heightScale={1} />
            {rowType !== rows.large && bottomNumber !== 1 && <Tile uri={photos[bottomOrder[1]]?.uri} widthScale={bottomNumber === 2 && bottomOrientation === orientations.right ? 2 : 1} heightScale={1} />}
            {rowType !== rows.large && bottomNumber === 3 && <Tile uri={photos[bottomOrder[2]]?.uri} widthScale={1} heightScale={1} />}
          </View>
        }
      </View>
      {rowType === rows.large && largeOrientation === orientations.right &&
        <Tile uri={photos[largeOrder[0]]?.uri} widthScale={2} heightScale={2} />
      }
    </View>
  }

  const Tile = ({ uri, widthScale = 1, heightScale = 1 }) => {
    let width = widthScale * Layout.window.width * 0.2
    let height = heightScale * Layout.window.width * 0.2

    if (uri) {
      return <Image
        style={{ height, width }}
        source={{ uri }}
        resizeMode='cover'
      />
    }
    else {
      return <View style={{ width, height, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.darkgrey }}>
        <MainText center>MISSING</MainText>
        <MainText center>PHOTO</MainText>
      </View>
    }
  }

  const savePhotoAd = async () => {
    if (formIncomplete) {
      Alert.alert('Please complete all fields', formIncomplete)
    }
    else if (invalidOrderLengths) {
      Alert.alert('Incorrect number of photos supplied')
      setSaveWithInvalidOrders(true)
    }
    else if ((rowType !== rows.large && topNumber === 2 && !topOrientation) ||
      (rowType === rows.double && bottomNumber === 2 && !bottomOrientation)
    ) {
      Alert.alert('Missing a row orientation')
    }
    else {

      try {
        setIsSaving(true)
        var batch = firebase.firestore().batch()

        let collectionRef = firebase.firestore().collection('restaurants').doc(restaurant_id).collection('restaurantPhotoAds')
        let docRef = null

        if (photoAd_id) {
          docRef = collectionRef.doc(photoAd_id)
        }
        else {
          docRef = collectionRef.doc()
          if (section_id) {
            let sectionRef = firebase.firestore().collection('restaurants').doc(restaurant_id).collection('restaurantSections').doc(section_id)
            batch.update(sectionRef, {
              photoAd: docRef.id,
            })
          }
        }

        batch.set(docRef, {
          name: name,
          topOrder: rowType === rows.large && largeOrientation === orientations.full ? [] : topOrder,
          topOrientation: rowType !== rows.large && topNumber === 2 ? topOrientation : '',
          bottomOrder: rowType === rows.single || (rowType === rows.large && largeOrientation === orientations.full) ? [] : bottomOrder,
          bottomOrientation: rowType === rows.double && bottomNumber === 2 ? bottomOrientation : '',
          largeOrder: rowType === rows.large ? largeOrder : [],
          largeOrientation: rowType === rows.large && largeOrientation !== orientations.full ? largeOrientation : '',
          live,
        })

        await batch.commit()

        setIsSaving(false)

        if (section_id) {
          dispatch(removeTracker('photoAd'))
          navigation.navigate('Section')
        }
        else {
          dispatch(removeTracker('photoAd'))
          navigation.navigate('CategoryList', { category: 'photoAd' })
        }
      }
      catch (error) {
        console.log('photoAd error: ', error)
        setIsSaving(false)
        Alert.alert('Could not save photo ad', 'Please try again. Contact Torte support if the issue persists.')
      }
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => {
          if (isAdAltered) {
            Alert.alert(`Save changes before you leave?`, photoAd_id ? 'If you proceed without saving, changes to the photo ad will be lost.' : 'If you proceed without saving, your current work will be lost. If you just want to change the style of photo ad, please click (edit style) at the top of the page.', [
              {
                text: 'Yes', onPress: async () => {
                  savePhotoAd()
                  dispatch(removeTracker('photoAd'))
                  navigation.goBack()
                }
              },
              {
                text: 'No',
                onPress: async () => {
                  dispatch(removeTracker('photoAd'))
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
            dispatch(removeTracker('photoAd'))
            navigation.goBack()
          }
        }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', }}>
          <DisablingScrollView contentContainerStyle={{ marginHorizontal: Layout.window.width * 0.1 }}>
            <View style={{ marginBottom: Layout.spacer.small }}>
              <HeaderText center >{rowType}</HeaderText>
              <TouchableOpacity onPress={() => { navigation.push('PhotoAd1') }}>
                <MainText center>(edit style)</MainText>
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: Layout.spacer.medium }}>
              <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                <LargeText>Show customers this photo ad</LargeText>
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
              <MainText center style={{ color: live ? Colors.green : Colors.red }}>Customers can{live ? '' : 'not'} see this photo ad</MainText>
            </View>

            <View style={{ marginTop: Layout.spacer.medium }}>
              <LargeText style={{ textAlign: 'center' }}>Give an internal name for the photo ad (required)</LargeText>
              <ClarifyingText style={{ textAlign: 'center' }}>This is for your records, and will not be shown to guests</ClarifyingText>
              <View style={{
                width: Layout.window.width * 0.7,
                alignSelf: 'center',
                marginVertical: Layout.spacer.medium,
                borderBottomColor: name ? Colors.softwhite : Colors.lightgrey,
                borderBottomWidth: 2,
                paddingBottom: 3,
              }}>
                <TextInput
                  style={{
                    fontSize: 28,
                    paddingHorizontal: 4,
                    color: Colors.softwhite,
                    textAlign: 'center',
                  }}
                  autoCapitalize={'sentences'}
                  autoCompleteType={'off'}
                  autoCorrect={true}
                  autoFocus
                  blurOnSubmit={false}
                  enablesReturnKeyAutomatically
                  onChangeText={text => setName(text)}
                  onSubmitEditing={() => {
                    Keyboard.dismiss()
                  }}
                  onBlur={() => { Keyboard.dismiss() }}
                  placeholder={'[insert name]'}
                  placeholderTextColor={Colors.lightgrey}
                  returnKeyType='next'
                  selectTextOnFocus
                  value={name}
                />
              </View>
            </View>

            {rowType !== rows.large && <View>
              <LargeText center>How many photos are in {rowType === rows.single ? 'this' : 'the top'} row?</LargeText>
              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: Layout.spacer.small }}>
                <Numbers number={1} selected={topNumber === 1} set={setTopNumber} />
                <Numbers number={2} selected={topNumber === 2} set={setTopNumber} />
                <Numbers number={3} selected={topNumber === 3} set={setTopNumber} />
              </View>

              {
                topNumber === 2 && <View>
                  <LargeText center>Which orientation for the top row?</LargeText>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: Layout.spacer.small }}>
                    <TouchableOpacity style={{ padding: 20, borderWidth: 5, borderColor: topOrientation === orientations.right ? Colors.purple : Colors.background }}
                      onPress={() => setTopOrientation(orientations.right)}>
                      <BoxGenerator top={[1, 2]} unitWidth={unitWidthOverride} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 20, borderWidth: 5, borderColor: topOrientation === orientations.left ? Colors.purple : Colors.background }}
                      onPress={() => setTopOrientation(orientations.left)}>
                      <BoxGenerator top={[2, 1]} unitWidth={unitWidthOverride} />
                    </TouchableOpacity>
                  </View>
                </View>
              }

              {topNumber > 0 && <View style={{ marginVertical: Layout.spacer.medium }}>
                <View style={{ marginBottom: Layout.spacer.small }}>
                  <LargeText style={{ fontWeight: 'bold', }}>Select the {rowType === rows.single ? '' : 'top '}{topNumber > 1 ? 'photos' : 'photo'}</LargeText>
                  {saveWithInvalidOrders && topNumber > topOrder.length && <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>* Missing <Plurarize value={topNumber - topOrder.length} nouns={{ s: 'photo', p: 'photos' }} /></LargeText>}
                  {saveWithInvalidOrders && topNumber < topOrder.length && <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>* Too many photos</LargeText>}
                  {topNumber > 1 && <ClarifyingText>Press and hold the arrows to drag into desired order</ClarifyingText>}
                </View>
                <DraggableList
                  data={topOrder}
                  allowDrag={topNumber > 1}
                  setData={setTopOrder}
                  dataReference={photos}
                  // labelTextKey
                  mainTextKey='name'
                  rightTextKey='uri'
                  onPress={() => {
                    setSelectedTop([...topOrder])
                    setShowPhotoList('top')
                  }}
                  del={(doc_id) => setTopOrder(prev => {
                    let index = prev.indexOf(doc_id)
                    if (~index) {
                      let next = [...prev]
                      next.splice(index, 1)
                      return next
                    }
                  })}
                  addExisting={() => {
                    setSelectedTop([...topOrder])
                    setShowPhotoList('top')
                  }}
                  category='photo'
                />
              </View>}
            </View>}

            {rowType === rows.double && <View>
              <LargeText center>How many photos are in the bottom row?</LargeText>
              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: Layout.spacer.small }}>
                <Numbers number={1} selected={bottomNumber === 1} set={setBottomNumber} />
                <Numbers number={2} selected={bottomNumber === 2} set={setBottomNumber} />
                <Numbers number={3} selected={bottomNumber === 3} set={setBottomNumber} />
              </View>

              {
                bottomNumber === 2 && <View>
                  <LargeText center>Which orientation for the bottom row?</LargeText>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: Layout.spacer.small }}>
                    <TouchableOpacity style={{ padding: 20, borderWidth: 5, borderColor: bottomOrientation === orientations.right ? Colors.purple : Colors.background }}
                      onPress={() => setBottomOrientation(orientations.right)}>
                      <BoxGenerator top={[1, 2]} unitWidth={unitWidthOverride} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 20, borderWidth: 5, borderColor: bottomOrientation === orientations.left ? Colors.purple : Colors.background }}
                      onPress={() => setBottomOrientation(orientations.left)}>
                      <BoxGenerator top={[2, 1]} unitWidth={unitWidthOverride} />
                    </TouchableOpacity>
                  </View>
                </View>
              }

              {bottomNumber > 0 && <View style={{ marginVertical: Layout.spacer.medium }}>
                <View style={{ marginBottom: Layout.spacer.small }}>
                  <LargeText style={{ fontWeight: 'bold', }}>Select the bottom {bottomNumber > 1 ? 'photos' : 'photo'}</LargeText>
                  {saveWithInvalidOrders && bottomNumber > bottomOrder.length && <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>* Missing <Plurarize value={bottomNumber - bottomOrder.length} nouns={{ s: 'photo', p: 'photos' }} /></LargeText>}
                  {saveWithInvalidOrders && bottomNumber < bottomOrder.length && <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>* Too many photos</LargeText>}
                  {bottomNumber > 1 && <ClarifyingText>Press and hold the arrows to drag into desired order</ClarifyingText>}
                </View>
                <DraggableList
                  data={bottomOrder}
                  allowDrag={bottomNumber > 1}
                  setData={setBottomOrder}
                  dataReference={photos}
                  // labelTextKey
                  mainTextKey='name'
                  rightTextKey='uri'
                  onPress={() => {
                    setSelectedBottom([...bottomOrder])
                    setShowPhotoList('bottom')
                  }}
                  del={(doc_id) => setBottomOrder(prev => {
                    let index = prev.indexOf(doc_id)
                    if (~index) {
                      let next = [...prev]
                      next.splice(index, 1)
                      return next
                    }
                  })}
                  addExisting={() => {
                    setSelectedBottom([...bottomOrder])
                    setShowPhotoList('bottom')
                  }}
                  category='photo'
                />
              </View>}
            </View>}

            {rowType === rows.large && <View>

              <View>
                <LargeText center>Which style?</LargeText>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: Layout.spacer.small }}>
                  <TouchableOpacity
                    style={{ padding: 20, borderWidth: 5, borderColor: largeOrientation === orientations.right ? Colors.purple : Colors.background }}
                    onPress={() => setLargeOrientation(orientations.right)}>
                    <BoxGenerator top={[1]} bottom={[1]} right unitWidth={unitWidthOverride} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ padding: 20, borderWidth: 5, borderColor: largeOrientation === orientations.full ? Colors.purple : Colors.background }}
                    onPress={() => setLargeOrientation(orientations.full)}>
                    <BoxGenerator large unitWidth={unitWidthOverride} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ padding: 20, borderWidth: 5, borderColor: largeOrientation === orientations.left ? Colors.purple : Colors.background }}
                    onPress={() => setLargeOrientation(orientations.left)}>
                    <BoxGenerator top={[1]} bottom={[1]} left unitWidth={unitWidthOverride} />
                  </TouchableOpacity>

                </View>

                <View style={{ marginVertical: Layout.spacer.medium }}>
                  <LargeText style={{ fontWeight: 'bold', marginBottom: Layout.spacer.small }}>Select the large photo</LargeText>
                  {saveWithInvalidOrders && largeOrder.length !== 1 && <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>* {largeOrder.length ? 'Too many photos' : 'Missing photo'}</LargeText>}
                  <DraggableList
                    data={largeOrder}
                    allowDrag={false}
                    dataReference={photos}
                    // labelTextKey
                    mainTextKey='name'
                    rightTextKey='uri'
                    onPress={() => {
                      setSelectedLarge([...largeOrder])
                      setShowPhotoList('large')
                    }}
                    del={(doc_id) => setLargeOrder([])}
                    addExisting={() => {
                      setSelectedLarge([...largeOrder])
                      setShowPhotoList('large')
                    }}
                    category='photo'
                  />
                </View>

                {
                  largeOrientation !== orientations.full && <>
                    <View style={{ marginVertical: Layout.spacer.medium }}>
                      <LargeText style={{ fontWeight: 'bold', marginBottom: Layout.spacer.small }}>Select the top photo</LargeText>
                      {saveWithInvalidOrders && topOrder.length !== 1 && <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>* {topOrder.length ? 'Too many photos' : 'Missing photo'}</LargeText>}
                      <DraggableList
                        data={topOrder}
                        allowDrag={false}
                        dataReference={photos}
                        // labelTextKey
                        mainTextKey='name'
                        rightTextKey='uri'
                        onPress={() => {
                          setSelectedTop([...topOrder])
                          setShowPhotoList('top')
                        }}
                        del={(doc_id) => setTopOrder(prev => {
                          let index = prev.indexOf(doc_id)
                          if (~index) {
                            let next = [...prev]
                            next.splice(index, 1)
                            return next
                          }
                        })}
                        addExisting={() => {
                          setSelectedTop([...topOrder])
                          setShowPhotoList('top')
                        }}
                        category='photo'
                      />
                    </View>
                    <View style={{ marginVertical: Layout.spacer.medium }}>
                      <LargeText style={{ fontWeight: 'bold', marginBottom: Layout.spacer.small }}>Select the bottom photo</LargeText>
                      {saveWithInvalidOrders && bottomOrder.length !== 1 && <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>* {bottomOrder.length ? 'Too many photos' : 'Missing photo'}</LargeText>}
                      <DraggableList
                        data={bottomOrder}
                        allowDrag={false}
                        dataReference={photos}
                        // labelTextKey
                        mainTextKey='name'
                        rightTextKey='uri'
                        onPress={() => {
                          setSelectedBottom([...bottomOrder])
                          setShowPhotoList('bottom')
                        }}
                        del={(doc_id) => setBottomOrder(prev => {
                          let index = prev.indexOf(doc_id)
                          if (~index) {
                            let next = [...prev]
                            next.splice(index, 1)
                            return next
                          }
                        })}
                        addExisting={() => {
                          setSelectedBottom([...bottomOrder])
                          setShowPhotoList('bottom')
                        }}
                        category='photo'
                      />
                    </View>
                  </>
                }
              </View>
            </View>}

            {(rowType === rows.large || (!!topNumber && (rowType === rows.single || !!bottomNumber))) && < View style={{ marginVertical: Layout.spacer.medium }}>
              <LargeText center style={{ fontWeight: 'bold', marginBottom: Layout.spacer.small }}>What your customers see:</LargeText>
              <View style={{ alignSelf: 'center' }}>
                <SampleAd />
              </View>
            </View>}

          </DisablingScrollView>
        </KeyboardAvoidingView>
        <View style={{ marginVertical: Layout.spacer.large, flexDirection: 'row', justifyContent: 'space-around' }}>
          <MenuButton text='Discard changes' color={isAdAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
            Alert.alert('Discard all changes?', undefined, [
              {
                text: 'Yes', onPress: () => {
                  switchLive(photoAd.live ?? false)
                  setName(photoAd.name ?? '')
                  setTopNumber(photoAd.topOrder?.length ?? (rowType === rows.large ? 1 : 0))
                  setTopOrientation(photoAd.topOrientation ?? '')
                  setTopOrder(photoAd.topOrder ?? [])
                  setBottomNumber(photoAd.bottomOrder?.length ?? rowType === rows.large ? 1 : 0)
                  setBottomOrientation(photoAd.bottomOrientation ?? '')
                  setBottomOrder(photoAd.bottomOrder ?? [])
                  setLargeOrientation(photoAd.largeOrientation ?? (photoAd.topOrder?.length ? orientations.full : ''))
                  setLargeOrder(photoAd.largeOrder ?? [])
                  setSaveWithInvalidOrders(false)
                }
              },
              {
                text: 'Cancel',
                style: 'cancel'
              },
            ])
          }} disabled={!isAdAltered} />
          <MenuButton text={isAdAltered ? 'Save changes' : 'No changes'} color={isAdAltered ? Colors.purple : Colors.darkgrey} buttonFn={savePhotoAd} disabled={!isAdAltered} />
        </View>
      </SafeAreaView>

      {
        showPhotoList === 'top' && <View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,0.9)`,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
          <View style={{ marginBottom: Layout.spacer.small, }}>
            <LargeText center style={{ fontWeight: 'bold' }}>Select <Plurarize value={topNumber} nouns={{ s: 'photo', p: 'photos' }} /></LargeText>
            <ClarifyingText center>{selectedTop.length} selected</ClarifyingText>
          </View>
          <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>

            <ScrollView style={{ padding: 16 }}>
              <StaticList
                data={Object.keys(photos).filter(key => key !== 'logo').sort((a, b) => photos[a].name > photos[b].name)}
                dataReference={photos}
                // labelTextKey
                mainTextKey='name'
                rightTextKey='uri'
                onPress={(doc_id) => setSelectedTop(prev => {
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
                selected={selectedTop}
                category='photo'
              />
            </ScrollView>
          </View>
          <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
            <TouchableOpacity onPress={() => {
              setShowPhotoList('')
            }}>
              <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setTopOrder(selectedTop)
              setShowPhotoList('')
            }}>
              <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.green, fontWeight: 'bold' }}>CONFIRM</LargeText>
            </TouchableOpacity>
          </View>
        </View>
      }

      {
        showPhotoList === 'bottom' && <View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,0.9)`,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
          <LargeText center style={{ marginBottom: Layout.spacer.small, fontWeight: 'bold' }}>Select <Plurarize value={bottomNumber} nouns={{ s: 'photo', p: 'photos' }} /></LargeText>
          <ClarifyingText center>{selectedBottom.length} selected</ClarifyingText>
          <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>

            <ScrollView style={{ padding: 16 }}>
              <StaticList
                data={Object.keys(photos).filter(key => key !== 'logo').sort((a, b) => photos[a].name > photos[b].name)}
                dataReference={photos}
                // labelTextKey
                mainTextKey='name'
                rightTextKey='uri'
                onPress={(doc_id) => setSelectedBottom(prev => {
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
                selected={selectedBottom}
                category='photo'
              />
            </ScrollView>
          </View>
          <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
            <TouchableOpacity onPress={() => {
              setShowPhotoList('')
            }}>
              <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setBottomOrder(selectedBottom)
              setShowPhotoList('')
            }}>
              <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.green, fontWeight: 'bold' }}>CONFIRM</LargeText>
            </TouchableOpacity>
          </View>
        </View>
      }

      {
        showPhotoList === 'large' && <View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,0.9)`,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
          <LargeText center style={{ marginBottom: Layout.spacer.small, fontWeight: 'bold' }}>Select 1 photo</LargeText>
          <ClarifyingText center>{selectedLarge.length} selected</ClarifyingText>
          <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>

            <ScrollView style={{ padding: 16 }}>
              <StaticList
                data={Object.keys(photos).filter(key => key !== 'logo').sort((a, b) => photos[a].name > photos[b].name)}
                dataReference={photos}
                // labelTextKey
                mainTextKey='name'
                rightTextKey='uri'
                onPress={(doc_id) => setSelectedLarge(prev => {
                  if (prev[0] === doc_id) {
                    return []
                  }
                  return [doc_id]
                })}
                selected={selectedLarge}
                category='photo'
              />
            </ScrollView>
          </View>
          <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
            <TouchableOpacity onPress={() => {
              setShowPhotoList('')
            }}>
              <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setLargeOrder(selectedLarge)
              setShowPhotoList('')
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




const styles = StyleSheet.create({
  rowOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginVertical: Layout.spacer.small,
    padding: 20,
    borderWidth: 5
  }
})

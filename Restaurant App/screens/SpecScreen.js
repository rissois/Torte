import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity, } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';
import firebase from '../config/Firebase';
import { MaterialIcons, } from '@expo/vector-icons';
import { DraggableList, } from '../components/PortalRow';
import RadioButton from '../components/RadioButton';
import { removeTracker, } from '../redux/actionsTracker';
import RenderOverlay from '../components/RenderOverlay';
import capitalize from '../functions/capitalize';
import useRestaurant from '../hooks/useRestaurant';

const ranges = {
  between: 'bw',
  exact: 'exact',
  min: 'min',
  max: 'max',
  any: 'any',
}

export default function SpecScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()
  const { items, tracker: { item: item_id, specification: spec_id }, specifications } = useSelector(state => state)
  let { [item_id]: item } = items
  let { [spec_id]: spec = {} } = specifications
  // console.log(spec_id)
  let {
    name: fsName = '',
    internal_name: fsInternalName = '',
    options: fsOptions = [],
    max: fsMax,
    min: fsMin,
    hide: fsHide = false
  } = spec

  let fsRange = !spec_id ? '' :
    fsMin === fsMax ? ranges.exact :
      fsMin === 0 ?
        fsMax === Infinity ? ranges.any : ranges.max :
        fsMax === Infinity ? ranges.min : ranges.between

  let { params = {} } = route

  const [topInput, setTopInput] = useState(fsName)
  const [bottomInput, setBottomInput] = useState(fsInternalName)
  const [bottomInputFocused, setBottomInputFocused] = useState(false)
  const bottomRef = useRef(null)
  const [submitError, setSubmitError] = useState(null)
  const [greyBottom, setGreyBottom] = useState(null)
  const [range, setRange] = useState(fsRange)

  const [min, setMin] = useState(fsMin || 1)
  const [max, setMax] = useState(!fsMax || fsMax === Infinity ? 1 : fsMax)
  const [exact, setExact] = useState(fsMin || 1)
  const [betweenMin, setBetweenMin] = useState(!spec_id || fsMin === fsMax ? 1 : fsMin || 1)
  const [betweenMax, setBetweenMax] = useState(!fsMax || fsMax === Infinity ? 2 : fsMax)

  const [options, setOptions] = useState(fsOptions)

  const [hide, setHide] = useState(fsHide)

  const [alteredSpec, setAlteredSpec] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setGreyBottom((!topInput && !bottomInput && !bottomInputFocused))
  }, [topInput, bottomInput, bottomInputFocused])

  // Add option passed basck by params
  useEffect(() => {
    if (typeof params?.index === 'number') {
      setOptions(prev => {
        let next = [...prev]
        next[params.index] = { name: params.name, price: params.price, max: params.max }
        return next
      })
      navigation.setParams({ name: null, price: null, index: null })
    }
  }, [params])

  useEffect(() => {
    let convertedRange = convertRange(range)
    setAlteredSpec(
      topInput !== fsName ||
      bottomInput !== fsInternalName ||
      !identicalOptions(options, fsOptions) ||
      range !== fsRange ||
      convertedRange.min !== fsMin ||
      convertedRange.max !== fsMax ||
      hide !== fsHide
    )

  }, [options, topInput, bottomInput, range, min, max, exact, betweenMax, betweenMin, hide])

  const identicalOptions = (a, b) => {
    if (a.length !== b.length) {
      return false
    }
    return !~a.findIndex((option, index) => {
      return b[index].name !== option.name || b[index].price !== option.price || b[index].max !== option.max
    })
  }

  const convertRange = () => {
    let firestore_range = {}
    switch (range) {
      case ranges.between:
        firestore_range = { min: betweenMin, max: betweenMax }
        break;
      case ranges.exact:
        firestore_range = { min: exact, max: exact }
        break;
      case ranges.min:
        firestore_range = { min, max: Infinity }
        break;
      case ranges.max:
        firestore_range = { min: 0, max }
        break;
      case ranges.any:
        firestore_range = { min: 0, max: Infinity }
    }
    return firestore_range
  }

  const saveSpec = async () => {
    if (spec_id) {
      try {
        if (alteredSpec) {
          setIsSaving(true)
          await firebase.firestore().collection('restaurants').doc(restaurant_id)
            .collection('restaurantSpecifications').doc(spec_id)
            .update({
              ...convertRange(),
              name: topInput,
              internal_name: bottomInput,
              options,
              hide: range === ranges.max || range === ranges.any ? hide : false,
            })
          setIsSaving(false)
        }
        dispatch(removeTracker('specification'))
        navigation.goBack()
      }
      catch (error) {
        setIsSaving(false)

        console.log('updateOrCreate spec_id error: ', error)
      }
    }
    else { // Create a new doc
      try {
        setIsSaving(true)

        var batch = firebase.firestore().batch()

        let collectionRef = firebase.firestore().collection('restaurants').doc(restaurant_id).collection('restaurantSpecifications')
        let docRef = collectionRef.doc()

        if (item_id) {
          let parentRef = firebase.firestore().collection('restaurants').doc(restaurant_id).collection('restaurantItems').doc(item_id)
          batch.update(parentRef, {
            specOrder: firebase.firestore.FieldValue.arrayUnion(docRef.id)
          })
        }

        batch.set(docRef, {
          ...convertRange(),
          name: topInput,
          internal_name: bottomInput,
          options,
          live: true,
          hide: range === ranges.max || range === ranges.any ? hide : false,
        })

        // can await
        await batch.commit()
        setIsSaving(false)
        if (item_id) {
          navigation.navigate('Item', { new_spec: docRef.id })
        }
        else {
          navigation.goBack()
        }

      }
      catch (error) {
        setIsSaving(false)

        console.log('updateOrCreate errro: ', error)
        setSubmitError(true)
      }
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <MenuHeader leftText='Back' leftFn={() => {
          if (alteredSpec) {
            Alert.alert(`Save changes before you leave?`, undefined, [
              {
                text: 'Yes', onPress: async () => {
                  saveSpec()
                  dispatch(removeTracker('specification'))
                  navigation.goBack()
                }
              },
              {
                text: 'No',
                onPress: async () => {
                  dispatch(removeTracker('specification'))
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
            dispatch(removeTracker('specification'))
            navigation.goBack()
          }
        }} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, }}>
          {!!item && <HeaderText style={{ textAlign: 'center', }}>{params.item_name ?? item.name}</HeaderText>}
          <DisablingScrollView keyboardShouldPersistTaps='always'>
            <View style={{ marginTop: Layout.spacer.medium }}>
              <LargeText style={{ textAlign: 'center' }}>Give a name for this specificiation</LargeText>
              <ClarifyingText style={{ textAlign: 'center' }}>Try to keep this under 20 characters (recommended lowercase)</ClarifyingText>
              <View style={{
                width: Layout.window.width * 0.7,
                alignSelf: 'center',
                marginTop: Layout.spacer.small,
                borderBottomColor: topInput ? Colors.softwhite : Colors.lightgrey,
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
                  autoCapitalize={'none'}
                  autoCompleteType={'off'}
                  autoCorrect={false}
                  autoFocus
                  blurOnSubmit={false}
                  enablesReturnKeyAutomatically
                  onChangeText={text => setTopInput(text)}
                  onSubmitEditing={() => {
                    bottomRef.current.focus()
                  }}
                  placeholder={'e.g. spice level, sauce, flavor'}
                  placeholderTextColor={Colors.lightgrey}
                  returnKeyType='next'
                  selectTextOnFocus
                  value={topInput}
                />
              </View>

            </View>

            <View style={{ minHeight: Layout.spacer.large }} />

            <View style={{}}>
              <LargeText center grey={greyBottom}>Give an internal name (recommended)</LargeText>
              <ClarifyingText center grey={greyBottom}>This is for your records, and will not be shown to guests</ClarifyingText>
              <View style={{
                width: Layout.window.width * 0.7,
                alignSelf: 'center',
                marginTop: Layout.spacer.small,
                borderBottomColor: greyBottom ? Colors.darkgrey : bottomInput ? Colors.softwhite : Colors.lightgrey,
                borderBottomWidth: 2,
                paddingBottom: 3,

              }}>
                <TextInput
                  style={{
                    fontSize: 28,
                    paddingHorizontal: 4,
                    color: greyBottom ? Colors.darkgrey : Colors.softwhite,
                    textAlign: 'center',
                  }}
                  autoCapitalize={'sentences'}
                  autoCompleteType={'off'}
                  autoCorrect={true}
                  blurOnSubmit={false}
                  editable={!greyBottom}
                  enablesReturnKeyAutomatically
                  onChangeText={text => setBottomInput(text)}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  placeholder={'e.g. Spice level - Soups'}
                  placeholderTextColor={greyBottom ? Colors.darkgrey : Colors.lightgrey}
                  ref={bottomRef}
                  // returnKeyType='done'
                  selectTextOnFocus
                  value={bottomInput}
                  onFocus={() => setBottomInputFocused(true)}
                  onBlur={() => setBottomInputFocused(false)}
                />
              </View>
            </View>

            <View style={{ minHeight: Layout.spacer.large }} />

            <View>
              <LargeText grey={greyBottom} style={{ textAlign: 'center', }}>How many {topInput || '[name]'} can a user select?</LargeText>
              <View style={{ alignSelf: 'center' }}>
                <RangeSelector text='Between two numbers' onPress={() => {
                  Keyboard.dismiss()
                  setRange(ranges.between)
                }} selected={range === ranges.between} grey={greyBottom && !range} />
                <RangeSelector text='Must be exact' onPress={() => {
                  Keyboard.dismiss()
                  setRange(ranges.exact)
                }} selected={range === ranges.exact} grey={greyBottom && !range} />
                <RangeSelector text='Any number' onPress={() => {
                  Keyboard.dismiss()
                  setRange(ranges.any)
                }} selected={range === ranges.any} grey={greyBottom && !range} />
                <RangeSelector text={'Maximum of'} onPress={() => {
                  Keyboard.dismiss()
                  setRange(ranges.max)
                }} selected={range === ranges.max} grey={greyBottom && !range} />
                <RangeSelector text={'Minimum of'} onPress={() => {
                  Keyboard.dismiss()
                  setRange(ranges.min)
                }} selected={range === ranges.min} grey={greyBottom && !range} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: Layout.spacer.medium }}>
                {range === ranges.min && <RangeValues value={min} text={'Minimum'} blockSub={min === 0} onPress={(val) => { setMin(prev => prev + val) }} />}
                {range === ranges.max && <RangeValues value={max} text={'Maximum'} blockSub={max === 0} onPress={(val) => { setMax(prev => prev + val) }} />}
                {range === ranges.exact && <RangeValues value={exact} text={'Exactly'} blockSub={exact === 0} onPress={(val) => { setExact(prev => prev + val) }} />}

                {range === ranges.between && <>
                  <RangeValues value={betweenMin} text={'Minimum'} blockSub={betweenMin === 1} blockAdd={betweenMin + 1 === betweenMax} onPress={(val) => { setBetweenMin(prev => prev + val) }} />
                  <RangeValues value={betweenMax} text={'Maximum'} blockSub={betweenMax - 1 === betweenMin} onPress={(val) => { setBetweenMax(prev => prev + val) }} />
                </>}
              </View>
            </View>

            {(!!range) && <View style={{ marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.medium, borderWidth: 5, borderColor: Colors.purple, padding: Layout.spacer.small }}>
              <LargeText center>Example text:</LargeText>
              {
                range === ranges.exact ? <MainText center>Select exactly {exact} {topInput}</MainText> :
                  range === ranges.between ? <MainText center>Select between {betweenMin} and {betweenMax} {topInput}</MainText> :
                    range === ranges.min ? <MainText center>Select at least {min} {topInput}</MainText> :
                      range === ranges.max ? <MainText center>Select up to {max} {topInput}</MainText> :
                        <MainText center>Select any number of {topInput}</MainText>
              }
            </View>}

            {
              (range === ranges.max || range === ranges.any) && <View style={{ marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.medium, }}>
                <LargeText center grey={greyBottom}>Minimize options for {topInput}?</LargeText>
                <MainText center grey={greyBottom}>Too many specifications can overwhelm guests</MainText>
                <MainText center>Example when minimized: {capitalize(topInput)} (press to view)</MainText>

                <View style={{ alignSelf: 'center', width: Layout.window.width * 0.6, flexDirection: 'row', justifyContent: 'space-evenly', marginTop: Layout.spacer.medium }}>
                  <TouchableOpacity onPress={() => {
                    setHide(false)
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                      <RadioButton on={!hide} />
                      <MainText>No</MainText>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => {
                    setHide(true)
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                      <RadioButton on={hide} />
                      <MainText>Yes</MainText>
                    </View>
                  </TouchableOpacity>
                </View>

              </View>
            }

            <View>
              <View style={{ marginBottom: Layout.spacer.small, marginHorizontal: Layout.window.width * 0.1 }}>
                <LargeText grey={greyBottom}>Options</LargeText>
                <ClarifyingText grey={greyBottom}>Press and hold the arrows to drag into desired order</ClarifyingText>
              </View>

              {!!topInput && <DraggableList
                data={options}
                setData={(order) => setOptions(order)}
                mainTextKey='name'
                rightTextKey='price'
                docIdKey='name'
                onPress={(_, index) => {
                  navigation.navigate('Option', { ...options[index], index, options })
                }}
                del={(_, mainText, index,) => {
                  Alert.alert(`Remove ${mainText || 'option'}?`, undefined, [
                    {
                      text: 'No, cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'Yes', onPress: async () => {
                        setOptions(prev => {
                          let next = [...prev]
                          next.splice(index, 1)
                          return next
                        })
                        // setOptionOrder(prev => {
                        //   let next = [...prev]
                        //   next.splice(next.indexOf(doc_id), 1)
                        //   return next
                        // })
                      }
                    },

                  ])
                }}
                addNew={() => {
                  // MUST SAVE TO OPTIONS SOMEHOW.... send back as param via index?
                  navigation.navigate('Option', { index: options.length, options })
                }}
                category='option'
              />}
            </View>

            <View style={{ marginBottom: Layout.spacer.small, marginTop: Layout.spacer.medium, flexDirection: 'row', justifyContent: 'space-evenly' }}>
              <MenuButton text='Discard changes' color={alteredSpec ? Colors.red : Colors.darkgrey} buttonFn={() => {
                Alert.alert('Discard all changes?', undefined, [
                  {
                    text: 'Yes', onPress: () => {
                      setTopInput(fsName)
                      setBottomInput(fsInternalName)
                      setRange(fsRange)
                      setMin(fsMin || 1)
                      setMax(!fsMax || fsMax === Infinity ? 1 : fsMax)
                      setExact(fsMin || 1)
                      setBetweenMin(!spec_id || fsMin === fsMax ? 0 : fsMin)
                      setBetweenMin(!fsMax || fsMax === Infinity ? 1 : fsMax)
                      setOptions(fsOptions)
                      setHide(fsHide)
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  },
                ])

              }} disabled={!alteredSpec} />
              <MenuButton text={alteredSpec ? 'Save changes' : 'No changes'} color={alteredSpec && topInput && range && options.length ? Colors.purple : Colors.darkgrey} minWidth buttonFn={() => saveSpec()} disabled={!alteredSpec || !topInput || !range || !options.length} />
            </View>

            <View style={{ height: Dimensions.get('screen').height * 0.55 }} />

          </DisablingScrollView>
        </KeyboardAvoidingView>

      </SafeAreaView>
      {isSaving && <RenderOverlay text='Saving changes' opacity={0.9} />}
    </View >
  );
}

const RangeValues = ({ onPress, value, text, blockAdd = false, blockSub = false }) => {
  return <View>
    <LargeText center>{text}</LargeText>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity disabled={blockSub} onPress={() => onPress(-1)}>
        <MaterialIcons name='remove-circle-outline' size={34} color={blockSub ? Colors.midgrey : Colors.softwhite} />
      </TouchableOpacity>
      <View style={{ minWidth: 100, }}>
        <HeaderText center style={{ fontSize: 60, }}>{value}</HeaderText>
      </View>
      <TouchableOpacity disabled={blockAdd} onPress={() => onPress(1)}>
        <MaterialIcons name='add-circle-outline' size={34} color={blockAdd ? Colors.midgrey : Colors.softwhite} />
      </TouchableOpacity>
    </View>
  </View>
}

const RangeSelector = ({ onPress, selected, text, grey = false }) => {
  let color = grey ? Colors.darkgrey : Colors.white
  return <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small }} onPress={onPress}>
    <RadioButton color={color} on={selected} />
    <MainText style={{ color: color }}>{text}</MainText>
  </TouchableOpacity>
}

const styles = StyleSheet.create({
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
  portalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center'
  }
});

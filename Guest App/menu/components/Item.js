import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  PixelRatio,
  Alert,
  Animated,
  ScrollView,
  TextInput,
  TouchableOpacity
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { DefaultText, ExtraSmallText, SmallText, MediumText, LargeText } from '../../utils/components/NewStyledText';
import centsToDollar from '../../utils/functions/centsToDollar';
import SafeView from '../../utils/components/SafeView';
import { doTrackersClearItem, } from '../../redux/actions/actionsTrackers';
import { LinearGradient } from 'expo-linear-gradient';
import Layout from '../../utils/constants/Layout';
import ItemSizes from './ItemSizes';
import ItemFilters from './ItemFilters';
import ItemModifiers from './ItemModifiers';
import ItemUpsells from './ItemUpsells';
import { doSelectionsSizeToggle } from '../../redux/actions/actionsSelections';
import { selectSelectionSubtotal } from '../../redux/selectors/selectSelections';
import BottomButton from '../../utils/components/BottomButton';
import { ItemPhoto } from './Photo';
import { doTransactBillGroup, } from '../redux-actions/actionsBillGroup';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { firstAndL } from '../../utils/functions/names';
import { selectIsOrderWithUser } from '../../redux/selectors/selectorsBillOrders';
import { useIsMenuOnly } from '../../utils/hooks/useBill';
import { selectTrackedItem, } from '../../redux/selectors/selectorsItems';
import { selectTrackedBillGroup, selectIsEditableByMe, selectIsBillGroupSelectionsAltered } from '../../redux/selectors/selectorsBillGroups';
import { selectSizeSelection } from '../../redux/selectors/selectorsSelections';
import { useBillUserNames } from '../../utils/hooks/useBillUsers';
import { selectIsPendingBillGroup } from '../../redux/selectors/selectorsFirestore';
import { selectIncompleteModifiers } from '../../redux/selectors/selectorsModifiers';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import MainAlert from '../../utils/components/MainAlert';


export default function Item({ requestBill }) {
  const dispatch = useDispatch()

  const scrollViewRef = useRef(null)
  const itemMissingOptions = useRef(new Animated.Value(0))

  const isOrderWithUser = useSelector(selectIsOrderWithUser)
  const isMenuOnly = useIsMenuOnly()
  const isEditableByMe = useSelector(selectIsEditableByMe)

  const {
    name,
    is_raw,
    description,
    photo: { id: photo_id } = {},
    allow_comments,
    comment_placeholder,
    is_sold_out,
    is_visible,
    sizes = [],
  } = useSelector(selectTrackedItem)

  useEffect(() => {
    if (!is_visible) dispatch(doTrackersClearItem())
  }, [is_visible])

  useEffect(() => {
    if (sizes.length === 1) {
      dispatch(doSelectionsSizeToggle(sizes[0]))
    }
  }, [])

  const {
    id: bill_group_id,
    quantity: billGroupQuantity,
    comment: billGroupComment,
    user_id: billGroupUserID,
  } = useSelector(selectTrackedBillGroup)

  const billUserNames = useBillUserNames()


  const selectedSize = useSelector(selectSizeSelection)

  const [quantity, setQuantity] = useState(1)
  const [comment, setComment] = useState('')
  const singleSubtotal = useSelector(selectSelectionSubtotal)

  const isBillGroupSelectionsAltered = useSelector(selectIsBillGroupSelectionsAltered)
  const isBillGroupChanged = isBillGroupSelectionsAltered || comment !== billGroupComment || quantity !== billGroupQuantity


  useEffect(() => {
    if (billGroupQuantity) setQuantity(billGroupQuantity)
  }, [billGroupQuantity])

  useEffect(() => {
    if (billGroupComment) setComment(billGroupComment)
  }, [billGroupComment])


  const [modifierHeights, setModifierHeights] = useState({})
  const [heightAboveModifiers, setHeightAboveModifers] = useState({})
  const incompleteModifiers = useSelector(selectIncompleteModifiers)

  const isSaving = useSelector(selectIsPendingBillGroup(bill_group_id))

  const bottomButtonWithIcon = useMemo(() => (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      <FontAwesome
        name='reply'
        color={Colors.white}
        size={24 * PixelRatio.getFontScale()}
      />
      <LargeText bold style={{ marginLeft: 12 }}>Pending order...</LargeText>
    </View>
  ), [])

  const itemMissingOptionsAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(
        itemMissingOptions.current,
        {
          toValue: 1,
          delay: 0,
          duration: 100,
          useNativeDriver: false,
        }
      ),
      Animated.timing(
        itemMissingOptions.current,
        {
          toValue: 0,
          delay: 1000,
          duration: 1500,
          useNativeDriver: false
        }
      )
    ]).start()
  }, [])

  const closeModal = useCallback(() => dispatch(doTrackersClearItem()), [])

  const addToCart = async () => {
    if (bill_group_id && !isBillGroupChanged) {
      closeModal()
    }
    else if (!selectedSize || incompleteModifiers.length) {
      if (!selectedSize) {
        scrollViewRef?.current?.scrollTo({ x: 0, y: 0, animated: true })
      }
      else {
        let sortedHeights = Object.values(modifierHeights).sort((a, b) => a.index - b.index)
        let firstIncompleteIndex = sortedHeights.findIndex(modifier => incompleteModifiers.some(({ modifier_id }) => modifier_id === modifier.id))
        sortedHeights.splice(firstIncompleteIndex)

        scrollViewRef?.current?.scrollTo({ x: 0, y: heightAboveModifiers + sortedHeights.reduce((acc, curr) => acc + curr.height, 0), animated: true })
      }
      itemMissingOptionsAnimation()
    }
    else {
      dispatch(doTransactBillGroup(quantity, comment, bill_group_id))
    }
  }

  const exit = useCallback(() => {
    if (bill_group_id && isBillGroupChanged) {
      dispatch(doAlertAdd('Exit without saving changes?', undefined, [
        {
          text: 'Yes',
          onPress: closeModal,
        },
        {
          text: 'No',
        }
      ]))
    }
    else {
      closeModal()
    }
  }, [isBillGroupChanged, bill_group_id])

  return (
    <SafeView backgroundColor={Colors.black + 'F1'}>
      <View>
        <TouchableOpacity onPress={exit} style={{ marginHorizontal: 12 }}>
          <MaterialIcons
            name={"close"}
            size={24}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, }}>
        <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={styles.scrollView}>
          {!!photo_id && <ItemPhoto photo_id={photo_id} />}

          <View style={styles.scrollViewBasics}>
            <View key='above modifiers' onLayout={({ nativeEvent }) => setHeightAboveModifers(nativeEvent.layout.height)}>
              {!isEditableByMe && <LargeText bold>{firstAndL(billUserNames[billGroupUserID])}'s</LargeText>}
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <LargeText bold style={{ flex: 1 }}>{name}{is_raw ? ' *' : ''}</LargeText>
                {sizes.length === 1 && <MediumText >{centsToDollar(sizes[0].price)}</MediumText>}
              </View>

              <DefaultText lightgrey>{description}</DefaultText>

              {sizes.length > 1 && <ItemSizes sizes={sizes} animateRed={itemMissingOptions} selectedSize={selectedSize} />}

            </View>

            <ItemModifiers animateRed={itemMissingOptions} incompleteModifiers={incompleteModifiers} setModifierHeights={setModifierHeights} />

            <ItemFilters />

            <ItemUpsells />

            {
              allow_comments && isEditableByMe && <View><View style={styles.commentBox}>
                <TextInput
                  style={{ color: Colors.white }}
                  editable={true}
                  multiline
                  placeholder={`Add special instructions or comments. ${comment_placeholder}`}
                  placeholderTextColor={Colors.white + 'AA'}
                  onChangeText={text => {
                    if (text.length <= 100) {
                      setComment(text)
                    }
                  }}
                  keyboardAppearance='dark'
                  returnKeyType={'done'}

                  autoCorrect
                  selectTextOnFocus
                  autoFocus={false}
                  blurOnSubmit
                  onFocus={() => { scrollViewRef.current.scrollToEnd() }}
                />
              </View>
                <SmallText style={{ marginTop: 4 }}>Maximum 100 characters. Remaining: {100 - comment.length}</SmallText>
              </View>
            }

            <Quantity quantity={quantity} setQuantity={setQuantity} isEditableByMe={isEditableByMe} />

            <ExtraSmallText center style={{ marginHorizontal: 30 }}>{is_raw ? '* Contains ingredients that are rare or undercooked. Consuming raw or undercooked meats, poultry, seafood or eggs may increase your risk of food-borne illness. ' : ''}Please inform your server before ordering if anyone in your party has a food allergy.</ExtraSmallText>

          </View>

        </ScrollView>

        <LinearGradient
          start={[0, 0]}
          end={[0, 1]}
          style={{ position: 'absolute', top: 0, height: 30, left: 0, right: 0 }}
          colors={[Colors.black, Colors.black + '00']}
        />
      </View>

      {isSaving && <IndicatorOverlay black />}

      {
        isMenuOnly ? <BottomButton text='Start / join a bill' onPress={requestBill} />
          : !isEditableByMe ? <BottomButton text='Return to cart' onPress={closeModal} isOfflineVisible />
            : isOrderWithUser ? <BottomButton disabled text={bottomButtonWithIcon} backgroundColor={Colors.red} onPress={closeModal} isOfflineVisible />
              : is_sold_out ? <BottomButton disabled text='Sold out' backgroundColor={Colors.red} isOfflineVisible />
                : <BottomButton
                  disabled={isSaving}
                  text={isSaving ? 'Adding to cart...' : !selectedSize ? 'Select a size' : incompleteModifiers.length ? `Missing ${incompleteModifiers[0].name} (${centsToDollar(quantity * singleSubtotal)})` : bill_group_id ? isBillGroupChanged ? `Save changes (${centsToDollar(quantity * singleSubtotal)})` : 'No changes' : `Add to cart (${centsToDollar(quantity * singleSubtotal)})`}
                  backgroundColor={!isSaving && selectedSize && !incompleteModifiers.length && (!bill_group_id || isBillGroupChanged) ? Colors.darkgreen : Colors.midgrey}
                  onPress={addToCart}
                  isOfflineVisible
                />
      }

      <MainAlert />
    </SafeView>
  )
}

const Quantity = ({ quantity, setQuantity, isEditableByMe }) => {

  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, marginBottom: 10, paddingVertical: PixelRatio.getFontScale() * 8, borderWidth: 1, borderColor: Colors.white }}>
    <LargeText center style={{ marginRight: PixelRatio.getFontScale() * 17 + 6 }}>Quantity</LargeText>

    <TouchableOpacity disabled={quantity === 1 || !isEditableByMe} onPress={() => setQuantity(prev => prev - 1)}>
      <MaterialIcons
        name="remove-circle-outline"
        color={quantity === 1 || isEditableByMe ? Colors.white : Colors.lightgrey}
        size={21 * PixelRatio.getFontScale()}
      />
    </TouchableOpacity>

    <View style={{ minWidth: 40 * PixelRatio.getFontScale() }}>
      <LargeText center>{quantity}</LargeText>
    </View>

    <TouchableOpacity disabled={!isEditableByMe} onPress={() => setQuantity(prev => prev + 1)}>
      <MaterialIcons
        name="add-circle-outline"
        color={isEditableByMe ? Colors.white : Colors.lightgrey}
        size={21 * PixelRatio.getFontScale()}
      />
    </TouchableOpacity>

  </View>
}


const styles = StyleSheet.create({
  scrollView: {
    alignSelf: 'center',
    paddingTop: 20,
    width: Layout.window.width * 0.85,
    paddingBottom: Layout.scrollViewPadBot
  },
  scrollViewBasics: {
    backgroundColor: Colors.darkgrey,
    padding: 16,
    borderRadius: 15,
    marginTop: 20,
  },
  commentBox: {
    minHeight: 60,
    backgroundColor: Colors.midgrey + '5A',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 16,
    borderRadius: 4,
  },
});


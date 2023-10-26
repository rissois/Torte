import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  Modal,
  TouchableOpacity,
  SectionList,
  PixelRatio,
} from 'react-native';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { MaterialIcons, } from '@expo/vector-icons';
import { DefaultText, LargeText, MediumText } from '../../utils/components/NewStyledText';

import BillGroup from '../components/BillGroup';
import CartOwner from '../components/CartOwner';
import Item from '../../menu/components/Item';

import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';

import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import HeaderShadow from '../../utils/components/HeaderShadow';
import BottomButton from '../../utils/components/BottomButton';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import CardInput from '../../utils/components/CardInput';

import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { doTrackersClearItem } from '../../redux/actions/actionsTrackers';

import { selectRestaurantChargeGratuity } from '../../redux/selectors/selectorsRestaurant2';
import { selectMyBillGroupIDs, selectNumberOfItemsInCart, selectTrackedBillGroupID } from '../../redux/selectors/selectorsBillGroups';

import { useIsStripeTestMode } from '../../utils/hooks/useApp';
import { useTableName, useBillCode, useBillID, useRestaurantID } from '../../utils/hooks/useBill';
import { useBillCarts } from '../../utils/hooks/useBillGroups';

import useModalCloser from '../../utils/hooks/useModalCloser';

import functions from '@react-native-firebase/functions'
import { selectIsUserAlreadyOrdered } from '../../redux/selectors/selectorsBill';
import { transactSubmitBillOrder } from '../../menu/transactions/transactBillOrder';
import { TORTE_FEE } from '../../utils/constants/TORTE_FEE';


if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CartScreen({ navigation, route }) {
  useModalCloser('Cart', () => {
    setIsCardFieldVisible(false)
    dispatch(doTrackersClearItem())
  })

  const restaurant_id = useRestaurantID()
  const bill_id = useBillID()
  const dispatch = useDispatch()
  const isStripeTestMode = useIsStripeTestMode()

  const tableName = useTableName()
  const billCode = useBillCode()

  const unpaidGratuity = useSelector(selectRestaurantChargeGratuity)
  const selectedBillGroupID = useSelector(selectTrackedBillGroupID)
  const orderedCarts = useBillCarts()
  const isUserAlreadyOrdered = useSelector(selectIsUserAlreadyOrdered)

  const numberOfItemsInCart = useSelector(selectNumberOfItemsInCart)
  const myBillGroupIDs = useSelector(selectMyBillGroupIDs, shallowEqual)

  const [isCheckingForValidCard, setIsCheckingForValidCard] = useState(false)
  const [setupIntentSecret, setSetupIntentSecret] = useState(null)
  const [isCardFieldVisible, setIsCardFieldVisible] = useState(null)
  const [isCartSubmitting, setIsCartSubmitting] = useState(false)


  const bottomButtonWithIcon = useMemo(() => (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      <MaterialIcons name='check-circle' color={Colors.white} size={24 * PixelRatio.getFontScale()} />
      <LargeText bold style={{ marginLeft: 12 }}>I'm ready</LargeText>
    </View>
  ), [])

  const submitCart = useCallback(async () => {
    try {
      setIsCartSubmitting(true)
      const isAutoPaused = await transactSubmitBillOrder(restaurant_id, bill_id, myBillGroupIDs)

      // if (isAutoPaused) dispatch(doAlertAdd("We've started a short pause", [
      //   "We try to collect everyone's orders at once so all your food is prepared at the same time.",
      //   "Some members of your party have not finished a cart, so we are waiting for them to decide.",
      //   "If you want, you can select a few items to start right away."
      // ]))

      setIsCartSubmitting(false)
      navigation.navigate('Order')
    }
    catch (error) {
      setIsCartSubmitting(false)
      console.log('CartScreen submitCart error: ', error)
      dispatch(doAlertAdd('Error placing order', [error.code || 'Please try again', error.message]))
    }
  }, [myBillGroupIDs,])

  const cardCheck = useCallback(async () => {
    // Potential for abuse? Order, pay, switch cards, order more
    if (!setupIntentSecret) {

      try {
        setIsCheckingForValidCard(true)

        if (!isUserAlreadyOrdered) {

          const { data: { isApproved, clientSecret } } = await functions().httpsCallable('stripeSetup-createSetupIntent')({ isTest: isStripeTestMode })
          if (!isApproved) { // currently always !isApproved

            setSetupIntentSecret(clientSecret)
            setIsCardFieldVisible(true)
            setIsCheckingForValidCard(false)
            return
          }
        }

        setIsCheckingForValidCard(false)


        await submitCart()
      }
      catch (error) {
        setIsCheckingForValidCard(false)

        console.log('CartScreen cardCheck error: ', error)
        dispatch(doAlertAdd('Error placing order', [error.code || 'Please try again', error.message]))
      }
    }
    else {
      // Intent was already created but card input was cancelled
      setIsCardFieldVisible(true)
    }
  }, [submitCart, isUserAlreadyOrdered, setupIntentSecret])

  return (
    <SafeView unsafeColor={Colors.black}>
      <Modal
        visible={!!selectedBillGroupID}
        animationType='slide'
        transparent={true}
      >
        <Item />
      </Modal>


      <CardInput
        visible={isCardFieldVisible}
        cartRequiresCardCreatedSecret={setupIntentSecret}
        isTest={isStripeTestMode}
        clear={() => setIsCardFieldVisible(false)}
        callbackWithCard={submitCart}
      />

      <Header back
      // right={
      //   <TouchableOpacity onPress={() => setSortByCourse(prev => !prev)}>
      //     <MaterialIcons
      //       name='sort'
      //       size={26}
      //       color={sortByCourse ? Colors.white : Colors.darkgrey}
      //     />
      //   </TouchableOpacity>
      // }
      >
        <LargeText center numberOfLines={1} ellipsizeMode='tail'>#{billCode} - {tableName}</LargeText>
      </Header>

      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <DefaultText center red bold style={{ paddingHorizontal: Layout.marHor, paddingTop: 8 }}>There is a {unpaidGratuity + TORTE_FEE}% charge for unpaid items</DefaultText>
        <SectionList
          sections={orderedCarts}
          style={{ flex: 1, paddingHorizontal: Layout.marHor, }}
          keyExtractor={item => item}
          renderSectionHeader={({ section: { user_id, subtotal, } }) => (
            <CartOwner user_id={user_id} isCart subtotal={subtotal} />
          )}
          renderSectionFooter={({ section: { data, user_id, } }) => {
            if (data.length) return null
            return (
              <View>
                <TouchableOpacity style={{ marginTop: 10, }} onPress={() => navigation.goBack()}>
                  <MediumText>You have no items in your cart.</MediumText>
                  <MediumText style={{ color: Colors.green }}>Press here to add items.</MediumText>
                </TouchableOpacity>
                <View style={{ height: 15 }} />
              </View>
            )
          }}
          renderItem={({ item: bill_group_id }) => (
            <BillGroup
              bill_group_id={bill_group_id}
              isCart
            />
          )}
          indicatorStyle='white'
          stickySectionHeadersEnabled={false}
        />
      </View>

      <BottomButton
        disabled={!numberOfItemsInCart}
        backgroundColor={numberOfItemsInCart ? Colors.darkgreen : Colors.midgrey}
        // maybe grey if add credit card?
        onPress={cardCheck}
        text={numberOfItemsInCart ? bottomButtonWithIcon : 'No items in cart'}
        isOfflineVisible
      />
      {!!isCartSubmitting && <IndicatorOverlay text='Submitting order...' black opacity='EA' />}
      {!!isCheckingForValidCard && <IndicatorOverlay text='Checking cards on file' black opacity='EA' />}
    </SafeView>
  )
}





const styles = StyleSheet.create({

});
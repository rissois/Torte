import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  ScrollView,
  Modal,
} from 'react-native';
import firestore from '@react-native-firebase/firestore'
import functions from '@react-native-firebase/functions'
import { useDispatch, useSelector } from 'react-redux';
import { useConfirmPayment, } from '@stripe/stripe-react-native';

import PayStatus from '../components/PayStatus';
import PayCards from '../components/PayCards';
import PayTip from '../components/PayTip';
import PaySummary from '../components/PaySummary';
import PayZeroTip from '../components/PayZeroTip';
import PayCoupons from '../components/PayCoupons';

import { transactPayAll } from '../firestore/transactPayAll';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';

import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import { LargeText, MediumText, } from '../../utils/components/NewStyledText';
import BottomButton from '../../utils/components/BottomButton';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import centsToDollar from '../../utils/functions/centsToDollar';


import { selectMyClaimSubtotal, selectMyClaimTax } from '../../redux/selectors/selectorsBillUsers';
import { selectBillGratuities, selectIsSoloBill } from '../../redux/selectors/selectorsBill';

import { useIsStripeTestMode } from '../../utils/hooks/useApp';
import { useMyID } from '../../utils/hooks/useUser';
import { useIsBillPaymentComplete } from '../../utils/hooks/useBillUsers';
import { useTableName, useBillCode, useRestaurantID, useBillID } from '../../utils/hooks/useBill';

import useModalCloser from '../../utils/hooks/useModalCloser';
import { doAppStripeProviderClear, doAppStripeProviderSet } from '../../redux/actions/actionsApp';
import { calculateDiscounts } from '../../utils/functions/coupons';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}




export default function PayScreen({ navigation, route }) {
  const {
    confirmPayment
  } = useConfirmPayment()
  const dispatch = useDispatch()

  const isPayAll = !!route.params?.payAll

  const isStripeTestMode = useIsStripeTestMode()
  const myID = useMyID()

  const tableName = useTableName()
  const billCode = useBillCode()
  const isSoloBill = useSelector(selectIsSoloBill)
  const bill_id = useBillID()
  const restaurant_id = useRestaurantID()

  const subtotal = useSelector(selectMyClaimSubtotal)
  const tax = useSelector(selectMyClaimTax)
  const [isTipFree, isAutomaticTip, tipDefault, tipOptions, isTipInPercentages, isNoTipWarned] = useSelector(selectBillGratuities)

  const [final, setFinal] = useState(0)

  const [selectedCoupons, setSelectedCoupons] = useState([])
  const [appliedPerCoupon, setAppliedPerCoupon] = useState({})

  const [tip, setTip] = useState(0)
  const [selectedTipOption, setSelectedTipOption] = useState(tipDefault)
  const [isNoTipConfirmationRequired, setIsNoTipConfirmationRequired] = useState(false)
  const zeroRef = useRef(null)

  const [overlayText, setOverlayText] = useState('')

  const [card, setCard] = useState(null)
  const [isCardFieldVisible, setIsCardFieldVisible] = useState(null)

  const [stripeStatus, setStripeStatus] = useState('')
  const [billPaymentID, setBillPaymentID] = useState('')

  const isPaymentComplete = useIsBillPaymentComplete(billPaymentID)

  const [isCancellingPayAll, setIsCancellingPayAll] = useState(false)


  useEffect(() => {
    if (isPaymentComplete) {
      navigation.navigate('Feedback')
    }
  }, [isPaymentComplete])

  useEffect(() => {
    setAppliedPerCoupon(calculateDiscounts(subtotal, tax, tip, selectedCoupons))
  }, [selectedCoupons, subtotal, tax, tip])

  const discounts = useMemo(() => Object.values(appliedPerCoupon).reduce((acc, val) => acc + val, 0), [appliedPerCoupon])


  useEffect(() => {
    setFinal(subtotal + tax + tip - discounts)
  }, [subtotal, tax, tip, discounts])

  const openZeroTipConfirmation = () => {
    setIsNoTipConfirmationRequired(true)
    zeroRef?.current?.focus()
  }

  const exit = useCallback(() => {
    if (isPayAll) {
      dispatch(doAlertAdd(
        'Go back and cancel payment?',
        undefined,
        [
          {
            text: 'Yes',
            isBold: true,
            onPress: async () => cancelPayAll()
          },
          {
            text: 'No',
            isBold: true,
            onPress: () => { }
          }
        ],
        undefined, undefined, true
      ))
    }
    else {
      navigation.goBack()
    }
  }, [isPayAll])

  const handleNoCard = useCallback(() => setIsCardFieldVisible(true), [])
  const handleCardExpired = useCallback(() => dispatch(doAlertAdd(
    'Card expired, please select a valid payment method.',
    undefined,
    [
      {
        text: 'Go back',
      },
      {
        text: 'Add a new card',
        onPress: () => setIsCardFieldVisible(true)
      }
    ]
  )), [])
  const handleFreeMeal = useCallback(() => dispatch(doAlertAdd(
    "You've discounted your way to a free meal!",
    'Please confirm you are finished',
    [
      {
        text: 'I am finished',
        onPress: async () => {
          try {
            setStripeStatus('Verifying free meal...')

            const bill_payment_id = (firestore().collection('null').doc()).id

            await functions().httpsCallable('stripePayment-createPaymentIntent')({
              amount: 0,
              tip,
              coupon_ids: selectedCoupons.map(({ id }) => id),
              bill_id,
              restaurant_id,
              bill_payment_id,
            })

            setStripeStatus('Saving free meal...')
            setBillPaymentID(bill_payment_id)
          }
          catch (error) {
            console.log('PayScreen handleFreeMeal error: ', error)
            dispatch(doAlertAdd('Unable to process free meal', 'Please try again and speak with your server if the issue persists. We are sorry for the inconvenience.'))
            setStripeStatus('')
          }
        }
      },
      {
        text: 'Go back',
      }
    ]
  )))

  const handle50Cents = useCallback(() => dispatch(doAlertAdd(
    '50¢ minimum',
    'Sorry, we are only able to process payments greater than $0.50. Please add more food or tip.'
  )))

  const handlePayButton = useCallback(async () => {
    dispatch(doAlertAdd(
      `Pay ${centsToDollar(final)}?`,
      undefined,
      [
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setStripeStatus('Initializing payment...')

              dispatch(doAppStripeProviderSet())

              const bill_payment_id = (firestore().collection('null').doc()).id

              const { data: { clientSecret: paymentIntentSecret, paymentMethodId, error: callableError } } = await functions().httpsCallable('stripePayment-createPaymentIntent')({
                amount: final,
                tip,
                coupon_ids: selectedCoupons.map(({ id }) => id),
                payment_method_id: card.payment_method_id,
                bill_id,
                restaurant_id,
                card_id: card.id,
                zip_code: card.zip_code,
                bill_payment_id,
              })

              if (!paymentIntentSecret) throw 'Failed to initialize payment'

              setStripeStatus('Processing payment...')

              const { error: confirmError, paymentIntent } = await confirmPayment(paymentIntentSecret, {
                type: 'Card',
                paymentMethodId,
              })

              if (confirmError) throw confirmError

              setStripeStatus('Confirming payment...')
              setBillPaymentID(bill_payment_id)
            }
            catch (error) {
              console.log('PayScreen handlePayButton error: ', error)
              dispatch(doAlertAdd('Unable to start payment', 'Please try again and speak with your server if the issue persists. We are sorry for the inconvenience.'))
              setStripeStatus('')
            }
            finally {
              dispatch(doAppStripeProviderClear())
            }
          }
        },
        {
          text: 'No',
        }
      ]
    ))
  }, [final, tip, card, isStripeTestMode, selectedCoupons])



  const cancelPayAll = useCallback(async () => {
    setIsCancellingPayAll(true)
    try {
      await transactPayAll(restaurant_id, bill_id)

      navigation.goBack()
    }
    catch (error) {
      dispatch(doAlertAdd('Unable to cancel', 'Please try again and let us know if the issue persists.'))
      console.log('PayScreen cancelPayAll error: ', error)
    }
    finally {
      setIsCancellingPayAll(false)
    }
  }, [restaurant_id, bill_id,])


  useModalCloser('Pay', () => {
    setIsNoTipConfirmationRequired(false)
    setIsCardFieldVisible(false)
  })

  return (
    <SafeView noBottom>
      <Modal
        visible={isNoTipConfirmationRequired}
        animationType='slide'
        transparent={false}
      >
        <PayZeroTip
          isOpen={isNoTipConfirmationRequired}
          close={() => setIsNoTipConfirmationRequired(false)}
          handlePayButton={handlePayButton}
        />
      </Modal>

      <Header back backFn={exit}>
        <LargeText center numberOfLines={1} ellipsizeMode='tail'>#{billCode} - {tableName}</LargeText>
      </Header>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Layout.scrollViewPadBot }}
      >

        {!isSoloBill && <View style={[styles.vertical, styles.horizontal]}><PayStatus /></View>}


        <View style={[styles.vertical, styles.horizontal]}>
          <LargeText bold style={{ marginBottom: 10 }}>Discounts</LargeText>
          <PayCoupons selectedCoupons={selectedCoupons} setSelectedCoupons={setSelectedCoupons} appliedPerCoupon={appliedPerCoupon} setAppliedPerCoupon={setAppliedPerCoupon} />
        </View>

        <View style={[styles.vertical, styles.horizontal]}>
          {
            !!isTipFree ?
              <MediumText bold center>This restaurant does not accept tips</MediumText> :
              <PayTip
                tip={tip}
                setTip={setTip}
                subtotal={subtotal}
                selectedTipOption={selectedTipOption}
                setSelectedTipOption={setSelectedTipOption}
                isAutomaticTip={isAutomaticTip}
                tipDefault={tipDefault}
                tipOptions={tipOptions}
                isTipInPercentages={isTipInPercentages}
              />}
        </View>


        <View style={[styles.vertical, styles.horizontal]}>
          <LargeText bold style={{ marginBottom: 10 }}>Summary</LargeText>
          <PaySummary subtotal={subtotal} discounts={discounts} tax={tax} tip={tip} final={final} isTipFree={isTipFree} />
        </View>

        <View style={[styles.horizontal]}>
          <LargeText bold style={{ marginBottom: 10 }}>Payment method</LargeText>
          <PayCards
            card={card}
            setCard={setCard}
            isCardFieldVisible={isCardFieldVisible} setIsCardFieldVisible={setIsCardFieldVisible}
            overlayText={overlayText} setOverlayText={setOverlayText}
          />
        </View>
      </ScrollView>

      {
        isNoTipWarned && !tip ? <BottomButton text='No tip (pay anyway)' backgroundColor={Colors.darkgrey} onPress={openZeroTipConfirmation} />
          : final <= 0 ? <BottomButton text='Free meal!' backgroundColor={Colors.purple} onPress={handleFreeMeal} />
            : final < 50 ? <BottomButton text='50¢ minimum' backgroundColor={Colors.darkgrey} onPress={handle50Cents} />
              : !card ? <BottomButton text='Add a card' backgroundColor={Colors.darkgrey} onPress={handleNoCard} />
                : !card.is_valid ? <BottomButton text='Card is expired' backgroundColor={Colors.darkgrey} onPress={handleCardExpired} />
                  : <BottomButton text={`Pay ${centsToDollar(final)}`} onPress={handlePayButton} />
      }

      {!!isCancellingPayAll && <IndicatorOverlay text='Cancelling payment' black opacity='EA' />}
      {!!overlayText && <IndicatorOverlay text={overlayText} black opacity='EA' />}
      {!!stripeStatus && <IndicatorOverlay text={stripeStatus} black opacity='EA' />}


    </SafeView>
  )
}


const styles = StyleSheet.create({
  vertical: {
    borderBottomColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  horizontal: {
    marginHorizontal: Layout.window.width * 0.1,
    paddingHorizontal: 10,
  },
  tip: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  image: {
    height: 40,
    width: 52,
  }
});
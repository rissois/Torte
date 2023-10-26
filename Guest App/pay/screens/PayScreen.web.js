import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { collection, getFirestore, doc } from 'firebase/firestore'
import { httpsCallable, getFunctions } from 'firebase/functions'
import { useDispatch, useSelector } from 'react-redux';
// import { useConfirmPayment, } from '@stripe/stripe-react-native';

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
import { DefaultText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import BottomButton from '../../utils/components/BottomButton';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import centsToDollar from '../../utils/functions/centsToDollar';


import { selectMyClaimSubtotal, selectMyClaimTax } from '../../redux/selectors/selectorsBillUsers';
import { selectBillGratuities, selectIsSoloBill } from '../../redux/selectors/selectorsBill';

import { useMyID } from '../../utils/hooks/useUser';
import { useIsBillPaymentComplete } from '../../utils/hooks/useBillUsers';
import { useTableName, useBillCode, useRestaurantID, useBillID } from '../../utils/hooks/useBill';

import useModalCloser from '../../utils/hooks/useModalCloser';
import { calculateDiscounts } from '../../utils/functions/coupons';
import firebaseApp from '../../firebase/firebase';
import { useStripe, } from '@stripe/react-stripe-js';
import StripeWrapper from '../../utils/components/StripeWrapper';


if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const firestore = getFirestore(firebaseApp)
const functions = getFunctions(firebaseApp)


export default function PayScreen({ navigation, route }) {
  // const {
  //   confirmPayment
  // } = useConfirmPayment()
  const dispatch = useDispatch()

  const isPayAll = !!route.params?.payAll

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
  const zeroRef = useRef(null)
  const [zeroTipCallback, setZeroTipCallback] = useState(null)

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

  useEffect(() => {
    if (zeroTipCallback) zeroRef?.current?.focus()
  }, [zeroTipCallback])

  const handleNoCard = useCallback(() => setIsCardFieldVisible(true), [])

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

  const cancelPayAll = useCallback(async () => {
    setIsCancellingPayAll(true)
    try {
      await transactPayAll(restaurant_id, bill_id)

      navigation.navigate('Order', { isCancellingPayAll: true })
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
    setZeroTipCallback(null)
    setIsCardFieldVisible(false)
  })

  return (
    <SafeView>
      <Modal
        visible={!!zeroTipCallback}
        animationType='slide'
        transparent={false}
      >
        <PayZeroTip
          isOpen={!!zeroTipCallback}
          close={(isConfirmed) => {
            if (isConfirmed === true) zeroTipCallback()
            setZeroTipCallback(null)
          }}
        />
      </Modal>

      <Header back backFn={exit}>
        <LargeText center numberOfLines={1} ellipsizeMode='tail'>#{billCode} - {tableName}</LargeText>
      </Header>

      <ScrollView
        style={[Platform.OS === 'web' && { height: Layout.window.height }]}
        contentContainerStyle={{ paddingBottom: Layout.scrollViewPadBot }}
      >

        <View style={[styles.vertical, styles.horizontal]}>
          <PayStatus />
        </View>


        {/* <View style={[styles.vertical, styles.horizontal]}>
          <LargeText bold style={{ marginBottom: 10 }}>Discounts</LargeText>
          <PayCoupons selectedCoupons={selectedCoupons} setSelectedCoupons={setSelectedCoupons} appliedPerCoupon={appliedPerCoupon} setAppliedPerCoupon={setAppliedPerCoupon} />
        </View> */}

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
          <View style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'center' }}>
            <LargeText bold>Summary  </LargeText>
            <TouchableOpacity onPress={() => navigation.navigate('Bill')}>
              <DefaultText center style={{ color: Colors.green, }}>(view full receipt)</DefaultText>
            </TouchableOpacity>
          </View>

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
        <StripeWrapper isConnected>
          <CheckoutButton
            final={final}
            tip={tip}
            card={card}
            selectedCoupons={selectedCoupons}
            setStripeStatus={setStripeStatus}
            setBillPaymentID={setBillPaymentID}
            setZeroTipCallback={setZeroTipCallback}
            handleNoCard={handleNoCard}
            isNoTipWarned={isNoTipWarned}
          />
        </StripeWrapper>
      }

      {!!isCancellingPayAll && <IndicatorOverlay text='Cancelling payment' black opacity='EA' />}
      {!!overlayText && <IndicatorOverlay text={overlayText} black opacity='EA' />}
      {!!stripeStatus && <IndicatorOverlay text={stripeStatus} black opacity='EA' />}


    </SafeView>
  )
}

const CheckoutButton = ({ final, card, tip, selectedCoupons, setStripeStatus, setBillPaymentID, setZeroTipCallback, handleNoCard, isNoTipWarned }) => {
  const stripe = useStripe()
  const dispatch = useDispatch()
  const bill_id = useBillID()
  const restaurant_id = useRestaurantID()

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

              const bill_payment_id = (doc(collection(firestore, 'null'))).id

              const { data: { clientSecret: paymentIntentSecret, paymentMethodId, } } = await httpsCallable(functions, 'stripePayment-createPaymentIntent')({
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

              const { error: paymentIntentError, paymentIntent } = await stripe.confirmCardPayment(
                paymentIntentSecret,
                {
                  payment_method: paymentMethodId,
                }
              )

              if (paymentIntentError) {
                console.log(`paymentIntentError: ${paymentIntentError.message}`)
                throw paymentIntentError
              }

              setStripeStatus('Confirming payment...')
              setBillPaymentID(bill_payment_id)
            }
            catch (error) {
              console.log('PayScreen handlePayButton error: ', error)
              dispatch(doAlertAdd('Unable to start payment', [error.message, 'Please try again']))
              setStripeStatus('')
            }
          }
        },
        {
          text: 'No',
        }
      ]
    ))
  }, [final, tip, card, selectedCoupons])

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

            const bill_payment_id = (doc(collection(firestore, 'null'))).id

            await httpsCallable(functions, 'stripePayment-createPaymentIntent')({
              amount: final,
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
  )), [selectedCoupons, final, tip])

  const handle50Cents = useCallback(() => dispatch(doAlertAdd(
    '50¢ minimum',
    'Sorry, we are only able to process payments greater than $0.50. Please add more food or tip.'
  )))

  if (final <= 0) return <BottomButton text='Free meal!' backgroundColor={Colors.purple} onPress={handleFreeMeal} />
  if (final < 50) return <BottomButton text='50¢ minimum' backgroundColor={Colors.darkgrey} onPress={handle50Cents} />
  if (isNoTipWarned && !tip) return <BottomButton text='No tip (pay anyway)' backgroundColor={Colors.darkgrey} onPress={() => setZeroTipCallback(() => handlePayButton)} />
  if (!card) return <BottomButton text='Add a card' backgroundColor={Colors.darkgrey} onPress={handleNoCard} />
  if (!card.is_valid) return <BottomButton text='Card is expired' backgroundColor={Colors.darkgrey} onPress={handleCardExpired} />
  return <BottomButton text={`Pay ${centsToDollar(final)}`} onPress={handlePayButton} />
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
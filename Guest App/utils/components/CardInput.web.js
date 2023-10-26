import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  Text
} from 'react-native';
// import { CardField, useStripe } from '@stripe/stripe-react-native';
import SafeView from './SafeView';
import { DefaultText, LargeText, MediumText, SmallText, } from './NewStyledText';
import Colors from '../constants/Colors';
import Header from './Header';
import { MaterialIcons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import StyledButton from './StyledButton';
import IndicatorOverlay from './IndicatorOverlay';
import { useDispatch, } from 'react-redux';

import { getFirestore, collection, query, where, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useIsStripeTestMode } from '../hooks/useApp';
import { useMyID, useMyRef } from '../hooks/useUser';
import firebaseApp from '../../firebase/firebase';
import { useStripe, useElements, CardExpiryElement, CardCvcElement, CardNumberElement, } from '@stripe/react-stripe-js';
import StripeWrapper from './StripeWrapper';

const firestore = getFirestore(firebaseApp)
const functions = getFunctions(firebaseApp)

/*
THIS IS FULLY FUNCTIONAL, albiet the PaymentElement is slow to load
Also the styling could use work

ELEMENTS OVERVIEW: 
https://stripe.com/docs/stripe-js/react#elements-props-stripe

MAIN ARTICLE:
https://stripe.com/docs/payments/save-and-reuse

STRIPE REACT REFERENCE:
https://stripe.com/docs/stripe-js/react

ELEMENTS APPEARNACE:
https://stripe.com/docs/stripe-js/appearance-api

ELEMENTS STYLE:
https://stripe.com/docs/js/appendix/style

Payment request buttons (scroll to bottom for Connect) (permitting Apple Pay and Google Pay)
https://stripe.com/docs/stripe-js/elements/payment-request-button?html-or-react=react

Billing portal to replace the native solution:
https://stripe.com/docs/billing/subscriptions/customer-portal

*/

/*
A COMPLETE STYLING GUIDE:
{
  // Variants
  base: {},
  complete: {},
  empty:{},
  invalid: {},

  // Pseudoclasses, treat identically to the above
  hover, focus, placeholder, selection, "-webkit-autofill", disabled, -ms-clear
  * -ms-clear is a clear button at the edge, may not appear in all cases

  // Properties
  Recommended for outside view:
  background-color, lineHeight > padding
  color, fontFamily, fontSize, fontSmoothing, fontStyle, fontVariant, fontWeight, iconColor, letterSpacing,
  textAlign, textDecoration, textShadow, textTransform
}
*/

const FONT_SIZE = 17
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: Colors.white,
      iconColor: Colors.white,
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: FONT_SIZE + "px",
      // fontSize: "24px", Too big, caused issues
      "::placeholder": {
        color: Colors.lightgrey,
      },
    },
    invalid: {
      color: Colors.red,
      iconColor: Colors.red,
    },
  },
};

/*
onChange object: {
  complete: true,
  elementType: 'cardNumber',
  empty: false,
  error: undefined,
  brand: 'visa', // number only
}
*/

export default function CardInput({ visible, clear, callbackWithCard = () => { }, screen, cartRequiresCardCreatedSecret = '' }) {
  const dispatch = useDispatch()

  const isStripeTestMode = useIsStripeTestMode()
  const [overlayText, setOverlayText] = useState('')
  const [clientSecret, setClientSecret] = useState(cartRequiresCardCreatedSecret)

  const headerLeft = useMemo(() => <TouchableOpacity onPress={clear}>
    <MaterialIcons name='close' color={Colors.white} size={30} />
  </TouchableOpacity>, [])

  useEffect(() => {
    const getClientSecret = async () => {
      try {
        const { data } = await httpsCallable(functions, 'stripeSetup-createSetupIntent')({
          isTest: isStripeTestMode,
          isIntentRequired: true
        })
        setClientSecret(data?.clientSecret || '')
      }
      catch (error) {
        console.log(`TestScreen getClientSecret error: `, error)
        dispatch(doAlertAdd('Unable to add card', 'Please pay through your server'))
      }
    }

    if (!cartRequiresCardCreatedSecret) getClientSecret()

  }, [])

  useEffect(() => {
    return () => setOverlayText('')
  }, [])

  return <Modal
    visible={visible}
    animationType='slide'
    transparent={true}
  >
    <SafeView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header left={headerLeft}>
        <LargeText center>{isStripeTestMode ? screen === 'Cart' ? 'Test card required' : 'Add test card' : screen === 'Pay' || screen === 'Cart' ? 'Credit card required' : 'Add new credit card'}</LargeText>
      </Header>


      <ScrollView style={{ flex: 1, paddingHorizontal: Layout.window.width * 0.1 }}>
        {isStripeTestMode && <SmallText center style={{ paddingBottom: 10 }}>ONLY TEST CARDS WORK IN DEMO MODE{'\n'}try 4242 4242 4242 4242{'\n'}with any future exp. date</SmallText>}

        {!isStripeTestMode && screen === 'Cart' && <DefaultText center style={{ paddingBottom: 10 }}>You will not be charged until you checkout in the app</DefaultText>}

        <View style={{ minHeight: Layout.window.height * 0.3, justifyContent: 'center', paddingVertical: 10 }}>
          {
            !!clientSecret ? <StripeWrapper clear={clear} >
              <CardForm callbackWithCard={callbackWithCard} screen={screen} clientSecret={clientSecret} setOverlayText={setOverlayText} clear={clear} />
            </StripeWrapper> :
              <IndicatorOverlay text='Loading Stripe' />
          }
        </View>
      </ScrollView>

      {!!overlayText && <IndicatorOverlay text={overlayText} black opacity='EA' />}

    </SafeView>
  </Modal>
}

const CardForm = ({ screen, clientSecret, callbackWithCard, setOverlayText, clear }) => {
  const stripe = useStripe();
  const elements = useElements();
  const zipRef = useRef(null)
  const dispatch = useDispatch()
  const myRef = useMyRef()
  const myID = useMyID()
  const isStripeTestMode = useIsStripeTestMode()
  const [numberStatus, setNumberStatus] = useState({ empty: true })
  const [cvcStatus, setCVCStatus] = useState({ empty: true })
  const [expiryStatus, setExpiryStatus] = useState({ empty: true })
  const [zipCode, setZipCode] = useState('')

  const [isNumberFocused, setIsNumberFocused] = useState(false)
  const [isCVCFocused, setIsCVCFocused] = useState(false)
  const [isExpiryFocused, setIsExpiryFocused] = useState(false)
  const [isZipFocused, setIsZipFocused] = useState(false)
  const [labelWidth, setLabelWidth] = useState(null)

  const handleSubmit = async () => {

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    try {
      setOverlayText('Creating card...')

      const numberElement = elements.getElement(CardNumberElement);
      // const cvcElement = elements.getElement(CardCvcElement); // automatically pulled with CardNumberElement
      // const expiryElement = elements.getElement(CardExpiryElement); // automatically pulled with CardNumberElement

      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: numberElement,
        billing_details: {
          // Can include name
          address: {
            postal_code: zipRef.current.value
          }
        }
      })

      if (paymentMethodError) {
        console.log(paymentMethodError.message)
        throw 'Unable to create payment method'
      }

      setOverlayText('Confirming card...')

      const { error: setupIntentError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: paymentMethod.id
      }, {
        handleActions: false
      })

      if (setupIntentError) {
        console.log(setupIntentError.message)
        throw 'Unable to set up card'
      }

      setOverlayText('Saving card...')

      const cardsRef = collection(myRef, 'Cards')
      const favorite = (await getDocs(query(cardsRef, where('is_favorite', '==', true), where('is_test', '==', !!isStripeTestMode)))).docs[0]

      const newCardRef = doc(cardsRef)
      const newCard = {
        payment_method_id: paymentMethod.id,
        user_id: myID,
        is_deleted: false,
        is_favorite: !favorite?.exists(),
        name: '',
        is_test: !!isStripeTestMode,
        id: newCardRef.id,
        brand: paymentMethod.card.brand,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
        last_four: paymentMethod.card.last4,
        zip_code: paymentMethod.billing_details.address.postal_code,
      }
      await setDoc(newCardRef, newCard)

      callbackWithCard(newCard)

      if (favorite?.exists()) dispatch(doAlertAdd('Set this card as your new favorite?', undefined, [
        {
          text: 'Yes',
          onPress: async () => {
            const batch = writeBatch(firestore)
            batch.update(favorite.ref, { is_favorite: false })
            batch.update(newCardRef, { is_favorite: true })
            batch.commit()
          }
        },
        {
          text: 'No'
        }
      ], undefined, undefined, true))

    }
    catch (error) {
      console.log(`CardForm handleSubmit catch error: ${error.message}`)
      dispatch(doAlertAdd('Unable to add card',))
    }
    finally {
      clear()
    }
  };

  const handleNumberChange = useCallback(event => {
    setNumberStatus(event)
    if (event.complete) {
      const expiryElement = elements.getElement(CardExpiryElement)
      expiryElement.focus()
    }
  }, [])

  const handleExpiryChange = useCallback(event => {
    setExpiryStatus(event)
    if (event.complete) {
      const cvcElement = elements.getElement(CardCvcElement)
      cvcElement.focus()
    }
  }, [])

  // https://github.com/stripe-archive/react-stripe-elements/issues/533
  // const handleCVCChange = useCallback(event => {
  //   setCVCStatus(event)
  //   if (event.complete) {
  //     zipRef?.current.focus()
  //   }
  // }, [])

  const handleLabelLayout = useCallback(({ nativeEvent: { layout: { width } } }) => setLabelWidth(prev => prev < width ? width : prev), [])

  return <View>
    <View style={[styles.base, isNumberFocused && styles.focused, numberStatus.error && styles.error]}>
      <View onLayout={handleLabelLayout} style={{ minWidth: labelWidth }}>
        <DefaultText red={numberStatus.error} style={styles.label}>Card no.:</DefaultText>
      </View>
      <View style={{ flex: 1 }}>
        <CardNumberElement onChange={handleNumberChange} options={CARD_ELEMENT_OPTIONS} onFocus={() => setIsNumberFocused(true)} onBlur={() => setIsNumberFocused(false)} />
      </View>
    </View>

    <View style={[styles.base, isExpiryFocused && styles.focused, expiryStatus.error && styles.error]}>
      <View onLayout={handleLabelLayout} style={{ minWidth: labelWidth }}>

        <DefaultText onLayout={handleLabelLayout} red={expiryStatus.error} style={styles.label}>Expires: </DefaultText>
      </View>

      <View style={{ flex: 1 }}>
        <CardExpiryElement onChange={handleExpiryChange} options={CARD_ELEMENT_OPTIONS} onFocus={() => setIsExpiryFocused(true)} onBlur={() => setIsExpiryFocused(false)} />
      </View>
    </View>

    <View style={[styles.base, isCVCFocused && styles.focused, cvcStatus.error && styles.error, { flex: 1 }]}>
      <View onLayout={handleLabelLayout} style={{ minWidth: labelWidth }}>
        <DefaultText red={cvcStatus.error} style={styles.label}>Security: </DefaultText>
      </View>

      <View style={{ flex: 1 }}>
        <CardCvcElement onChange={setCVCStatus} options={CARD_ELEMENT_OPTIONS} onFocus={() => setIsCVCFocused(true)} onBlur={() => setIsCVCFocused(false)} />
      </View>
    </View>

    <View style={[styles.base, isZipFocused && styles.focused, !!(zipCode.length > 5 || (!isZipFocused && zipCode && zipCode.length < 5)) && styles.error]}>
      <View onLayout={handleLabelLayout} style={{ minWidth: labelWidth }}>
        <DefaultText red={zipCode.length > 5 || (!isZipFocused && zipCode && zipCode.length < 5)} style={styles.label}>Zipcode:</DefaultText>
      </View>

      <TextInput
        ref={zipRef}
        value={zipCode}
        onChangeText={setZipCode}
        placeholder='(postal code)'
        placeholderTextColor={Colors.lightgrey}
        style={{
          color: zipCode.length > 5 || (!isZipFocused && zipCode && zipCode.length < 5) ? Colors.red : Colors.white,
          fontSize: FONT_SIZE,
          outline: 'none',
        }}
        maxLength={9}
        onFocus={() => setIsZipFocused(true)}
        onBlur={() => setIsZipFocused(false)}
      />
    </View>

    <View style={{ marginVertical: 20 }}>
      {screen === 'Pay' || screen === 'Cart' && <DefaultText center style={{ marginBottom: 10, marginHorizontal: Layout.window.width * 0.1 }}>By placing an order, you agree to our policies on unpaid items as outlined in our <Text style={{ color: Colors.green, fontWeight: 'bold' }} onPress={() => Linking.openURL('http://tortepay.com/eula')}>Terms and Conditions</Text></DefaultText>}

      <StyledButton
        center
        text={numberStatus.error ? 'Invalid number' : !numberStatus.complete ? 'Missing number' :
          cvcStatus.error ? 'Invalid CVC' : !cvcStatus.complete ? 'Missing CVC' :
            expiryStatus.error ? 'Invalid expiry' : !expiryStatus.complete ? 'Missing expiry' :
              !zipCode ? 'Missing zip code' : screen === 'Cart' ? 'Place order' : 'Save card'}
        disabled={!numberStatus.complete || !cvcStatus.complete || !expiryStatus.complete}
        onPress={handleSubmit}
        style={{ backgroundColor: !zipCode ? Colors.darkgrey : Colors.purple, }}
      />
    </View>
  </View>
}

const styles = StyleSheet.create({
  base: {
    borderColor: Colors.midgrey,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  focused: {
    borderColor: Colors.white,
  },
  error: {
    backgroundColor: Colors.red + '11',
    borderColor: Colors.red,
  },
  label: {
    fontSize: FONT_SIZE,
    paddingRight: 8,
  }
});


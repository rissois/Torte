import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  Platform
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import SafeView from './SafeView';
import { DefaultText, LargeText, } from './NewStyledText';
import Colors from '../constants/Colors';
import Header from './Header';
import { MaterialIcons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import StyledButton from './StyledButton';
import IndicatorOverlay from './IndicatorOverlay';
import { useDispatch, } from 'react-redux';

import firestore from '@react-native-firebase/firestore'
import functions from '@react-native-firebase/functions'
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useIsStripeTestMode } from '../hooks/useApp';
import { useMyID, useMyRef } from '../hooks/useUser';

export default function CardInput({ visible, clear, callbackWithCard = () => { }, showCardRequired, cartRequiresCardCreatedSecret }) {
  const dispatch = useDispatch()

  const {
    confirmSetupIntent,
  } = useStripe()

  const isStripeTestMode = useIsStripeTestMode()

  const myID = useMyID()
  const myRef = useMyRef()
  const [details, setDetails] = useState(null)
  const [overlayText, setOverlayText] = useState('')

  const headerLeft = useMemo(() => <TouchableOpacity onPress={clear}>
    <MaterialIcons name='close' color={Colors.white} size={30} />
  </TouchableOpacity>, [])

  const addCard = async (cardDetails) => {
    try {
      if (cardDetails.exp_year.toString().length === 2) {
        cardDetails.exp_year = Number('20' + cardDetails.exp_year)
      }

      let setupIntentSecret = cartRequiresCardCreatedSecret

      if (!setupIntentSecret) {
        const { data: { clientSecret } } = await functions().httpsCallable('stripeSetup-createSetupIntent')({
          isTest: isStripeTestMode,
          isIntentRequired: true
        })
        setupIntentSecret = clientSecret
      }

      const { setupIntent, error } = await confirmSetupIntent(setupIntentSecret, {
        type: 'Card'
      })

      if (error) throw error

      setOverlayText('Saving card...')


      const cardsRef = myRef.collection('Cards')
      const favorite = (await cardsRef.where('is_favorite', '==', true).where('is_test', '==', !!isStripeTestMode).get()).docs[0]

      const newCardRef = cardsRef.doc()
      const newCard = {
        ...cardDetails,
        payment_method_id: setupIntent.paymentMethodId,
        user_id: myID,
        is_deleted: false,
        is_favorite: !favorite?.exists,
        name: '',
        is_test: !!isStripeTestMode,
        id: newCardRef.id
      }
      await newCardRef.set(newCard)

      callbackWithCard(newCard)

      if (favorite?.exists) dispatch(doAlertAdd('Set this card as your new favorite?', undefined, [
        {
          text: 'Yes',
          onPress: async () => {
            const batch = firestore().batch()
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
      console.log('CardInput addCard error: ', error)
      dispatch(doAlertAdd(
        'Error adding card',
        [error.code, error.message]
      ))
    }
    finally {
      setOverlayText('')
      clear()
    }
  }

  useEffect(() => {
    return () => setOverlayText('')
  }, [])

  return <Modal
    visible={visible}
    animationType='slide'
    transparent={true}
  >
    <SafeView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View>
        <Header left={headerLeft} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? "padding" : undefined}
        style={{ flex: 1, marginHorizontal: Layout.window.width * 0.1, justifyContent: 'center' }}>
        <View style={{ marginHorizontal: Layout.window.width * 0.1 }}>
          <LargeText center>{showCardRequired ? 'Credit card required' : 'Add new credit card'}</LargeText>
          {showCardRequired && <DefaultText center style={{ marginTop: 6 }}>You will not be charged until you checkout in the app</DefaultText>}
        </View>
        <CardField
          postalCodeEnabled
          autofocus
          // placeholder={{}}
          cardStyle={{
            backgroundColor: Colors.darkgrey,
            textColor: Colors.white
          }}
          style={{
            width: '100%',
            height: 50,
            marginVertical: 30,
          }}
          onCardChange={cardDetails => {
            if (cardDetails.complete && cardDetails.postalCode.length) {
              setDetails({
                brand: cardDetails.brand,
                exp_month: cardDetails.expiryMonth,
                exp_year: cardDetails.expiryYear,
                last_four: cardDetails.last4,
                zip_code: cardDetails.postalCode
              })
            }
            else {
              setDetails(null)
            }
          }}
        />
        <StyledButton
          center
          text={details ? details.zip_code.length !== 5 ? 'Check zip code' : showCardRequired ? 'Place order' : 'Save card' : 'Invalid card'}
          disabled={!details}
          onPress={() => {
            setOverlayText('Confirming card...')
            addCard(details)
          }}
          style={{ backgroundColor: details ? details.zip_code.length !== 5 ? Colors.red : Colors.purple : Colors.darkgrey }}
        />

        {showCardRequired && <View style={{ marginHorizontal: Layout.window.width * 0.1 }}>
          <DefaultText center style={{ marginTop: 20, }}>Refer to our Terms of Use for policies regarding unpaid items</DefaultText>
        </View>}


      </KeyboardAvoidingView>

      {!!overlayText && <IndicatorOverlay text={overlayText} black opacity='EA' />}

    </SafeView>
  </Modal>
}

const styles = StyleSheet.create({

});


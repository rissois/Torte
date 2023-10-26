// In App.js in a new project

import React, { useCallback, useState, useEffect } from 'react';
import {
  Linking,
  View,
} from 'react-native';
import { LargeText, MediumText, SerifText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import StripeCheckout from 'react-native-stripe-checkout-webview';
import { useIsStripeTestMode } from '../../utils/hooks/useApp';
import { getFunctions, httpsCallable } from 'firebase/functions'
import firebaseApp from '../../firebase/firebase';

const functions = getFunctions(firebaseApp)

/*
react-native-stripe-checkout-webview RELIES ON WEBVIEW, which does not actually work on web


I THINK YOU NEED TO DO stripeAccount AND NO CUSTOMER_ID, this will be automatically created and defined.
Then just save it in BillPayments


RELEVANT STRIPE LINKS

Connect Create a Payments Page https://stripe.com/docs/connect/creating-a-payments-page
redirectToCheckout https://stripe.com/docs/js/checkout/redirect_to_checkout


General Accept a Payment Page https://stripe.com/docs/payments/accept-a-payment?platform=web
Checkout Sessions Create https://stripe.com/docs/api/checkout/sessions/create

ISSUE: Connected Account https://github.com/A-Tokyo/react-native-stripe-checkout-webview/issues/62

** May require react-native-web-webview
*/


export default function TestScreen({ navigation, route }) {
  const isStripeTestMode = useIsStripeTestMode()
  const [it, setIt] = useState('')
  const [checkoutSessionID, setCheckoutSessionID] = useState('')
  // useEffect(() => {
  //   const url = async () => {
  //     try {
  //       const url = await Linking.getInitialURL()
  //       setIt(url)
  //       console.log(url)
  //     }
  //     catch (error) {
  //       console.log('how did you fuck this one up?')
  //     }
  //   }

  //   url()
  // }, [])

  useEffect(() => {
    const test = async () => {
      try {
        let response = await httpsCallable(functions, 'stripeCheckout-createCheckoutSession')({
          amount: 956,
          tip: 100,
          restaurant_id: 'K00IXKl5xiNmsTBYro0dRSK8gtA3',
          bill_id: 'KeSR9yZZZn6IStWxD8ad',
          cancel_url: 'https://wwww.facebook.com',
          success_url: 'https://wwww.google.com',
        })

        // you are concerned with response.data
        // you need to figure out linking for the cancel (PARAM TO PAYMENT) and success url (NAV TO FEEDBACK)

        console.log(`ID: ${response?.data?.id}`)

        setCheckoutSessionID(response.data.id)
      }
      catch (error) {
        console.log('TestScreen error: ', error)
      }

    }

    test()
  }, [])

  console.log(`checkoutSessionID: ${checkoutSessionID}`)


  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <LargeText>HI {it || 'none'}</LargeText>
      <LargeText>{JSON.stringify(route.params) || 'none'}</LargeText>
      {!!checkoutSessionID && <StripeCheckout
        stripePublicKey={
          isStripeTestMode ?
            '##############' :
            '##############'
        }
        checkoutSessionInput={{
          sessionId: checkoutSessionID,
        }}
        onSuccess={({ checkoutSessionId }) => {
          console.log(`Stripe checkout session succeeded. session id: ${checkoutSessionId}.`);
        }}
        onCancel={() => {
          console.log(`Stripe checkout session cancelled.`);
        }}
      />}
    </View>
  );
}

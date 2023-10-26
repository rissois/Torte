import React, { useMemo, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Colors from '../../utils/constants/Colors';
import { getFunctions, httpsCallable } from 'firebase/functions'
import { CardElement } from '@stripe/react-stripe-js';
import firebaseApp from '../../firebase/firebase';

const functions = getFunctions(firebaseApp)


// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  '##############',
  // {stripeAccount: ''} MUST GET FROM RESTAURANT
);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: Colors.white,
      iconColor: Colors.white,
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
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




const CheckoutForm = () => {
  return (
    <form>
      <CardElement options={CARD_ELEMENT_OPTIONS} />
      <button>Submit</button>
    </form>
  );
};

export default function TestScreen() {
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    const getClientSecret = async () => {
      try {
        const { data } = await httpsCallable(functions, 'stripeSetup-createSetupIntent')({
          isTest: true,
          isIntentRequired: true
        })
        setClientSecret(data?.clientSecret || '')
      }
      catch (error) {
        console.log(`TestScreen getClientSecret error: `, error)
      }
    }

    getClientSecret()

  }, [])

  console.log(`clientSecret ${clientSecret}`)

  if (!clientSecret) return null

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm />
      </Elements>
    </View>

  );
};
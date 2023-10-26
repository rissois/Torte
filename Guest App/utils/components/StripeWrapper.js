import React from 'react';
import { Elements, } from '@stripe/react-stripe-js';
import IndicatorOverlay from './IndicatorOverlay';
import useStripeObject from '../hooks/useStripeObject';

// https://thoughtsandstuff.com/dynamically-set-an-account-id-in-stripe-using-loadstripe/

export default function StripeWrapper({ clear, children, isConnected }) {
    const stripeObject = useStripeObject(isConnected)

    if (!stripeObject) return <IndicatorOverlay text='Loading Stripe...' />

    return <Elements stripe={stripeObject}>{children}</Elements>
}



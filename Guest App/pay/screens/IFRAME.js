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
import functions from '@react-native-firebase/functions'
import Layout from '../../utils/constants/Layout';

/*
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
  return <iframe src="https://en.m.wikipedia.org" style={{ height: Layout.window.height }} />
}

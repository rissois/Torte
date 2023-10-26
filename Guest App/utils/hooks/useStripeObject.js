import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector, } from 'react-redux';

import { useIsStripeTestMode } from './useApp';
import { loadStripe } from '@stripe/stripe-js';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { selectRestaurantConnectID } from '../../redux/selectors/selectorsRestaurant2';

export default function useStripeObject(isConnected) {
    const dispatch = useDispatch()

    const isStripeTestMode = useIsStripeTestMode()
    const connect_id = useSelector(selectRestaurantConnectID)
    const [stripeObject, setStripeObject] = useState(null)

    useEffect(() => {
        // This could be a custom hook, but stripe recommends at root
        const fetchStripeObject = async () => {
            if (isConnected && !connect_id) return

            try {
                const p = await loadStripe(isStripeTestMode ?
                    '##############' :
                    '##############',
                    isConnected ? { stripeAccount: connect_id } : undefined)

                setStripeObject(p)
            }
            catch (error) {
                console.log('useStripeObject error: ', error.message)
                // is this safe?
                dispatch(doAlertAdd('Unable to connect to Stripe', 'Please close out and try again.'))
            }
        }

        fetchStripeObject()
    }, [isStripeTestMode, connect_id])

    return stripeObject
}



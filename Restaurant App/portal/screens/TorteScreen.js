import React, { useState, } from 'react';
import {
  StyleSheet,
} from 'react-native';
import useRestaurantNestedFields from '../../hooks/useRestaurantNestedField';
import PortalGroup from '../components/PortalGroup';
import { formatPhoneNumber } from '../functions/formatPortalFields';
import { useDispatch, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import PortalForm from '../components/PortalForm';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import usePrivateNestedField from '../../hooks/usePrivateNestedField';
import { PortalTextField, PortalEnumField } from '../components/PortalFields';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import firebase from 'firebase';

const PHONE_EXACT = 10


export default function TorteScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()

  const currentAuthEmail = usePrivateNestedField('Contact', 'auth_email')
  const currentEmail = usePrivateNestedField('Contact', 'email')
  const currentPhone = usePrivateNestedField('Contact', 'phone')

  const stripeID = useRestaurantNestedFields('stripe', 'live', 'connect_id')
  const is_live = useRestaurantNestedFields('is_live')
  const is_hidden = useRestaurantNestedFields('is_hidden')
  const currentIsOrderEnabled = useRestaurantNestedFields('is_order_enabled')
  const currentIsPayEnabled = useRestaurantNestedFields('is_pay_enabled')


  const [phone, setPhone] = useState(currentPhone)
  const [email, setEmail] = useState(currentEmail)
  const [is_order_enabled, setIsOrderEnabled] = useState(currentIsOrderEnabled)
  const [is_pay_enabled, setIsPayEnabled] = useState(currentIsPayEnabled)

  const [failedFields, setFailedFields] = useState([])


  const isAltered = phone != currentPhone
    || email !== currentEmail
    || is_order_enabled !== currentIsOrderEnabled
    || is_pay_enabled !== currentIsPayEnabled

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setPhone(currentPhone)
          setEmail(currentEmail)
          setIsOrderEnabled(currentIsOrderEnabled)
          setIsPayEnabled(currentIsPayEnabled)
        }
      },
      {
        text: 'No'
      }
    ]))
  }

  const save = () => {
    let failed = []
    if (!phone || phone.length !== PHONE_EXACT) failed.push('phone')
    if (failed.length) {
      dispatch(doAlertAdd('Incorrect fields', ['Correct the following fields: ', ...failed]))
      setFailedFields(failed)
    }
    else {
      const batch = firebase.firestore().batch()

      if (phone !== currentPhone || email !== currentEmail) {
        batch.set(restaurantRef.collection('Private').doc('Contact'), {
          phone,
          email,
        }, { merge: true })
      }

      if (is_order_enabled !== currentIsOrderEnabled || is_pay_enabled !== currentIsPayEnabled) {
        batch.set(restaurantRef, {
          is_order_enabled,
          is_pay_enabled,
        }, { merge: true })
      }

      return batch.commit().then(() => {
        dispatch(doSuccessAdd())
      }).catch(error => {
        console.log('TorteScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new details', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }

  return (
    <PortalForm
      headerText='Torte information'
      isLocked
      save={save}
      reset={reset}
      isAltered={isAltered}>
      <PortalGroup text='Torte status' >
        <PortalTextField text='Connected to Stripe' value={stripeID ? 'YES' : 'NO'} isLocked />
        <PortalTextField text='Visible on Torte' value={is_hidden ? 'NO' : 'YES'} isLocked />
        <PortalTextField text='Live on Torte' value={is_live ? 'YES' : 'No, coming soon!'} isLocked />
      </PortalGroup>

      <PortalGroup text='Guest capabilities' >
        <PortalEnumField text='Allow ordering through Torte' value={is_order_enabled ? 'YES' : 'NO'} options={[true, false]} setValue={setIsOrderEnabled} />
        <PortalEnumField text='Allow paying through Torte' value={is_pay_enabled ? 'YES' : 'NO'} options={[true, false]} setValue={setIsPayEnabled} />
      </PortalGroup>

      <PortalGroup text='How can we reach you?' >
        <PortalTextField
          text='Phone'
          value={phone}
          placeholder='(XXX) XXX-XXXX'
          onChangeText={setPhone}
          isRequired
          exact={PHONE_EXACT}
          format={formatPhoneNumber}
          isFailed={failedFields.includes('phone')}
          isNumberString
        />

        <PortalTextField
          text='Account email'
          subtext='The email used to register with Torte'
          value={currentAuthEmail}
          isLocked
        />

        <PortalTextField
          text='Alternative email'
          subtext='A secondary email to the one above'
          value={email}
          placeholder='(optional)'
          onChangeText={setEmail}
          keyboardType='email-address'
        />
      </PortalGroup>
    </PortalForm>
  )
}

const styles = StyleSheet.create({

});


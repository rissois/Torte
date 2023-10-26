/*
  Consider using getRestaurant to alert restaurant status (closed, no orders, etc.)
*/

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore'
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { ExtraLargeText, DefaultText, LargeText, } from '../../utils/components/NewStyledText';
import CodeConfirm from './CodeConfirm';
import { codeTextInputs } from '../constants/codeTextInputs';

export default function CodeRestaurantInput({
  restaurantRef,
  changeRestaurant,
}) {
  const [restaurantCode, setRestaurantCode] = useState('')
  const [invalidRestaurantCode, setInvalidRestaurantCode] = useState('')
  const [isFetchingRestaurant, setIsFetchingRestaurant] = useState(false)

  const getRestaurant = useCallback(r_code => {
    setInvalidRestaurantCode('')
    setIsFetchingRestaurant(true)

    firestore().collection('Restaurants')
      .where('code', '==', r_code.toUpperCase())
      .limit(1)
      .get()
      .then(docs => {
        if (!docs.size) {
          setRestaurantCode('')
          setInvalidRestaurantCode(r_code)
          setIsFetchingRestaurant(false)
        }
        else {
          changeRestaurant(docs.docs[0].data())
        }
      }, error => {
        setRestaurantCode('')
        setInvalidRestaurantCode(r_code)
        setIsFetchingRestaurant(false)
        console.log('CodeScreen getRestaurant error: ', error)
      })
  }, [])

  useEffect(() => {
    // Required for android
    if (Platform.OS !== 'web') setTimeout(() => restaurantRef?.current?.focus(), 10)
  }, [])

  return (
    <View>
      {!!invalidRestaurantCode && <ExtraLargeText center red>"{invalidRestaurantCode}" NOT FOUND</ExtraLargeText>}

      <LargeText center>Enter the restaurant code</LargeText>
      <DefaultText center>(this should be below the QR code)</DefaultText>
      <TextInput
        ref={restaurantRef}
        style={codeTextInputs.textInput}
        autoCapitalize='characters'
        contextMenuHidden
        onChangeText={setRestaurantCode}
        value={restaurantCode}
      />

      <CodeConfirm disabled={restaurantCode.length < 2} onPress={() => getRestaurant(restaurantCode)} />

      {isFetchingRestaurant && <IndicatorOverlay />}
    </View>
  )
}


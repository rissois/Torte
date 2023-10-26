/*
  Consider using getRestaurant to alert restaurant status (closed, no orders, etc.)
*/

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
} from 'react-native';
import { collection, getFirestore, getDocs, query, where, limit } from 'firebase/firestore'

import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { ExtraLargeText, DefaultText, LargeText, } from '../../utils/components/NewStyledText';
import CodeConfirm from './CodeConfirm';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../utils/constants/Colors';
import firebaseApp from '../../firebase/firebase';

const firestore = getFirestore(firebaseApp)

export default function CodeRestaurantInput({
  restaurantRef,
  changeRestaurant,
}) {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const ref = useRef(null)
  const [restaurantCode, setRestaurantCode] = useState('')
  const [invalidRestaurantCode, setInvalidRestaurantCode] = useState('')
  const [isFetchingRestaurant, setIsFetchingRestaurant] = useState(false)

  const getRestaurant = useCallback(async r_code => {
    setInvalidRestaurantCode('')
    setIsFetchingRestaurant(true)



    try {
      const docs = await getDocs(
        query(
          collection(firestore, 'Restaurants'),
          where('code', '==', r_code.toUpperCase()),
          limit(1),
        )
      )

      setRestaurantCode('')
      setIsFetchingRestaurant(false)
      if (!docs.size) {
        setInvalidRestaurantCode(r_code)
      }
      else {
        changeRestaurant(docs.docs[0].data())
      }
    }
    catch (error) {
      setRestaurantCode('')
      setInvalidRestaurantCode(r_code)
      setIsFetchingRestaurant(false)
      console.log('CodeRestaurantInput.web.js error: ', error)
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      restaurantRef?.current?.focus()
    }, 50)
  }, [])

  return (
    <View>
      {!!invalidRestaurantCode && <ExtraLargeText center red>"{invalidRestaurantCode}" NOT FOUND</ExtraLargeText>}

      <LargeText center>Enter the restaurant code</LargeText>
      <DefaultText center>(this should be below the QR code)</DefaultText>
      <TextInput
        ref={restaurantRef}
        style={{
          textAlign: 'center',
          color: Colors.white,
          fontSize: 24,
          outline: 'none',
          marginVertical: 20,
          paddingBottom: 4,
          borderBottomColor: Colors.white,
          borderBottomWidth: 1,
          width: '50%',
          alignSelf: 'center',
        }}
        autoCapitalize='characters'
        contextMenuHidden
        onChangeText={setRestaurantCode}
        value={restaurantCode}
        autoFocus
      />

      <CodeConfirm disabled={restaurantCode.length < 2} onPress={() => getRestaurant(restaurantCode)} />

      {isFetchingRestaurant && <IndicatorOverlay />}
    </View>
  )
}


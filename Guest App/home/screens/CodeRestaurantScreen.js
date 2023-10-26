/*
  Consider using getRestaurant to alert restaurant status (closed, no orders, etc.)
*/

import React, { useState, useRef, useCallback, } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import { useDispatch, } from 'react-redux';
import { useFocusEffect, } from '@react-navigation/native';

import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import { LargeText, DefaultText, ExtraLargeText } from '../../utils/components/NewStyledText';
import { doTempRemoveRestaurant, doTempSetRestaurant } from '../../redux/actions/actionsTemp';
import Colors from '../../utils/constants/Colors';
import CodeConfirm from '../components/CodeConfirm';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { useRestaurantFromCode } from '../../utils/hooks/useCodes';
import { TextInput, } from 'react-native-web'


export default function CodeRestaurantScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantInputRef = useRef(null)
  const getRestaurantFromCode = useRestaurantFromCode()

  const [restaurantCode, setRestaurantCode] = useState('')
  const [invalidRestaurantCode, setInvalidRestaurantCode] = useState(null)
  const [isFetchingRestaurant, setIsFetchingRestaurant] = useState(false)


  useFocusEffect(useCallback(() => {
    // Precaution for now
    dispatch(doTempRemoveRestaurant())

    // setTimeout(() => {
    //   setInvalidRestaurantCode('REF')
    //   restaurantInputRef.current?.focus()
    // }, 100)
  }, []))

  const getRestaurant = useCallback(async r_code => {
    setIsFetchingRestaurant(true)
    setInvalidRestaurantCode(null)

    try {
      const restaurant = await getRestaurantFromCode(r_code)
      setIsFetchingRestaurant(false)
      setRestaurantCode('')
      dispatch(doTempSetRestaurant(restaurant))
      navigation.navigate('CodeTable')
    }
    catch (error) {
      console.log('CodeRestaurantScreen getRestaurant error: ', error)
      setIsFetchingRestaurant(false)
      setInvalidRestaurantCode(r_code)
      setRestaurantCode('')
    }
  }, [])

  return <SafeView>
    <Header back />

    <View>
      <ExtraLargeText center red style={{ opacity: invalidRestaurantCode ? 1 : 0 }}>"{invalidRestaurantCode}" NOT FOUND</ExtraLargeText>

      <LargeText center>Enter the restaurant code</LargeText>
      <DefaultText center>(this should be below the QR code)</DefaultText>
      <TextInput
        ref={restaurantInputRef}
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
        autoCorrect={false}
        autoComplete={false}
        contextMenuHidden
        onChangeText={setRestaurantCode}
        value={restaurantCode.toUpperCase()}
        autoFocus
      />


      <CodeConfirm disabled={restaurantCode.length < 2} onPress={() => getRestaurant(restaurantCode.toUpperCase())} />

      {isFetchingRestaurant && <IndicatorOverlay />}
    </View>
  </SafeView>
}



const styles = StyleSheet.create({

});


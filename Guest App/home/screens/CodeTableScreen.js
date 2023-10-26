/*
  Consider using getTable to alert restaurant status (closed, no orders, etc.)
*/

import React, { useState, useRef, useCallback, } from 'react';
import {
  StyleSheet,
  View,

  TouchableOpacity,
  KeyboardAvoidingView
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, } from '@react-navigation/native';
import Header from '../../utils/components/Header';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { LargeText, DefaultText, ExtraLargeText, SmallText } from '../../utils/components/NewStyledText';
import { doTempRemoveRestaurant, doTempRemoveTable, doTempSetTable } from '../../redux/actions/actionsTemp';
import Colors from '../../utils/constants/Colors';
import CodeConfirm from '../components/CodeConfirm';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { useTableCodeResponse, useTableFromCodeOrID } from '../../utils/hooks/useCodes';
import { selectTempRestauranAddress, selectTempRestaurantID, selectTempRestaurantName } from '../../redux/selectors/selectorsTemp';
import SafeView from '../../utils/components/SafeView';
import { TextInput, } from 'react-native-web'

export default function CodeTableScreen({ navigation, route }) {
  const dispatch = useDispatch()

  const tableInputRef = useRef(null)
  const getTableFromCode = useTableFromCodeOrID()
  const handleTableCodeResponse = useTableCodeResponse()
  const restaurant_id = useSelector(selectTempRestaurantID)
  const restaurant_name = useSelector(selectTempRestaurantName)
  const restaurant_address = useSelector(selectTempRestauranAddress)
  const isRestaurantListenerOn = useSelector(state => !!state.listeners.restaurant.restaurant)

  const [tableCode, setTableCode] = useState('')
  const [invalidTableCode, setInvalidTableCode] = useState(false)
  const [isFetchingTable, setIsFetchingTable] = useState(false)

  useFocusEffect(useCallback(() => {
    // This may have unforeseen negative consequences
    dispatch(doTempRemoveTable())

    // setTimeout(() => {
    //   setInvalidTableCode('HI')
    //   tableInputRef.current?.focus()
    // }, 250)
  }, []))

  const getTable = useCallback(async t_code => {
    setIsFetchingTable(true)
    setInvalidTableCode(false)

    try {
      const data = await getTableFromCode(restaurant_id, t_code)

      setIsFetchingTable(false)
      setTableCode('')

      handleTableCodeResponse(data)
    }
    catch (error) {
      if (error.code !== 'functions/invalid-argument') {
        console.log('CodeTableScreenScreen getTableFromCode error: ', error)
        dispatch(doAlertAdd('Error finding table', error.message))
      }
      setIsFetchingTable(false)
      setInvalidTableCode(t_code)
      setTableCode('')
    }
  }, [restaurant_id])

  return <SafeView>
    <Header back backFn={() => {
      dispatch(doTempRemoveRestaurant())
      navigation.goBack()
    }}>
      <LargeText center>{restaurant_name}</LargeText>
    </Header>

    <View>
      {!!restaurant_address.line1 && <DefaultText center>{restaurant_address.line1}</DefaultText>}
      <DefaultText center>{restaurant_address.city}, {restaurant_address.state}</DefaultText>
    </View>

    <View>
      <ExtraLargeText center red style={{ opacity: invalidTableCode ? 1 : 0 }}>"{invalidTableCode}" NOT FOUND</ExtraLargeText>

      <LargeText center>Enter the table or seat #</LargeText>
      <TextInput
        ref={tableInputRef}
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
        onChangeText={setTableCode}
        value={tableCode.toUpperCase()}
        autoFocus
      />


      <CodeConfirm disabled={!tableCode.length} onPress={() => getTable(tableCode.toUpperCase())} />

      <TouchableOpacity style={{ marginTop: 20 }} onPress={() => {
        if (isRestaurantListenerOn) navigation.replace('Menu')
        else navigation.navigate('Link', { restaurant_id, isRestaurantNavStateReset: true })
      }}>
        <SmallText center>(I'm not ordering, just view menu)</SmallText>
      </TouchableOpacity>

      {isFetchingTable && <IndicatorOverlay />}
    </View>

  </SafeView>
}



const styles = StyleSheet.create({

});


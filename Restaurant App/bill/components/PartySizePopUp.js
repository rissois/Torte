import React, { useState, useCallback, useEffect, } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  KeyboardAvoidingView,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { LargeText, SuperLargeText } from '../../utils/components/NewStyledText';
import StyledButton from '../../utils/components/StyledButton';
import useBillNestedFields from '../../hooks/useBillNestedFields';
import { useBillCode, } from '../../utils/hooks/useBill';
import { useTableName } from '../../utils/hooks/useTable';
import Layout from '../../utils/constants/Layout';
import { PortalCheckField, PortalEnumField, PortalTextField } from '../../portal/components/PortalFields';
import useRestaurantNestedFields from '../../hooks/useRestaurantNestedField';
import { useDispatch, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { transactPartySize } from '../firestore/transactPartySize';
import plurarize from '../../utils/functions/plurarize';
// import { selectIsTableWithMultipleBills } from '../../redux/selectors/selectorsTableStatus';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


export const PartySizePopUp = ({ bill_id, showPartySize, setShowPartySize, table_id }) => {
  const dispatch = useDispatch()
  const party_size = useBillNestedFields(bill_id, 'party', 'party_size')
  const is_repeat_party_size = useBillNestedFields(bill_id, 'party', 'is_repeat_party_size')
  const restaurantRef = useRestaurantRef()
  const tableName = useTableName(table_id)
  const billCode = useBillCode(bill_id)
  const is_automatic_gratuity_on = useBillNestedFields(bill_id, 'gratuities', 'is_automatic_gratuity_on')
  const partyBoundary = useRestaurantNestedFields('gratuities', 'automatic', 'party_size')
  const automaticPercent = useRestaurantNestedFields('gratuities', 'automatic', 'default_option')
  // const isTableWithMultipleBills = useSelector(selectIsTableWithMultipleBills(table_id))

  const [partySize, setPartySize] = useState(party_size || 0)
  const [isRepeatPartySize, setIsRepeatPartySize] = useState(!!is_repeat_party_size)
  const [isAutomaticGratuityOn, setIsAutomaticGratuityOn] = useState(!!is_automatic_gratuity_on)
  const [isSaving, setIsSaving] = useState(false)


  useEffect(() => {
    if (bill_id && party_size === null) {
      setShowPartySize(true)
      setPartySize(0)
    }
  }, [party_size, bill_id])

  useEffect(() => {
    setIsAutomaticGratuityOn(partySize >= partyBoundary)
  }, [partySize])

  const toggleAutomaticGrauity = useCallback(() => {
    setIsAutomaticGratuityOn(prev => !prev)
  }, [])

  const save = async () => {
    try {
      if (partySize !== party_size || isRepeatPartySize !== is_repeat_party_size || is_automatic_gratuity_on !== isAutomaticGratuityOn) {
        setIsSaving(true)
        await transactPartySize(restaurantRef, bill_id, isAutomaticGratuityOn, automaticPercent, partySize, isRepeatPartySize)
      }
    }
    catch (error) {
      dispatch(doAlertAdd('Cannot set party size / gratuity', 'Please try again or contact Torte support if the error persists'))
    }
    finally {
      setIsSaving(false)
      setShowPartySize(false)
    }
  }

  if (!showPartySize) return null

  return <KeyboardAvoidingView behavior='padding' style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black + 'F1' }}>
    <View style={{ alignItems: 'center', borderColor: Colors.white, borderWidth: 1, backgroundColor: Colors.background, padding: Layout.marHor }}>
      <SuperLargeText center>{tableName} - #{billCode}</SuperLargeText>

      <View style={{ marginVertical: 20, alignItems: 'center' }}>
        <LargeText style={{ marginTop: 20, marginBottom: 8 }}>How many guests are at this table?</LargeText>
        <PortalTextField
          value={partySize}
          onChangeText={setPartySize}
          isNumber
          backgroundColor={partySize ? Colors.purple : Colors.red}
          autoFocus
        />

        <LargeText style={{ marginTop: 20, }}>Does this table have multiple bills</LargeText>
        <LargeText style={{ marginBottom: 8 }}>and you've already noted {plurarize(partySize, 'guest', 'guests')}?</LargeText>
        <PortalEnumField
          value={isRepeatPartySize ? 'YES' : 'NO'}
          options={[true, false]}
          setValue={setIsRepeatPartySize}
        />

        <View style={{ marginVertical: 20 }}>
          <PortalCheckField value={isAutomaticGratuityOn} text='Automatic gratuity is applied' subtext={`(automatic gratuity is ${automaticPercent}%)`} onPress={toggleAutomaticGrauity} />
        </View>
      </View>

      <StyledButton text={partySize ? 'CONFIRM' : "I'll enter this later"} color={partySize ? Colors.purple : Colors.darkgrey} onPress={save} />

      {isSaving && <IndicatorOverlay text='Saving....' />}
    </View>
  </KeyboardAvoidingView>
}



const styles = StyleSheet.create({

});


import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity
} from 'react-native';
import { LargeText, MediumText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import useRestaurantNestedFields from '../../hooks/useRestaurantNestedField';
import PortalGroup from '../components/PortalGroup';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import PortalForm from '../components/PortalForm';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import { PortalEnumField, PortalTextField } from '../components/PortalFields';
import centsToDollar from '../../utils/functions/centsToDollar';
import equalArrays from '../../utils/functions/equalArrays';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';


const useGratuityField = (...fields) => {
  const currentValue = useRestaurantNestedFields(...fields)
  const [value, setValue] = useState(currentValue)
  return [value, setValue, currentValue]
}

const checkDuplicateOptions = (options) => {
  return (new Set(options)).size !== options.length;
}

const changeOption = (text, index) => prev => {
  let copy = [...prev]
  copy[index] = Number(text)
  return copy
}

const DefaultOption = ({ isDefaultOption, disabled, onPress }) => (
  <TouchableOpacity disabled={disabled} onPress={onPress}>
    <FontAwesome
      name={isDefaultOption ? 'star' : 'star-o'}
      size={36}
      color={isDefaultOption ? Colors.yellow : Colors.midgrey}
      style={{ marginHorizontal: 20, marginTop: 4 }}
    />
  </TouchableOpacity>
)


export default function GratuityScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()

  const [isTipEnabled, setIsTipEnabled, currentIsTipEnabled] = useGratuityField('gratuities', 'is_tip_enabled')
  const [isAutomaticTipEnabled, setIsAutomaticTipEnabled, currentIsAutomaticTipEnabled] = useGratuityField('gratuities', 'is_automatic_tip_enabled')
  const [isChargeTipEnabled, setIsChargeTipEnabled, currentIsChargeTipEnabled] = useGratuityField('gratuities', 'is_charge_tip_enabled')

  // const [automaticDefaultOption, setAutomaticDefaultOption, currentAutomaticDefaultOption] = useGratuityField('gratuities', 'automatic', 'default_option')
  const [automaticOptions, setAutomaticOptions, currentAutomaticOptions] = useGratuityField('gratuities', 'automatic', 'options')
  const [automaticPartySize, setAutomaticPartySize, currentAutomaticPartySize] = useGratuityField('gratuities', 'automatic', 'party_size')

  const [chargeDefaultOption, setChargeDefaultOption, currentChargeDefaultOption] = useGratuityField('gratuities', 'charge', 'default_option')

  const [promptsIsNoTipWarned, setPromptsIsNoTipWarned, currentPromptsIsNoTipWarned] = useGratuityField('gratuities', 'prompts', 'is_no_tip_warned')
  const [promptsIsPercentBased, setPromptsIsPercentBased, currentPromptsIsPercentBased] = useGratuityField('gratuities', 'prompts', 'is_percent_based')

  const [promptsCentsDefaultOption, setPromptsCentsDefaultOption, currentPromptsCentsDefaultOption] = useGratuityField('gratuities', 'prompts', 'cents', 'default_option')
  const [promptsCentsDefaultIndex, setPromptsCentsDefaultIndex,] = useState(null)
  const [promptsCentsOptions, setPromptsCentsOptions, currentPromptsCentsOptions] = useGratuityField('gratuities', 'prompts', 'cents', 'options')

  const [promptsPercentDefaultOption, setPromptsPercentDefaultOption, currentPromptsPercentDefaultOption] = useGratuityField('gratuities', 'prompts', 'percent', 'default_option')
  const [promptsPercentDefaultIndex, setPromptsPercentDefaultIndex,] = useState(null)
  const [promptsPercentOptions, setPromptsPercentOptions, currentPromptsPercentOptions] = useGratuityField('gratuities', 'prompts', 'percent', 'options')

  useEffect(() => {
    setPromptsCentsDefaultIndex(currentPromptsCentsOptions.indexOf(currentPromptsCentsDefaultOption))
  }, [currentPromptsCentsOptions, currentPromptsCentsDefaultOption])

  useEffect(() => {
    setPromptsPercentDefaultIndex(currentPromptsPercentOptions.indexOf(currentPromptsPercentDefaultOption))
  }, [currentPromptsPercentOptions, currentPromptsPercentDefaultOption])

  const isAltered = promptsIsNoTipWarned !== currentPromptsIsNoTipWarned
    || isTipEnabled !== currentIsTipEnabled
    || isAutomaticTipEnabled !== currentIsAutomaticTipEnabled
    || isChargeTipEnabled !== currentIsChargeTipEnabled
    // || automaticDefaultOption !== currentAutomaticDefaultOption
    || !equalArrays(automaticOptions, currentAutomaticOptions)
    || automaticPartySize !== currentAutomaticPartySize
    || chargeDefaultOption !== currentChargeDefaultOption
    || promptsIsPercentBased !== currentPromptsIsPercentBased
    || (promptsIsPercentBased
      ? (
        (promptsPercentOptions[promptsPercentDefaultIndex] || 0) !== currentPromptsPercentDefaultOption
        || !equalArrays(promptsPercentOptions, currentPromptsPercentOptions)
      )
      : (
        (promptsCentsOptions[promptsCentsDefaultIndex] || 0) !== currentPromptsCentsDefaultOption
        || !equalArrays(promptsCentsOptions, currentPromptsCentsOptions)
      ))

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setIsTipEnabled(currentIsTipEnabled)
          setIsAutomaticTipEnabled(currentIsAutomaticTipEnabled)
          setIsChargeTipEnabled(currentIsChargeTipEnabled)
          // setSuggestedMinimumTipPercent(currentSuggestedMinimumTipPercent)
          // setAutomaticDefaultOption(currentAutomaticDefaultOption)
          setAutomaticOptions(currentAutomaticOptions)
          setAutomaticPartySize(currentAutomaticPartySize)
          setChargeDefaultOption(currentChargeDefaultOption)
          setPromptsIsNoTipWarned(currentPromptsIsNoTipWarned)
          setPromptsIsPercentBased(currentPromptsIsPercentBased)
          setPromptsCentsOptions(currentPromptsCentsOptions)
          setPromptsPercentOptions(currentPromptsPercentOptions)
          setPromptsCentsDefaultIndex(currentPromptsCentsOptions.indexOf(currentPromptsCentsDefaultOption))
          setPromptsPercentDefaultIndex(currentPromptsPercentOptions.indexOf(currentPromptsPercentDefaultOption))
        }
      },
      {
        text: 'No'
      }
    ]))
  }

  const save = () => {
    let failed = []
    if (isAutomaticTipEnabled && (automaticOptions[1] < automaticOptions[0] || automaticOptions[2] < automaticOptions[0])) failed.push('Automatic gratuity Options 2 and 3 must be large than Option 1')
    if (failed.length) {
      dispatch(doAlertAdd('Incorrect fields', [...failed]))
    }
    else {
      const sortedAutomaticOptions = [...automaticOptions].sort()
      const sortedPromptsPercentOptions = [...promptsPercentOptions].sort()
      const sortedPromptsCentsOptions = [...promptsCentsOptions].sort()
      // NOTE: You can limit the set based on what data is actually visibilty (i.e. no reason to update prompts.cents if is_percent_based)
      return restaurantRef.set({
        gratuities: {
          is_tip_enabled: isTipEnabled,
          is_automatic_tip_enabled: isAutomaticTipEnabled,
          is_charge_tip_enabled: isChargeTipEnabled,

          automatic: {
            default_option: automaticOptions[0],
            options: sortedAutomaticOptions,
            party_size: automaticPartySize,
          },

          charge: {
            default_option: chargeDefaultOption
          },

          prompts: {
            is_no_tip_warned: promptsIsNoTipWarned,
            is_percent_based: promptsIsPercentBased,
            percent: {
              default_option: promptsPercentOptions[promptsPercentDefaultIndex] || 0,
              options: sortedPromptsPercentOptions,
            },
            cents: {
              default_option: promptsCentsOptions[promptsCentsDefaultIndex] || 0,
              options: sortedPromptsCentsOptions
            }
          },
        }
      }, { merge: true }).then(() => {
        setAutomaticOptions(sortedAutomaticOptions)
        setPromptsPercentOptions(sortedPromptsPercentOptions)
        setPromptsCentsOptions(sortedPromptsCentsOptions)
        dispatch(doSuccessAdd())
      }).catch(error => {
        console.log('GratuityScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new settings', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }



  return (
    <PortalForm
      headerText='Customer gratuity settings'
      isLocked
      save={save}
      reset={reset}
      isAltered={isAltered}
    >
      <PortalGroup text='General' >
        <PortalEnumField text="Are tips allowed?" value={isTipEnabled ? 'YES' : 'NO'} options={[true, false]} setValue={setIsTipEnabled} />
        {isTipEnabled && <PortalEnumField text="Is there an automatic tip for large parties?" value={isAutomaticTipEnabled ? 'YES' : 'NO'} options={[true, false]} setValue={setIsAutomaticTipEnabled} />}
        <PortalEnumField text="Is there an automatic tip for unpaid bills?" value={isChargeTipEnabled ? 'YES' : 'NO'} options={[true, false]} setValue={setIsChargeTipEnabled} />
      </PortalGroup>

      {isTipEnabled && <PortalGroup text='Customer prompts' >
        <PortalEnumField text="Tips as percent or dollars?" subtext='Percent recommended for table service, dollar for counter service' value={promptsIsPercentBased ? 'PERCENT' : 'DOLLAR'} options={[true, false]} setValue={setPromptsIsPercentBased} />
        <LargeText>Options presented to guests:</LargeText>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MediumText>You may select a default tip</MediumText>
          <FontAwesome
            name='star'
            size={20}
            color={Colors.yellow}
            style={{ marginHorizontal: 8 }}
          />
          <MediumText>to be preselected for guests</MediumText>
        </View>

        <View style={{ marginVertical: 8, marginLeft: 30 }}>
          {
            promptsIsPercentBased ?
              promptsPercentOptions.map((value, index) => (
                <PortalTextField
                  key={index.toString()}
                  text={`Option ${index + 1}`}
                  subtext='max 30%'
                  value={value}
                  onChangeText={text => setPromptsPercentOptions(changeOption(text, index))}
                  max={30}
                  afterCursor='%'
                  isNumber
                  symbol={<DefaultOption isDefaultOption={index === promptsPercentDefaultIndex} onPress={() => setPromptsPercentDefaultIndex(prev => prev === index ? -1 : index)} />}
                />
              )) :
              promptsCentsOptions.map((value, index) => (
                <PortalTextField
                  key={index.toString()}
                  text={`Option ${index + 1}`}
                  value={value}
                  onChangeText={text => setPromptsCentsOptions(changeOption(text, index))}
                  isNumber
                  format={centsToDollar}
                  symbol={<DefaultOption isDefaultOption={index === promptsCentsDefaultIndex} onPress={() => setPromptsCentsDefaultIndex(prev => prev === index ? -1 : index)} />}
                />
              ))
          }
          {checkDuplicateOptions(promptsIsPercentBased ? promptsPercentOptions : promptsCentsOptions) && <LargeText bold red>AVOID DUPLICATE OPTIONS</LargeText>}
        </View>
        <PortalEnumField text={`Warn on ${promptsIsPercentBased ? '0%' : '$0.00'} tip`} subtext='Only recommended for table service' value={promptsIsNoTipWarned ? 'YES' : 'NO'} options={[true, false]} setValue={setPromptsIsNoTipWarned} />
      </PortalGroup>}

      {isTipEnabled && isAutomaticTipEnabled && <PortalGroup text='Automatic gratuities' >
        <PortalTextField
          text="Gratuity for large parties"
          value={automaticOptions[0]}
          onChangeText={text => setAutomaticOptions(changeOption(text, 0))}
          isNumber
          afterCursor='%'
        />
        <PortalTextField
          text="Number of guests for large parties"
          subtext='or more'
          value={automaticPartySize}
          onChangeText={setAutomaticPartySize}
          isNumber
        />
        <LargeText>Options for guests to increase their tip:</LargeText>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MediumText>The default tip</MediumText>
          <FontAwesome
            name='star'
            size={20}
            color={Colors.yellow}
            style={{ marginHorizontal: 8 }}
          />
          <LargeText>will always be the gratuity for large parties above</LargeText>
        </View>
        <View style={{ marginVertical: 8, marginLeft: 30 }}>
          <PortalTextField
            text='Option 1'
            value={automaticOptions[0]}
            afterCursor='%'
            isLocked
            symbol={<DefaultOption isDefaultOption={true} disabled />}
            isNumber
          />
          {
            automaticOptions.slice(1).map((value, index) => (
              <PortalTextField
                key={index.toString()}
                text={`Option ${index + 2}`}
                subtext={`must be greater than Option 1 (${automaticOptions[0]}%) (max 30%)`}
                value={value}
                min={automaticOptions[0]}
                max={30}
                onChangeText={text => setAutomaticOptions(changeOption(text, index + 1))}
                isNumber
                afterCursor='%'
              />
            ))
          }
          {checkDuplicateOptions(automaticOptions) && <LargeText bold red>AVOID DUPLICATE OPTIONS</LargeText>}
        </View>
      </PortalGroup>}

      {isChargeTipEnabled && <PortalGroup text='Unpaid bill gratuity' >
        <PortalTextField
          text="Gratuity for unpaid bills"
          subtext='Suggested 20% (max 30%)'
          max={30}
          value={chargeDefaultOption}
          onChangeText={setChargeDefaultOption}
          afterCursor='%'
          isNumber
        />
      </PortalGroup>}
    </PortalForm>
  )
}

const styles = StyleSheet.create({

});


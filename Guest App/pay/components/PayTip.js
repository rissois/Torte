
import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  TouchableOpacity,
  PixelRatio,
  LayoutAnimation,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons, } from '@expo/vector-icons';
import { LargeText, MediumText, SuperLargeText, DefaultText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import centsToDollar from '../../utils/functions/centsToDollar';
import Cursor from '../../utils/components/Cursor';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const calculateTipAmount = (isTipInPercentages, option, subtotal) => isTipInPercentages ? Math.round(option * subtotal / 100) : option


export default function PayTip({
  tip,
  setTip,
  subtotal,
  selectedTipOption,
  setSelectedTipOption,
  isAutomaticTip,
  tipDefault,
  tipOptions,
  isTipInPercentages,
}) {
  const [isCustomTip, setIsCustomTip] = useState(false)
  const [isTextInputFocused, setIsTextInputFocused] = useState(false)
  const tipTextInputRef = useRef(null)

  const [isOtherSelected, setIsOtherSelected] = useState(false)

  useEffect(() => {
    if (isAutomaticTip && subtotal > 50) {
      const minTip = calculateTipAmount(true, tipDefault, subtotal)
      setTip(prev => prev < minTip ? minTip : prev) // is this not redundant with below? selectedTipOption > tip
      setSelectedTipOption(prev => prev < tipDefault ? tipDefault : prev)
    }
  }, [isAutomaticTip, tipDefault, subtotal])

  useEffect(() => {
    if (subtotal > 50) setTip(calculateTipAmount(isTipInPercentages, selectedTipOption, subtotal))
  }, [isTipInPercentages, selectedTipOption, subtotal])


  const showCustomTip = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedTipOption(prev => prev || tipOptions[0])
    setIsOtherSelected(true)
    setIsCustomTip(true)
  }


  return (
    <View>
      <View style={{ marginBottom: 10 }}>
        <LargeText bold >{subtotal > 50 ? 'Select a tip' : 'Enter a tip'}</LargeText>
        {
          !!isAutomaticTip && subtotal > 50 && <DefaultText>An automatic {tipDefault}% gratuity has been added to your bill by your server.</DefaultText>
        }
      </View>

      {
        isTipInPercentages && subtotal > 50 ?
          <View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {
                tipOptions.map(option => <TipOption
                  disabled={isAutomaticTip && option < tipDefault}
                  key={option.toString()}
                  isTipInPercentages={isTipInPercentages}
                  option={option}
                  isSelected={option === selectedTipOption && !isOtherSelected}
                  onPress={() => {
                    setSelectedTipOption(option)
                    setIsOtherSelected(false)
                  }}
                />)
              }

            </View>
            <TipOption
              option='other'
              isSelected={isOtherSelected}
              onPress={() => showCustomTip()}
              flexBasis={tipOptions.length === 4 ? 2 : 1}
            />
            {isCustomTip && <TipAdjuster
              min={isAutomaticTip ? tipDefault : 0}
              isTipInPercentages={isTipInPercentages}
              amount={selectedTipOption}
              setAmount={setSelectedTipOption}
              setIsOtherSelected={setIsOtherSelected}
            />}
          </View> :
          <View>
            <TextInput
              ref={tipTextInputRef}
              style={{ height: 0, width: 0, opacity: 0 }}
              value={tip}
              onChangeText={str => {
                if (!str.length) return setTip(0)
                const num = Number(str)
                if (!!num) setTip(num)
              }}
              keyboardType='number-pad'
              onFocus={() => setIsTextInputFocused(true)}
              onBlur={() => setIsTextInputFocused(false)}
            />
            <TouchableWithoutFeedback onPress={() => tipTextInputRef?.current?.focus()}>
              <View style={{ flexDirection: 'row', alignSelf: 'center', width: '60%', borderBottomColor: Colors.white, borderBottomWidth: 2, paddingBottom: 4, justifyContent: 'center' }}>
                <SuperLargeText style={{ color: tip ? Colors.white : Colors.lightgrey }}>{centsToDollar(tip)}</SuperLargeText>
                <View>
                  <Cursor cursorOn={isTextInputFocused} />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
      }
    </View>
  )
}

const TipAdjuster = ({ amount, setAmount, min = 0, isTipInPercentages, setIsOtherSelected }) => {
  const incrementAmount = isTipInPercentages ? 1 : 25

  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
    <TouchableOpacity disabled={amount - incrementAmount < min} onPress={() => {
      setAmount(prev => prev - incrementAmount)
      setIsOtherSelected(true)
    }}>
      <MaterialIcons
        name="remove-circle-outline"
        color={(amount - incrementAmount < min) ? Colors.midgrey : Colors.white}
        size={30 * PixelRatio.getFontScale()}
        style={{ paddingHorizontal: 20 }}
      />
    </TouchableOpacity>

    <View >
      <SuperLargeText center>{isTipInPercentages ? `${amount}%` : `${centsToDollar(amount)}`}</SuperLargeText>
    </View>

    <TouchableOpacity disabled={false} onPress={() => {
      setAmount(prev => prev + incrementAmount)
      setIsOtherSelected(true)
    }}>
      <MaterialIcons
        name="add-circle-outline"
        color={false ? Colors.midgrey : Colors.white}
        size={30 * PixelRatio.getFontScale()}
        style={{ paddingHorizontal: 20 }}
      />
    </TouchableOpacity>
  </View>
}


const TipOption = ({ disabled, option, isTipInPercentages, isSelected, onPress, }) => {
  return (
    <View style={{ flexGrow: 1 }}>
      <TouchableOpacity
        disabled={disabled}
        onPress={onPress}>
        <View style={[styles.tip, {
          backgroundColor: disabled ? undefined : isSelected ? Colors.purple : Colors.darkgrey
        }]}>
          {
            option === 'other' ?
              <MediumText center >other</MediumText>
              :
              isTipInPercentages ?
                <LargeText center>{option}%</LargeText> :
                <MediumText center>{centsToDollar(option)}</MediumText>
          }
        </View>
      </TouchableOpacity>
    </View>)
}



const styles = StyleSheet.create({
  tip: {
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 10,
  },
});
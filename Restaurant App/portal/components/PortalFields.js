import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

import { DefaultText, LargeText, MediumText } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import Cursor from '../../utils/components/Cursor';
import { regexIsNumber } from '../../utils/functions/regex';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function PortalBaseField({ isFailed, text, subtext, limit, exact, isLocked, value, children, symbol, isDelta }) {
  return (
    <View style={{ marginBottom: 8, }}>
      <View style={{ flexDirection: 'row', }}>
        {isFailed && <LargeText red bold style={styles.firstLineCorrection}>* </LargeText>}
        {!!text && <LargeText style={styles.firstLineCorrection}>{text}:   </LargeText>}
        <View style={{ flexShrink: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {children}
            {isDelta && <MaterialCommunityIcons
              name='delta'
              size={30}
              color={Colors.yellow}
              style={{ marginLeft: 10 }}
            />}
            {isLocked && <MaterialIcons
              name='lock-outline'
              size={30}
              color={Colors.white}
              style={{ marginTop: 10 }}
            />}
            {symbol}
          </View>
          {!!limit && <DefaultText style={styles.lineSpacing}>{`max ${limit} characters (${limit - value.length} remaining)`}</DefaultText>}
          {!!exact && <DefaultText style={styles.lineSpacing}>Must be {exact} characters {exact !== value.length ? `(missing ${exact - value.length})` : ''}</DefaultText>}
          {!!subtext && <DefaultText style={styles.lineSpacing}>{subtext}</DefaultText>}
        </View>
      </View>
    </View >
  )
}

const placeholderColor = Colors.white + 'DA'

const PortalSilentText = ({ value, placeholder }) => {
  return <View pointerEvents='none'>
    {/* Multiline distorts formatting, hence for consitency still using TextInput here */}
    <TextInput style={{ fontSize: 20, color: Colors.white }} multiline value={value} editable={false} placeholderTextColor={placeholderColor} placeholder={placeholder} />
  </View>
}


export function PortalTextField(props) {
  const {
    // REQUIRED
    value,
    // text

    // OPTIONAL
    onChangeText, // OR
    isLocked,
    onPress,
    backgroundColor,

    isRed,
    isRequired,
    format,
    limit,
    exact,
    max,
    min,
    afterCursor,
    isNumber,
    isNumberString,
    isIncremental,
    isNegativeAllowed,
    isNegativeVertical,
    ...textInputProps
    // subtext, isFailed 
  } = props
  const [isNegative, setIsNegative] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [selection, setSelection] = useState(undefined)
  const ref = useRef(null)
  const maxLength = limit || exact
  const isSubAllowed = min === undefined || value > min
  const isAddAllowed = max === undefined || value < max
  const valueLength = value.toString().length


  return (
    <PortalBaseField
      text={props.text}
      subtext={props.subtext}
      isFailed={props.isFailed}
      isLocked={props.isLocked}
      symbol={props.symbol}
      limit={limit}
      exact={exact}
      value={value}
      isDelta={props.isDelta}
    >
      <TouchableWithoutFeedback onPress={() => {
        ref.current.focus()
        if (onPress) onPress()
      }}>
        <View style={[styles.inputBox, {
          backgroundColor: backgroundColor ||
            (isRed || (isRequired && !value) || (min !== undefined && value < min) || (max !== undefined && value > max) || (exact && exact !== valueLength) ? Colors.red : isLocked ? undefined : Colors.darkgrey),
        }]}>
          {!!format && (
            <>
              <PortalSilentText value={format(value) || ''} />
              <View style={{ width: 3 }}>
                <Cursor cursorOn={isFocused} color={backgroundColor === Colors.purple || backgroundColor === Colors.red ? Colors.white : Colors.purple} />
                {!!afterCursor && <PortalSilentText value={afterCursor} />}
              </View>
              {!value && <PortalSilentText placeholder={textInputProps.placeholder || ''} />}
            </>
          )}
          <TextInput
            multiline
            autoFocus={props.autoFocus}
            selectTextOnFocus={props.selectTextOnFocus}
            ref={ref}
            style={{
              fontSize: 20, color: Colors.white,
              ...!!format && { width: 0, height: 0, color: Colors.background },
            }}
            editable={!isLocked}
            placeholderTextColor={placeholderColor}
            selection={selection}
            maxLength={maxLength}
            selectionColor={backgroundColor === Colors.purple || backgroundColor === Colors.red ? Colors.white : Colors.purple}
            onSelectionChange={() => {
              setSelection(undefined) // for some reason, selection stuck at cursor 0 onChangeText if not reset
            }}
            onChangeText={text => {
              if (isNumber || isIncremental) {
                if (text === '-') return onChangeText(0)
                if (!regexIsNumber(text)) return
                let num = Number(text)
                // if (min !== undefined && num < min) return cannot block min (otherwise cannot delete)
                if (max !== undefined && num > max) return

                // if (num < 0) setIsNegative(true)
                // if (num > 0) setIsNegative(false)
                onChangeText(isNegative !== (num < 0) ? -num : num)
              }
              else if (isNumberString) {
                onChangeText(text.replace(/\D/g, ''))
              }
              else {
                onChangeText(text)
              }
            }}
            onFocus={() => {
              setIsFocused(true)
              setTimeout(() => setSelection({ start: valueLength, end: valueLength }), 5)
            }}
            onBlur={() => setIsFocused(false)}
            {...(isNumber || isIncremental) && { keyboardType: 'number-pad' }}
            {...textInputProps}
            value={value.toString()}
          />
          {!format && !!afterCursor && <PortalSilentText value={afterCursor} />}
        </View>
      </TouchableWithoutFeedback>

      {isNegativeAllowed && <View style={{ marginLeft: 30 }}>
        <PortalCheckField
          value={isNegative}
          onPress={() => {
            setIsNegative(prev => !prev)
            onChangeText(prev => -1 * prev)
          }}
          text='Negative?'
        />
      </View>}

      {isIncremental && <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>

        <TouchableOpacity style={{ paddingHorizontal: 8 }} onPress={() => {
          if (isSubAllowed) {
            onChangeText(value - 1)
          }
        }}>
          <MaterialIcons
            name='remove-circle-outline'
            size={30}
            color={isSubAllowed ? Colors.white : Colors.darkgrey}
            disabled={!isSubAllowed}
          />
        </TouchableOpacity>

        <TouchableOpacity style={{ paddingHorizontal: 8 }} onPress={() => {
          if (isAddAllowed) {
            onChangeText(value + 1)
          }
        }}>
          <MaterialIcons
            name='add-circle-outline'
            size={30}
            color={isAddAllowed ? Colors.white : Colors.darkgrey}
            disabled={!isAddAllowed}
          />
        </TouchableOpacity>
      </View>}
    </PortalBaseField>
  )
}

export function PortalEnumField(props) {
  const {
    // REQUIRED
    value,
    options,
    // text

    // OPTIONAL
    setValue, // OR
    isLocked,
    isRequired,
    isRed,
    format,
    placeholder,
    // subtext, isFailed 
  } = props

  const onPress = useCallback(() => {
    setValue(prev => {
      const index = options.indexOf(prev)
      return options[(index + 1) % options.length]
    })
  }, [])
  return (
    <PortalBaseField
      text={props.text}
      subtext={props.subtext}
      isFailed={props.isFailed}
      isLocked={props.isLocked}
      isDelta={props.isDelta}
    >
      <TouchableOpacity disabled={isLocked} onPress={onPress}>
        <View style={[styles.inputBox, {
          backgroundColor: isRed || (isRequired && !value) ? Colors.red : isLocked ? undefined : Colors.darkgrey,
        }]}>
          <PortalSilentText value={format ? format(value) || '' : value} placeholder={placeholder} />
        </View>
      </TouchableOpacity>
    </PortalBaseField>
  )
}

export function PortalDropdownField(props) {
  const {
    // REQUIRED
    value,
    options,
    orderedKeys,
    // text

    // OPTIONAL
    noOptionText,
    setValue, // OR
    isLocked,
    isRequired,
    isRed,
    format,
    placeholder,
    // subtext, isFailed 
  } = props

  const [isOpen, setIsOpen] = useState(false)

  const toggleOpen = useCallback(option => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isOpen) {
      setValue(option)
      setIsOpen(false)
    }
    else {
      setIsOpen(true)
    }
  }, [isOpen])

  const trueValue = orderedKeys ? options[value] : value

  return <PortalBaseField
    text={props.text}
    subtext={props.subtext}
    isFailed={props.isFailed}
    isLocked={props.isLocked}
  >
    <View>

      <TouchableOpacity disabled={isLocked} onPress={() => toggleOpen(value)}>
        <View style={[styles.inputBox, {
          backgroundColor: isRed || (isRequired && (!value || !trueValue)) ? Colors.red : isLocked ? undefined : isOpen ? Colors.darkgreen : Colors.darkgrey,
        }]}>
          <MaterialIcons name='arrow-drop-down' size={30} color={Colors.white} style={{ marginLeft: -6, marginTop: 2 }} />
          <PortalSilentText value={
            trueValue ? format ? format(trueValue) || '' : trueValue :
              placeholder ? placeholder : noOptionText ? noOptionText : format(trueValue) || ''} />
        </View>
      </TouchableOpacity>


      <View style={{ height: isOpen ? undefined : 0, overflow: 'hidden' }}>
        {
          (orderedKeys || options).length === 1 && !noOptionText ?
            <MediumText>There is only one option for this question</MediumText>
            : (orderedKeys || options).map((option, index) => {
              const trueOption = orderedKeys ? options[option] : option
              return (
                <TouchableOpacity style={{
                  marginTop: 8,
                }} key={option} disabled={isLocked} onPress={() => toggleOpen(option)}>
                  <View style={[styles.inputBox, {
                    backgroundColor: Colors.darkgrey,
                  }]}>
                    <PortalSilentText value={format ? format(trueOption) || '' : trueOption} />
                  </View>
                </TouchableOpacity>
              )
            })
        }
        {
          !!noOptionText && <TouchableOpacity style={{
            marginTop: 8,
          }} disabled={isLocked} onPress={() => toggleOpen('')}>
            <View style={[styles.inputBox, {
              backgroundColor: Colors.darkgrey,
            }]}>
              <PortalSilentText value={noOptionText} />
            </View>
          </TouchableOpacity>
        }
      </View>
    </View>
  </PortalBaseField>

}

/*
const toggleTaxOptions = () => {
    setShowTaxOptions(prev => !prev)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

<View key={'tax'} style={{ flex: 1, marginHorizontal: Layout.window.width * 0.1, marginBottom: Layout.spacer.medium }}>
  <TouchableOpacity onPress={toggleTaxOptions} style={{ flexDirection: 'row' }}>
    <LargeText onLayout={({ nativeEvent }) => { setTaxTitleOffset(nativeEvent.layout.width) }} style={{ paddingRight: Layout.spacer.small }}>Item tax: </LargeText>
    {
      !!taxRates[taxRate] ?
        <LargeText>{taxRates[taxRate].percent}% ({taxRates[taxRate].name})</LargeText> :
        <LargeText style={{ fontWeight: 'bold', color: Colors.red }}>No tax applied</LargeText>
    }
    <ClarifyingText style={{ marginHorizontal: 20, color: Colors.lightgrey, lineHeight: 30, }}>(edit)</ClarifyingText>
  </TouchableOpacity>

  <View style={{ height: showTaxOptions ? undefined : 0, marginLeft: taxTitleOffset, marginVertical: showTaxOptions ? 12 : 0 }}>
    {Object.keys(taxRates).map(key => <TouchableOpacity key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => {
      setTaxRate(key)
      toggleTaxOptions()
    }}>
      {showTaxOptions && <RadioButton on={taxRate === key} />}
      <LargeText>{taxRates[key].percent}% ({taxRates[key].name})</LargeText>
    </TouchableOpacity>)}
  </View>

</View>
*/


export function PortalCheckField({
  value,
  text,
  subtext,
  onPress,
  isLocked,
  isDelta,
}) {
  return (
    <TouchableOpacity disabled={isLocked} onPress={onPress}>
      <View style={{ flexDirection: 'row', paddingVertical: 6, }}>
        <MaterialIcons
          name={value ? 'check-box' : 'check-box-outline-blank'}
          size={30}
          color={value ? Colors.purple : Colors.lightgrey}
          style={{ marginRight: 12 }}
        />
        <View style={{ marginTop: 2 }}>
          <LargeText>{text}</LargeText>
          {!!subtext && <DefaultText>{subtext}</DefaultText>}
        </View>
        {isDelta && <MaterialCommunityIcons
          name='delta'
          size={30}
          color={Colors.yellow}
          style={{ marginLeft: 10 }}
        />}
      </View>
    </TouchableOpacity>
  )
}

export function PortalBox({ onPress, backgroundColor, value }) {
  return <TouchableOpacity onPress={onPress}>
    <View style={[styles.inputBox, {
      backgroundColor,
    }]}>
      <PortalSilentText value={value} />
    </View>
  </TouchableOpacity>
}

const styles = StyleSheet.create({
  inputBox: {
    flexShrink: 1,
    flexDirection: 'row',
    minWidth: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 3,
      height: 2
    },
    shadowOpacity: 0.31,
    shadowRadius: 3.16,

    elevation: 20,
  },
  firstLineCorrection: {
    marginTop: 12
  },
  lineSpacing: {
    marginTop: 4
  }
});


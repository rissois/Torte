export const isTesting = false

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Button,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,

} from 'react-native';
import {
  TextInput,
  Modal,
} from 'react-native-web';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SerifText, SuperLargeText, } from '../utils/components/NewStyledText';
import { FontAwesome, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SafeView from '../utils/components/SafeView';
import StyledButton from '../utils/components/StyledButton';
import Colors from '../utils/constants/Colors';
import Layout from '../utils/constants/Layout';
import centsToDollar from '../utils/functions/centsToDollar';
import Cursor from '../utils/components/Cursor';

const INDEX = 0

export const testScreenNames = ['TestScreen', 'TestScreen2', 'TestScreen3', 'TestScreen4']

export function TestScreenNavigator({ index, title }) {
  const navigation = useNavigation()
  return <View>
    <LargeText center bold style={{ marginVertical: 20 }}>{title || `${testScreenNames[index]}`}</LargeText>
    <LargeText center>Go to screen:</LargeText>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', }}>
      {testScreenNames.map((name, i) => <TouchableOpacity disabled={index === i} style={{ marginHorizontal: 20, marginVertical: 10, backgroundColor: i === index ? Colors.darkgrey : Colors.purple, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }} onPress={() => navigation.navigate(name)}>
        <MediumText>{name}</MediumText>
      </TouchableOpacity>)}
    </View>
  </View>
}


export default function TestScreen({ navigation, route }) {
  const [value, setValue] = useState('Random name lets')
  const [price, setPrice] = useState(500)
  const [selection, setSelection] = useState({})
  const [visible, setVisible] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  return (
    <SafeView scroll>
      <Modal
        visible={visible}
        animationType="slide"
      >
        <View style={{ flex: 1, backgroundColor: 'red' }}>
          <TouchableOpacity onPress={() => setVisible(false)}>
            <View style={{ height: 50, width: 50, backgroundColor: isFocused ? 'yellow' : 'blue' }} />
          </TouchableOpacity>
          <View style={[styles.view, {}]}>
            <LargeText>Price: </LargeText>
            <View style={[styles.view2, {}]}>
              <TextInput
                style={[styles.textInput, {}]}
                value={centsToDollar(price)}
                onChangeText={text => {
                  const stripped = text.replace(/\D/g, '')
                  if (REGEX_IS_NUMBER.test(stripped)) setPrice(Number(stripped))
                }}
                // autoFocus={false}
                onSelectionChange={({ nativeEvent: { text, } }) => {
                  setSelection({ start: text.length })
                }}
                // selection={selection}
                {...isFocused && { selection: false }}
                // selection={isFocused && selection}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
      <TestScreenNavigator index={INDEX}
        title='Flex'
      />

      <TouchableOpacity onPress={() => setVisible(true)}>
        <View style={{ height: 50, width: 50, backgroundColor: 'green' }} />
      </TouchableOpacity>



      {/* <EditPrice value={price} setValue={setPrice} /> */}

      {/* <View style={styles.inputRow}>
        <LargeText >Price:</LargeText>
        {/* <View style={styles.textInput}>
        <TextInput
          multiline
          numberOfLines={1}
          style={styles.textInputText}
          value={subtotal}
          onChange={handleChange}
        />

         </View> */}
      {/* <TouchableWithoutFeedback onPress={() => priceRef?.current?.focus()}>
          <View style={[styles.textInput, { flexDirection: 'row', flex: 1, }]}>
            <LargeText bold>{centsToDollar(subtotal)}</LargeText>
            <View>
              <Cursor cursorOn={isPriceFocused} />
            </View>
          </View>
        </TouchableWithoutFeedback>
        <TextInput ref={priceRef} value={subtotal} style={{ width: 0, height: 0 }} onChangeText={setSubtotal} onFocus={() => setIsPriceFocused(true)} onBlur={() => setIsPriceFocused(false)} /> */}

    </SafeView>
  );
}

export const longString = 'This is just a long string that you can use to create a quick array. Just use a useMemo and split by the space, then you should be able to just console.log each word so you can take up an entire screen'

const EditGroup = ({ group = {
  name: 'item name',
  quantity: 1,
  subtotal: 500
}, numClaimed = 0 }) => {
  const [name, setName] = useState(group.name)
  const [quantity, setQuantity] = useState(group.quantity)
  const [subtotal, setSubtotal] = useState(priceToObject(group.subtotal))
  const [quantityWidth, setQuantityWidth] = useState(null)

  const claimedItemsAffected = useMemo(() => (subtotal / quantity) !== (group.subtotal / group.quantity) && numClaimed, [subtotal, quantity, group])

  return <View style={styles.overlay}>
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: Colors.background, marginHorizontal: Layout.window.width * 0.1, padding: 20 }}>
        <View style={[styles.inputRow, styles.rowMargin]} >
          <MediumText style={{ minWidth: quantityWidth }}>Name:</MediumText>
          <View style={[styles.textInput, { flex: 1, backgroundColor: name ? Colors.darkgrey : Colors.red }]}>
            <TextInput value={name} style={[styles.textInputText,]} onChangeText={setName} />
          </View>
        </View>

        <View style={[styles.inputRow, styles.rowMargin]}>
          <View onLayout={({ nativeEvent }) => setQuantityWidth(nativeEvent.layout.width)}>
            <MediumText>Quantity:</MediumText>
          </View>
          <View style={[styles.textInput, { flex: 1, backgroundColor: quantity.toString().length ? Colors.darkgrey : Colors.red }]}>
            <TextInput value={quantity} style={styles.textInputText} onChangeText={setQuantity} keyboardType='number-pad' />
          </View>
        </View>

        <View style={styles.rowMargin}>
          <View style={styles.inputRow}>
            <MediumText style={{ minWidth: quantityWidth }}>Price:</MediumText>
            <EditPrice {...subtotal} setValue={setSubtotal} />
          </View>

          <TouchableOpacity style={{ marginTop: 2, paddingVertical: 2, marginLeft: quantityWidth + 20 }} onPress={() => setSubtotal(prev => ({ ...prev, isNegative: !prev.isNegative }))}>
            <View style={styles.inputRow}>
              <MaterialIcons name={subtotal.isNegative ? 'check-box' : 'check-box-outline-blank'} size={25} color={subtotal.isNegative ? Colors.purple : Colors.lightgrey} />
              <SmallText style={{ marginLeft: 8 }}>Negative price? (e.g. discounts)</SmallText>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ marginVertical: 8 }}>
          <MediumText center bold>({subtotal.value % quantity ? '~' : ''}{centsToDollar(quantity ? Math.round(subtotal.value / quantity) : 0)} each)</MediumText>
          {!!claimedItemsAffected && <MediumText bold red style={{ marginTop: 8 }}>WARNING: This will reset splits on {claimedItemsAffected} items</MediumText>}
        </View>
      </View>
    </View>
  </View >
}

const REGEX_IS_NUMBER = /^-?[0-9]*$/
const EditPrice = ({ value, setValue, isNegative }) => {
  const isObject = typeof isNegative === 'boolean'
  const ref = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  const onChangeText = useCallback(text => {
    if (REGEX_IS_NUMBER.test(text)) setValue(prev => isObject ? ({ ...prev, value: Number(text) }) : Number(text))
  }, [])

  return <View style={{ marginHorizontal: 40, backgroundColor: Colors.darkgrey }}>
    <TouchableWithoutFeedback onPress={() => {
      ref?.current?.focus()
      setIsFocused(true)
    }}>
      <View style={[styles.textInput, { flexDirection: 'row', flex: 1, }]}>
        <ExtraLargeText bold>{centsToDollar(isNegative ? -value : value)}</ExtraLargeText>
        <View>
          <Cursor cursorOn={isFocused} />
        </View>
      </View>
    </TouchableWithoutFeedback>

    <TextInput
      ref={ref}
      keyboardType='number-pad'
      value={value.toString()}
      style={{ width: 0, height: 0 }}
      onChangeText={onChangeText}
      multiline
      numberOfLines={1}
      // onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      // On focus otherwise starts from beginning, not sure why
      selection={{ start: value.toString().length }}
    />

  </View>
}


const styles = StyleSheet.create({
  view: {
    flexDirection: 'row',
    marginVertical: 20,
  },
  view2: {
    marginLeft: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.darkgrey,
    borderRadius: 8,
  },
  textInput: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: 'bold',
  }
});


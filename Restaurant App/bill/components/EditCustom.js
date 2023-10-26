import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  UIManager,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, LargeText, } from '../../utils/components/NewStyledText';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import useCategoryChild from '../../portal/hooks/useCategoryChild';
import { EditLineItemBox } from './EditLineItemBox';
import StyledButton from '../../utils/components/StyledButton';
import { PortalTextField } from '../../portal/components/PortalFields';
import centsToDollar from '../../utils/functions/centsToDollar';
import Layout from '../../utils/constants/Layout';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';

// import { selectIsTableWithMultipleBills } from '../../redux/selectors/selectorsTableStatus';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// itemUpsells = reference setUpsells = selections
export const EditCustom = ({ custom = [], setCustom, setEditCustomIndex }) => {
  const dispatch = useDispatch()
  return <ScrollView style={{ marginVertical: 20 }} contentContainerStyle={{ marginHorizontal: 20 }}>
    {
      custom.map(({ name, price }, index) => <View key={index.toString()} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderColor: Colors.white, borderBottomWidth: 1, }}>
        <TouchableOpacity style={{ flex: 1, flexDirection: 'row' }} onPress={() => setEditCustomIndex(index)}>
          <View style={[styles.customBox, { flex: 1 }]}>
            <LargeText>{name}</LargeText>
          </View>
          <View style={styles.customBox}>
            <LargeText>{centsToDollar(price)}</LargeText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => dispatch(doAlertAdd(`Delete ${name} (${centsToDollar(price)})?`, undefined, [
          {
            text: 'Yes, delete',
            onPress: () => setCustom(prev => {
              const next = [...prev]
              next.splice(index, 1)
              return next
            })
          },
          {
            text: 'No, cancel',
          }
        ]))}>
          <MaterialCommunityIcons
            name='delete-forever'
            size={32}
            color={Colors.red}
            style={{ paddingHorizontal: 30, }}
          />
        </TouchableOpacity>
      </View>)
    }
    <StyledButton style={{ marginVertical: 40 }} center text='Add custom' onPress={() => setEditCustomIndex(custom.length)} />

  </ScrollView>
}


export const EditCustomPopUp = ({ custom, index, setCustom, setEditCustomIndex }) => {
  const { name: initialName = '', price: initialPrice = 0 } = custom[index] ?? {}
  const [name, setName] = useState(initialName)
  const [price, setPrice] = useState(initialPrice)

  return <KeyboardAvoidingView style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black + 'F1', }}>
    <View style={{ alignItems: 'center', borderColor: Colors.white, width: Layout.window.width * 0.6, borderWidth: 1, backgroundColor: Colors.background, padding: Layout.marHor }}>
      <ExtraLargeText center>{initialName ? 'Edit' : 'Add'} custom field</ExtraLargeText>
      <View style={{ height: 20 }} />
      <PortalTextField
        text='Name'
        value={name}
        placeholder='(name)'
        onChangeText={setName}
        isRequired
      />
      <View style={{ height: 12 }} />
      <PortalTextField
        text='Price'
        value={price}
        onChangeText={setPrice}
        isNumber
        format={centsToDollar}
        isNegativeAllowed
        isNegativeVertical
      />
      <View style={{ marginTop: 20, flexDirection: 'row' }}>
        <StyledButton text='Cancel' color={Colors.red} onPress={() => setEditCustomIndex(-1)} />
        <View style={{ width: 20 }} />
        <StyledButton
          disabled={!name}
          text={name ? 'CONFIRM' : "Missing name"}
          onPress={() => {
            setCustom(prev => {
              if (index > prev.length) return [...prev, { name, price }]
              let copy = [...prev]
              copy[index] = { name, price }
              return copy
            })
            setEditCustomIndex(-1)
          }} />
      </View>
    </View>
  </KeyboardAvoidingView>
}





// export const EditLineItemBox = ({ isPurple, text, onPress, isField, isDisabled }) => {
//   return <View style={[styles.editBoxContainer, { width: isField ? '20%' : '25%', }]}><TouchableOpacity disabled={isDisabled} style={[styles.editBox, { backgroundColor: isDisabled ? Colors.background : isPurple ? Colors.purple : Colors.darkgrey, borderColor: isDisabled ? Colors.darkgrey : Colors.white }]} onPress={onPress}>
//     <LargeText numberOfLines={2} ellipsizeMode='tail' center style={{ fontWeight: isField ? 'bold' : 'normal', color: isDisabled ? Colors.darkgrey : Colors.white }}>{text}</LargeText>
//   </TouchableOpacity>
//   </View>
// }

const styles = StyleSheet.create({
  customBox: {
    marginLeft: 12,
    backgroundColor: Colors.darkgrey,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
});


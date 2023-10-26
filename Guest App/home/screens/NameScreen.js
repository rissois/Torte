import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { ExtraLargeText, LargeText, MediumText, SmallText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import Header from '../../utils/components/Header';
import StyledButton from '../../utils/components/StyledButton';
import { useDispatch, useSelector } from 'react-redux';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { doc, getFirestore, setDoc } from "@firebase/firestore"
import { getAuth, updateProfile, signInAnonymously } from '@firebase/auth';
import firebaseApp from '../../firebase/firebase';
import TermsAndConditions from '../components/TermsAndConditions';
import { selectTempTableID, selectTempTableName, selectTempTableRestaurantID, selectTempTableRestaurantName } from '../../redux/selectors/selectorsTemp';
import { doUserSetName } from '../../redux/actions/actionsUser';
import SafeView from '../../utils/components/SafeView';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { MaterialIcons } from '@expo/vector-icons';

const auth = getAuth(firebaseApp)
const firestore = getFirestore(firebaseApp)

export default function NameScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useSelector(selectTempTableRestaurantID)
  const restaurant_name = useSelector(selectTempTableRestaurantName)
  const table_name = useSelector(selectTempTableName)
  const table_id = useSelector(selectTempTableID)
  const [isSettingName, setIsSettingName] = useState(false)
  const [isNameFailed, setIsNameFailed] = useState(false)
  const [name, setName] = useState('')
  const [isEulaAgreed, setIsEulaAgreed] = useState(false)
  const { bill_id, receipt_id, isNewReceipt } = route.params ?? {}

  const initName = async () => {
    // if (name.split(' ').length < 2) return dispatch(doAlertAdd(
    //   'First and last name needed',
    //   'Please make sure to have a first and last name separated by a space.'
    // ))

    setIsSettingName(true)

    try {
      setIsNameFailed(false)

      const userCredential = await signInAnonymously(auth)

      await Promise.all([
        setDoc(doc(firestore, 'UsersPOS', userCredential.user.uid), {
          id: userCredential.user.uid,
          is_anonymous: true,
          name,
          torte: {
            open_bills: [], // must create this here or else racing against bill creation
          },
        }, { merge: true }), // not strictly necessary
        // not strictly necessary
        updateProfile(userCredential.user, {
          displayName: name
        }),
      ])

      dispatch(doUserSetName(name))

      if (isNewReceipt) navigation.navigate('OCR', { isNamed: true })
      else navigation.replace('Link', { restaurant_id, bill_id, receipt_id, table_id, name, scan: true, })
    }
    catch (error) {
      console.log('NameScreen error: ', error)
      setIsSettingName(false)
      setIsNameFailed(true)
    }
  }

  return <SafeView>
    <Header back>
      <LargeText center>{restaurant_id ? restaurant_name : 'Join receipt'}</LargeText>
    </Header>
    {!!table_name && <MediumText center>{table_name}</MediumText>}

    <View style={{ marginHorizontal: Layout.window.width * 0.2 }}>
      <ExtraLargeText center red style={{ opacity: isNameFailed ? 1 : 0 }}>ERROR SAVING NAME</ExtraLargeText>
      <LargeText>Enter your name</LargeText>
      <View style={{ marginVertical: 8, paddingBottom: 2, borderColor: Colors.white, borderBottomWidth: 1 }}>
        <TextInput
          style={{
            color: Colors.white,
            fontSize: 24,
            flex: 1,
          }}
          autoCapitalize='words'
          onChangeText={setName}
          value={name}
        />
      </View>
      {!!restaurant_id && <SmallText>(your name will identify you to the restaurant and the rest of your table)</SmallText>}

    </View>

    <View style={{ paddingTop: 20, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity style={{ marginRight: 4 }} onPress={() => setIsEulaAgreed(prev => !prev)}>
          <MaterialIcons
            name={isEulaAgreed ? 'check-box' : 'check-box-outline-blank'}
            color={isEulaAgreed ? Colors.purple : Colors.white}
            size={24}
            style={{ padding: 4 }}
          />
        </TouchableOpacity>
        <TermsAndConditions />
      </View>
      <StyledButton disabled={!name || !isEulaAgreed} center text={!name ? 'ENTER NAME' : !isEulaAgreed ? 'Agree to Terms' : 'SAVE NAME'} onPress={initName} />
    </View>

    {isSettingName && <IndicatorOverlay text='Saving name' />}
  </SafeView>
}


const styles = StyleSheet.create({

});
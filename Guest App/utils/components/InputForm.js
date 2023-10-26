import React from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

import Colors from '../constants/Colors';
import BackIcon from './BackIcon';
import Header from './Header';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { DefaultText, MediumText, LargeText } from './NewStyledText';
import CenteredScrollView from './CenteredScrollView';
import Layout from '../constants/Layout';

export default function InputForm({ header = '', subheader, inputs = [], close = () => { }, success = () => { } }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : undefined} style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 0,
      left: 0,
      zIndex: 99,
      backgroundColor: Colors.black + 'EA',
      paddingHorizontal: Layout.marHor,
    }}>
      <CenteredScrollView main={<View style={{ backgroundColor: Colors.background, paddingVertical: 12 }}>
        <Header left={<BackIcon name='close' backFn={close} />}>
          <MediumText center>{header}</MediumText>
        </Header>

        <View style={{ paddingHorizontal: 30 }}>
          {!!subheader && <DefaultText center>{subheader}</DefaultText>}

          {
            inputs.map(({ prompt, placeholder = '', text, setText, autoFocus }) => <View key={prompt}>
              <MediumText >{prompt}</MediumText>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={{ color: Colors.white, size: 20, }}
                  autoFocus={autoFocus}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.lightgrey}
                  onChangeText={setText}
                  value={text}
                />
              </View>
            </View>)
          }

        </View>
        <View style={{ flexDirection: 'row', marginVertical: 12, justifyContent: 'space-evenly' }}>
          <TouchableOpacity onPress={success}>
            <MediumText style={{ color: Colors.green }}>CONFIRM</MediumText>
          </TouchableOpacity>
          <TouchableOpacity onPress={close}>
            <MediumText red>cancel</MediumText>
          </TouchableOpacity>
        </View>
      </View>} />
    </KeyboardAvoidingView>
  )
}


const styles = StyleSheet.create({
  textInputContainer: {
    marginTop: 10,
    marginBottom: 12,
    borderBottomColor: Colors.white,
    borderBottomWidth: 1,

  }
});


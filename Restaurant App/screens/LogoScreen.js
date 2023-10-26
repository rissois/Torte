import React from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { MainText, } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSelector, } from 'react-redux';

import ImageUploader from '../components/ImageUploader';


if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}



/*
  LOGO ERRORS
  UPLOAD FAILED

  RETRIEVAL FAILED
  DELETE FAILED
*/


export default function LogoScreen({ navigation, route }) {
  const { logo = {} } = useSelector(state => state.photos)
  let { upload = {} } = logo

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader showLogo leftText='Back' leftFn={() => { navigation.goBack() }} {...!route?.params?.review && { rightText: '4/5' }} />

        <DisablingScrollView center >


          <ImageUploader item_id={'logo'} {...logo} />

          <MainText style={{ textAlign: 'center', marginVertical: Layout.spacer.large }}>- or -</MainText>

          <View style={{ alignSelf: 'center', marginBottom: Layout.spacer.large }}>
            <MenuButton {...(upload?.blobbing || upload?.upload_task) && { disabled: true, color: Colors.darkgrey }} text={route?.params?.review ? 'Save' : 'Continue'} minWidth buttonFn={async () => {
              if (route?.params?.review) {
                navigation.push('Review')
              }
              else {
                navigation.navigate('Hours')
              }
            }} />
          </View>
        </DisablingScrollView>

      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
});

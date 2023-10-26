import React, { } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';
import PortalGroup from '../components/PortalGroup';
import PortalForm from '../components/PortalForm';
import { LargeText } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import Layout from '../../utils/constants/Layout';



export default function SupportScreen({ navigation, route }) {
  return (
    <SafeView>
      <Header back>
        <LargeText center>Contact Torte Support</LargeText>
      </Header>
      <View style={{ marginHorizontal: Layout.marHor, paddingTop: 50 }}>
        <PortalGroup text='Contact us' >
          <LargeText style={{ marginVertical: 10 }}>Call: (248) 891-4781</LargeText>
          <LargeText style={{ marginVertical: 10 }}>Email: support@tortepay.com</LargeText>
        </PortalGroup>
      </View>
    </SafeView>
  )
}

const styles = StyleSheet.create({

});


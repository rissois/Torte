import React, { useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function TestingScreen(props) {

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <View style={{ flex: 1 }}>
          <MenuHeader showLogo leftText='Log In' leftFn={() => { }} />
          <HeaderText style={{ marginTop: 24, textAlign: 'center' }}>Welcome to Torte</HeaderText>
        </View>
        <MainText style={{ textAlign: 'center' }}>Let’s start by registering</MainText>
        <MainText style={{ textAlign: 'center' }}>your restaurant</MainText>
        <MenuButton style={{ marginTop: Layout.spacer.medium }} text='Get started' minWidth />
        <View style={{ flex: 1, }} />
      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
});

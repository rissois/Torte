import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import BoxGenerator from '../components/BoxGenerator';

const rows = {
  single: 'Single row',
  double: 'Double row',
  large: 'Large',
}

export default function PhotoAdScreen1({ navigation, route }) {
  const [labelWidth, setLabelWidth] = useState(null)
  const [selectedRow, setSelectedRow] = useState('')



  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} />

        <DisablingScrollView center keyboardShouldPersistTaps='always' contentContainerStyle={{ marginHorizontal: Layout.window.width * 0.1 }}>
          <LargeText center>What style of photo ad?</LargeText>
          <ClarifyingText center>(there are more variations than the examples shown)</ClarifyingText>
          <View style={{ marginVertical: Layout.spacer.medium }}>
            <TouchableOpacity onPress={() => setSelectedRow(rows.single)}>
              <View style={[styles.rowOptions, { borderColor: selectedRow === rows.single ? Colors.purple : Colors.background, }]}>
                <MainText style={{ width: labelWidth }}>Single row</MainText>
                <BoxGenerator top={[1, 1, 1]} />
                <BoxGenerator top={[1, 2]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelectedRow(rows.double)}>
              <View style={[styles.rowOptions, { borderColor: selectedRow === rows.double ? Colors.purple : Colors.background, }]}>
                <MainText onLayout={({ nativeEvent }) => setLabelWidth(nativeEvent.layout.width)} style={{ width: labelWidth }}>Double row</MainText>
                <BoxGenerator top={[1, 1, 1]} bottom={[1, 1, 1]} />
                <BoxGenerator top={[2, 1]} bottom={[1, 2]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelectedRow(rows.large)}>
              <View style={[styles.rowOptions, { borderColor: selectedRow === rows.large ? Colors.purple : Colors.background, }]}>
                <MainText style={{ width: labelWidth }}>Large</MainText>
                <BoxGenerator right bottom={[1]} top={[1]} />
                <BoxGenerator large />
              </View>
            </TouchableOpacity>
          </View>


          <View style={{ marginBottom: Layout.spacer.large }}>
            <MenuButton text='Next' disabled={!selectedRow} color={selectedRow ? Colors.purple : Colors.darkgrey} buttonFn={() => { navigation.navigate('PhotoAd2', { rowType: selectedRow }) }} />
          </View>

        </DisablingScrollView>

      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  rowOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginVertical: Layout.spacer.small,
    padding: 20,
    borderWidth: 5
  }
})

import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  PixelRatio,
  Platform,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Animated,
  PanResponder,
} from 'react-native';
import firebase from '../config/Firebase';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { ClarifyingText, HeaderText, LargeText, MainText, } from '../components/PortalText'

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlatList, LongPressGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
// import EscPosPrinter, { getPrinterSeriesByName } from 'react-native-esc-pos-printer';

export default function TestingScreen(props) {

  async function testPrint() {
    try {
      // const printers = await EscPosPrinter.discovery()
      // console.log(printers)

      // const printer = printers[0]

      // await EscPosPrinter.init({
      //   target: printer.target,
      //   seriesName: getPrinterSeriesByName(printer.name),
      //   language: 'EPOS2_LANG_EN',
      // })

      // const printing = new EscPosPrinter.printing();

      // const status = await printing
      //   .initialize()
      //   .align('center')
      //   .size(3, 3)
      //   .line('DUDE!')
      //   .smooth()
      //   .line('DUDE!')
      //   .smooth()                
      //   .size(1, 1)
      //   .text('is that a ')
      //   .bold()
      //   .underline()
      //   .text('printer?')
      //   .bold()
      //   .underline()
      //   .newline(2)
      //   .align('center')
      //   .image(image, 200)
      //   .barcode({
      //     value:'Test123',
      //     type:'EPOS2_BARCODE_CODE93',
      //     hri:'EPOS2_HRI_BELOW',
      //     width:2,
      //     height:50,
      //   })
      //   .qrcode({
      //     value: 'Test123',
      //     level: 'EPOS2_LEVEL_M',
      //     width: 5,
      //   })
      //   .cut()
      //   .send()

      //   console.log('Success:', status)

    } catch (e) {
      console.log('Error:', status)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <LargeText>Hi</LargeText>
      <TouchableOpacity onPress={() => {
        testPrint()
      }}>
        <LargeText>touch here to try printing</LargeText>
      </TouchableOpacity>
    </View >
  );
}

const styles = StyleSheet.create({
  box: {
    zIndex: 2,
    position: 'absolute',
    backgroundColor: Colors.black,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 1,
    shadowRadius: 9.51,

    elevation: 15,
  },
  servers: {
    paddingVertical: 24,
    marginVertical: 10,
    marginHorizontal: 20,
    backgroundColor: Colors.background
  },
  sections: {
    paddingVertical: 24,
    marginVertical: 10,
    marginHorizontal: 20,
    backgroundColor: Colors.darkgrey
  }
});
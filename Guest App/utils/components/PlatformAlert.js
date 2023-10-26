import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,

} from 'react-native';
import {
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import CenteredScrollView from './CenteredScrollView';


export default function PlatformAlert({ header, text, options, dismiss, isHeaderRed, isRowOfOptions, clearAlert = () => { } }) {

  const message = useMemo(() => (<View style={[styles.viewShading, { padding: 20, }]}>
    {!!header && <Text style={[styles.headerText, isHeaderRed && { color: Colors.red }]}>{header}</Text>}
    {!text ? null : typeof text === 'string' ?
      <Text style={styles.mainText}>{text}</Text> :
      text.map((line, index) => <Text key={index.toString()} style={styles.mainText}>{line}</Text>)
    }
    {!options?.length && <TouchableOpacity onPress={() => {
      if (dismiss) dismiss()
      clearAlert()
    }}>
      <Text style={styles.okText}>OK</Text>
    </TouchableOpacity>}
  </View>), [header, text, isHeaderRed, options])

  const touchables = useMemo(() => {
    if (!options?.length) return null
    return <View style={{ marginTop: 20, ...isRowOfOptions && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' } }}>
      {options.map(({ text, onPress = () => { }, isBold }) => <TouchableOpacity key={text} onPress={() => {
        onPress()
        clearAlert()
      }} style={[styles.viewShading, styles.optionView, isRowOfOptions && { width: Layout.window.width * 0.38 }]}>
        <Text style={[styles.mainText, isBold && styles.boldOption, isRowOfOptions && { textAlign: 'center' }]}>{text}</Text>
      </TouchableOpacity>)}
    </View>
  }, [options])

  return <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 50 }}>
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.black + 'EA', }}
    >
      <TouchableWithoutFeedback disabled={!dismiss && options?.length} style={{ flex: 1 }} containerStyle={{ flex: 1 }} onPress={() => {
        if (dismiss && dismiss !== true) dismiss()
        clearAlert()
      }}>
        <View style={{ flex: 1, margin: Layout.window.width * 0.10, }}>
          <CenteredScrollView main={message} secondary={touchables} />
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  </View>
}


const styles = StyleSheet.create({
  viewShading: {
    backgroundColor: Colors.darkgrey,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.44,
    shadowRadius: 6.27,

    elevation: 10,
  },
  headerText: {
    fontVariant: ['small-caps'],
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 24,
  },
  mainText: {
    color: Colors.white,
    fontSize: 17,
    marginTop: 6,
  },
  okText: {
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'right',
    marginTop: 10,
    marginRight: 20,
    color: Colors.green
  },
  optionView: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 50,
    marginTop: 10,
    justifyContent: 'center',
  },
  boldOption: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    // fontVariant: ['small-caps'],
  }
});


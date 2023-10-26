import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { MaterialIcons } from '@expo/vector-icons';


export default function Alert(props) {
  let { header = 'WARNING', subheader = [], options = [], clearAlert = () => { } } = props

  let subArray = typeof subheader === 'string' ? [subheader] : subheader

  return (

    <SafeAreaView style={[Layout.modal]}>
      <TouchableWithoutFeedback onPress={() => { clearAlert() }}>
        <View style={{ flex: 1 }} />
      </TouchableWithoutFeedback>


      <View>
        <TouchableWithoutFeedback onPress={() => { clearAlert() }}>
          <View style={styles.alertContainer}>
            <View style={styles.alertMain}>
              <View style={styles.alertIcon}>
                <MaterialIcons
                  name="warning"
                  size={50}
                  color={Colors.red}
                />
              </View>

              <View style={styles.alertHeader}>
                <Text maxFontSizeMultiplier={1.5} style={styles.alertHeaderText}>{header}</Text>
              </View>

              <View style={styles.alertIcon}>
                <MaterialIcons
                  name="warning"
                  size={50}
                  color={Colors.red}
                />
              </View>
            </View>

            <View style={styles.alertSubheader}>
              {subArray.map((sub, index) => <Text key={index} maxFontSizeMultiplier={1.7} style={styles.alertSubheaderText}>{sub}</Text>)}
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* <View style={styles.optionsContainer}> */}
        {
          options.map(({ text, callback, bold = false }, index) => {
            return < View style={styles.optionsContainer} key={index} >
              <TouchableOpacity onPress={() => {
                callback()
              }}>
                <View style={styles.optionsItem}>
                  <Text maxFontSizeMultiplier={1.7} style={[
                    styles.optionsItemText,
                    { fontWeight: bold ? Layout.fontWeight.black : Layout.fontWeight.medium }
                  ]}>{text}</Text>
                </View>
              </TouchableOpacity>
            </View>
          })
        }
        {/* </View> */}
      </View>

      <TouchableWithoutFeedback onPress={() => { clearAlert() }}>
        <View style={{ flex: 1 }} />
      </TouchableWithoutFeedback>
    </SafeAreaView >
  )
}

const styles = StyleSheet.create({
  alertContainer: {
    backgroundColor: Colors.white,
    width: Layout.window.width * 0.8,
    borderRadius: 15,
    alignSelf: 'center',
    padding: 16,
  },
  alertMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    // alignItems: 'center',
  },
  alertHeader: {
    flex: 1,
    alignItems: 'center',
  },
  alertHeaderText: {
    fontSize: 40,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.red,
    marginHorizontal: 12,
    textAlign: 'center',
  },
  alertSubheader: {
    // alignItems: 'center',
  },
  alertSubheaderText: {
    marginTop: 12,
    color: Colors.black,
    fontSize: 30,
    fontWeight: Layout.fontWeight.regular,
    textAlign: 'center',
  },
  alertTextBody: {
    color: Colors.black,
    fontSize: 14,
    fontWeight: Layout.fontWeight.regular,
    textAlign: 'center',
  },
  optionsContainer: {
    backgroundColor: Colors.white,
    width: Layout.window.width * 0.8,
    borderRadius: 15,
    alignSelf: 'center',
    marginTop: 14
  },
  optionsItem: {
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  optionsItemText: {
    color: Colors.black,
    fontSize: 24,
    fontWeight: Layout.fontWeight.medium,
  },
});


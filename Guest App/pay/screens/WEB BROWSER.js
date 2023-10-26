import React, { useState } from 'react';
import { Button, Text, View, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Colors from '../../utils/constants/Colors';

export default function TestScreen() {
  const [result, setResult] = useState(null);

  const _handlePressButtonAsync = async () => {
    let result = await WebBrowser.openBrowserAsync('https://expo.dev');
    setResult(result);
  };
  return (
    <View style={styles.container}>
      <Button title="Open WebBrowser" onPress={_handlePressButtonAsync} />
      <Text>{result && JSON.stringify(result)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
  }
});
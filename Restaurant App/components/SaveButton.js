import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Colors from '../constants/Colors'
import MenuButton from '../components/MenuButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function SaveButton(props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={{
      position: 'absolute',
      right: 12,
      bottom: insets.bottom + 12,

    }}>
      <MenuButton text='Save' color={Colors.darkgreen} minWidth={false} />
    </View>
  );
}

const styles = StyleSheet.create({
});

import React from 'react';
import {
  StyleSheet,
} from 'react-native';

import Colors from '../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

export default function BackIcon(props) {
  const navigation = useNavigation();

  return <TouchableOpacity disabled={props.hidden} onPress={props.backFn || navigation.goBack} style={{ ...props.style }}>
    <MaterialIcons
      name={props.name || "arrow-back"}
      size={props.iconSize || 30}
      color={Colors.white}
      style={{ opacity: props.hidden ? 0 : 1 }}
    />
  </TouchableOpacity>
}

const styles = StyleSheet.create({

});


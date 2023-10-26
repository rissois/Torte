import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MediumText } from '../../utils/components/NewStyledText';
import { useSelector } from 'react-redux';
import { selectTable } from '../../redux/selectors/selectorsTables';
import Colors from '../../utils/constants/Colors';
import { LargeText } from '../../utils/components/NewStyledText';
import plurarize from '../../utils/functions/plurarize';
import { selectNumberSoldOutItems, selectNumberSoldOutOptions } from '../../redux/selectors/selectorsSoldOut';

export default function SoldOutButton({ setIsSoldOutOpen }) {
  const numberSoldOutItems = useSelector(selectNumberSoldOutItems)
  const numberSoldOutOptions = useSelector(selectNumberSoldOutOptions)

  return (
    <TouchableOpacity onPress={() => setIsSoldOutOpen(prev => !prev)}>
      <View style={styles.manageButton}>
        <LargeText bold style={{ color: Colors.purple }}>{numberSoldOutItems + numberSoldOutOptions} SOLD OUT</LargeText>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  manageButton: {
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    marginTop: 4,
    borderWidth: 2,
    borderColor: Colors.white
  }
});


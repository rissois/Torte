import React, { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import Layout from '../../utils/constants/Layout';
import Colors from '../../utils/constants/Colors';
import { PortalRowSelectable } from './PortalRow';
import StyledButton from '../../utils/components/StyledButton';
import { LinearGradient } from 'expo-linear-gradient';
import { ExtraLargeText } from '../../utils/components/NewStyledText';
import singularize from '../../utils/functions/singularize';
import BackIcon from '../../utils/components/BackIcon';
import { useNavigation } from '@react-navigation/native';
import capitalize from '../../utils/functions/capitalize';


export default function PortalItemOrOption({ category, showChildSelector, navigationParams, setShowChildSelector, setShowChildCategory }) {
  const navigation = useNavigation()
  const [singularCategory] = useState(singularize(category))

  const handleButton = useCallback((subcategory) => {
    setShowChildSelector('')
    if (showChildSelector === 'new') {
      navigation.navigate(capitalize(subcategory), navigationParams)
    }
    else {
      setShowChildCategory(subcategory)
    }

  }, [navigationParams, showChildSelector])

  return <View style={[StyleSheet.absoluteFill, styles.absolute]}>
    <View style={styles.popup}>
      <BackIcon name='close' backFn={() => setShowChildSelector('')} />
      <View style={{ marginTop: 20, marginBottom: 40 }}>
        <ExtraLargeText center>Should this {showChildSelector} {singularCategory} be an OPTION or an ITEM?</ExtraLargeText>
      </View>

      <View style={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-evenly' }}>
        <StyledButton text='Option' onPress={() => {
          handleButton('options')
        }} />
        <StyledButton text='Item' onPress={() => {
          handleButton('items')
        }} />

      </View>
    </View>
  </View>
}

const styles = StyleSheet.create({
  absolute: {
    flex: 1,
    backgroundColor: Colors.black + 'F1',
    justifyContent: 'center',
  },
  popup: {
    backgroundColor: Colors.background,
    margin: Layout.marHor * 2,
    padding: 40,
  },
});


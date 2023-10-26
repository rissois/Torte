import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import SafeView from '../../utils/components/SafeView';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SuperLargeText } from '../../utils/components/NewStyledText';
import Header from '../../utils/components/Header';
import capitalize from '../../utils/functions/capitalize';
import { useNavigation } from '@react-navigation/native';

import { initialFilters as filterNames } from '../../redux/selectors/selectorsBillItems';


export default function FiltersScreen({ navigation, route }) {
  const flatListRef = useRef(null)

  useEffect(() => {
    const start = route.params?.start
    if (start) {
      flatListRef.current.scrollToIndex(Object.keys(filterNames).indexOf(start))
    }
  }, [])

  return (
    <SafeView>
      <Header back>
        <ExtraLargeText center>Dietary filters</ExtraLargeText>
      </Header>

      <FlatList
        ref={flatListRef}
        data={Object.keys(filterNames)}
        keyExtractor={item => item}
        renderItem={({ item }) => <Filter filter={item} />}
      />

    </SafeView>
  )
  // https://www.foodallergy.org/resources/facts-and-statistics
}


const Filter = ({ filter }) => {

  return <View>
    <ExtraLargeText>{filterNames[filter].name}</ExtraLargeText>

  </View>
}


const styles = StyleSheet.create({

});


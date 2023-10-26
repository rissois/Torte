import React, { useCallback, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { PortalBox, PortalTextField } from './PortalFields';
import Colors from '../../utils/constants/Colors';
import { useNavigation } from '@react-navigation/native';
import centsToDollar from '../../utils/functions/centsToDollar';

import { LargeText, } from '../../utils/components/NewStyledText';
import Layout from '../../utils/constants/Layout';
import { initialFilters as filterNames } from '../../redux/selectors/selectorsBillItems';
import { MaterialCommunityIcons, } from '@expo/vector-icons';


export default function ItemFilters({ filters, setFilters, isVariant, rootFilters = {} }) {
  const [filterNameWidth, setFilterNameWidth] = useState(null)
  return <View style={{ marginVertical: 10 }}>
    <LargeText center style={{ marginHorizontal: Layout.marHor, marginBottom: 10 }}>Select the rightmost option if the item can be specially prepared for that diet. You can add a charge for this as well.</LargeText>
    {
      Object.keys(filterNames).map((filter, index) => <FilterRow index={index} filterNameWidth={filterNameWidth} setFilterNameWidth={setFilterNameWidth} name={filterNames[filter]?.name} value={filters[filter]} setFilters={setFilters} filter={filter} key={filter} isVariant={isVariant} rootFilter={rootFilters[filter]} />)
    }
  </View>
}

function FilterRow({ name, value, setFilters, filter, filterNameWidth, setFilterNameWidth, index, isVariant, rootFilter }) {
  const navigation = useNavigation()
  const isAlways = value === true
  const isNever = value === false
  const isMod = !isAlways && !isNever

  const [price, setPrice] = useState(isMod ? value : 0)

  const changePrice = useCallback((price) => {
    setPrice(price)
    setFilters(prev => ({ ...prev, [filter]: price }))
  }, [filter])

  return <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: index % 2 ? Colors.background : Colors.blue + '25',
    paddingHorizontal: 20,
    paddingTop: 8,
  }}>
    <TouchableOpacity disabled onPress={() => navigation.navigate('Filters')}>
      <View onLayout={({ nativeEvent }) => {
        const width = nativeEvent.layout.width
        setFilterNameWidth(prev => prev > width ? prev : width)
      }}
        style={{ width: filterNameWidth, flexDirection: 'row' }}
      >
        <LargeText>{name}</LargeText>
        {/* <MaterialCommunityIcons
          name='information-outline'
          size={24}
          color={Colors.lightgrey}
          style={{ marginLeft: 8, marginTop: -4 }}
        /> */}
      </View>
    </TouchableOpacity>

    <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-evenly' }}>
      <PortalBox
        value='ALWAYS'
        backgroundColor={isAlways ? Colors.darkgreen : Colors.darkgrey}
        onPress={() => {
          Keyboard.dismiss()
          setFilters(prev => ({ ...prev, [filter]: true }))
        }}
      />

      <PortalBox
        value='NEVER'
        backgroundColor={isNever ? Colors.red : Colors.darkgrey}
        onPress={() => {
          Keyboard.dismiss()
          setFilters(prev => ({ ...prev, [filter]: false }))
        }}
      />

      <PortalTextField
        value={price}
        onChangeText={changePrice}
        isNumber
        format={centsToDollar}
        backgroundColor={isMod ? Colors.purple : Colors.darkgrey}
        onPress={() => setFilters(prev => ({ ...prev, [filter]: price }))}
      />

      {isVariant && value !== rootFilter && <View style={{ position: 'absolute', right: 0, top: 0, bottom: 5, justifyContent: 'center' }}>
        <MaterialCommunityIcons
          name='delta'
          size={30}
          color={Colors.yellow}
        />
      </View>}
    </View>
  </View>
}

const styles = StyleSheet.create({

});


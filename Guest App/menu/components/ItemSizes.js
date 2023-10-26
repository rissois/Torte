import React, { } from 'react';
import {
  StyleSheet,
  View,
  Animated
} from 'react-native';
import { ItemOption2 } from './ItemOption2';
import { useDispatch, } from 'react-redux';
import { doSelectionsSizeToggle, } from '../../redux/actions/actionsSelections';
import { appendPriceToName } from '../functions/appendPriceToName';
import Colors from '../../utils/constants/Colors';


export default function ItemSizes({ sizes, animateRed, selectedSize }) {
  const dispatch = useDispatch()

  const toggleSizeSelection = (size) => dispatch(doSelectionsSizeToggle(size))

  return (
    <Animated.View style={{
      marginTop: 10, borderRadius: 6, backgroundColor: selectedSize ? Colors.darkgrey : animateRed.current.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.darkgrey, Colors.red]
      }),
    }}>
      <View style={{ marginLeft: 6 }}>
        {
          sizes.map(size => {
            const isSelected = selectedSize?.name === size.name && selectedSize?.price === size.price
            return <ItemOption2
              key={size.name + size.price}
              onToggle={() => toggleSizeSelection(size)}
              isSelected={isSelected}
              text={appendPriceToName(size.name, size.price, false)}
            />
          })
        }
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({

});


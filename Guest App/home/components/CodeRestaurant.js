import React, { useCallback, useRef } from 'react';
import {
  View,
  Platform,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { DefaultText, LargeText, } from '../../utils/components/NewStyledText';
import CodeRestaurantInput from './CodeRestaurantInput';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function CodeRestaurant({
  isRestaurantPreexisting,
  restaurant,
  setRestaurant,
  isTable,
  isFetchingTable,
  tableRef,
}) {

  const restaurantRef = useRef(null)

  const changeRestaurant = useCallback((r) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRestaurant(r)
    tableRef?.current?.focus()
  }, [])

  const resetRestaurant = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    restaurantRef?.current?.focus()
    setRestaurant(null)
  }, [])

  // Necessary to keep in view for animation?
  return (
    <View>
      {
        restaurant
          ? <View>
            <LargeText center>{restaurant.name}</LargeText>
            {!isTable && (
              <View>
                {!!restaurant?.address?.line1 && <DefaultText center>{restaurant?.address?.line1}</DefaultText>}
                <DefaultText center>{restaurant?.address?.city}, {restaurant?.address?.state}</DefaultText>
                {!isRestaurantPreexisting && (
                  <TouchableOpacity disabled={isFetchingTable} onPress={resetRestaurant}>
                    <DefaultText center style={{ color: isFetchingTable ? Colors.darkgrey : Colors.red }}>(change restaurant)</DefaultText>
                  </TouchableOpacity>
                )}
              </View>
            )
            }
          </View>
          : <CodeRestaurantInput
            restaurantRef={restaurantRef}
            changeRestaurant={changeRestaurant}
          />
      }
    </View>
  )

}
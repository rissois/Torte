import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { useDispatch, useSelector } from 'react-redux';
import { DefaultText, ExtraLargeText, ExtraSmallText, LargeText, SmallText, SuperLargeText, } from '../../utils/components/NewStyledText';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import Layout from '../../utils/constants/Layout';
import { doTrackersSet } from '../../redux/actions/actionsTrackers';
import { doPhotoDownloadByMenu } from '../../redux/actions/actionsRestaurantPhotos';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { fullDays } from '../../utils/constants/DOTW';
import { selectTrackedDotwID, selectTrackedMealID, selectTrackedMenuID, selectTrackedPeriodID } from '../../redux/selectors/selectorsTrackers';
import { useIsMenuOnly } from '../../utils/hooks/useBill';
import { selectIsRestaurantLoading } from '../../redux/selectors/selectorsListeners';
import { selectMenusOverview } from '../../redux/selectors/selectorsMenusOverview';
import { militaryToClock } from '../../utils/functions/dateAndTime';

const MENU_VERTICAL_PADDING = 10
const MINUTE = 60000


export default function MenuChangerDrawer({ isChangerOpen, sectionListRef, closeChangerDrawer }) {
  const dispatch = useDispatch()

  const isMenuOnly = useIsMenuOnly()


  const [day, setDay] = useState((new Date()).getDay()) // Could use trackers.dotw_id...
  const [mealRefresh, setMealRefresh] = useState(Date.now())

  const selectMeals = useMemo(() => selectMenusOverview, [])
  const meals = useSelector(selectMeals(day, mealRefresh))

  const isRestaurantLoading = useSelector(selectIsRestaurantLoading)
  const currentDotwID = useSelector(selectTrackedDotwID)
  const currentPeriodID = useSelector(selectTrackedPeriodID)
  const currentMealID = useSelector(selectTrackedMealID)
  const currentMenuID = useSelector(selectTrackedMenuID)

  const dayFlatListRef = useRef(null)

  useEffect(() => {
    dayFlatListRef?.current?.scrollToIndex({ index: day, viewPosition: 0.5 })
  }, [day])

  useEffect(() => {
    setTimeout(() => {
      dayFlatListRef?.current?.scrollToIndex({ index: day, viewPosition: 0.5 })
    }, 150)
  }, [])

  useEffect(() => {
    const now = Date.now()
    let interval = null
    let timeout = setTimeout(() => {
      setMealRefresh(Date.now())
      interval = setInterval(() => {
        setMealRefresh(Date.now())
      }, MINUTE)
    }, MINUTE - (now % MINUTE))

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  return <View style={[styles.container, { width: isChangerOpen ? '100%' : 0, }]}>
    <View style={styles.changerView}>
      {
        isMenuOnly ? (
          <FlatList
            ref={dayFlatListRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 0, }}
            keyExtractor={item => item}
            initialScrollIndex={day}
            onScrollToIndexFailed={(info) => {
              /* handle error here /*/
            }}
            contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 50 }}
            data={fullDays}
            renderItem={({ item: dotw, index }) => <TouchableOpacity style={{ marginHorizontal: 12, }} onPress={() => setDay(index)}><View
              style={{
                paddingHorizontal: 8,
                paddingBottom: 4,
                borderBottomWidth: 2,
                borderBottomColor: day === index ? Colors.darkgrey : Colors.paper,
              }}>
              <ExtraLargeText darkgrey>{dotw}</ExtraLargeText>
            </View></TouchableOpacity>}
          />) :
          <View style={{ height: 20 }} />
      }
      <ScrollView contentContainerStyle={styles.scrollView}>
        {
          meals.length ?
            meals.map((meal, index) => (
              <View key={meal.meal_id + index} style={styles.mealView}>
                <View style={styles.mealNameView}>
                  <ExtraLargeText darkgrey center>{meal.name}</ExtraLargeText>
                </View>

                <View style={{ paddingHorizontal: 40, }}>
                  {
                    meal.menus.map(menu => {
                      return (
                        <TouchableOpacity key={meal.dotw_id + meal.period_id + meal.meal_id + menu.menu_id} onPress={() => {
                          if (currentMenuID !== meal.menu_id || currentMealID !== meal.meal_id || currentPeriodID !== meal.period_id || currentDotwID !== meal.dotw_id) {
                            dispatch(doTrackersSet({ dotw_id: meal.dotw_id, period_id: meal.period_id, meal_id: meal.meal_id, menu_id: menu.menu_id, menuPosition: menu.menuPosition }))
                            if (Platform.OS !== 'web') dispatch(doPhotoDownloadByMenu(menu.menu_id))

                            if (sectionListRef?.current?.props?.sections?.length) { // Prevent empty sectionListRef firing
                              sectionListRef?.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0 })
                            }
                          }

                          closeChangerDrawer()
                        }}>
                          <View style={styles.menuView}>
                            <LargeText darkgrey center>{menu.name}</LargeText>
                            <ExtraSmallText darkgrey center style={{ fontStyle: 'italic' }}>{militaryToClock(menu.start)}-{militaryToClock(menu.end, undefined, true)}</ExtraSmallText>
                          </View>
                        </TouchableOpacity>
                      )
                    })
                  }
                </View>
              </View>
            )) :
            <LargeText darkgrey center>No menus available on {fullDays[day]}s</LargeText>
        }
      </ScrollView>

      {isRestaurantLoading && <IndicatorOverlay text='Loading menus' opacity={'00'} dark />}
    </View>
  </View>
  // }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: Colors.black + 'EA',
  },
  changerView: {
    flex: 1,
    backgroundColor: Colors.paper,
    marginHorizontal: Layout.window.width * 0.1,
    marginVertical: 30,
  },
  scrollView: {
    paddingBottom: 40,
  },
  mealView: {
    marginBottom: 40,
    marginTop: 20,
  },
  mealNameView: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    marginBottom: MENU_VERTICAL_PADDING,
    borderBottomColor: Colors.darkgrey,
    borderBottomWidth: 1,
    alignSelf: 'center',
  },
  menuView: {
    paddingVertical: MENU_VERTICAL_PADDING,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
});


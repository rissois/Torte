import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Switch,
  Alert,
  ScrollView
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import { DraggableList, StaticList } from '../components/PortalRow';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';;
import { setTracker, removeTracker } from '../redux/actionsTracker';
import firebase from '../config/Firebase';
import DisablingScrollView from '../components/DisablingScrollview';
import MenuButton from '../components/MenuButton';
import { useFocusEffect } from '@react-navigation/native';
import RenderOverlay from '../components/RenderOverlay';
import { militaryToClock, militaryToDate } from '../functions/dateAndTime';
import useRestaurant from '../hooks/useRestaurant';


export default function MealScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()
  const { menus = {}, tracker: { meal: meal_id, menu: menu_id }, restaurant: { meals = {} } } = useSelector(state => state)
  let meal = meals[meal_id] ?? {}
  let { menus: fsMealMenus = [], live = false } = meal
  let {
    name = meal.name,
    internal_name = meal.internal_name,
    start = meal.start ?? '0000',
    end = meal.end ?? '2400',
    menuStart,
    menuEnd,
    menuFirmEnd,
  } = (route?.params || {})
  const [mealMenus, setMealMenus] = useState(fsMealMenus)
  const [newMenus, setNewMenus] = useState([])
  const [showMenuList, setShowMenuList] = useState(false)
  const [isMealAltered, setIsMealAltered] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [sortedMenuList, setSortedMenuList] = useState([])

  useEffect(() => {
    setSortedMenuList(Object.keys(menus).filter(menu_id => {
      // Remove any menus that are already part of mealMenus
      return !~mealMenus.findIndex(menu => menu_id === menu.menu_id)
    }).sort((a, b) => menus[a].name > menus[b].name))
  }, [menus, mealMenus])


  useFocusEffect(useCallback(() => {
    // Add or edit a menu returned by params to the MealMenus
    setShowMenuList(false)
    if (menuStart && menu_id) {
      setMealMenus(prev => {
        let newMeal = [...prev]
        let menuIndex = newMeal.findIndex(menu => menu.menu_id === menu_id)
        if (~menuIndex) {
          newMeal[menuIndex] = { ...newMeal[menuIndex], start: menuStart, end: menuEnd, firm_end: menuFirmEnd }
        }
        else {
          newMeal.push({ menu_id, start: menuStart, end: menuEnd, firm_end: menuFirmEnd })
        }
        return newMeal
      })

      navigation.setParams({ menuStart: null, menuEnd: null, menuFirmEnd: null })
    }
  }, [menuStart, menuEnd, menuFirmEnd, menu_id]))

  const identicalMenus = (a, b) => {
    return a.length === b.length &&
      !~a.findIndex((a_menu, index) => a_menu.start !== b[index].start || a_menu.end !== b[index].end || a_menu.firm_end !== b[index].firm_end || a_menu.menu_id !== b[index].menu_id)
  }

  useEffect(() => {
    setIsMealAltered(name !== meal.name || internal_name !== meal.internal_name ||
      start !== meal.start || end !== meal.end ||
      !identicalMenus(fsMealMenus, mealMenus))
    // For meal menus to be different, menus must also be different
  }, [fsMealMenus, mealMenus, name, internal_name, start, end, meal,])

  const switchLive = async (isLive) => {
    try {
      firebase.firestore().collection('restaurants').doc(restaurant_id)
        .set({
          meals: {
            [meal_id]: {
              live: isLive
            }
          }
        }, { merge: true })
    }
    catch (error) {
      console.log('mealScreen switch error: ', error)
      Alert.alert(`Could not ${isLive ? 'turn on' : 'turn off'}`, 'Please try again. Contact Torte support if the issue persists.')
    }
  }

  const updateMeal = async () => {
    if (isMealAltered) {
      try {
        setIsSaving(true)

        await firebase.firestore().collection('restaurants').doc(restaurant_id).set({
          meals: {
            [meal_id]: {
              menus: mealMenus,
              name,
              internal_name,
              start,
              end,
            }
          }
        }, { merge: true })
        setIsSaving(false)
      }
      catch (error) {
        setIsSaving(false)
        console.log('updateMeal error: ', error)
        Alert.alert('Could not save menu', 'Please try again. Contact Torte support if the issue persists.')
      }
    }

  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <MenuHeader leftText='Back' leftFn={() => {
          if (isMealAltered) {
            Alert.alert(`Save changes before you leave?`, 'If you proceed without saving, changes to the names, hours, and menu order will be lost', [
              {
                text: 'Yes', onPress: async () => {
                  updateMeal()
                  dispatch(removeTracker('day'))
                  dispatch(removeTracker('section'))
                  dispatch(removeTracker('meal'))
                  navigation.navigate('MealsList')
                }
              },
              {
                text: 'No',
                onPress: async () => {
                  dispatch(removeTracker('day'))
                  dispatch(removeTracker('section'))
                  dispatch(removeTracker('meal'))
                  navigation.navigate('MealsList')
                }
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },

            ])
          }
          else {
            dispatch(removeTracker('day'))
            dispatch(removeTracker('section'))
            dispatch(removeTracker('meal'))
            navigation.navigate('MealsList')
          }
        }} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <HeaderText>{name}</HeaderText>
          <TouchableOpacity onPress={() => navigation.push('Create', { category: 'meal', name, internal_name })}>
            <ClarifyingText style={{ marginLeft: 20, color: Colors.lightgrey }}>(edit)</ClarifyingText>
          </TouchableOpacity>
        </View>

        <MainText center>{internal_name || '(no internal name)'}</MainText>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <MainText>{militaryToClock(start)} - {militaryToClock(end)}</MainText>
          <TouchableOpacity onPress={() => {
            navigation.push('MealHours', { name, internal_name, start, end })
          }}>
            <ClarifyingText style={{ marginLeft: 20, color: Colors.lightgrey }}>(edit)</ClarifyingText>
          </TouchableOpacity>
        </View>


        <View style={{ marginVertical: Layout.spacer.medium }}>
          <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
            <LargeText>Show customers this meal</LargeText>
            <Switch
              trackColor={{ false: Colors.purple, true: Colors.green }}
              thumbColor={live ? Colors.white : Colors.lightgrey}
              ios_backgroundColor={Colors.midgrey}
              onValueChange={switchLive}
              value={live}
              style={{
                marginLeft: 20,
                transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
              }}
            />
          </View>
          <MainText center style={{ color: live ? Colors.green : Colors.red }}>Customers can{live ? '' : 'not'} see this meal</MainText>
        </View>

        <DisablingScrollView contentContainerStyle={{ alignSelf: 'center' }}>
          {/* <View style={{ width: Layout.window.width * 0.8, flex: 1, alignSelf: 'center' }}> */}
          <View style={{ marginBottom: Layout.spacer.small, width: Layout.window.width * 0.9, }}>
            <LargeText>Menus in this meal</LargeText>
            <ClarifyingText>Press and hold the arrows to drag into desired order</ClarifyingText>
            <MainText style={{ color: Colors.red, fontWeight: 'bold' }}>You can only edit the times for each menu from this page. If the menu is red, it is either not shown to customers or does not have sections that are shown to customers. Please go to Menus on the main Portal screen if you want to create or edit a menu.</MainText>
          </View>
          <DraggableList
            data={mealMenus.map(menu => ({ ...menu, name: menus[menu.menu_id].name, internal_name: menus[menu.menu_id].internal_name, }))}
            setData={(order) => {
              setMealMenus(order)
            }}
            // dataReference={menus}
            mainTextKey='name'
            rightTextKey='internal_name'
            docIdKey='menu_id'
            showTime
            // rightTextKey='internal_name'
            // rightTextKey='right'
            onPress={(doc_id) => {
              dispatch(setTracker({ menu: doc_id }))
              let menu = mealMenus.find(m => m.menu_id === doc_id)
              navigation.navigate('MenuHours', { mealStart: start, mealEnd: end, start: menu.start, end: menu.end, name: menus[doc_id].internal_name ?? menus[doc_id].name })
              // SET MENU TRACKER
              // AND USEFOCUSEFFECT, check for menu tracker and check for params. Apply those params with findIndex(menu => menu.menu_id === doc_id)
              // Apply params to the menu
            }}
            del={(doc_id, mainText) => {
              Alert.alert(`Remove ${mainText || 'menu'}?`, undefined, [
                {
                  text: 'No, cancel',
                  style: 'cancel'
                },
                {
                  text: 'Yes', onPress: async () => {
                    setMealMenus(prev => {
                      let next = [...prev]
                      next.splice(next.findIndex(menu => menu.menu_id === doc_id), 1)
                      return next
                    })
                  }
                },

              ])
            }}
            {...Object.keys(menus).length && {
              addExisting: () => {
                setNewMenus([])
                setShowMenuList(true)
              }
            }}
            category='menu'
          />
          <View style={{ marginVertical: Layout.spacer.large, flexDirection: 'row', justifyContent: 'space-around' }}>
            <MenuButton text='Discard changes' color={isMealAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
              Alert.alert('Discard all changes?', undefined, [
                {
                  text: 'Yes', onPress: () => {
                    navigation.setParams({ name: meal.name, internal_name: meal.internal_name, start: meal.start, end: meal.end })
                    setMealMenus(fsMealMenus)
                  }
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
              ])
            }} disabled={!isMealAltered} />
            <MenuButton text={isMealAltered ? 'Save changes' : 'No changes'} color={isMealAltered ? Colors.purple : Colors.darkgrey} buttonFn={() => updateMeal()} disabled={!isMealAltered} />
          </View>
          {/* </View> */}
        </DisablingScrollView>
      </SafeAreaView>

      {!!showMenuList && <View style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: `rgba(0,0,0,0.9)`,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
        <LargeText style={{ marginBottom: Layout.spacer.small, fontWeight: 'bold' }}>Select a menu to add</LargeText>
        <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <StaticList
              data={sortedMenuList}
              dataReference={menus}
              // labelTextKey
              mainTextKey='name'
              rightTextKey='internal_name'
              // showTime
              onPress={(doc_id) => {
                // setNewMenus(prev => {
                //   let index = prev.indexOf(doc_id)
                //   if (~index) {
                //     let next = [...prev]
                //     next.splice(index, 1)
                //     return next
                //   }
                //   else {
                //     return [...prev, doc_id]
                //   }
                // })

                dispatch(setTracker({ menu: doc_id }))
                navigation.navigate('MenuHours', { mealStart: start, mealEnd: end, name: menus[doc_id].internal_name ?? menus[doc_id].name })
              }}
              // GET RID OF SELECTED FOR THIS
              category='menu'
            />
          </ScrollView>
        </View>
        <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
          <TouchableOpacity onPress={() => setShowMenuList(false)}>
            <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setMealMenus(prev => [...prev, ...newMenus])
            setShowMenuList(false)
          }}>
            <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.green, fontWeight: 'bold' }}>CONFIRM</LargeText>
          </TouchableOpacity>
        </View>
      </View>}
      {isSaving && <RenderOverlay text='Saving changes' opacity={0.9} />}
    </View >
  );
}

const styles = StyleSheet.create({
});

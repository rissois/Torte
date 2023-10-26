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
import identicalArrays from '../functions/identicalArrays';
import firebase from '../config/Firebase';
import DisablingScrollView from '../components/DisablingScrollview';
import MenuButton from '../components/MenuButton';
import { useFocusEffect } from '@react-navigation/native';
import RenderOverlay from '../components/RenderOverlay';
import useRestaurant from '../hooks/useRestaurant';


export default function MenuScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()
  const { menus = {}, sections = {}, items = {}, tracker: { menu: menu_id }, tracker } = useSelector(state => state)
  let menu = menus[menu_id] ?? {}
  let { sectionOrder: fsSectionOrder = [], live = false } = menu
  let { name = menu.name, internal_name = menu.internal_name } = (route?.params || {})
  const [sectionOrder, setSectionOrder] = useState(fsSectionOrder)
  const [newSections, setNewSections] = useState([])
  const [showSectionList, setShowSectionList] = useState(false)
  const [isMenuAltered, setIsMenuAltered] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useFocusEffect(useCallback(() => {
    setSectionOrder(prev => {
      if (!identicalArrays(prev, fsSectionOrder)) {
        return fsSectionOrder
      }
      return prev
    })
  }, [fsSectionOrder]))

  useEffect(() => {
    setIsMenuAltered(name !== menu.name || internal_name !== menu.internal_name || !identicalArrays(fsSectionOrder, sectionOrder))
  }, [fsSectionOrder, sectionOrder, name, internal_name, menu,])

  const switchLive = async (isLive) => {
    try {
      firebase.firestore().collection('restaurants').doc(restaurant_id)
        .collection('restaurantMenus').doc(menu_id)
        .update({
          live: isLive
        })
    }
    catch (error) {
      console.log('menuScreen switch error: ', error)
      Alert.alert(`Could not ${isLive ? 'turn on' : 'turn off'}`, 'Please try again. Contact Torte support if the issue persists.')
    }
  }

  const updateMenu = async () => {
    if (isMenuAltered) {
      try {
        setIsSaving(true)
        var batch = firebase.firestore().batch()

        let menuRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
          .collection('restaurantMenus').doc(menu_id)

        batch.update(menuRef, {
          sectionOrder,
          name,
          internal_name,
        })

        // No longer tracking menu_ids
        // if (!identicalArrays(fsSectionOrder, sectionOrder)) {
        //   let affected_items = {}

        //   // sections removed from menu should no longer contain the menu
        //   fsSectionOrder.forEach(section_id => {
        //     if (!sectionOrder.includes(section_id)) {
        //       let sectionRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
        //         .collection('restaurantSections').doc(section_id)
        //       batch.update(sectionRef, {
        //         menu_ids: firebase.firestore.FieldValue.arrayRemove(menu_id)
        //       })

        //       sections[section_id].itemOrder.forEach(item_id => {
        //         if (~sectionOrder.findIndex(section_id => items[item_id].section_ids.includes(section_id))) {
        //           // item_id is still in menu through another section
        //         }
        //         else {
        //           affected_items[item_id] = 'removed'
        //         }
        //       })
        //     }
        //   })

        //   // sections added from menu should be given menu_id
        //   sectionOrder.forEach(section_id => {
        //     if (!fsSectionOrder.includes(section_id)) {
        //       let sectionRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
        //         .collection('restaurantSections').doc(section_id)
        //       batch.update(sectionRef, {
        //         menu_ids: firebase.firestore.FieldValue.arrayUnion(menu_id)
        //       })

        //       sections[section_id].itemOrder.forEach(item_id => {
        //         if (affected_items[item_id]) { // removed and added in same go, so no change
        //           delete affected_items[item_id]
        //         }
        //         else if (items[item_id].menu_ids.includes(menu_id)) {
        //           // No change, item already included this menu
        //         }
        //         else {
        //           affected_items[item_id] = 'added'
        //         }
        //       })
        //     }
        //   })

        //   Object.keys(affected_items).forEach(item_id => {
        //     let itemRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
        //       .collection('restaurantItems').doc(item_id)
        //     if (affected_items[item_id] === 'added') {
        //       batch.update(itemRef, {
        //         menu_ids: firebase.firestore.FieldValue.arrayUnion(menu_id)
        //       })
        //     }
        //     else if (affected_items[item_id] === 'removed') {
        //       batch.update(itemRef, {
        //         menu_ids: firebase.firestore.FieldValue.arrayRemove(menu_id)
        //       })
        //     }
        //   })
        // }

        await batch.commit()
        setIsSaving(false)
      }
      catch (error) {
        setIsSaving(false)
        console.log('updateMenu error: ', error)
        Alert.alert('Could not save menu', 'Please try again. Contact Torte support if the issue persists.')
      }
    }

  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <MenuHeader leftText='Back' leftFn={() => {
          if (isMenuAltered) {
            Alert.alert(`Save changes before you leave?`, 'If you proceed without saving, changes to the section order will be lost', [
              {
                text: 'Yes', onPress: async () => {
                  updateMenu()
                  dispatch(removeTracker('menu'))
                  navigation.goBack()
                }
              },
              {
                text: 'No',
                onPress: async () => {
                  dispatch(removeTracker('menu'))
                  navigation.goBack()
                }
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },

            ])
          }
          else {
            dispatch(removeTracker('menu'))
            navigation.goBack()
          }
        }} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <HeaderText >{name} menu</HeaderText>
          <TouchableOpacity onPress={() => navigation.push('Create', { category: 'menu', name, internal_name })}>
            <ClarifyingText style={{ marginLeft: 20, color: Colors.lightgrey }}>(edit)</ClarifyingText>
          </TouchableOpacity>
        </View>

        <MainText center>{internal_name || '(no internal name)'}</MainText>

        <View style={{ marginVertical: Layout.spacer.medium }}>
          <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
            <LargeText>Show customers this menu</LargeText>
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
          <MainText center style={{ color: live ? Colors.green : Colors.red }}>Customers can{live ? '' : 'not'} see this menu</MainText>
        </View>

        <DisablingScrollView contentContainerStyle={{ alignSelf: 'center' }}>
          {/* <View style={{ width: Layout.window.width * 0.8, flex: 1, alignSelf: 'center' }}> */}
          <View style={{ marginBottom: Layout.spacer.small }}>
            <LargeText>Sections in this menu</LargeText>
            <ClarifyingText>e.g. Starters, Seafood, Pizzas, Sides, Desserts</ClarifyingText>
            <ClarifyingText>Press and hold the arrows to drag into desired order</ClarifyingText>
          </View>
          <DraggableList
            data={sectionOrder}
            setData={(order) => {
              setSectionOrder(order)
              // firebase.firestore().collection('restaurants').doc(restaurant_id)
              //   .collection('restaurantMenus').doc(menu_id)
              //   .update({
              //     sectionOrder: order
              //   })
            }}
            dataReference={sections}
            mainTextKey='name'
            rightTextKey='internal_name'
            // rightTextKey='right'
            onPress={(doc_id) => {
              if (isMenuAltered) {
                Alert.alert(`Save changes on this menu?`, 'If you proceed without saving, changes to the section order will be lost', [
                  {
                    text: 'Yes', onPress: async () => {
                      updateMenu()
                      dispatch(setTracker({ section: doc_id }))
                      navigation.navigate('Section')
                    }
                  },
                  {
                    text: 'No',
                    onPress: async () => {
                      setSectionOrder(fsSectionOrder)
                      dispatch(setTracker({ section: doc_id }))
                      navigation.navigate('Section')
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },

                ])
              }
              else {
                dispatch(setTracker({ section: doc_id }))
                navigation.navigate('Section')
              }
            }}
            del={(doc_id, rightText) => {
              Alert.alert(`Remove ${rightText || 'section'}?`, undefined, [
                {
                  text: 'No, cancel',
                  style: 'cancel'
                },
                {
                  text: 'Yes', onPress: async () => {
                    setSectionOrder(prev => {
                      let next = [...prev]
                      next.splice(next.indexOf(doc_id), 1)
                      return next
                    })
                  }
                },

              ])
              // firebase.firestore().collection('restaurants').doc(restaurant_id)
              //   .collection('restaurantMenus').doc(menu_id)
              //   .update({
              //     sectionOrder: firebase.firestore.FieldValue.arrayRemove(doc_id)
              //   })
            }}
            addNew={() => {
              if (isMenuAltered) {
                Alert.alert(`Save changes on this menu?`, 'If you proceed without saving, changes to the section order will be lost', [
                  {
                    text: 'Yes', onPress: async () => {
                      updateMenu()
                      navigation.navigate('Create', { category: 'section' })
                    }
                  },
                  {
                    text: 'No',
                    onPress: async () => {
                      setSectionOrder(fsSectionOrder)
                      navigation.navigate('Create', { category: 'section' })
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },

                ])
              }
              else {
                navigation.navigate('Create', { category: 'section' })
              }
              // setTrackerMenu(doc_id)
              // updateMenu() // commit the changes in case user does not return

            }}
            {...Object.keys(sections).length && {
              addExisting: () => {
                setNewSections([])
                setShowSectionList(true)
              }
            }}
            category='section'
          />
          <View style={{ marginVertical: Layout.spacer.large, flexDirection: 'row', justifyContent: 'space-around' }}>
            <MenuButton text='Discard changes' color={isMenuAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
              Alert.alert('Discard all changes?', undefined, [
                {
                  text: 'Yes', onPress: () => {
                    navigation.setParams({ name: menu.name, internal_name: menu.internal_name, })
                    setSectionOrder(fsSectionOrder)
                  }
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
              ])
            }} disabled={!isMenuAltered} />
            <MenuButton text={isMenuAltered ? 'Save changes' : 'No changes'} color={isMenuAltered ? Colors.purple : Colors.darkgrey} buttonFn={() => updateMenu()} disabled={!isMenuAltered} />
          </View>
          {/* </View> */}
        </DisablingScrollView>
      </SafeAreaView>

      {!!showSectionList && <View style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: `rgba(0,0,0,0.9)`,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
        <LargeText style={{ marginBottom: Layout.spacer.small, fontWeight: 'bold' }}>Select sections</LargeText>
        <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <StaticList
              data={Object.keys(sections).filter(section_id => !sectionOrder.includes(section_id)).sort((a, b) => sections[a].name > sections[b].name)}
              dataReference={sections}
              // labelTextKey
              mainTextKey='name'
              rightTextKey='internal_name'
              onPress={(doc_id) => setNewSections(prev => {
                let index = prev.indexOf(doc_id)
                if (~index) {
                  let next = [...prev]
                  next.splice(index, 1)
                  return next
                }
                else {
                  return [...prev, doc_id]
                }
              })}
              selected={newSections}
              category='section'
            />
          </ScrollView>
        </View>
        <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
          <TouchableOpacity onPress={() => {
            setShowSectionList(false)
          }}>
            <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setSectionOrder(prev => [...prev, ...newSections])
            setShowSectionList(false)
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

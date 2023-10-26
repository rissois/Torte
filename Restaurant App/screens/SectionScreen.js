import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Switch,
  Alert,
  ScrollView,
  TextInput,
  Keyboard
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import { DraggableList, StaticList } from '../components/PortalRow';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';;
import { removeTracker, setTracker } from '../redux/actionsTracker';
import firebase from '../config/Firebase';
import DisablingScrollView from '../components/DisablingScrollview';
import MenuButton from '../components/MenuButton';
import identicalArrays from '../functions/identicalArrays';
import { useFocusEffect } from '@react-navigation/native';
import RenderOverlay from '../components/RenderOverlay';
import useRestaurant from '../hooks/useRestaurant';


export default function SectionScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()
  const { sections = {}, items = {}, photoAds, photos, tracker: { section: section_id }, } = useSelector(state => state)
  let section = sections[section_id] ?? {}
  let { itemOrder: fsItemOrder = [], photoAd: fsPhotoAd = null, description: fsDescription = '', live = false } = section
  let { name = section.name, internal_name = section.internal_name } = (route.params || {})

  const [description, setDescription] = useState(fsDescription)

  const [itemOrder, setItemOrder] = useState(fsItemOrder)
  const [newItems, setNewItems] = useState([])
  const [showItemList, setShowItemList] = useState(false)
  const [isSectionAltered, setIsSectionAltered] = useState(false)

  const [photoAd, setPhotoAd] = useState(fsPhotoAd)
  const [selectedPhotoAd, setSelectedPhotoAd] = useState([])
  const [showPhotoAdList, setShowPhotoAdList] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Saving photoAd immediately returns to Section screen, causing syncing errors
    setPhotoAd(fsPhotoAd)
  }, [fsPhotoAd])

  useFocusEffect(useCallback(() => {
    setItemOrder(prev => {
      if (!identicalArrays(prev, fsItemOrder)) {
        return fsItemOrder
      }
      return prev
    })
  }, [fsItemOrder]))

  useEffect(() => {
    setIsSectionAltered(name !== section.name || internal_name !== section.internal_name || description !== fsDescription || photoAd !== section.photoAd || !identicalArrays(itemOrder, fsItemOrder))
  }, [itemOrder, fsItemOrder, name, internal_name, section, photoAd, description, fsDescription])

  const switchLive = async (isLive) => {
    try {
      firebase.firestore().collection('restaurants').doc(restaurant_id)
        .collection('restaurantSections').doc(section_id)
        .update({
          live: isLive
        })
    }
    catch (error) {
      console.log('sectionScreen switch error: ', error)
      Alert.alert(`Could not ${isLive ? 'turn on' : 'turn off'}`, 'Please try again. Contact Torte support if the issue persists.')
    }
  }

  const updateSection = async () => {
    if (isSectionAltered) {
      try {
        setIsSaving(true)
        var batch = firebase.firestore().batch()

        let sectionRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
          .collection('restaurantSections').doc(section_id)

        batch.update(sectionRef, {
          itemOrder,
          name,
          internal_name,
          photoAd: photoAd ?? '',
          description,
        })

        // No longer tracking section_ids and menu_ids
        // if (!identicalArrays(itemOrder, fsItemOrder)) {
        //   // items removed from section should no longer contain the section (or menu_id, if applicable)
        //   fsItemOrder.forEach(item_id => {
        //     if (!itemOrder.includes(item_id)) {
        //       let all_menus = []
        //       items[item_id].section_ids.forEach(section_id => {
        //         all_menus.push(sections[section_id].menu_ids)
        //       })

        //       let itemRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
        //         .collection('restaurantItems').doc(item_id)
        //       batch.update(itemRef, {
        //         section_ids: firebase.firestore.FieldValue.arrayRemove(section_id),
        //         menu_ids: [...new Set(all_menus)]
        //       })
        //     }
        //   })

        //   // items added to section should be given section_id (and menu_id if applicable)
        //   itemOrder.forEach(item_id => {
        //     if (!fsItemOrder.includes(item_id)) {
        //       let itemRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
        //         .collection('restaurantItems').doc(item_id)
        //       batch.update(itemRef, {
        //         section_ids: firebase.firestore.FieldValue.arrayUnion(section_id),
        //         menu_ids: firebase.firestore.FieldValue.arrayUnion(...sections[section_id].menu_ids)
        //       })
        //     }
        //   })
        // }

        await batch.commit()

        setIsSaving(false)

      }
      catch (error) {
        setIsSaving(false)
        console.log('updateSection error: ', error)
        Alert.alert('Could not save section', 'Please try again. Contact Torte support if the issue persists.')
      }
    }

    // NEED TO GET THE MENU_IDS AS WELL ON THE UPDATE

    // You also need to update each section's menu_ids with arrayUnion / array remove
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <MenuHeader leftText='Back' leftFn={() => {
          if (isSectionAltered) {
            Alert.alert(`Save changes before you leave?`, 'If you proceed without saving, changes to the item order and photo ad selection will be lost', [
              {
                text: 'Yes', onPress: async () => {
                  updateSection()
                  dispatch(removeTracker('section'))
                  navigation.goBack()
                }
              },
              {
                text: 'No',
                onPress: async () => {
                  dispatch(removeTracker('section'))
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
            dispatch(removeTracker('section'))
            navigation.goBack()
          }
        }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }} />
          <HeaderText>{name} section</HeaderText>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.push('Create', { category: 'section', name, internal_name })}>
              <ClarifyingText style={{ marginHorizontal: 20, color: Colors.lightgrey }}>(edit)</ClarifyingText>
            </TouchableOpacity>
          </View>

        </View>

        <MainText center>{internal_name || '(no internal name)'}</MainText>

        <View style={{ marginVertical: Layout.spacer.medium }}>
          <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
            <LargeText>Show customers this section</LargeText>
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
          <MainText center style={{ color: live ? Colors.green : Colors.red }}>Customers can{live ? '' : 'not'} see this section</MainText>
        </View>

        <DisablingScrollView onScrollBeginDrag={() => { Keyboard.dismiss() }} contentContainerStyle={{ alignSelf: 'center' }}>
          <View style={{ marginBottom: Layout.spacer.small, width: Layout.window.width * 0.8 }}>
            <LargeText>Section description</LargeText>
            <ClarifyingText>We recommend avoiding section descriptions. If you need one, try keep it short.</ClarifyingText>
            <View style={[styles.descriptionInputView, { borderBottomColor: description ? Colors.softwhite : Colors.lightgrey }]}>
              <TextInput
                style={styles.descriptionInput}
                autoCapitalize='none'
                autoCompleteType={'off'}
                autoCorrect={false}
                onChangeText={text => setDescription(text)}
                placeholder='(optional)'
                placeholderTextColor={Colors.lightgrey}
                returnKeyType='done'
                selectTextOnFocus
                value={description}
              />
            </View>
          </View>

          <View style={{ marginBottom: Layout.spacer.small }}>
            <LargeText>Items in this section</LargeText>
            <ClarifyingText>Press and hold the arrows to drag into desired order</ClarifyingText>
          </View>
          <DraggableList
            data={itemOrder}
            setData={(order) => {
              setItemOrder(order)
            }}
            dataReference={items}
            mainTextKey='name'
            rightTextKey='internal_name'
            onPress={(doc_id) => {
              if (isSectionAltered) {
                Alert.alert(`Save changes on this section?`, 'If you proceed without saving, changes to the item order and photo ad selection will be lost', [
                  {
                    text: 'Yes', onPress: async () => {
                      updateSection()
                      dispatch(setTracker({ 'item': doc_id }))
                      navigation.navigate('Item')
                    }
                  },
                  {
                    text: 'No',
                    onPress: async () => {
                      setItemOrder(fsItemOrder)
                      dispatch(setTracker({ 'item': doc_id }))
                      navigation.navigate('Item')
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },

                ])
              }
              else {
                dispatch(setTracker({ 'item': doc_id }))
                navigation.navigate('Item')
              }
            }}
            del={(doc_id, rightText) => {
              Alert.alert(`Remove ${rightText || 'item'}?`, undefined, [
                {
                  text: 'No, cancel',
                  style: 'cancel'
                },
                {
                  text: 'Yes', onPress: async () => {
                    setItemOrder(prev => {
                      let next = [...prev]
                      next.splice(next.indexOf(doc_id), 1)
                      return next
                    })
                  }
                },

              ])
            }}
            addNew={() => {
              if (isSectionAltered) {
                Alert.alert(`Save changes on this section?`, 'If you proceed without saving, changes to the item order and photo ad selection will be lost', [
                  {
                    text: 'Yes', onPress: async () => {
                      updateSection()
                      if (Object.keys(items).length) {
                        navigation.navigate('Create', { category: 'item' })
                      }
                      else {
                        navigation.navigate('WallOfText', { page: 'item', })
                      }
                    }
                  },
                  {
                    text: 'No',
                    onPress: async () => {
                      setItemOrder(fsItemOrder)
                      setPhotoAd(fsPhotoAd)
                      if (Object.keys(items).length) {
                        navigation.navigate('Create', { category: 'item' })
                      }
                      else {
                        navigation.navigate('WallOfText', { page: 'item', item_redirect: true })
                      }
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },

                ])
              }
              else {
                if (Object.keys(items).length) {
                  navigation.navigate('Create', { category: 'item' })
                }
                else {
                  navigation.navigate('WallOfText', { page: 'item', item_redirect: true })
                }
              }

            }}
            {...Object.keys(items).length && {
              addExisting: () => {
                setNewItems([])
                setShowItemList(true)
              }
            }}
            category='item'
          />

          <View style={{ marginVertical: Layout.spacer.small }}>
            <LargeText>Photo ad for this section</LargeText>
          </View>
          <DraggableList
            data={photoAd ? [photoAd] : []}
            allowDrag={false}
            dataReference={photoAds}
            mainTextKey='name'
            // rightTextKey='internal_name'
            onPress={(doc_id) => {
              if (isSectionAltered) {
                Alert.alert(`Save changes on this section?`, 'If you proceed without saving, changes to the item order and photo ad selection will be lost', [
                  {
                    text: 'Yes', onPress: async () => {
                      updateSection()
                      dispatch(setTracker({ 'photoAd': doc_id }))
                      navigation.navigate('PhotoAd2')
                    }
                  },
                  {
                    text: 'No',
                    onPress: async () => {
                      setItemOrder(fsItemOrder)
                      dispatch(setTracker({ 'photoAd': doc_id }))
                      navigation.navigate('PhotoAd2')
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },

                ])
              }
              else {
                dispatch(setTracker({ 'photoAd': doc_id }))
                navigation.navigate('PhotoAd2')
              }
            }}
            del={(doc_id, mainText) => {
              Alert.alert(`Remove ${mainText || 'photo ad'}?`, undefined, [
                {
                  text: 'No, cancel',
                  style: 'cancel'
                },
                {
                  text: 'Yes', onPress: async () => {
                    setPhotoAd(null)
                  }
                },

              ])
            }}
            {...!photoAd && {
              addNew: () => {
                if (!Object.keys(photos).filter(key => key !== 'logo').length) {
                  Alert.alert('You need items with photos to create a photo ad')
                }
                else if (isSectionAltered) {
                  Alert.alert(`Save changes on this section?`, 'If you proceed without saving, changes to the item order and photo ad selection will be lost', [
                    {
                      text: 'Yes', onPress: async () => {
                        updateSection()
                        if (Object.keys(photoAds).length) {
                          navigation.navigate('PhotoAd1')
                        }
                        else {
                          navigation.navigate('WallOfText', { page: 'photoAd' })
                        }
                      }
                    },
                    {
                      text: 'No',
                      onPress: async () => {
                        setItemOrder(fsItemOrder)
                        if (Object.keys(photoAds).length) {
                          navigation.navigate('PhotoAd1')
                        }
                        else {
                          navigation.navigate('WallOfText', { page: 'photoAd' })
                        }
                      }
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },

                  ])
                }
                else {
                  if (Object.keys(photoAds).length) {
                    navigation.navigate('PhotoAd1')
                  }
                  else {
                    navigation.navigate('WallOfText', { page: 'photoAd' })
                  }
                }

              },
            }
            }
            {...!!Object.keys(photoAds).length && {
              addExisting: () => {
                setShowPhotoAdList(true)
              }
            }}
            category='photoAd'
          />


          <View style={{ marginVertical: Layout.spacer.large, flexDirection: 'row', justifyContent: 'space-around' }}>
            <MenuButton text='Discard changes' color={isSectionAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
              Alert.alert('Discard all changes?', undefined, [
                {
                  text: 'Yes', onPress: () => {
                    navigation.setParams({ name: section.name, internal_name: section.internal_name })
                    setItemOrder(fsItemOrder)
                    setPhotoAd(fsPhotoAd)
                    setDescription(fsDescription)
                  }
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
              ])
            }} disabled={!isSectionAltered} />
            <MenuButton text={isSectionAltered ? 'Save changes' : 'No changes'} color={isSectionAltered ? Colors.purple : Colors.darkgrey} buttonFn={() => updateSection()} disabled={!isSectionAltered} />
          </View>
        </DisablingScrollView>
      </SafeAreaView>

      {!!showItemList && <View style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: `rgba(0,0,0,0.9)`,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
        <LargeText style={{ marginBottom: Layout.spacer.small, fontWeight: 'bold' }}>Select items</LargeText>
        <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <StaticList
              data={Object.keys(items).filter(item_id => !itemOrder.includes(item_id)).sort((a, b) => items[a].name > items[b].name)}
              dataReference={items}
              // labelTextKey
              mainTextKey='name'
              rightTextKey='internal_name'
              onPress={(doc_id) => {
                setNewItems(prev => {
                  let index = prev.indexOf(doc_id)
                  if (~index) {
                    let next = [...prev]
                    next.splice(index, 1)
                    // console.log('index: ', next)
                    return next
                  }
                  else {
                    return [...prev, doc_id]
                  }
                })
              }}
              selected={newItems}
              category='item'
            />
          </ScrollView>
        </View>
        <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
          <TouchableOpacity onPress={() => setShowItemList(false)}>
            <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setItemOrder(prev => {
              // console.log([...prev, ...newItems])
              return [...prev, ...newItems]
            })
            setShowItemList(false)
          }}>
            <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.green, fontWeight: 'bold' }}>CONFIRM</LargeText>
          </TouchableOpacity>
        </View>
      </View>}

      {!!showPhotoAdList && <View style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: `rgba(0,0,0,0.9)`,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
        <LargeText style={{ marginBottom: Layout.spacer.small, fontWeight: 'bold' }}>Select photo ad</LargeText>
        <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <StaticList
              data={Object.keys(photoAds).sort((a, b) => photoAds[a].name > photoAds[b].name)}
              dataReference={photoAds}
              // labelTextKey
              mainTextKey='name'
              onPress={(doc_id) => {
                setSelectedPhotoAd(prev => {
                  if (prev === doc_id) {
                    return []
                  }
                  else {
                    return [doc_id]
                  }
                })
              }}
              selected={selectedPhotoAd}
              category='photoAd'
            />
          </ScrollView>
        </View>
        <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
          <TouchableOpacity onPress={() => setShowPhotoAdList(false)}>
            <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setPhotoAd(selectedPhotoAd[0] || null)
            setShowPhotoAdList(false)
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
  descriptionInputView:
  {
    marginVertical: Layout.spacer.small,
    borderBottomWidth: 2,
    paddingBottom: 3,
    paddingHorizontal: 6,
    marginHorizontal: Layout.spacer.medium
  },
  descriptionInput:
  {
    fontSize: 24,
    color: Colors.softwhite,
  }
});

import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fullDays, threeLetterDays } from '../constants/DOTW';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';
import firebase from '../config/Firebase';
import objectToArray from '../functions/objectToArray';
import { AddRow, DraggableList, PortalRow, StaticList } from '../components/PortalRow';
import { setTracker } from '../redux/actionsTracker';
import identicalArrays from '../functions/identicalArrays';
import RenderOverlay from '../components/RenderOverlay';
import { useFocusEffect } from '@react-navigation/native';
import useRestaurant from '../hooks/useRestaurant';

const buttonResponses = {
  start_closed: 'Closed',
  twenty_four: '24 hours',
  start_prev: 'prev',
  end_midnight: '2400',
  end_next: 'next',
  time: 'time'
}


export default function MealsListScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()
  const { days: fsDays = {}, meals = {}, } = useSelector(state => state.restaurant)
  let {
    start,
    end,
  } = (route?.params || {})

  const [isDaysAltered, setIsDaysAltered] = useState(false)

  const [days, setDays] = useState({})
  const [showMealList, setShowMealList] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newMeals, setNewMeals] = useState([])

  useFocusEffect(useCallback(() => {
    setDays(fsDays)
  }, []))

  //  useFocusEffect(useCallback(() => {
  //   if (start && end && day && service && meal) {


  //     dispatch(removeTracker('day'))
  //     dispatch(removeTracker('service'))
  //     dispatch(removeTracker('meal'))
  //     navigation.setParams({ start: null, end: null})
  //   }
  // }, [start, end, day, service, meal]))

  useEffect(() => {
    if (~Object.keys(days).findIndex(day => {
      return ~days[day].services.findIndex((service, index) => {
        return !identicalArrays(service.mealOrder, fsDays[day].services[index].mealOrder)
      })
    })) {
      setIsDaysAltered(true)
    }
    else {
      setIsDaysAltered(false)
    }
  }, [days, fsDays])

  const reorder = (dayIndex, serviceIndex = 0) => (order) => {
    setDays(prev => {
      let newServices = [...days[dayIndex].services]
      newServices[serviceIndex] = { ...days[dayIndex].services[serviceIndex], mealOrder: [...order] }
      return {
        ...prev,
        [dayIndex]: {
          ...prev[dayIndex],
          services: newServices
        }
      }
    })
  }

  const onPress = (doc_id) => {
    if (isDaysAltered) {
      Alert.alert(`Save changes on this meal?`, 'If you proceed without saving, changes to meal orders will be lost', [
        {
          text: 'Yes', onPress: async () => {
            updateDays()
            dispatch(setTracker({ meal: doc_id }))
            navigation.navigate('Meal')
          }
        },
        {
          text: 'No',
          onPress: async () => {
            dispatch(setTracker({ meal: doc_id }))
            navigation.navigate('Meal')
          }
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },

      ])
    }
    else {
      dispatch(setTracker({ meal: doc_id }))
      navigation.navigate('Meal')
    }
  }

  const del = (dayIndex, serviceIndex = 0) => (doc_id, mainText) => {
    Alert.alert(`Remove ${mainText || 'meal'}?`, undefined, [
      {
        text: 'No, cancel',
        style: 'cancel'
      },
      {
        text: 'Yes', onPress: async () => {
          setDays(prev => {
            let newServices = [...days[dayIndex].services]
            newServices[serviceIndex] = { ...days[dayIndex].services[serviceIndex], mealOrder: days[dayIndex].services[serviceIndex].mealOrder.filter(id => id !== doc_id) }
            return {
              ...prev,
              [dayIndex]: {
                ...prev[dayIndex],
                services: newServices
              }
            }
          })
        }
      },

    ])
  }
  const addNew = (dayIndex, serviceIndex = 0) => () => {
    if (isDaysAltered) {
      Alert.alert(`Save changes on this meal?`, 'If you proceed without saving, changes to meal orders will be lost', [
        {
          text: 'Yes', onPress: async () => {
            updateDays()
            dispatch(setTracker({ dayIndex, serviceIndex }))
            navigation.navigate('Create', { category: 'meal' })
          }
        },
        {
          text: 'No',
          onPress: async () => {
            setDays(fsDays)
            dispatch(setTracker({ dayIndex, serviceIndex }))
            navigation.navigate('Create', { category: 'meal' })
          }
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },

      ])
    }
    else {
      dispatch(setTracker({ dayIndex, serviceIndex }))
      navigation.navigate('Create', { category: 'meal' })
    }
  }

  const addExisting = (dayIndex, serviceIndex = 0) => () => {
    setNewMeals([])
    setShowMealList({ dayIndex, serviceIndex })
  }

  const updateDays = async () => {
    try {
      setIsSaving(true)

      await firebase.firestore().collection('restaurants').doc(restaurant_id)
        .update({
          days
        })

      setIsSaving(false)
    }
    catch (error) {
      console.log('MealsListScren updateDays error: ', error)
      Alert.alert('Could not save meal', 'Please try again. Contact Torte support if the issue persists.')
      setIsSaving(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <MenuHeader leftText='Back' leftFn={() => {
          navigation.goBack()
        }} />

        <DisablingScrollView contentContainerStyle={{ alignSelf: 'center', }}>
          <HeaderText center style={{ marginBottom: Layout.spacer.medium }}>Meals</HeaderText>
          {/* <LargeText><Text style={{color: Colors.red, fontWeight: Colors.red}}>PLEASE NOTE: </Text>A meal must be assigned to a set of hours for the meal to be visible during that period.</LargeText> */}
          {
            Object.keys(days).sort().map((dayIndex) => {
              if (days[dayIndex].text === buttonResponses.start_closed) {
                return <View key={dayIndex} style={{ marginBottom: Layout.spacer.medium, width: Layout.window.width * 0.8 }}>
                  <LargeText >{threeLetterDays[dayIndex]}: Closed</LargeText>
                </View>
              }
              else if (days[dayIndex].text === buttonResponses.twenty_four) {
                return <View key={dayIndex} style={{ marginBottom: Layout.spacer.medium, }}>
                  <LargeText>{threeLetterDays[dayIndex]}: 24 hours</LargeText>
                  <ClarifyingText style={{ marginBottom: Layout.spacer.small }}>Press and hold the arrows to drag into desired order</ClarifyingText>
                  <View style={{ borderWidth: 1, borderColor: Colors.keygrey, borderRightColor: Colors.background }}>
                    <DraggableList
                      data={days[dayIndex].services[0].mealOrder.filter(meal_id => Object.keys(meals).includes(meal_id)) ?? []}
                      setData={reorder(dayIndex)}
                      dataReference={meals}
                      showTime
                      mainTextKey='name'
                      rightTextKey='internal_name'
                      onPress={onPress}
                      del={del(dayIndex)}
                      addNew={addNew(dayIndex)}
                      {...Object.keys(meals).length && {
                        addExisting: addExisting(dayIndex)
                      }}
                      category='meal'
                    />
                  </View>
                </View>
              }
              else {
                return days[dayIndex].services.map((service, serviceIndex) => {
                  return <View key={serviceIndex + days[dayIndex].text[serviceIndex]} style={{ marginBottom: Layout.spacer.medium, }}>
                    <LargeText>{threeLetterDays[dayIndex]}: {days[dayIndex].text[serviceIndex]}</LargeText>
                    <ClarifyingText style={{ marginBottom: Layout.spacer.small }}>Press and hold the arrows to drag into desired order</ClarifyingText>
                    <View style={{ borderWidth: 1, borderColor: Colors.keygrey, borderRightColor: Colors.background }}>
                      <DraggableList
                        data={days[dayIndex].services[serviceIndex].mealOrder.filter(meal_id => Object.keys(meals).includes(meal_id)) ?? []}
                        setData={reorder(dayIndex, serviceIndex)}
                        dataReference={meals}
                        showTime
                        mainTextKey='name'
                        rightTextKey='internal_name'
                        onPress={onPress}
                        del={del(dayIndex, serviceIndex)}
                        addNew={addNew(dayIndex, serviceIndex)}
                        {...Object.keys(meals).length && {
                          addExisting: addExisting(dayIndex, serviceIndex)
                        }}
                        category='meal'
                      />
                    </View>
                  </View>
                })
              }
            })
          }



          <View style={{ marginVertical: Layout.spacer.medium, }}>
            <LargeText style={{}}>All meals</LargeText>
            <ClarifyingText style={{ marginBottom: Layout.spacer.small }}>Select a meal to edit or delete</ClarifyingText>

            <StaticList
              // data={test.sort()}
              data={objectToArray(meals).sort((a, b) => a.name > b.name)}
              mainTextKey='name'
              rightTextKey='internal_name'
              docIdKey='key'
              showTime
              onPress={(doc_id) => {
                dispatch(setTracker({ meal: doc_id }))
                navigation.navigate('Meal')
              }}
              del={(doc_id, rightText) => {
                Alert.alert(`Delete ${rightText || 'meal'}?`, `This will remove the meal from your entire system, including all hours above. This action cannot be undone.`, [
                  {
                    text: 'Yes', onPress: async () => {
                      try {
                        let newDays = {}
                        Object.keys(days).forEach(day => {
                          newDays[day] = { ...days[day] }
                          newDays[day].services = [...days[day].services]

                          newDays[day].services.forEach((service, index) => {
                            if (service.mealOrder.includes(doc_id)) {
                              newDays[day].services[index] = { ...service, mealOrder: service.mealOrder.filter(meal_id => meal_id !== doc_id) }
                            }
                          })
                        })

                        firebase.firestore().collection('restaurants').doc(restaurant_id)
                          .update({
                            days: newDays,
                            ['meals.' + [doc_id]]: firebase.firestore.FieldValue.delete()
                          })
                        setDays(newDays)
                      }
                      catch (error) {
                        console.log('mealListScreen delete error: ', error)
                        Alert.alert(`Could not delete meal`, 'Please try again. Contact Torte support if the issue persists.')
                      }
                    }
                  },
                  {
                    text: 'No, cancel',
                    style: 'cancel'
                  },
                ])
              }}
              addNew={() => navigation.navigate('Create', { category: 'meal' })}
              category={'meal'}
            />
          </View>
        </DisablingScrollView>
        <View style={{ marginVertical: Layout.spacer.small, flexDirection: 'row', justifyContent: 'space-around' }}>
          <MenuButton text='Discard changes' color={isDaysAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
            Alert.alert('Discard all changes?', undefined, [
              {
                text: 'Yes', onPress: () => {
                  setDays(fsDays)
                }
              },
              {
                text: 'Cancel',
                style: 'cancel'
              },
            ])
          }} disabled={!isDaysAltered} />
          <MenuButton text={isDaysAltered ? 'Save changes' : 'No changes'} color={isDaysAltered ? Colors.purple : Colors.darkgrey} buttonFn={() => updateDays()} disabled={!isDaysAltered} />
        </View>
      </SafeAreaView>
      {!!showMealList && <View style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: `rgba(0,0,0,0.9)`,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
        <LargeText style={{ marginBottom: Layout.spacer.small, fontWeight: 'bold' }}>Select meals</LargeText>
        <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <StaticList
              data={Object.keys(meals).filter(meal_id => {
                return !days[showMealList?.dayIndex]?.services[showMealList?.serviceIndex]?.mealOrder.includes(meal_id)
              }).sort((a, b) => meals[a].name > meals[b].name)}
              dataReference={meals}
              // labelTextKey
              mainTextKey='name'
              rightTextKey='internal_name'
              showTime
              onPress={(doc_id) => setNewMeals(prev => {
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
              category='meal'
              selected={newMeals}
            />
          </ScrollView>
        </View>
        <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
          <TouchableOpacity onPress={() => {
            setShowMealList(null)
          }}>
            <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setDays(prev => {
              setDays(prev => {
                let { dayIndex, serviceIndex } = showMealList
                let newServices = [...days[dayIndex].services]
                newServices[serviceIndex] = { ...days[dayIndex].services[serviceIndex], mealOrder: [...days[dayIndex].services[serviceIndex].mealOrder, ...newMeals] }
                return {
                  ...prev,
                  [dayIndex]: {
                    ...prev[dayIndex],
                    services: newServices
                  }
                }
              })
            })
            setShowMealList(null)
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
  body: {
    width: Layout.window.width * 0.7,
    alignSelf: 'center'
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,

    elevation: 10,
  },
  rectPadding: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  }
});

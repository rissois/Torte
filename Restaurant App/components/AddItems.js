import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Alert,
} from 'react-native';

import { useFocusEffect, } from '@react-navigation/native';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { useSelector, } from 'react-redux';
import { ClarifyingText, HeaderText, LargeText, MainText } from './PortalText';
import { MaterialIcons, } from '@expo/vector-icons';
import { getCurrentMenus } from '../functions/getCurrentMenus';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { fullDays, } from '../constants/DOTW';
import BillItemOrder from './BillItemOrder';
import Segment from './Segment';
import { demoDate, isDemo } from '../constants/demo';
import capitalize from '../functions/capitalize';

const segmentValues = {
  mods: 'Add-ons',
  specs: 'Specifications'
}

export default function AddItems({ closeModal, bill_id, valid, invalidAlert }) {
  let { restaurant: { days = {}, meals = {}, taxRates = {} }, menus = {}, sections = {}, items = {}, specifications = {}, modifications = {}, } = useSelector(state => state)

  const [day, setDay] = useState(isDemo() ? (demoDate).getDay() : (new Date()).getDay())
  const [meal, setMeal] = useState('')
  const [menu, setMenu] = useState('')
  const [section, setSection] = useState('')
  const [item, setItem] = useState('')
  const [availables, setAvailables] = useState({
    available_days: [], available_meals: [], available_menus: []
  })
  const [showDays, setShowDays] = useState(false)
  const [showMeals, setShowMeals] = useState(false)
  const [showMenus, setShowMenus] = useState(false)
  const [showSections, setShowSections] = useState(false)
  const [showItems, setShowItems] = useState(false)
  const [showExtras, setShowExtras] = useState(false)

  const [fullItemPosition, setFullItemPosition] = useState((new Date()).getDay())

  const [segment, setSegment] = useState(segmentValues.mods)
  const [spec, setSpec] = useState('')
  const [specOption, setSpecOption] = useState('')
  const [mod, setMod] = useState('')

  const [createItem, setCreateItem] = useState(false)

  useEffect(() => {
    if (!valid) {
      invalidAlert()
    }
  }, [valid])


  const onlyMealInDay = useCallback((day_no) => {
    let daysMeals = days[day_no].services.reduce((acc, service) => {
      let copy = [...acc]
      service.mealOrder.forEach(meal_id => {
        if (!copy.includes(meal_id)) {
          copy.push(meal_id)
        }
      })
      return copy
    }, [])

    if (daysMeals.length === 1) {
      setFullItemPosition(day_no.toString() + '0000')
      return daysMeals[0]
    }
    return ''
  }, [days])


  const onlyMenuInMeal = useCallback((meal_id) => {
    if (meals[meal_id].menus.length === 1) {
      setFullItemPosition(prev => prev + '00')
      return meals[meal_id].menus[0].menu_id
    }
    return ''
  }, [meals])


  const onlySectionInMenu = useCallback((menu_id) => {
    if (menus[menu_id].sectionOrder.length === 1) {
      setFullItemPosition(prev => prev + '00')
      return menus[menu_id].sectionOrder[0]
    }
    return ''
  }, [menus])


  const onlyItemInSection = useCallback((section_id) => {
    if (sections[section_id].itemOrder.length === 1) {
      setFullItemPosition(prev => prev + '00')
      return sections[section_id].itemOrder[0]
    }
    return ''
  }, [sections])

  useFocusEffect(useCallback(() => {
    setAvailables(getCurrentMenus(days, meals))
  }, [days, meals]))

  useEffect(() => {
    if (item) {
      setShowItems(false)

    }
    else {
      setShowItems(true)
    }
  }, [item])

  useEffect(() => {
    if (section) {
      if (!__DEV__) {
        setItem(onlyItemInSection(section))
      }
      setShowSections(false)
    }
    else {
      setShowSections(true)
    }
  }, [section])

  useEffect(() => {
    if (menu) {
      if (!__DEV__) {
        setSection(onlySectionInMenu(menu))
      }
      setShowMenus(false)
    }
    else {
      setShowMenus(true)
    }

  }, [menu])

  useEffect(() => {
    if (meal) {
      if (!__DEV__) {
        setMenu(onlyMenuInMeal(meal))
      }
      setShowMeals(false)

    }
    else {
      setShowMeals(true)
    }
  }, [meal])

  useEffect(() => {
    setMeal(onlyMealInDay(day))
    setShowDays(false)
  }, [day])

  if (item) {
    return <BillItemOrder
      bill_id={bill_id}
      menu_id={menu}
      section_id={section}
      item_id={item}
      full_item_position={fullItemPosition}
      invalidAlert={invalidAlert}
      valid={valid}
      close={(name) => {
        // if (added) {
        setItem('')
        // }
        setShowItems(true)

        if (name) {
          Alert.alert(capitalize(name) + ' successfully added to bill')
        }
      }}
    />
  }

  if (createItem) {
    return <BillItemOrder
      bill_id={bill_id}
      menu_id=''
      section_id=''
      item_id=''
      create
      invalidAlert={invalidAlert}
      valid={valid}
      close={(name) => {
        setCreateItem(false)
        if (section) {
          setShowItems(true)
        }
        else if (menu) {
          setShowItems(true)
          setShowSections(true)
        }
        else if (meal) {
          setShowItems(true)
          setShowSections(true)
          setShowMenus(true)
        }
        else if (day) {
          setShowItems(true)
          setShowSections(true)
          setShowMenus(true)
          setShowMeals(true)
        }
        else {
          setShowItems(true)
          setShowSections(true)
          setShowMenus(true)
          setShowMeals(true)
          setShowDays(true)
        }

        if (name) {
          Alert.alert(capitalize(name) + ' successfully added to bill')
        }
      }}
      full_item_position={'000000000'}
    />
  }

  return <View style={{ flex: 1, backgroundColor: Colors.background }}>
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', margin: 16, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => {
            if (item) {
              setShowItems(true)
              setItem('')
            }
            else if (createItem) {
              setCreateItem(false)
              if (section) {
                setShowItems(true)
              }
              else if (menu) {
                setShowSections(true)
              }
              else if (meal) {
                setShowMenus(true)
              }
              else if (day) {
                setShowMeals(true)
              }
              else {
                setShowDays(true)
              }
            }
            else {
              closeModal()
            }
          }}>
            <MaterialIcons
              name='arrow-back'
              size={38}
              color={Colors.white}
              style={{ marginLeft: 12 }}
            />
          </TouchableOpacity>
        </View>
        <View>
          <HeaderText center>Add item</HeaderText>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <TouchableOpacity onPress={() => {
            if (createItem) {
              setCreateItem(false)
              if (section) {
                setShowItems(true)
              }
              else if (menu) {
                setShowSections(true)
              }
              else if (meal) {
                setShowMenus(true)
              }
              else if (day) {
                setShowMeals(true)
              }
              else {
                setShowDays(true)
              }
            }
            else {
              setCreateItem(true)
              setShowDays(false)
              setShowMeals(false)
              setShowMenus(false)
              setShowSections(false)
              setShowItems(false)
            }
          }}>
            <MainText>one-time item</MainText>
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => {
            setShowExtras(prev => !prev)
          }}>
            <MainText>{showExtras ? 'Items' : 'Extras'}</MainText>
          </TouchableOpacity> */}
        </View>
      </View>

      {showExtras ?
        <View>
          <Segment
            segments={Object.values(segmentValues)}
            segment={segment}
            setSegment={setSegment}
          />

          {
            segment === segmentValues.mods ?
              <FlatList
                contentContainerStyle={styles.flatlist}
                numColumns={2}
                data={Object.keys(modifications).sort((a, b) => modifications[a].name.toLowerCase() > modifications[b].name.toLowerCase())}
                ListHeaderComponent={() => {
                  return <LargeText center>Select an add-on</LargeText>
                }}
                ListEmptyComponent={() => {
                  return <MainText center style={{ marginTop: 20 }}>Sorry, we cannot find any add-ons</MainText>
                }}
                keyExtractor={mod_id => mod_id}
                renderItem={({ item: mod_id }) => <SelectionBox
                  name={modifications[mod_id]?.name}
                  internal_name={modifications[mod_id]?.internal_name}
                  // price={modifications[mod_id]?.price}
                  onPress={() => {
                    setMod(mod_id)
                  }}
                  not_live={!modifications[mod_id]?.live}
                />}
              />
              :
              !spec ? <FlatList
                contentContainerStyle={styles.flatlist}
                numColumns={2}
                data={Object.keys(specifications).sort((a, b) => specifications[a].name.toLowerCase() > specifications[b].name.toLowerCase())}
                ListHeaderComponent={() => {
                  return <LargeText center>Select a specification</LargeText>
                }}
                ListEmptyComponent={() => {
                  return <MainText center style={{ marginTop: 20 }}>Sorry, we cannot find any add-ons</MainText>
                }}
                keyExtractor={spec_id => spec_id}
                renderItem={({ item: spec_id }) => <SelectionBox
                  name={specifications[spec_id]?.name}
                  internal_name={specifications[spec_id]?.internal_name}
                  onPress={() => {
                    setSpec(spec_id)
                  }}
                  not_live={!specifications[spec_id]?.live}
                />}
              /> :
                <FlatList
                  contentContainerStyle={styles.flatlist}
                  numColumns={2}
                  data={specifications[spec]?.options ?? []}
                  ListHeaderComponent={() => {
                    return <LargeText center>Select from {specifications[spec].name}</LargeText>
                  }}
                  ListEmptyComponent={() => {
                    return <MainText center style={{ marginTop: 20 }}>There are no items for this section</MainText>
                  }}
                  keyExtractor={option => option.name}
                  renderItem={({ item: option, index: optionIndex }) => <SelectionBox
                    name={option.name}
                    // price={option.price}
                    // internal_name={items[item_id]?.internal_name}
                    onPress={() => {
                      // hmmmm
                    }} />}
                />
          }
        </View> :
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <DropBox
              cat='Day'
              text={fullDays[day]}
              onPress={() => {
                setShowDays(true)
              }}
              shown={showDays}
              onDoublePress={() => { if (day) { setShowDays(false) } }}
            />

            <DropBox
              cat='Meal'
              text={meals[meal]?.name}
              onPress={() => {
                setShowMeals(true)
                setShowDays(false)
              }}
              disabled={!day}
              shown={showMeals && !showDays}
              onDoublePress={() => { if (meal) { setShowMeals(false) } }}
            />

            <DropBox
              cat='Menu'
              text={menus[menu]?.name}
              onPress={() => {
                setShowMenus(true)
                setShowMeals(false)
                setShowDays(false)
              }}
              disabled={!meal || !day}
              shown={showMenus && !showMeals && !showDays}
              onDoublePress={() => { if (menu) { setShowMenus(false) } }}
            />

            <DropBox
              cat='Section'
              text={sections[section]?.name}
              onPress={() => {
                setShowSections(true)
                setShowMenus(false)
                setShowMeals(false)
                setShowDays(false)
              }}
              disabled={!menu || !meal || !day}
              shown={showSections && !showMenus && !showMeals && !showDays}
              onDoublePress={() => { if (section) { setShowSections(false) } }}
            />
          </View>

          {
            showDays ?
              <FlatList
                contentContainerStyle={styles.flatlist}
                numColumns={2}
                data={Object.keys(days).sort()}
                keyExtractor={day => day}
                ListHeaderComponent={() => {
                  return <LargeText center>Select a day</LargeText>
                }}
                renderItem={({ item: day_no }) => <SelectionBox
                  name={fullDays[day_no]}
                  onPress={() => {
                    setItem('')
                    setSection('')
                    setMenu('')
                    setMeal('')
                    setDay(day_no)
                    setFullItemPosition(day_no.toString())
                    setShowDays(false)
                    setCreateItem(false)
                  }}
                  available={availables.available_days.includes(Number(day_no))}
                />}
              />
              : showMeals ?
                <FlatList
                  contentContainerStyle={styles.flatlist}
                  numColumns={2}
                  data={days[day]?.services.flatMap(service => service.mealOrder) ?? []}
                  keyExtractor={meal_id => meal_id}
                  ListHeaderComponent={() => {
                    return <LargeText center>Select a meal</LargeText>
                  }}
                  ListEmptyComponent={() => {
                    return <MainText center style={{ marginTop: 20 }}>There are no meals for this day</MainText>
                  }}
                  renderItem={({ item: meal_id }) => <SelectionBox
                    name={meals[meal_id]?.name}
                    internal_name={meals[meal_id]?.internal_name}
                    onPress={() => {
                      let serviceIndex = days[day].services.findIndex(service => {
                        return service.mealOrder.includes(meal_id)
                      })
                      let mealIndex = days[day].services[serviceIndex]?.mealOrder.indexOf(meal_id)
                      setItem('')
                      setSection('')
                      setMenu('')
                      setMeal(meal_id)
                      setFullItemPosition(day.toString() + padIndex(serviceIndex) + padIndex(mealIndex))
                      setShowMeals(false)
                      setCreateItem(false)
                    }}
                    available={availables.available_meals.includes(meal_id)}
                  />}

                />
                : showMenus ?
                  <FlatList
                    contentContainerStyle={styles.flatlist}
                    numColumns={2}
                    data={meals[meal]?.menus ?? []}
                    keyExtractor={menu => menu.menu_id}
                    ListHeaderComponent={() => {
                      return <LargeText center>Select a {meals[meal]?.name} menu</LargeText>
                    }}
                    ListEmptyComponent={() => {
                      return <MainText center style={{ marginTop: 20 }}>There are no menus for this meal</MainText>
                    }}
                    renderItem={({ item: { menu_id }, index: menuIndex },) => <SelectionBox
                      name={menus[menu_id]?.name}
                      internal_name={menus[menu_id]?.internal_name}
                      onPress={() => {
                        setItem('')
                        setSection('')
                        setMenu(menu_id)
                        setFullItemPosition(prev => prev.substring(0, 5) + padIndex(menuIndex))
                        setShowMenus(false)
                        setCreateItem(false)
                      }}
                      available={availables.available_menus.includes(menu_id)}
                    />}
                    ListFooterComponent={() => {
                      // If all menus are shown already, do not show this footer
                      if (meals[meal]?.menus.length === Object.keys(menus).length) {
                        return null
                      }

                      return <View>
                        <FlatList
                          contentContainerStyle={styles.flatlist}
                          numColumns={2}
                          data={Object.keys(menus).sort((a, b) => menus[a].name.toLowerCase() > menus[b].name.toLowerCase())}
                          ListHeaderComponent={() => {
                            return <View style={{ marginVertical: 20 }}>
                              <LargeText center> - or select any menu - </LargeText>
                              <ClarifyingText center>offline menus are highlighted in red</ClarifyingText>
                            </View>
                          }}
                          ListEmptyComponent={() => {
                            return <MainText center style={{ marginTop: 20 }}>Sorry, we cannot find any menus</MainText>
                          }}
                          keyExtractor={menu_id => menu_id}
                          renderItem={({ item: menu_id }) => <SelectionBox
                            name={menus[menu_id]?.name}
                            internal_name={menus[menu_id]?.internal_name}
                            onPress={() => {
                              setItem('')
                              setSection('')
                              setMenu(menu_id)
                              setShowMenus(false)
                              setCreateItem(false)

                              let menuIndexInCurrentMeal = meals[meal].menus.findIndex(menu => menu_id === menu.menu_id)
                              if (~menuIndexInCurrentMeal) {
                                // If the currently selected meal contains this menu, add on to it
                                setFullItemPosition(prev => prev.substring(0, 5) + padIndex(menuIndexInCurrentMeal))
                              }
                              else if (!menus[menu_id].live) {
                                setFullItemPosition('9999999')
                              }
                              else {
                                // Only check the available day for this menu. Otherwise, ignore and set to the bottom
                                let nestedPosition = ''
                                if (availables.available_menus.includes(menu_id)) {
                                  availables.available_days.some(day_no => {
                                    return days[day_no].services.some((service, serviceIndex) => {
                                      return service.mealOrder.some((meal_id, mealIndex) => {
                                        return meals[meal_id].menus.some((menu, menuIndex) => {
                                          if (menu.menu_id === menu_id) {
                                            nestedPosition = day_no.toString() + padIndex(serviceIndex) +
                                              padIndex(mealIndex) +
                                              padIndex(menuIndex)
                                            return true
                                          }
                                          return false
                                        })
                                      })
                                    })
                                  })
                                }

                                setFullItemPosition(nestedPosition || '9999999')
                              }
                            }}
                            available={availables.available_menus.includes(menu_id)}
                            not_live={!menus[menu_id]?.live}
                          />}
                        />
                      </View>
                    }}
                  />
                  :
                  showSections ?
                    <FlatList
                      contentContainerStyle={styles.flatlist}
                      numColumns={2}
                      data={menus[menu]?.sectionOrder ?? []}
                      ListHeaderComponent={() => {
                        return <LargeText center>Select a section</LargeText>
                      }}
                      ListEmptyComponent={() => {
                        return <MainText center style={{ marginTop: 20 }}>There are no sections for this menu</MainText>
                      }}
                      keyExtractor={section_id => section_id}
                      renderItem={({ item: section_id, index: sectionIndex }) => <SelectionBox
                        name={sections[section_id]?.name}
                        internal_name={section[section_id]?.internal_name}
                        onPress={() => {
                          setItem('')
                          setSection(section_id)
                          setShowSections(false)
                          setCreateItem(false)
                          setFullItemPosition(prev => prev.substring(0, 7) + padIndex(sectionIndex))
                        }} />}
                      ListFooterComponent={() => {
                        return <View>

                          <FlatList
                            contentContainerStyle={styles.flatlist}
                            numColumns={2}
                            data={menus[menu]?.sectionOrder
                              .flatMap(section_id => sections[section_id].itemOrder ?? [])
                              .sort((a, b) => items[a]?.name.toLowerCase() > items[b]?.name.toLowerCase())
                              ?? []}
                            ListHeaderComponent={() => {
                              return <LargeText center style={{ marginVertical: 20 }}> - or select an item - </LargeText>
                            }}
                            ListEmptyComponent={() => {
                              return <MainText center style={{ marginTop: 20 }}>Sorry, there are no items either</MainText>
                            }}
                            keyExtractor={item_id => item_id}
                            renderItem={({ item: item_id }) => <SelectionBox
                              name={items[item_id]?.name}
                              internal_name={items[item_id]?.internal_name}
                              // price={items[item_id]?.price}
                              onPress={() => {
                                // setShowSections(false)
                                setCreateItem(false)
                                menus[menu].sectionOrder.some((section_id, sectionIndex) => {
                                  if (sections[section_id].itemOrder.includes(item_id)) {
                                    // setSection(section_id)
                                    setFullItemPosition(prev => prev.substring(0, 7) +
                                      padIndex(sectionIndex) +
                                      padIndex(sections[section_id]?.itemOrder.indexOf(item_id))
                                    )
                                    return true
                                  }
                                })
                                setItem(item_id)
                              }} />}
                          />
                        </View>
                      }}
                    />
                    : showItems ?
                      <FlatList
                        contentContainerStyle={styles.flatlist}
                        numColumns={2}
                        data={sections[section]?.itemOrder ?? []}
                        ListHeaderComponent={() => {
                          return <LargeText center>Select an item</LargeText>
                        }}
                        ListEmptyComponent={() => {
                          return <MainText center style={{ marginTop: 20 }}>There are no items for this section</MainText>
                        }}
                        keyExtractor={item_id => item_id}
                        renderItem={({ item: item_id, index: itemIndex }) => <SelectionBox
                          name={items[item_id]?.name}
                          internal_name={items[item_id]?.internal_name}
                          // price={items[item_id]?.price}
                          onPress={() => {
                            setItem(item_id)
                            setShowItems(false)
                            setCreateItem(false)
                            setFullItemPosition(prev => prev.substring(0, 9) + padIndex(itemIndex))
                          }} />}
                      /> : null
          }
        </View>}
    </SafeAreaView>
  </View>
}

const padIndex = (index) => {
  if (~index) {
    return index.toString().padStart(2, '0')
  }
  return '99'
}

const DropBox = ({ cat, text, onPress, disabled, shown, onDoublePress }) => {
  const [width, setWidth] = useState(null)
  return <TouchableOpacity onPress={() => {
    if (shown) {
      onDoublePress()

    }
    else {
      onPress()
    }
  }} disabled={disabled} containerStyle={{ opacity: disabled ? 0.3 : 1 }}>
    <ClarifyingText>{cat}:</ClarifyingText>
    <View onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.height)} style={[styles.dropBox, { backgroundColor: shown ? Colors.purple : Colors.darkgrey, }]}>
      <MainText numberOfLines={1} ellipsizeMode='tail' style={{ flex: 1, color: text || shown ? Colors.softwhite : Colors.lightgrey, margin: 6 }}>{text ?? (shown ? '(select)' : cat.toLowerCase())}</MainText>
      <View style={[styles.dropBoxButton, { width: width, }]}>
        <MaterialIcons
          name='arrow-drop-down'
          color={Colors.softwhite}
          size={30} />
      </View>
    </View>
  </TouchableOpacity>
}

const SelectionBox = ({ name, internal_name, onPress, available, not_live = false }) => {
  return <TouchableOpacity onPress={onPress}>
    <View style={[styles.selectionBox, {
      backgroundColor: available ? Colors.darkgreen + 'DC' : not_live ? Colors.red : Colors.darkgrey,
    }]}>
      <View style={{ flexDirection: 'row', }}>
        <MainText numberOfLines={2} ellipsizeMode='tail' style={{ flex: 1, fontSize: 27, marginRight: 8 }}>{name}</MainText>
        {/* {!!price && <MainText>{centsToDollar(price)}</MainText>} */}
      </View>
      {!!internal_name && <ClarifyingText numberOfLines={1} ellipsizeMode='tail' >{internal_name}</ClarifyingText>}
    </View>
  </TouchableOpacity>
}

const styles = StyleSheet.create({
  dropBox: {
    flexDirection: 'row',
    width: Layout.window.width * 0.20,
    borderRadius: 8,
    borderColor: Colors.softwhite,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4
  },
  dropBoxButton: {
    borderLeftColor: Colors.softwhite,
    borderLeftWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatlist: {
    marginVertical: 20,
    paddingBottom: Layout.window.height * 0.2
  },
  selectionBox: {
    width: Layout.window.width * 0.5 - 60,
    marginLeft: 40,
    marginTop: 20,
    borderRadius: 8,
    padding: 12,
    // borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.30,
    shadowRadius: 5.30,

    elevation: 7,
  },

});


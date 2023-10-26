import React, { useEffect, useState, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Alert,
  Text,
} from 'react-native';
import Colors from '../constants/Colors'
import firebase from '../config/Firebase';
import { useSelector, } from 'react-redux';
import { ClarifyingText, HeaderText, LargeText, MainText, } from '../components/PortalText'
import { MaterialIcons, } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlatList, PanGestureHandler, State } from 'react-native-gesture-handler';
import useRestaurant from '../hooks/useRestaurant';

export default function TablesScreen({ navigation }) {
  const { privateDocs: { tableSections }, tables, system: { table_order } } = useSelector(state => state)
  const restaurant_id = useRestaurant()
  const tableSectionsRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
    .collection('restaurantPrivate').doc('tableSections')
  const [dragging, setDragging] = useState(false)
  const [tableBoundary, setTableBoundary] = useState(0)
  const [sectionOffset, setSectionOffset] = useState(0)
  const [sectionScrollDistance, setSectionScrollDistance] = useState(0)
  const [sectionHeights, setSectionHeights] = useState([])
  const [sortedSections, setSortedSections] = useState([])
  // const [point] = useState(new Animated.ValueXY({ x: 0, y: 0 }))
  const [translateX] = useState(new Animated.Value(0))
  const [translateY] = useState(new Animated.Value(0))
  const insets = useSafeAreaInsets();
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 })
  const [sectionTableSize, setSectionTableSize] = useState({ width: 0, height: 0 })
  const [activeTable, setActiveTable] = useState({
    table_id: '',
    section_id: '',
  })

  useEffect(() => {
    setSortedSections(Object.keys(tableSections).sort((a, b) => tableSections[a].name > tableSections[b].name))
  }, [tableSections])

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: false }
  );
  // const onGestureEvent = ({ nativeEvent }) => {
  //   point.setValue({ x: nativeEvent.absoluteX - nativeEvent.x, y: nativeEvent.absoluteY - nativeEvent.y })
  // }


  const onHandlerStateChange = (table_id, section_id = '') => ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.absoluteX < tableBoundary) {
        if (activeTable.section_id) {
          console.log('Remove ' + tables[activeTable.table_id].table_details.name + ' from section ' + tableSections[activeTable.section_id].name)
          try {
            tableSectionsRef.set({
              [section_id]: {
                tables: firebase.firestore.FieldValue.arrayRemove(activeTable.table_id)
              }
            }, { merge: true })
          }
          catch (error) {
            console.log('Add error: ', error)
            Alert.alert('Failed to remove table from section', 'Please contact Torte support if the issue persists')
          }
        }
        else {
          console.log('Table ' + tables[activeTable.table_id].table_details.name + ' pulled back into table area')
        }
      }
      else {
        let endFlatlistPosition = nativeEvent.absoluteY + sectionScrollDistance - sectionOffset - insets.top
        if (endFlatlistPosition > 0) {
          let accHeights = 0
          let sectionIndex = sectionHeights.findIndex(height => {
            accHeights += height
            if (endFlatlistPosition <= accHeights) {
              return true
            }
            return false
          })

          if (~sectionIndex) {
            let section_id = sortedSections[sectionIndex]
            let old_section = activeTable.section_id || Object.keys(tableSections).find(ts_id => {
              return tableSections[ts_id].tables.includes(table_id)
            })
            if (old_section === section_id) {
              // don't do anything if section was not changed
            }
            else if (old_section) {
              console.log('Transfer ' + tables[activeTable.table_id]?.table_details?.name + ' to section ' + tableSections[section_id]?.name)
              try {
                tableSectionsRef.set({
                  [section_id]: {
                    tables: firebase.firestore.FieldValue.arrayUnion(activeTable.table_id)
                  },
                  [old_section]: {
                    tables: firebase.firestore.FieldValue.arrayRemove(activeTable.table_id)
                  }
                }, { merge: true })
              }
              catch (error) {
                console.log('Add error: ', error)
                Alert.alert('Failed to add table to section', 'Please contact Torte support if the issue persists')
              }
            }
            else {
              console.log('Add ' + tables[activeTable.table_id]?.table_details?.name + ' to section ' + tableSections[section_id]?.name)
              try {
                tableSectionsRef.set({
                  [section_id]: {
                    tables: firebase.firestore.FieldValue.arrayUnion(activeTable.table_id)
                  }
                }, { merge: true })
              }
              catch (error) {
                console.log('Add error: ', error)
                Alert.alert('Failed to add table to section', 'Please contact Torte support if the issue persists')
              }
            }
          }
        }
      }
      setDragging(false)
      setActiveTable({
        table_id: '',
        section_id: '',
      })
    }
    else if (nativeEvent.state === State.BEGAN) {
      setDragging(true)
      setActiveTable({ section_id, table_id })
      translateX.setOffset(nativeEvent.absoluteX - nativeEvent.x)
      translateY.setOffset(nativeEvent.absoluteY - nativeEvent.y)
    }
    else if (nativeEvent.state === State.ACTIVE) {

    }
  };

  const getSectionNameForTable = (table_id) => {
    return tableSections[Object.keys(tableSections).find(ts_id => {
      return tableSections[ts_id].tables.includes(table_id)
    })]?.name
  }

  return <View style={{ flex: 1, backgroundColor: Colors.background }}>
    {dragging && <Animated.View style={[styles.box, styles.floating,
      , {
      shadowColor: "#aaa",
      transform: [
        { translateX: translateX },
        { translateY: translateY },
      ],
      ...activeTable.section_id ? {
        ...sectionTableSize,
        backgroundColor: Colors.softwhite,
      } : {
        ...tableSize,
        backgroundColor: getSectionNameForTable(activeTable.table_id) ? Colors.darkgrey : Colors.red
      }
    }]}>
      <LargeText style={{ ...activeTable.section_id && { color: Colors.black } }}><Text style={{ fontWeight: 'bold' }}>{tables[activeTable.table_id].table_details.code}</Text> {tables[activeTable.table_id]?.table_details.name ?? 'unknown'}</LargeText>
      <MainText style={{ ...activeTable.section_id && { color: Colors.black } }}>{getSectionNameForTable(activeTable.table_id) ?? '(no section)'}</MainText>
    </Animated.View>}
    <SafeAreaView style={{ flex: 1, }}>
      <View onLayout={({ nativeEvent }) => {
        setSectionOffset(nativeEvent.layout.height)
      }} style={{ paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', padding: 12, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons
                name='arrow-back'
                size={38}
                color={Colors.softwhite}
              />
            </TouchableOpacity>
          </View>
          <HeaderText>Tables {'&'} Sections</HeaderText>
          <View style={{ flex: 1 }} />
        </View>
        <View style={{}}>
          <MainText center>Drag tables to add/remove from sections</MainText>
          <MainText center>Tap a table or section to edit or delete it</MainText>
        </View>
      </View>



      <View style={{ flexDirection: 'row', flex: 1, }}>
        <View onLayout={({ nativeEvent }) => {
          setTableBoundary(nativeEvent.layout.width)
        }} style={{
          flex: 5,
        }}>
          <FlatList
            contentContainerStyle={{ opacity: dragging && activeTable.section_id ? 0.1 : 1 }}
            data={table_order}
            keyExtractor={(item => item)}
            ListEmptyComponent={() => {
              return <LargeText center style={{ marginTop: 50 }}>No tables yet.</LargeText>
            }}
            renderItem={({ item: table_id }) => {
              if (!tables[table_id] || tables[table_id].table_details.code === 'MN' || tables[table_id].table_details.code === 'TG') {
                return null
              }
              let section_name = getSectionNameForTable(table_id)
              return <TouchableOpacity onPress={() => { navigation.navigate('Table', { table_id }) }}><PanGestureHandler
                activeOffsetX={15}
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange(table_id)}>
                <View onLayout={({ nativeEvent }) => {
                  if (!tableSize.width) {
                    setTableSize({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })
                  }
                }} style={[styles.box, styles.tables, {
                  opacity: table_id === activeTable.table_id && !activeTable.section_id ? 0.5 : 1,
                  backgroundColor: section_name ? Colors.darkgrey : Colors.red + 'AA'
                }]}>
                  <LargeText><Text style={{ fontWeight: 'bold' }}>{tables[table_id].table_details.code}</Text> {tables[table_id].table_details.name}</LargeText>
                  <MainText>{section_name ?? '(no section)'}</MainText>
                </View>
              </PanGestureHandler>
              </TouchableOpacity>
            }}
            ListFooterComponent={() => {
              return <TouchableOpacity onPress={() => {
                navigation.navigate('Table')
              }} style={styles.new}>
                <LargeText>Add table</LargeText>
              </TouchableOpacity>
            }}
          />
          {dragging && !!activeTable.section_id && <View style={[styles.floating, { left: 0, right: 0, top: 100, }]}>
            <HeaderText center style={{ marginHorizontal: 20 }}>
              Drag here to remove from section
            </HeaderText>
          </View>}
        </View>
        <View style={{ flex: 8, backgroundColor: Colors.purple + '44' }}>
          <FlatList
            data={sortedSections}
            keyExtractor={(item => item)}
            onScroll={({ nativeEvent }) => {
              setSectionScrollDistance(nativeEvent.contentOffset.y)
            }}
            scrollEventThrottle={16}
            ListEmptyComponent={() => {
              return <LargeText center style={{ marginTop: 50 }}>No sections yet.</LargeText>
            }}
            // ListHeaderComponent={() => <View style={{ height: 50 }} />}
            renderItem={({ item: section_id, index }) => {
              if (!tableSections[section_id]) {
                return null
              }
              return <View onLayout={({ nativeEvent }) => {
                setSectionHeights(prev => {
                  let next = [...prev]
                  next[index] = nativeEvent.layout.height
                  return next
                })
              }}>
                <View style={styles.sections}>
                  <TouchableOpacity onPress={() => { navigation.navigate('TableSection', { section_id }) }}>
                    <View style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}>
                      <HeaderText style={{ flex: 1 }}>{tableSections[section_id].name}    </HeaderText>
                      <MainText>(edit section)</MainText>
                    </View>
                  </TouchableOpacity>
                  {
                    tableSections[section_id].tables.length ?
                      tableSections[section_id].tables.sort((a, b) => table_order.indexOf(a) - table_order.indexOf(b)).map(table_id => {
                        if (!tables[table_id]) {
                          return null
                        }
                        return <TouchableOpacity onLayout={({ nativeEvent }) => {
                          if (!sectionTableSize.height) {
                            setSectionTableSize({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })
                          }
                        }} key={table_id} onPress={() => { navigation.navigate('Table', { table_id }) }}><PanGestureHandler
                          activeOffsetX={-15}
                          onGestureEvent={onGestureEvent}
                          onHandlerStateChange={onHandlerStateChange(table_id, section_id)}>
                            <View style={[styles.box, styles.tables, { backgroundColor: Colors.softwhite, opacity: table_id === activeTable.table_id && section_id === activeTable.section_id ? 0.3 : 1 }]}>
                              <LargeText style={{ color: Colors.black }}><Text style={{ fontWeight: 'bold' }}>{tables[table_id].table_details.code}</Text> {tables[table_id].table_details.name}</LargeText>
                              <MainText style={{ color: Colors.black }}>{getSectionNameForTable(table_id) ?? '(no section)'}</MainText>
                            </View>
                          </PanGestureHandler>
                        </TouchableOpacity>
                      }) :
                      <View style={styles.dragBox}>
                        <LargeText center>Drag table here</LargeText>
                      </View>
                  }
                </View>
              </View>
            }}
            ListFooterComponent={() => {
              return <TouchableOpacity onPress={() => {
                navigation.navigate('TableSection')
              }} style={styles.new}>
                <LargeText>Add section</LargeText>
              </TouchableOpacity>
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  </View>

}

const styles = StyleSheet.create({
  box: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.darkgrey,
  },
  floating: {
    zIndex: 2,
    position: 'absolute',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 1,
    shadowRadius: 9.51,

    elevation: 15,
  },
  tables: {
    marginVertical: 10,
    marginHorizontal: 20,
  },
  sections: {
    paddingVertical: 24,
    marginVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: Colors.softwhite
  },
  new: {
    alignSelf: 'center',
    marginVertical: 40,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: Colors.darkgreen,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 1,
    shadowRadius: 9.51,

    elevation: 15,
  },
  dragBox: {
    alignSelf: 'center',
    borderColor: Colors.softwhite,
    borderWidth: 2,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 4,
    borderStyle: 'dashed',
  }
});
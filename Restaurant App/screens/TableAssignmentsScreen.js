import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Alert,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { useSelector, shallowEqual } from 'react-redux';
import { ClarifyingText, HeaderText, LargeText, MainText, } from '../components/PortalText'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, } from 'react-native-safe-area-context';
import { FlatList, TouchableOpacity, } from 'react-native-gesture-handler';
import Segment from '../components/Segment';
import commaList from '../functions/commaList';
import { StaticList } from '../components/PortalRow';
import { writeTransferTables } from '../transactions/writeTransferTables';
import { writeTransferBills } from '../transactions/writeTransferBills';
import { dateToClock } from '../functions/dateAndTime';
import RenderOverlay from '../components/RenderOverlay';
import useFilteredBills from '../hooks/useFilteredBills';
import useRestaurant from '../hooks/useRestaurant';

const segmentValues = {
  sections: 'Sections',
  tables: 'Tables',
}

/*
  THERE ARE STILL A LOT OF UNTESTED COMPONENTS
  Plus you have not written the code to display bills to transfer
  OR select bills to transfer
    including select/unselect all
  The error could use work
  AND likely you'll want a (optional?) param to writeTransferBills about open/close status
*/

/*
  Render overlay during a transfer
  Once complete: 
    IF this was not a removal (i.e. added server to table)
    REGARDLESS of manager or user
    CHECK for any open bills on this table
  If open bills are found:
    Turn renderoverlay into a selection of bills to transfer
    Attempt to transfer
    Alert if any issues transferring (can just say table, tell previous server to log in to attempt again)
  else if this was a transfer and not an assignment
    Alert that there were no open bills for the table
  if just an assignment, no need to alert
*/

// ??? You need to transfer bills even if there is a manager transferring

export default function TableAssignmentsScreen({ navigation, route = {} }) {
  let { manager, tableTransfer } = route.params ?? {}
  const { privateDocs: { tableSections }, tables, system: { table_order }, employees, user, } = useSelector(state => state)
  const minibills = useSelector(state => state.minibills, shallowEqual)
  const { openBillsInTables } = useFilteredBills()
  const restaurant_id = useRestaurant()

  const [sortedSections, setSortedSections] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [showOpenBills, setShowOpenBills] = useState(null)
  const [selectedTransferBills, setSelectedTransferBills] = useState([])
  const [isTransferring, setIsTransferring] = useState(false)
  const [openBills, setOpenBills] = useState([])

  useEffect(() => {
    setSortedSections(Object.keys(tableSections).sort((a, b) => tableSections[a].name > tableSections[b].name))
  }, [tableSections])

  useEffect(() => {
    if (tableTransfer) {
      initiateTransfer(tableTransfer.table_ids, tableTransfer.to, tableTransfer.from)
      navigation.setParams({ tableTransfer: undefined })
    }
  }, [tableTransfer])

  const [segment, setSegment] = useState(segmentValues.sections)
  const [assign, setAssign] = useState({})

  const getSectionNameForTable = (table_id) => {
    return tableSections[Object.keys(tableSections).find(ts_id => {
      return tableSections[ts_id].tables.includes(table_id)
    })]?.name
  }

  const initiateTransfer = useCallback(async (table_ids, new_employee_id, old_employee_id) => {
    if (typeof table_ids === 'string') {
      table_ids = [table_ids]
    }

    if (!new_employee_id || new_employee_id !== old_employee_id) {
      try {
        setIsTransferring('tables')
        await writeTransferTables(restaurant_id, table_ids, new_employee_id, employees[new_employee_id]?.name)

        // only show the open bills selection if this is a transfer OR there were in fact open bills on these tables
        if ((new_employee_id && old_employee_id) || Object.keys(openBillsInTables).some(table_id => openBillsInTables[table_id]?.length)) {
          setShowOpenBills({ table_ids, to: new_employee_id, from: old_employee_id })

        }
      }
      catch (error) {
        console.log('Error with assignment: ', error)
        Alert.alert(`Failed to ${new_employee_id ? old_employee_id ? 'transfer' : 'assign to' : 'remove from'} ${table_ids.length > 1 ? 'tables' : 'table'}`,
          'Please try again and contact Torte support if the issue persists')
      }
      finally {
        setIsTransferring('')
        setAssign({})
      }
    }
  }, [employees, openBillsInTables])

  const createOpenBillArray = (table_ids = [], from) => {

    setOpenBills(
      table_order
        // only use tables there were transfered
        .filter(table_id => table_ids.includes(table_id))
        // Reduce down to a flat array
        .reduce((bills, table_id) => {
          let copy = [...bills]
          // Find tables that have open bills
          if (openBillsInTables[table_id]?.length) {
            // Check those open bills are valid for transfer and add to the list
            openBillsInTables[table_id].forEach(bill_id => {
              let { server_id, table_id, ref_code, created } = minibills[bill_id]
              if (!server_id || server_id !== from) {
                copy.push({
                  table_id,
                  bill_id,
                  server_id: server_id,
                  time: dateToClock(new Date(created)),
                  ref_code: ref_code,
                })
              }
            })
          }
          return copy
        }, [])
    )
  }

  return <View style={{ flex: 1, backgroundColor: Colors.background }}>
    <SafeAreaView style={{ flex: 1, }}>
      <View style={{ paddingBottom: 10 }}>
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
          <HeaderText>{manager ? 'Table Assignments' : 'Select sections'}</HeaderText>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {manager && <TouchableOpacity onPress={() => { navigation.navigate('Tables') }}>
              <MainText>Edit {segment.toLowerCase()}</MainText>
            </TouchableOpacity>}
          </View>
        </View>
      </View>

      <Segment
        segments={Object.values(segmentValues)}
        segment={segment}
        setSegment={setSegment}
      />

      {
        segment === segmentValues.sections ?
          <FlatList
            contentContainerStyle={{ marginHorizontal: Layout.window.width * 0.2, marginTop: 20 }}
            data={sortedSections}
            keyExtractor={item => item}
            ListEmptyComponent={() => <View style={{ marginTop: 50 }}>
              <LargeText center>No sections</LargeText>
              {manager && <TouchableOpacity onPress={() => { navigation.navigate('Tables') }} style={{ marginTop: Layout.spacer.small, borderRadius: 12, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: Colors.purple }}>
                <LargeText>Go to Tables {'&'} Sections</LargeText>
              </TouchableOpacity>}
            </View>}
            renderItem={({ item: section_id }) => {
              let section = tableSections[section_id]
              let tablesByServer = {}
              let unassignedTables = []
              table_order.forEach(table_id => {
                if (section.tables.includes(table_id)) {
                  let server_id = tables[table_id].server_details.id
                  if (server_id) {
                    if (tablesByServer[server_id]) {
                      tablesByServer[server_id].push(table_id)
                    }
                    else {
                      tablesByServer[server_id] = [table_id]
                    }
                  }
                  else {
                    unassignedTables.push(table_id)
                  }
                }
              })

              const empty = !section.tables.length
              const unassigned = !Object.keys(tablesByServer).length
              const mixed = Object.keys(tablesByServer).length > 1 || (Object.keys(tablesByServer).length === 1 && !!unassignedTables.length)
              const single = Object.keys(tablesByServer).length === 1 && !unassignedTables.length && employees[Object.keys(tablesByServer)[0]].name
              const mySection = !manager && tablesByServer.hasOwnProperty(user)

              return <View style={[styles.section, { backgroundColor: (manager && unassigned || (!manager && !mySection)) ? Colors.red : Colors.darkgrey }]}>
                <LargeText style={{ fontWeight: 'bold' }}>{section.name}{empty ? '' : unassigned ? ': No server' : mixed ? ': mixed' : single ? ': ' + single : ''}</LargeText>
                <View style={{ paddingVertical: 8, paddingLeft: Layout.spacer.medium }}>
                  {
                    empty ?
                      <View>
                        <MainText style={{ fontWeight: 'bold' }}>No tables</MainText>
                      </View> :
                      unassigned ?
                        <View>
                          <MainText>for {commaList(section.tables.map(table_id => tables[table_id].table_details.name))}</MainText>
                        </View> :
                        <View>
                          {
                            Object.keys(tablesByServer).map(server_id => {
                              return <MainText key={server_id}>{employees[server_id].name}: {commaList(tablesByServer[server_id].map(table_id => tables[table_id].table_details.name))}</MainText>
                            })
                          }
                          {
                            !!unassignedTables.length && <MainText style={{ color: !manager && !mySection ? Colors.softwhite : Colors.red, fontWeight: 'bold' }}>Unassigned: {commaList(unassignedTables.map(table_id => tables[table_id].table_details.name))}</MainText>
                          }
                        </View>
                  }
                </View>
                {
                  empty ?
                    null :
                    unassigned ?
                      <TouchableOpacity style={styles.serverButton} onPress={async () => {
                        if (manager) {
                          setAssign({ section: true, id: section_id })
                        }
                        else {
                          initiateTransfer(section.tables, user)
                        }
                      }}>
                        <MainText center>{manager ? 'assign server' : 'claim section'}</MainText>
                      </TouchableOpacity> :
                      (manager || mySection) ?
                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
                          <TouchableOpacity style={styles.serverButton} onPress={() => {
                            if (manager) {
                              setAssign({ section: true, id: section_id, current: Object.keys(tablesByServer) })
                            }
                            else {
                              setAssign({ transfer_ids: tablesByServer[user], current: [user] })
                              // ??? assign transfer out with PIN !only do tablesByServer[server_id]
                            }
                          }}>
                            <MainText center>{manager ? 'replace server(s)' : 'transfer tables'}</MainText>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.serverButton} onPress={() => {
                            Alert.alert('Remove ' + (manager ? mixed ? 'servers' : single : 'yourself') + ' from ' + section.name + '?', manager ? single ? single + ' will remain on all bills.' : 'Servers will remain on their bills.' : 'You will remain on all bills', [
                              {
                                text: 'Yes, remove',
                                onPress: () => initiateTransfer(manager ? section.tables : tablesByServer[user])
                              },
                              {
                                text: 'No, cancel',
                                style: 'cancel'
                              }
                            ])
                          }}>
                            <MainText center>{manager ? 'remove server(s)' : 'unclaim section'}</MainText>
                          </TouchableOpacity>
                        </View> :
                        Object.keys(tablesByServer).length === 1 ?
                          <TouchableOpacity style={styles.serverButton} onPress={async () => {
                            navigation.navigate('Pin', {
                              employee_id: Object.keys(tablesByServer)[0],
                              tableTransfer: {
                                table_ids: section.tables,
                                to: user,
                                from: Object.keys(tablesByServer)[0],
                                screen: 'TableAssignments'
                              }
                            })
                            // ??? get pin of Object.keys(tablesByServer)[0]
                          }}>
                            <MainText center>{'request section'}</MainText>
                          </TouchableOpacity> :

                          <MainText center>cannot request from multiple people</MainText>
                }

              </View>
            }}
          /> :
          <FlatList
            contentContainerStyle={{ marginHorizontal: Layout.window.width * 0.2, marginTop: 20 }}
            data={table_order}
            keyExtractor={item => item}
            ListEmptyComponent={() => <View style={{ marginTop: 50 }}>
              <LargeText center>No tables</LargeText>
              {manager && <TouchableOpacity onPress={() => { navigation.navigate('Tables') }} style={{ marginTop: Layout.spacer.small, borderRadius: 12, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: Colors.purple }}>
                <LargeText>Go to Tables {'&'} Sections</LargeText>
              </TouchableOpacity>}
            </View>}
            renderItem={({ item: table_id }) => {
              let { table_details: { name: table_name }, server_details: { id, name: server_name } } = tables[table_id]

              const section_name = getSectionNameForTable(table_id) ?? ''
              const myTable = id === user

              return <View style={[styles.section, {
                backgroundColor:
                  manager ? !server_name ? Colors.red : Colors.darkgrey :
                    id === user ? Colors.darkgreen + 'DD' : server_name ? Colors.red : Colors.darkgrey
              }]}>
                <LargeText style={{ fontWeight: 'bold' }}>{table_name}: {server_name || 'No server'}</LargeText>
                {!!section_name && <ClarifyingText>Part of {section_name}</ClarifyingText>}
                {
                  server_name ?
                    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
                      <TouchableOpacity style={styles.serverButton} onPress={() => {
                        if (manager) {
                          setAssign({ section: false, id: table_id, current: [id] })
                        }
                        else if (myTable) {
                          // ??? Transfer table out, BUT you need to get PIN
                          setAssign({ transfer_ids: [table_id], current: [user] })
                        }
                        else {
                          navigation.navigate('Pin', {
                            employee_id: id,
                            tableTransfer: {
                              table_ids: [table_id],
                              to: user,
                              from: id,
                              screen: 'TableAssignments'
                            }
                          })
                          // ???? Request table from BUT you need to get PIN
                        }
                      }}>
                        <MainText center>{manager ? 'replace server' : myTable ? 'transfer' : 'request'}</MainText>
                      </TouchableOpacity>
                      {(myTable || manager) && <TouchableOpacity style={styles.serverButton} onPress={() => {
                        Alert.alert('Remove ' + (manager ? server_name : 'yourself') + ' from ' + table_name + '?', (manager ? server_name : 'You') + ' will remain on any bills for this table.' + (section_name ? 'This does not affect assignments to other tables in ' + section_name : ''), [
                          {
                            text: 'Yes, remove',
                            onPress: () => initiateTransfer(table_id)
                          },
                          {
                            text: 'No, cancel',
                            style: 'cancel'
                          }
                        ])

                      }}>
                        <MainText center>{manager ? 'remove server' : 'unclaim'}</MainText>
                      </TouchableOpacity>}
                    </View> :
                    <TouchableOpacity style={styles.serverButton} onPress={async () => {
                      if (manager) {
                        setAssign({ section: false, id: table_id })
                      }
                      else {
                        initiateTransfer(table_id, user)
                      }
                    }}>
                      <MainText center>{manager ? 'assign server' : 'claim table'}</MainText>
                    </TouchableOpacity>
                }

              </View>
            }}
          />
      }

      {
        !!Object.keys(assign).length && <View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,0.9)`,
            justifyContent: 'center',
            padding: Layout.window.width * 0.1
          },
        ]}>
          <View style={{ backgroundColor: Colors.background, flex: 1, marginBottom: Layout.spacer.medium, }}>
            {
              assign.transfer_ids ? <View style={{ paddingVertical: Layout.spacer.medium }}>
                <LargeText center >{`Transfer ${assign.transfer_ids.length > 1 ? 'tables' : 'table'} to`}</LargeText>
              </View> :
                <View style={{ paddingVertical: Layout.spacer.medium }}>
                  <LargeText center >{assign.current ? 'Replace server on ' : 'Assign server to '}{assign.section ? tableSections[assign?.id]?.name : tables[assign?.id]?.table_details.name}</LargeText>
                  {!!assign.current && <MainText center>(currently {assign.current > 1 ? 'mixed' : employees[assign.current[0]].name})</MainText>}
                </View>}

            <View style={{ marginHorizontal: 20 }}>
              <StaticList
                data={Object.keys(employees).filter(id => {
                  if (assign.current.length === 1) {
                    return id !== assign.current[0]
                  }
                  else if (assign.transfer_ids) {
                    return id !== user
                  }
                }).sort((a, b) => employees[a].name > employees[b].name)}
                dataReference={employees}
                // labelTextKey
                mainTextKey='name'
                onPress={(doc_id) => setSelectedEmployee(prev => {
                  if (prev === doc_id) {
                    return ''
                  }
                  return doc_id
                })}
                selected={[selectedEmployee]}
                category='employee'
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <TouchableOpacity styles={styles.serverButton} onPress={() => {
              setSelectedEmployee('')
              setAssign({})
            }}>
              <LargeText style={{ color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
            </TouchableOpacity>
            <TouchableOpacity disabled={!selectedEmployee} styles={styles.serverButton}
              onPress={() => {
                if (assign.transfer_ids) {
                  navigation.navigate('Pin', {
                    employee_id: selectedEmployee,
                    tableTransfer: {
                      table_ids: assign.transfer_ids,
                      to: selectedEmployee,
                      from: user,
                      screen: 'TableAssignments'
                    }
                  })
                }
                else {
                  const table_ids = assign.section ? tableSections[assign.id].tables : assign.id
                  if (assign.current) {
                    let mixed = assign.current.length > 1
                    Alert.alert('Are you sure you want to replace ' + (mixed ? 'all servers' : employees[assign.current[0]].name) + ' on ' + (assign.section ? tableSections[assign?.id]?.name : tables[assign?.id]?.table_details.name) + '?', undefined, [
                      {
                        text: 'Yes, transfer',
                        onPress: () => initiateTransfer(table_ids, selectedEmployee, mixed ? '' : assign.current)
                      },
                      {
                        text: 'No, cancel',
                        style: 'cancel'
                      }
                    ])
                  }
                  else {
                    initiateTransfer(table_ids, selectedEmployee,)
                  }
                }
                setSelectedEmployee('')
              }}
            >
              <LargeText style={{ color: selectedEmployee ? Colors.green : Colors.lightgrey, fontWeight: 'bold' }}>CONFIRM</LargeText>
            </TouchableOpacity>
          </View>
        </View>
      }
      {
        !!showOpenBills && <View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,0.9)`,
            justifyContent: 'center',
            padding: Layout.window.width * 0.1
          },
        ]}>
          <View style={{ backgroundColor: Colors.background, flex: 1, marginBottom: Layout.spacer.medium, }}>
            <View style={{ marginHorizontal: 20, paddingHorizontal: 20 }}>
              <View style={{ marginVertical: 20 }}>
                <LargeText center>These table{showOpenBills.table_ids.length > 1 ? 's' : ''} may have open bills</LargeText>
                <MainText center>Select any open bills that{'\n'}should be re-assigned to {employees[showOpenBills.to].name}</MainText>

                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 }}>
                  <TouchableOpacity onPress={() => setSelectedTransferBills([])}>
                    <MainText>unselect all</MainText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedTransferBills(openBills.map(({ bill_id }) => bill_id))}>
                    <MainText>select all</MainText>
                  </TouchableOpacity>
                </View>
              </View>


              <FlatList
                data={openBills}
                keyExtractor={item => item.bill_id}
                ListEmptyComponent={() => {
                  return <View>
                    <LargeText style={{ marginVertical: 50 }}>There are no open bills for transfer</LargeText>
                  </View>
                }}
                renderItem={({ item: { table_id, bill_id, server_id, time, ref_code } }) => {
                  return <TouchableOpacity style={{ flexDirection: 'row', backgroundColor: Colors.darkgrey, padding: 12, alignItems: 'center' }} onPress={() => {
                    setSelectedTransferBills(prev => {
                      let index = prev.indexOf(bill_id)
                      if (~index) {
                        let next = [...prev]
                        next.splice(index, 1)
                        return next
                      }
                      return [...prev, bill_id]
                    })
                  }}>
                    <MaterialCommunityIcons
                      name='checkbox-marked-circle-outline'
                      color={selectedTransferBills.includes(bill_id) ? Colors.green : Colors.darkgrey}
                      size={50}
                      style={{ marginRight: 12, }}
                    />
                    <View style={{ flex: 1 }}>
                      <LargeText>{tables[table_id].table_details.name}</LargeText>
                      <MainText>{time}</MainText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <LargeText>#{ref_code}</LargeText>
                      <MainText>{employees[server_id]?.name ?? '(no server)'}</MainText>
                    </View>
                  </TouchableOpacity>
                }}
                ListFooterComponent={() => {
                  if (!openBills.length) {
                    return null
                  }
                  return <View>
                    <MainText center style={{ marginVertical: 50 }}>No further bills</MainText>
                  </View>
                }}
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <TouchableOpacity styles={styles.serverButton}
              onPress={async () => {
                try {
                  if (selectedTransferBills.length) {
                    setIsTransferring('bills')
                    let results = await writeTransferBills(restaurant_id, selectedTransferBills, {
                      id: showOpenBills.to,
                      name: employees[showOpenBills.to].name
                    })

                    // ??? Not sure how results output yet... or if that even works
                    // results.forEach(result => console.log(result))
                  }
                }
                catch (error) {
                  console.log('Write transfer bill error: ', error)
                  // ??? need a more informative error
                  Alert.alert('Error transferring all bills')
                }
                finally {
                  setIsTransferring('')
                  setShowOpenBills(null)
                  setOpenBills([])
                  setSelectedTransferBills([])
                }
              }}
            >
              <LargeText style={{ color: Colors.green, fontWeight: 'bold' }}>{selectedTransferBills.length ? 'CONFIRM' : 'SKIP'}</LargeText>
            </TouchableOpacity>
          </View>
        </View>
      }
      {!!isTransferring && <RenderOverlay text={'Transferring ' + isTransferring} opacity={0.92} />}
    </SafeAreaView>
  </View >

}

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  serverButton: {
    paddingTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 16
  }
});
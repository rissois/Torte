import React, { useState, } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  ScrollView,
} from 'react-native';

import firebase from 'firebase';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { useSelector, } from 'react-redux';
import { checkForUpdateAsync, reloadAsync, fetchUpdateAsync } from 'expo-updates';
import { TouchableOpacity, } from 'react-native-gesture-handler';
import { isDemo, demo_restaurant_ids } from '../constants/demo';
import useRestaurant from '../hooks/useRestaurant';
import { MainText, ClarifyingText, LargeText } from '../components/PortalText'
import { MaterialCommunityIcons } from '@expo/vector-icons';
/*
  https://stackoverflow.com/questions/53524187/query-firestore-database-on-timestamp-field

*/

const toggleDeactivation = async (restaurant_id, segment, deactive) => {
  try {
    firebase.firestore().collection('restaurants').doc(restaurant_id).set({
      deactivated: {
        [segment]: deactive
      }
    }, { merge: true })
  }
  catch (error) {
    console.log('toggle deactivation error: ', error)
    Alert.alert(`Error ${deactive ? 'deactivating' : 'turning on'} ${segment}`)
  }
}


export default function Settings(props) {
  let { onPressSettings, navigation } = props

  const { deactivated = {}, name } = useSelector(state => state.restaurant)
  const restaurant_id = useRestaurant()

  const [showRestaurants, setShowRestaurants] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')




  const [billsSettings] = useState([
    {
      name: 'Review day',
      onPress: () => {
        navigation.navigate('Day')
      }
    },
    {
      name: 'Review unpaid',
      onPress: () => {
        navigation.navigate('Unpaid')
      }
    },
  ])

  const [serverSettings] = useState([
    {
      name: 'Table assignments',
      onPress: () => {
        navigation.navigate('TableAssignments', { manager: true })
      }
    },
    {
      name: 'Employees',
      onPress: () => {
        navigation.navigate('Employees')
      }
    },
    {
      name: 'Tables & Sections',
      onPress: () => {
        navigation.navigate('Tables')
      }
    },
  ])

  const [portalSettings] = useState([
    {
      name: 'Manager Portal',
      onPress: () => {
        onPressSettings()
        navigation.navigate('Portal')
      }
    }
  ])

  const updateSettings = [
    // {
    //   name: 'Printers',
    //   onPress: async () => {
    //     navigation.navigate('Printers')
    //   },
    // },
    {
      name: 'Update',
      onPress: async () => {
        let response = await checkForUpdateAsync()
        if (response.isAvailable) {
          await fetchUpdateAsync()
          Alert.alert('Loading update', 'Torte will restart when the upload is complete', [
            {
              text: 'OK',
            }
          ],
            { cancelable: true })
          await reloadAsync()
        }
        else {
          Alert.alert('Software is up-to-date', null, [
            {
              text: 'OK',
            }
          ],
            { cancelable: true })
        }
      },
    },
    ...(isDemo() && restaurant_id === firebase.auth().currentUser?.uid) ? [{
      name: 'Demo bill',
      onPress: async () => {
        try {
          let { data: { failed, ref_code, table_no, bill_id } } = await firebase.functions().httpsCallable('quickBill-quickBill')()
          if (failed) {
            throw new Error('Failed to create quickBill')
          }
          Alert.alert('Create bill #' + ref_code, 'At table ' + table_no + '\n' + bill_id)
        }
        catch (error) {
          console.log(error)
          Alert.alert('Cannot create a demo bill')
        }
      },
    }] : [],
    ...isDemo() ? [{
      name: 'Change restaurant',
      onPress: async () => {
        setShowRestaurants(true)

        firebase.firestore().collection('restaurants').get().then((querySnapshot) => {
          let basics = []
          querySnapshot.forEach((doc) => {
            if (doc.id === restaurant_id) {

            }
            else if (demo_restaurant_ids.includes(doc.id)) {
              basics.unshift({ id: doc.id, name: doc.data().name })
            }
            else {
              basics.push({ id: doc.id, name: doc.data().name })
            }
          });
          setRestaurants(basics)
        }).catch(error => {
          console.log('Change restuarant error: ', error)
          setShowRestaurants(false)
        })
      },
    }] : [],
  ]

  const bottomSettings = [
    ...deactivated.order ? [{
      name: 'Turn on ordering',
      onPress: () => {
        toggleDeactivation(restaurant_id, 'order', false)
      }
    }] : [{
      name: 'Turn off ordering',
      onPress: () => {
        Alert.alert('Are you sure you want to turn off ordering?', 'Your guests will no longer be able to order any food through Torte', [
          {
            text: 'Yes, turn off ordering',
            onPress: () => {
              toggleDeactivation(restaurant_id, 'order', true)
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
          { cancelable: true })
      },
      // color: Colors.red + 'CC'
    }],
    ...deactivated.pay ? [{
      name: 'Turn on payment',
      onPress: () => {
        toggleDeactivation(restaurant_id, 'pay', false)
      },
    }] : [{
      name: 'Turn off payment',
      onPress: () => {
        Alert.alert('Are you sure you want to turn off payment?', 'Your guests will no longer be able to pay for their meals through Torte', [
          {
            text: 'Yes, turn off payment',
            onPress: () => {
              toggleDeactivation(restaurant_id, 'pay', true)
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
          { cancelable: true })
      },
      // color: Colors.red + 'CC'
    }],
    {
      name: 'Sign out',
      onPress: () => {
        Alert.alert('Are you sure you want to sign out?', null, [
          {
            text: 'Sign out',
            onPress: () => {
              firebase.auth().signOut().catch(function (error) {
                console.log(error)
              })
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
          { cancelable: true })

      },
      // color: Colors.red + 'CC'
    },
  ]

  return <View style={{ flex: 1, flexDirection: 'row' }}>
    <View style={{ backgroundColor: Colors.black, minWidth: 294, paddingTop: 10 }}>
      {/* <MaterialIcons
        name='arrow-back'
        size={30}
        color={Colors.softwhite}
      /> */}
      <View style={{ flex: 1, marginTop: 20 }}>
        <View style={{ marginBottom: 20 }}>
          {billsSettings.map(setting => <Setting key={setting.name} {...setting} />)}
        </View>

        <View style={{ marginBottom: 20, backgroundColor: Colors.purple }}>
          {serverSettings.map(setting => <Setting key={setting.name} {...setting} />)}
        </View>

        <View style={{ marginBottom: 20 }}>
          {portalSettings.map(setting => <Setting key={setting.name} {...setting} />)}
        </View>
      </View>

      <View style={{ marginBottom: 20, }}>
        {updateSettings.map(setting => <Setting key={setting.name} {...setting} />)}
      </View>
      <View style={{ marginBottom: 50, borderTopColor: Colors.lightgrey, borderTopWidth: 1, }}>
        {bottomSettings.map(setting => <Setting key={setting.name} {...setting} />)}
      </View>

      <View style={{ marginBottom: 10 }}>
        <Text style={[styles.settingText, styles.centered, {}]}>Contact support</Text>
        <Text style={[styles.settingText, styles.centered]}>248.891.4781</Text>
      </View>
    </View>
    <TouchableOpacity activeOpacity={1} containerStyle={{ flex: 1, backgroundColor: Colors.modalBackground + '44' }} style={{}} onPress={() => { onPressSettings() }} />

    {
      !!showRestaurants && <View style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: `rgba(0,0,0,0.9)`,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
        <View style={{ width: '80%', height: '70%', backgroundColor: Colors.background }}>
          <View style={{ marginVertical: Layout.spacer.small, }}>

            <LargeText center style={{ fontWeight: 'bold' }}>Change restaurant:</LargeText>
            <MainText center>Currently {name} {isDemo() ? '(demo)' : ''}</MainText>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, flex: 1 }}>
            {
              restaurants.map(({ id, name }) => {
                return <TouchableOpacity key={id} onPress={() => {
                  setSelectedRestaurant(prev => {
                    if (prev === id) {
                      return ''
                    }
                    return id
                  })
                }}>
                  <View style={{
                    flexDirection: 'row',
                    borderTopColor: Colors.softwhite,
                    borderTopWidth: 1,
                    paddingVertical: 20
                  }}>
                    <MaterialCommunityIcons
                      name='checkbox-marked-circle-outline'
                      color={selectedRestaurant === id ? Colors.green : Colors.background}
                      size={40}
                      style={{ marginRight: 20, }}
                    />
                    <LargeText>{name} {demo_restaurant_ids.includes(id) ? '(demo)' : ''}</LargeText>
                  </View>
                </TouchableOpacity>
              })
            }
          </ScrollView>
        </View>
        <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-around', }}>
          <TouchableOpacity onPress={() => {
            setShowRestaurants(false)
            setSelectedRestaurant('')
          }}>
            <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!selectedRestaurant}
            onPress={() => {
              navigation.navigate('Connect', { change_restaurant_id: selectedRestaurant })
            }}>
            <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.green, fontWeight: 'bold' }}>CONFIRM</LargeText>
          </TouchableOpacity>
        </View>
      </View>
    }
  </View>

}

const Setting = (props) => {
  return <TouchableOpacity onPress={() => {
    props.onPress()
  }}>
    <View style={[styles.settingView, {
      backgroundColor: props.color ?? null,
    }]}>
      <Text style={styles.settingText}>{props.name}</Text>
    </View>
  </TouchableOpacity>
}



const styles = StyleSheet.create({
  centered: {
    textAlign: 'center'
  },
  settingView: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    // borderBottomColor: Colors.lightgrey,
    // borderBottomWidth: 1,
    // borderTopColor: Colors.lightgrey,
    // borderTopWidth: 1,
  },
  settingText: {
    color: Colors.white,
    fontSize: 24,
  }


});


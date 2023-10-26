import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, } from '../components/PortalText'
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { MaterialIcons, } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import TorteGradientLogo from '../components/TorteGradientLogo';
import writePin from '../transactions/writePin';
import { setUser } from '../redux/actionsEmployees';
import useRestaurant from '../hooks/useRestaurant';
import { demo_restaurant_ids, isDemo } from '../constants/demo';

const gridSize = Layout.window.width * 0.17
const logoSize = Layout.window.width * 0.15

export default function PinScreen({ navigation, route }) {
  let { change_pin, employee_id, manager_reset, firstEmployee, tableTransfer, managerApproval } = route?.params ?? {}
  const { employees = {}, } = useSelector(state => state)
  const [pin, setPin] = useState('')
  const [confirmedPin, setConfirmedPin] = useState(false)
  const [firstPin, setFirstPin] = useState('')
  const [showPinPad, setShowPinPad] = useState(!!(employee_id || managerApproval))
  const [padTimeout, setPadTimeout] = useState('')
  const [message, setMessage] = useState('')
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()

  const admin = isDemo() && !demo_restaurant_ids.includes(restaurant_id)

  // useEffect(() => {
  //   if (!pin && !confirmedPin) {
  //     // set a timeout for show pin
  //   }
  // }, [pin, confirmedPin])

  useEffect(() => {
    if (!employee_id && showPinPad) {
      setPadTimeout(prev => {
        clearTimeout(prev)
        return setTimeout(() => {
          setShowPinPad(false)
          setPin('')
        }, 20000)
      })
    }
  }, [pin, employee_id, showPinPad])

  useEffect(() => {
    if (pin.length === 1) {
      setMessage('')
    }
    if (pin.length === 4) {
      setMessage('')
      setPin('')
      setTimeout(() => {
        if (managerApproval) {
          if (confirmManager(getEmployeeFromPin(pin))) {
            navigation.navigate(managerApproval.screen, managerApproval.success_param)
          }
          else {
            setMessage('INVALID PIN')
          }
        }
        else if (employee_id) { // establishing new pin for server or changing pin
          if (tableTransfer) {
            if (getEmployeeFromPin(pin) === employee_id) {
              navigation.navigate(tableTransfer.screen, { tableTransfer })
            }
            else {
              setMessage('WRONG PIN')
            }
          }
          else if (change_pin && !confirmedPin) { // Get old pin
            if (manager_reset && pin === manager_reset) {
              setConfirmedPin(true)
            }
            else if (getEmployeeFromPin(pin) === employee_id) {
              // Even in manager_reset, still allow the the old pin to reset
              setConfirmedPin(true)
            }
            else {
              setMessage('WRONG PIN')
            }
          }
          else if (!firstPin) {
            let existing_server = getEmployeeFromPin(pin)
            if (existing_server && existing_server !== employee_id) {
              setMessage('ALREADY USED')
            }
            else {
              setFirstPin(pin)
            }
          }
          else { // Set new pin
            if (firstPin === pin) {
              attachPinToEmployee(pin, employee_id)
            }
            else {
              setFirstPin('')
              setMessage('PINS MUST MATCH')
            }
          }
        }
        else {
          logInEmployee(pin)
        }
      }, 150)

    }
  }, [pin, confirmedPin])


  const attachPinToEmployee = async (pin, employee_id) => {
    try {
      // Skip write if already set to this pin
      if (getEmployeeFromPin(pin) !== employee_id) {
        writePin(restaurant_id, employee_id, pin)
      }
      setMessage('SUCCESS!')
      setTimeout(() => {
        if (firstEmployee) {
          dispatch(setUser(employee_id))
          navigation.navigate('Portal')
        }
        else if (change_pin) {
          navigation.goBack()
        }
        else {
          navigation.navigate('Employees')
        }
      }, 1000)
    }
    catch (error) {
      console.log('attachPinToEmployee error: ', error)
      setMessage('ERROR SETTING PIN')
    }
  }

  const getEmployeeFromPin = useCallback((pin) => {
    return Object.keys(employees).find(employee_id => employees[employee_id].pin === pin)
  }, [employees])

  const confirmManager = useCallback((employee_id) => {
    return employee_id && employees[employee_id].roles.includes('manager')
  }, [employees])


  const logInEmployee = (pin) => {
    const employee = admin ? Object.keys(employees).find(e_id => employees[e_id].roles.includes('owner')) : getEmployeeFromPin(pin)

    if (employee) {
      dispatch(setUser(employee))
      setPadTimeout(prev => {
        clearTimeout(prev)
        return ''
      })
      navigation.navigate('Dashboard')
    }
    else {
      setMessage('INVALID PIN')
    }
  }

  // useEffect(() => {
  //   setShowPinPad(false)
  // }, [])


  if (!showPinPad) {
    return <TouchableWithoutFeedback onPress={() => { setShowPinPad(true) }} style={{ width: '100%', height: '100%' }}><View style={{ flex: 1, backgroundColor: Colors.black + '50', alignItems: 'center', justifyContent: 'center' }}>
      <MaterialIcons
        name='lock-outline'
        size={Layout.window.width * 0.5}
        color={Colors.softwhite}
        style={{ opacity: 0.3 }}
      />
      <HeaderText center style={{ opacity: 0.8 }}>Touch anywhere to log in</HeaderText>
    </View >
    </TouchableWithoutFeedback >
  }


  return (
    <View style={{ flex: 1, backgroundColor: Colors.black + 'F1' }}>
      {!!(employee_id || managerApproval) ? <View style={{ position: 'absolute', zIndex: 2, padding: 50 }}>
        <TouchableOpacity onPress={() => {
          navigation.goBack()
        }}>
          <HeaderText>CANCEL</HeaderText>
        </TouchableOpacity>
      </View> : <View style={{ position: 'absolute', zIndex: 2, padding: 50 }}>
        <TouchableOpacity onPress={() => {
          setShowPinPad(false)
        }}>
          <HeaderText>HIDE</HeaderText>
        </TouchableOpacity>
      </View>}
      {admin && <View style={{ position: 'absolute', zIndex: 2, right: 0, padding: 50 }}>
        <TouchableOpacity onPress={() => {
          logInEmployee()
        }}>
          <HeaderText>OVERRIDE</HeaderText>
        </TouchableOpacity>
      </View>
      }
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.container}>

          <View style={{ position: 'absolute', top: -logoSize, alignSelf: 'center', }}>
            <TorteGradientLogo size={logoSize} />
          </View>
          <HeaderText center style={styles.enterText}>{
            managerApproval ? 'Manager PIN' :
              tableTransfer ? employees[employee_id]?.name?.split(" ")?.[0] + '\'s PIN' :
                change_pin ?
                  confirmedPin ? firstPin ? 'Re-enter new PIN' : 'Enter new PIN' : manager_reset ? 'Enter your mgmt. pin' : 'Enter old PIN' :
                  employee_id ? firstPin ? 'Re-enter your PIN' : 'Enter a 4-digit PIN' : // Attach
                    'Enter your PIN' //Log in
          }</HeaderText>

          <View style={{ flexDirection: 'row', alignSelf: !pin && message ? undefined : 'center', }}>
            {!pin && !!message && <View style={styles.invalidView}><HeaderText style={styles.invalidText} center>{message}</HeaderText></View>}
            <View style={[styles.indicator, { backgroundColor: pin.length > 0 ? Colors.softwhite : undefined }]} />
            <View style={[styles.indicator, { backgroundColor: pin.length > 1 ? Colors.softwhite : undefined }]} />
            <View style={[styles.indicator, { backgroundColor: pin.length > 2 ? Colors.softwhite : undefined }]} />
            <View style={[styles.indicator, { backgroundColor: pin.length > 3 ? Colors.softwhite : undefined }]} />
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Number setPin={setPin} number={1} />
            <Number setPin={setPin} number={2} />
            <Number setPin={setPin} number={3} />
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Number setPin={setPin} number={4} />
            <Number setPin={setPin} number={5} />
            <Number setPin={setPin} number={6} />
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Number setPin={setPin} number={7} />
            <Number setPin={setPin} number={8} />
            <Number setPin={setPin} number={9} />
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Number empty />
            <Number setPin={setPin} number={0} />
            <Number setPin={setPin} back />
          </View>
        </View>

      </SafeAreaView>
    </View >
  );
}

const Number = ({ number, setPin, back = false, empty = false }) => {
  return <TouchableOpacity style={styles.buttonTouchable} disabled={empty} onPress={() => {
    setPin(prev => {
      if (back) {
        return prev.substring(0, prev.length - 1)
      }
      else if (prev.length < 4) {
        return prev + number
      }
      return prev
    })
  }}>
    {empty ? [] : back ? <MaterialIcons
      name='backspace'
      size={90}
      color={Colors.softwhite}
    /> : <View style={styles.button}>
      <HeaderText center style={styles.buttonText}>{number}</HeaderText>
    </View>}

  </TouchableOpacity>
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingHorizontal: 80,
    paddingBottom: 50,
    paddingTop: 50 + (logoSize / 3),
  },
  enterText: {
    fontSize: 60,
  },
  invalidView: {
    position: 'absolute',
    top: 0, bottom: 0,
    left: 0, right: 0,
    // alignItems: 'center',
    justifyContent: 'center',
  },
  invalidText: {
    fontWeight: 'bold',
    color: Colors.red,
  },
  indicator: {
    width: 30,
    height: 30,
    marginVertical: 30,
    marginHorizontal: 20,
    borderRadius: 40,
  },
  buttonTouchable: {
    height: gridSize,
    width: gridSize * 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  button: {
    backgroundColor: Colors.darkgrey,
    height: gridSize - 16,
    width: gridSize - 16,
    borderRadius: gridSize,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 90,
    fontWeight: 'bold',
    color: Colors.softwhite
  }
});

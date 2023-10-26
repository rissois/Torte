import React, { useState, } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import functions from '@react-native-firebase/functions'
import { DefaultText, ExtraLargeText, LargeText, } from '../../utils/components/NewStyledText';
import { useDispatch, useSelector, } from 'react-redux'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import SettingsRow from '../components/SettingsRow';
import SafeView from '../../utils/components/SafeView';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../utils/components/Header';
import { doUserEnd } from '../../redux/actions/actionsUser';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useIsMyAccountAdmin, useMyID, useMyName } from '../../utils/hooks/useUser';
import { selectMyAccountNumber } from '../../redux/selectors/selectorsUser';

export default function SettingsScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const myID = useMyID()
  const myName = useMyName()
  const acct_no = useSelector(selectMyAccountNumber)
  const [showCopyright, setShowCopyright] = useState(false)
  const isAdmin = useIsMyAccountAdmin()

  const [appSettings] = useState([
    {
      text: 'Loyalty & Discounts',
      iconName: 'heart',
      iconSize: 24,
      IconSource: MaterialCommunityIcons,
      onTouch: () => { navigation.navigate('Loyalty') }
    },
    {
      text: 'Credit cards',
      iconName: 'credit-card',
      iconSize: 24,
      onTouch: () => { navigation.navigate('Cards') }
    },
  ])

  const [legalSettings] = useState(([
    {
      text: 'Privacy',
      iconName: 'lock-outline', //business-center
      iconSize: 24,
      onTouch: () => { navigation.navigate('Eula', { privacy: true }) },
    },
    {
      text: 'End-User License Agreement',
      iconName: 'business-center',
      iconSize: 24,
      onTouch: () => { navigation.navigate('Eula', { eula: true }) },
    },
    {
      text: 'Copyright notice',
      iconName: 'copyright',
      iconSize: 24,
      onTouch: () => { setShowCopyright(true) },
    },
  ]))

  const [torteQnA] = useState([
    /*{
      text: 'Change name',
      iconName: 'account-box', //'textsms'
      iconSize: 29,
      onTouch: async () => {
        // require password
        // HTTPS request
        // Must hit firebase Auth and all firebase documents
        // Warn can only be done once in a while
      },
    },
    {
      text: 'Change email',
      iconName: 'email', //'textsms'
      iconSize: 27,
      onTouch: async () => {
        // Require password
        // Firebase auth and 
      },
    },*/
    {
      text: 'Feedback',
      iconName: 'comment', //'textsms'
      iconSize: 24,
      onTouch: async () => {
        let response = await MailComposer.composeAsync({
          recipients: ['feedback@tortepay.com'],
          subject: 'Feedback'
        }).catch(error => RNAlert.alert('Cannot open email app', 'Sorry, please send an email to feedback@tortepay.com'))
        if (response?.status === 'sent') {
          // navigation.goBack()
          // navigation.navigate('Home', { successFeedback: true }) 
        }
      },
    },
    {
      text: 'Support',
      iconName: 'announcement',
      iconSize: 24,
      onTouch: async () => {
        let response = await MailComposer.composeAsync({
          recipients: ['support@tortepay.com'],
          subject: 'Help!'
        }).catch(error => RNAlert.alert('Cannot open email app', 'Sorry, please send an email to support@tortepay.com'))
        if (response?.status === 'sent') {
          // navigation.goBack()
          // navigation.navigate('Home', { successFeedback: true }) 
        }
      },
    },

    {
      text: 'F.A.Q.',
      iconName: 'info', // help or help-outline local-library
      iconSize: 24,
      onTouch: () => { navigation.navigate('FAQ') },
    },
  ])

  const [authSettings] = useState([
    {
      text: 'Sign Out',
      iconName: 'power-settings-new',
      iconSize: 24,
      onTouch: () => {
        dispatch(doUserEnd())
      },
    },
  ])

  return (
    <SafeView>
      <View style={styles.settingsContainer}>
        <View style={styles.settingsTop}>
          <TouchableOpacity onPress={() =>
            navigation.goBack()
            // navigation.navigate('Home')
          }>
            <View style={{ paddingTop: 16, paddingLeft: 16 }}>
              <MaterialIcons
                name="home"
                size={30}
                color={Colors.white}
              />
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginRight: 40 }}>

            <LinearGradient
              colors={[Colors.green, Colors.purple]}
              style={{ height: 75, width: 75, borderRadius: 37.5, alignItems: 'center', justifyContent: 'center' }}
              start={[0.85, 0.2]}
              end={[0.3, 1.2]}>
              <Image style={{ width: 50, height: 50, marginTop: 5 }} source={require('../../assets/images/whiteLogo.png')} />
            </LinearGradient>

            <View style={{ marginVertical: 20, paddingLeft: 20 }}>
              <View style={{ flex: 5 }} />
              <DefaultText key='name' maxFontSizeMultiplier={1.4} >{myName}</DefaultText>
              <DefaultText key='no' maxFontSizeMultiplier={1.4} >Account No: #{acct_no}</DefaultText>
              <View style={{ flex: 8 }} />
            </View>
          </View>
        </View>



        <ScrollView style={{}}>


          {
            appSettings.map((setting, index) => <SettingsRow key={index} {...setting} />)
          }

          <View style={styles.sectionBreak} />

          {
            legalSettings.map((setting, index) => <SettingsRow key={index} {...setting} />)
          }

          <View style={styles.sectionBreak} />

          {
            torteQnA.map((setting, index) => <SettingsRow key={index} {...setting} />)
          }

          <View style={styles.sectionBreak} />

          {
            authSettings.map((setting, index) => <SettingsRow key={index} {...setting} />)
          }

          {isAdmin && <View style={{ marginTop: 20, marginLeft: 62 }}>
            <TouchableOpacity onPress={async () => {
              try {
                let { data: { failed, ref_code, table_no, bill_id } } = await functions().httpsCallable('quickBill-quickBill')({
                  user_id: myID,
                  user_name: myName
                })
                if (failed) {
                  throw new Error('Failed to create quickBill')
                }
                dispatch(doAlertAdd(`Bill #${''} at table ${''}`, `bill_id: ${''}`))
              }
              catch (error) {
                console.log('SettingsScreen error: ', error)
                dispatch(doAlertAdd('Error creating demo bill'))
              }
            }}>
              <DefaultText style={{ paddingVertical: 20 }}>(Demo bill)</DefaultText>
            </TouchableOpacity>
          </View>}

        </ScrollView>
      </View>


      {showCopyright && <View style={[StyleSheet.absoluteFill, { flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', width: '100%', justifyContent: 'center', alignItems: 'center', }]}>
        <TouchableWithoutFeedback onPress={() => {
          setShowCopyright(false)
        }}>
          <View style={{ paddingTop: 12, width: Layout.window.width * 0.7, backgroundColor: Colors.background, }}>
            <Header left={<MaterialIcons
              name='close'
              size={30}
              color={Colors.white}
            />}>
              <ExtraLargeText maxScale={1.7} bold center>Torte LLC</ExtraLargeText>
            </Header>
            <View style={{ paddingHorizontal: 12 }}>
              <LargeText maxScale={1.7} center style={{ marginBottom: 12 }}>Copyright {'\u00A9'} 2020.</LargeText>
              <LargeText maxScale={1.7} center style={{ marginBottom: 12 }}>Torte{'\u00AE'} and the Torte logo{'\u2122'}</LargeText>
              <LargeText maxScale={1.7} center style={{ marginBottom: 12 }}>The Torte interface and system are patent pending.</LargeText>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View >}
    </SafeView>
  )
}

const styles = StyleSheet.create({
  settingsContainer: {
    flex: 1,
    backgroundColor: Colors.darkgrey,
    borderRadius: 30,
    borderTopLeftRadius: 200,
    marginHorizontal: 16,
  },
  settingsTop: {
    flexDirection: 'row',
    height: 175,
  },
  sectionBreak: {
    height: 24,
  },
  settingText: {
    fontSize: 19,
    color: Colors.white,
    textAlign: 'right'
  }
});
import React, { useState, } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { DefaultText, LargeText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import useRestaurantNestedFields from '../../hooks/useRestaurantNestedField';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import PortalGroup from '../components/PortalGroup';
import { formatPhoneNumber } from '../functions/formatPortalFields';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import PortalForm from '../components/PortalForm';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import { PortalTextField } from '../components/PortalFields';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';

const descriptionLimit = 100
const cuisineLimit = 30
const stateExact = 2
const zipCodeExact = 5
const phoneExact = 10


export default function RestaurantScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()

  const currentName = useRestaurantNestedFields('name')
  const currentDescription = useRestaurantNestedFields('description')
  const [description, setDescription] = useState(currentDescription)
  const currentCuisine = useRestaurantNestedFields('cuisine')
  const [cuisine, setCuisine] = useState(currentCuisine)
  const currentPriceRange = useRestaurantNestedFields('price_range')
  const [price_range, setPriceRange] = useState(currentPriceRange)

  const currentWebsite = useRestaurantNestedFields('website', 'url')
  const [website, setWebsite] = useState(currentWebsite)
  const currentLine1 = useRestaurantNestedFields('address', 'line1')
  const [line1, setLine1] = useState(currentLine1)
  const currentLine2 = useRestaurantNestedFields('address', 'line2')
  const [line2, setLine2] = useState(currentLine2)
  const currentCity = useRestaurantNestedFields('address', 'city')
  const [city, setCity] = useState(currentCity)
  const currentState = useRestaurantNestedFields('address', 'state')
  const [state, setState] = useState(currentState)
  const currentZipCode = useRestaurantNestedFields('address', 'zip_code')
  const [zip_code, setZipCode] = useState(currentZipCode)

  const currentPhone = useRestaurantNestedFields('phone')
  const [phone, setPhone] = useState(currentPhone)
  const currentEmail = useRestaurantNestedFields('email')
  const [email, setEmail] = useState(currentEmail)

  const [failedFields, setFailedFields] = useState([])


  const isAltered = description !== currentDescription
    || cuisine !== currentCuisine
    || price_range !== currentPriceRange
    || website !== currentWebsite
    || line1 !== currentLine1
    || line2 !== currentLine2
    || city !== currentCity
    || state !== currentState
    || zip_code != currentZipCode
    || phone != currentPhone
    || email !== currentEmail

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setDescription(currentDescription)
          setCuisine(currentCuisine)
          setPriceRange(currentPriceRange)
          setWebsite(currentWebsite)
          setLine1(currentLine1)
          setLine2(currentLine2)
          setCity(currentCity)
          setState(currentState)
          setZipCode(currentZipCode)
          setPhone(currentPhone)
          setEmail(currentEmail)
        }
      },
      {
        text: 'No'
      }
    ]))
  }

  const save = () => {
    let failed = []
    if (!price_range) failed.push('price range')
    if (!line1) failed.push('address')
    if (!city) failed.push('city')
    if (!state || state.length !== stateExact) failed.push('state')
    if (!zip_code || zip_code.length !== zipCodeExact) failed.push('zip code')
    if (!phone || phone.length !== phoneExact) failed.push('phone')
    if (failed.length) {
      dispatch(doAlertAdd('Incorrect fields', ['Correct the following fields: ', ...failed]))
      setFailedFields(failed)
    }
    else {
      return restaurantRef.set({
        cuisine,
        price_range,
        description,
        address: {
          line1,
          line2,
          city,
          state,
          zip_code,
        },
        website: {
          url: website,
        },
        phone,
        email,
      }, { merge: true }).then(() => {
        dispatch(doSuccessAdd())
      }).catch(error => {
        console.log('RestaurantScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new details', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }

  return (
    <PortalForm
      headerText='Edit restaurant details'
      isLocked
      save={save}
      reset={reset}
      isAltered={isAltered}
    >
      <PortalGroup text='Be understood' >
        <PortalTextField text='Restaurant' value={currentName} isLocked />

        <PortalTextField
          text='Cuisine'
          value={cuisine}
          placeholder='(e.g. Southern)'
          onChangeText={setCuisine}
          limit={cuisineLimit}
        />

        <PriceRange priceRange={price_range} setPriceRange={setPriceRange} isRequired isFailed={failedFields.includes('price range')} />

        <PortalTextField
          text='Description'
          value={description}
          placeholder='(recommended)'
          onChangeText={setDescription}
          limit={descriptionLimit}
        />
      </PortalGroup>

      <PortalGroup text='Be found' >
        <PortalTextField
          text='Address line 1'
          value={line1}
          placeholder='(required)'
          onChangeText={setLine1}
          isRequired
          isFailed={failedFields.includes('address')}
        />

        <PortalTextField
          text='Address line 2'
          value={line2}
          placeholder='(optional)'
          onChangeText={setLine2}
        />

        <PortalTextField
          text='City'
          value={city}
          onChangeText={setCity}
          placeholder='(required)'
          isRequired
          isFailed={failedFields.includes('city')}
        />

        <PortalTextField
          text='State (e.g. MA)'
          value={state}
          onChangeText={setState}
          placeholder='(required)'
          exact={stateExact}
          isRequired
          isFailed={failedFields.includes('state')}
        />

        <PortalTextField
          text='Zip code'
          value={zip_code}
          onChangeText={setZipCode}
          placeholder='(required)'
          keyboardType='number-pad'
          exact={zipCodeExact}
          isRequired
          isFailed={failedFields.includes('zip code')}
          isNumberString
        />

        <View style={{ height: 30 }} />

        <PortalTextField
          text='Website'
          value={website}
          onChangeText={setWebsite}
          placeholder='(recommended)'
          keyboardType='url'
        />
      </PortalGroup>

      <PortalGroup text='Be reachable' >
        <PortalTextField
          text='Phone'
          value={phone}
          format={formatPhoneNumber}
          placeholder='(XXX) XXX-XXXX'
          onChangeText={setPhone}
          exact={phoneExact}
          isRequired
          isFailed={failedFields.includes('phone')}
          isNumberString
        />
        <PortalTextField
          text='Email'
          subtext='Email address for customers to reach out to you with inquiries'
          value={email}
          onChangeText={setEmail}
          placeholder='(optional)'
          keyboardType='email-address'
        />
      </PortalGroup>
    </PortalForm>
  )
}

const PriceRange = ({ priceRange, setPriceRange }) => {
  const [dollarWidth, setDollarWidth] = useState(0)
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8, paddingVertical: 8, }}>
      <LargeText style={{ marginTop: 6 }}>Price range:   </LargeText>

      <View>
        <PanGestureHandler
          onGestureEvent={({ nativeEvent }) => {
            setPriceRange(Math.max(Math.min(Math.ceil(nativeEvent.x / dollarWidth), 4), 1))
          }}>
          <View style={{ flexDirection: 'row', }}>
            {
              [...Array(4)].map((_, i) => {
                return <TapGestureHandler key={i} onHandlerStateChange={({ nativeEvent }) => {
                  if (nativeEvent.state === State.BEGAN) {
                    setPriceRange(i + 1)
                  }
                }}>
                  <View onLayout={({ nativeEvent }) => setDollarWidth(nativeEvent.layout.width)} style={{ paddingHorizontal: 30 }}>
                    <FontAwesome
                      name='dollar'
                      size={36}
                      color={i < priceRange ? Colors.white : Colors.darkgrey}
                    />
                  </View>
                </TapGestureHandler>
              })
            }
          </View>
        </PanGestureHandler>
        <DefaultText style={{ marginTop: 4 }}>Per person: $ = under $10; $$ = $11-$30; $$$ = $31-$60; $$$$ = more than $60</DefaultText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({

});


import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RestaurantNameScreen from '../screens/RestaurantNameScreen';
import AddressScreen from '../screens/AddressScreen';
import PhoneScreen from '../screens/PhoneScreen';
import LogoScreen from '../screens/LogoScreen';
import HoursScreen from '../screens/HoursScreen';
import ReviewScreen from '../screens/ReviewScreen';
import ServiceScreen1 from '../screens/ServiceScreen1';
import ServiceScreen2 from '../screens/ServiceScreen2';
import WallOfTextScreen from '../screens/WallOfTextScreen';


const RegistrationStack = createStackNavigator();


export default function RegistrationStackScreen({ navigation, route }) {
    return (
        <RegistrationStack.Navigator
            initialRouteName="RestaurantName"
            screenOptions={() => ({
                gestureEnabled: false,
                headerShown: false,
            })}
        >
            <RegistrationStack.Screen name="RestaurantName" component={RestaurantNameScreen} />
            <RegistrationStack.Screen name="Address" component={AddressScreen} />
            <RegistrationStack.Screen name="Phone" component={PhoneScreen} />
            <RegistrationStack.Screen name="Logo" component={LogoScreen} />
            <RegistrationStack.Screen name="Hours" component={HoursScreen} />
            <RegistrationStack.Screen name="Review" component={ReviewScreen} />
            <RegistrationStack.Screen name="WallOfText" component={WallOfTextScreen} />
            <RegistrationStack.Screen name="Service1" component={ServiceScreen1} />
            <RegistrationStack.Screen name="Service2" component={ServiceScreen2} />
        </RegistrationStack.Navigator>
    )
}


import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    AppState,
} from 'react-native'
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../dashboard/screens/DashboardScreen';
import RestaurantScreen from '../portal/screens/RestaurantScreen';
import TorteScreen from '../portal/screens/TorteScreen';
import MainAlert from '../utils/components/MainAlert';
import HoursScreen from '../portal/screens/HoursScreen';
import SuccessAlert from '../utils/components/SuccessAlert';
import GratuityScreen from '../portal/screens/GratuityScreen';
import FoodScreen from '../portal/screens/FoodScreen';
import CategoryScreen from '../portal/screens/CategoryScreen';
import MenusScreen from '../portal/screens/MenusScreen';
import SectionsScreen from '../portal/screens/SectionsScreen';
import ItemsScreen from '../portal/screens/ItemsScreen';
import FiltersScreen from '../portal/screens/FiltersScreen';
import TaxRatesScreen from '../portal/screens/TaxRatesScreen';
import PrintersScreen from '../portal/screens/PrintersScreen';
import OptionsScreen from '../portal/screens/OptionsScreen';
import ModifiersScreen from '../portal/screens/ModifiersScreen';
import PanelsScreen from '../portal/screens/PanelsScreen';
import MealsScreen from '../portal/screens/MealsScreen';
import PeriodsScreen from '../portal/screens/PeriodsScreen';
import SupportScreen from '../portal/screens/SupportScreen';
import DeleteAlert from '../utils/components/DeleteAlert';
import { useDispatch, useSelector } from 'react-redux';
import IndicatorOverlay from '../utils/components/IndicatorOverlay';
import { handleUpdateOnAppActive } from './functions/handleUpdate';
import HistoryScreen from '../dashboard/screens/HistoryScreen';
import UnpaidScreen from '../dashboard/screens/UnpaidScreen';
import DietsScreen from '../dashboard/screens/DietsScreen';
import AddScreen from '../bill/screens/AddScreen';
import AnalyticsScreen from '../dashboard/screens/AnalyticsScreen';
import TestScreen, { IS_TESTING } from '../testing/TestScreen';


const MainStack = createStackNavigator();


export default function MainStackScreen({ navigation, route }) {
    const [updateNotice, setUpdateNotice] = useState(null)
    const appState = useRef(AppState.currentState);
    const dispatch = useDispatch()
    // const isEULANeeded = useSelector(state => state.user?.user?.pos?.eula?.is_needed)

    // useEffect(() => {
    //     if (isEULANeeded) navigation.navigate('Eula')
    // }, [isEULANeeded])

    const handleForegrounding = useCallback(async (nextAppState, isInitial) => {
        if (
            (appState.current.match(/inactive|background/) && nextAppState === "active")
            || isInitial
        ) {
            // Only start link AFTER update check
            // Can store a time to limit to once a day...
            await handleUpdateOnAppActive(
                () => setUpdateNotice("We've made improvements! We are loading the newest version of Torte, your app will then automatically restart. We are sorry for the delay"),
                () => setUpdateNotice('Restarting Torte. See you in a second!'),
                dispatch
            )
        }

        appState.current = nextAppState;
    }, []);

    useEffect(() => {
        if (!__DEV__) {
            handleUpdateOnAppActive(
                () => setUpdateNotice("We've made improvements! We are loading the newest version of Torte, your app will then automatically restart. We are sorry for the delay"),
                () => setUpdateNotice('Restarting Torte. See you in a second!'),
                dispatch
            )

            const listener = AppState.addEventListener("change", handleForegrounding);

            return () => {
                listener.remove()
            };
        }
    }, []);

    return (
        <>
            <MainStack.Navigator
                screenOptions={() => ({
                    gestureEnabled: false,
                    headerShown: false,
                })}
            >
                {
                    IS_TESTING ?
                        <MainStack.Group>
                            <MainStack.Screen name="Test" component={TestScreen} />
                        </MainStack.Group> :
                        <MainStack.Group>
                            <MainStack.Screen name="Dashboard" component={DashboardScreen} />
                            <MainStack.Screen name="Restaurant" component={RestaurantScreen} />
                            <MainStack.Screen name="Torte" component={TorteScreen} />
                            <MainStack.Screen name="Hours" component={HoursScreen} />
                            <MainStack.Screen name="Food" component={FoodScreen} />
                            <MainStack.Screen name="Diets" component={DietsScreen} />
                            <MainStack.Screen name="Category" component={CategoryScreen} />
                            <MainStack.Screen name="Menus" component={MenusScreen} />
                            <MainStack.Screen name="Meals" component={MealsScreen} />
                            <MainStack.Screen name="Periods" component={PeriodsScreen} />
                            <MainStack.Screen name="Printers" component={PrintersScreen} />
                            <MainStack.Screen name="Sections" component={SectionsScreen} />
                            <MainStack.Screen name="Items" component={ItemsScreen} />
                            <MainStack.Screen name="Options" component={OptionsScreen} />
                            <MainStack.Screen name="Modifiers" component={ModifiersScreen} />
                            <MainStack.Screen name="Panels" component={PanelsScreen} />
                            <MainStack.Screen name="Filters" component={FiltersScreen} />
                            <MainStack.Screen name="Gratuity" component={GratuityScreen} />
                            <MainStack.Screen name="TaxRates" component={TaxRatesScreen} />
                            <MainStack.Screen name="Support" component={SupportScreen} />
                            <MainStack.Screen name="History" component={HistoryScreen} />
                            <MainStack.Screen name="Unpaid" component={UnpaidScreen} />
                            <MainStack.Screen name="Add" component={AddScreen} />
                            <MainStack.Screen name="Analytics" component={AnalyticsScreen} />
                        </MainStack.Group>
                }
            </MainStack.Navigator>
            <MainAlert />
            <SuccessAlert />
            <DeleteAlert />
            {!!updateNotice && <IndicatorOverlay text={updateNotice} black />}
        </>
    )
}


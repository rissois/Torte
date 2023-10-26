import { useCallback, } from 'react';
import { useDispatch, } from 'react-redux';
import { getFirestore, getDocs, query, collection, where, limit } from "@firebase/firestore"
import { getFunctions, httpsCallable } from "@firebase/functions"
import { useNavigation } from '@react-navigation/native';
import firebaseApp from '../../firebase/firebase';
import { useMyName } from './useUser';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { doTempSetTable } from '../../redux/actions/actionsTemp';

const firestore = getFirestore(firebaseApp)
const functions = getFunctions(firebaseApp)

export function useTableCodeResponse() {
    const dispatch = useDispatch()
    const navigation = useNavigation()

    return useCallback((data, isReplacing) => {
        const {
            table,
            unnamed,
            occupied,
            empty,

            bill,
            previous,
        } = data

        const redirect = navigation[isReplacing ? 'replace' : 'navigate']
        const restaurant_id = bill?.restaurant?.id || table?.restaurant?.id

        if (bill) {
            if (unnamed) {
                dispatch(doTempSetTable(table, bill))
                redirect('Name')
            }
            else if (previous) {
                dispatch(doAlertAdd('You have an existing bill', 'What would you like to do?', [
                    {
                        text: 'Return to bill',
                        onPress: () => redirect('Link', { restaurant_id, bill_id: bill.id, })
                    },
                    {
                        text: 'Join a different bill',
                        onPress: () => {
                            dispatch(doTempSetTable(table))
                            redirect('CodeBill')
                        }
                    },
                    {
                        text: 'Create a new bill',
                        onPress: () => redirect('Link', { restaurant_id, table_id: table.id, create: true })
                    },
                    {
                        text: 'Cancel',
                    }
                ]))
            }
            // new bill was created
            else redirect('Link', { restaurant_id, bill_id: bill.id, isBillNewToUser: true, })
        }
        else if (table) {
            if (unnamed) {
                dispatch(doTempSetTable(table))
                redirect('Name')
            }
            else if (empty) dispatch(doAlertAdd(`Join bill at ${table.name}?`, `The server has started a new bill for ${table.name}. Is this the bill you wish to join?`, [
                {
                    text: 'Yes, join',
                    onPress: () => redirect('Link', { restaurant_id, bill_id: empty, join: true })
                },
                {
                    text: 'No, I need a different bill',
                    onPress: () => {
                        dispatch(doTempSetTable(table))
                        redirect('CodeBill')
                    }
                },
                {
                    text: 'No, cancel',
                },
            ]))
            else if (occupied) {
                dispatch(doTempSetTable(table))
                redirect('CodeBill')
            }
        }
        else throw new Error('Unable to handle response.')
    }, [])
}

export function useTableFromCodeOrID() {
    const myName = useMyName()

    return useCallback(async (restaurant_id, table_code, table_id,) => {
        const { data } = await httpsCallable(functions, 'bill2-tableFromCodeOrID')({
            restaurant_id,
            table_code,
            table_id,
            name: myName,
        })

        return data
    }, [myName,])
}

export function useBillFromID() {
    const myName = useMyName()

    return useCallback(async (restaurant_id, bill_id) => {
        const { data } = await httpsCallable(functions, 'bill2-billFromID')({
            restaurant_id,
            bill_id,
            name: myName,
        })

        return data
    }, [myName])
}

export function useBillFromCode() {
    const myName = useMyName()

    return useCallback(async (restaurant_id, table_id, bill_code) => {
        const { data } = await httpsCallable(functions, 'bill2-billFromCode')({
            restaurant_id,
            table_id,
            bill_code,
            name: myName,
        })

        return data
    }, [myName,])
}

export function useCreateBillAtTable() {
    const myName = useMyName()

    return useCallback(async (restaurant_id, table_id,) => {
        const { data } = await httpsCallable(functions, 'bill2-createBillAtTable')({
            restaurant_id,
            table_id,
            name: myName,
        })

        return data
    }, [myName,])
}


export function useRestaurantFromCode() {
    return useCallback(async restaurant_code => {
        const code = restaurant_code.toUpperCase()

        const restaurantsSnapshot = await getDocs(
            query(
                collection(firestore, 'Restaurants'),
                where('code', '==', code),
                limit(1),
            )
        )

        if (!restaurantsSnapshot.size) throw new Error()
        return restaurantsSnapshot.docs[0].data()
    }, [])
}
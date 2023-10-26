import firebase from "firebase";

export const transactPartySize = (restaurantRef, bill_id, isAutomaticGratuityOn, automaticPercent, partySize, isRepeatPartySize) => {
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return firebase.firestore().runTransaction(async transaction => {
        const {
            analytics_helper: { day_id },
            party: { party_size = 0 }
        } = (await transaction.get(billRef)).data()

        const dayRef = restaurantRef.collection('Days').doc(day_id)

        transaction.set(billRef, {
            gratuities: {
                is_automatic_gratuity_on: isAutomaticGratuityOn,
                percent: automaticPercent
            },
            party: {
                party_size: partySize,
                is_repeat_party_size: isRepeatPartySize,
            }
        }, { merge: true })

        transaction.set(dayRef, {
            usage: {
                diners: firebase.firestore.FieldValue.increment(partySize - party_size)
            }
        }, { merge: true })
    })
}
import { createSelector } from "reselect"
import checkIsValidPaymentMethod from "../../utils/functions/checkIsValidPaymentMethod"
import { selectIsStripeTestMode } from "./selectorsApp"

const emptyObject = {}

const selectCards = state => state.user.cards ?? emptyObject

export const selectCardsForDisplay = createSelector(
    selectCards,
    selectIsStripeTestMode,
    (cards, isStripeTestMode) => Object.keys(cards)
        .filter(card_id => cards[card_id].is_test === isStripeTestMode)
        .sort(card_id => cards[card_id].is_favorite ? -1 : 0)
        .map(card_id => ({ ...cards[card_id], is_valid: checkIsValidPaymentMethod(cards[card_id]) }))
)

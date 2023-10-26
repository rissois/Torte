import { createSelector } from "reselect"

const emptyObject = {}

export const selectMe = state => state.user.user ?? emptyObject

export const selectMyID = createSelector(
    selectMe,
    user => user.id ?? ''
)

export const selectMyName = createSelector(
    selectMe,
    user => user.name ?? 'Cannot find name'
)

export const selectIsMyAccountInitialized = createSelector(
    selectMe,
    user => !!user.date_joined
)

export const selectIsMyAccountAnonymous = createSelector(
    selectMe,
    user => !!user.is_anonymous
)

export const selectIsMyAccountAdmin = createSelector(
    selectMe,
    user => !!user.is_admin
)

export const selectMyAccountNumber = createSelector(
    selectMe,
    user => user.acct_no ?? '?'
)
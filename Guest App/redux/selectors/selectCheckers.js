import { createSelectorCreator, defaultMemoize } from "reselect";

// NONE OF THIS WORKS

export const createShallowObjectSelector = createSelectorCreator(
    defaultMemoize,
    (before, after) => {
        if (typeof before !== 'object') return false
        if (typeof after !== 'object') return false
        if (Object.keys(before).length !== Object.keys(after).length) return false
        return Object.keys(before).every(key => before[key] === after[key])
    }
)
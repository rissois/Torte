import { createSelector } from 'reselect'
import { demoDate } from '../../utils/constants/demo'
import { addHoursToMilitary, dateToMilitary, shiftDOTW } from '../../utils/functions/dateAndTime'
import { indexesToPosition } from '../../menu/functions/indexesToPosition';
import { selectBill } from './selectorsBill';
import { selectMenus } from './selectorsMenus';
import { selectTrackedRestaurant } from './selectorsRestaurant2';

const emptyArray = []


const billPassesTimes = (created, now, { start, end, is_strict }, override) => {
    if (override) return true
    if (start > end) {
        end = addHoursToMilitary(end, 24)
    }

    const passes_strict = now >= start && now <= end
    if (is_strict) return passes_strict

    return passes_strict || (created <= end && now >= start)

    /*
                Start                   End             T/F
        c   n   |                       |               F
        c       |               n       |               T
        c       |                       |       n       T
                |       c       n       |               T
                |       c               |       n       T
                |                       |   c   n       F

        c = created; n = now
    */
}

const addMenusForBill = (days, meals, menus, dotw_id, created, now, accumulator, override) => {
    const day = days[dotw_id]

    day.hours.forEach((period, periodIndex) => {
        if (billPassesTimes(created, now, period, override)) {
            period.meal_order.forEach((meal_id, mealIndex) => {
                const meal = meals[meal_id]
                if (billPassesTimes(created, now, meal, override)) {
                    const mealMenus = meal.menus.reduce((acc, menu, menuIndex) => {
                        if (menus[menu.menu_id]?.is_visible && billPassesTimes(created, now, menu, override)) {
                            return [...acc, { ...menu, name: menus[menu.menu_id].name, menuPosition: dotw_id + indexesToPosition(periodIndex, mealIndex, menuIndex) }]
                        }
                        return acc
                    }, [])

                    if (mealMenus.length) {
                        accumulator.push({
                            dotw_id,
                            period_id: period.id,
                            meal_id,
                            ...meals[meal_id],
                            menus: mealMenus,
                        })
                    }
                }
            })
        }
    })
}

export const selectMenusOverview = (day) => createSelector(
    selectTrackedRestaurant,
    selectMenus,
    selectBill,
    (restaurant, menus, bill) => {

        if (!restaurant.days?.[0]) return emptyArray

        const { days, meals } = restaurant

        const isMenuOnly = !bill.id
        const isBillTest = !!bill.is_test

        const dateCreated = isMenuOnly ? null : isBillTest ? demoDate : bill.timestamps.created.toDate()
        const dayCreated = isMenuOnly ? day : dateCreated.getDay()
        const militaryCreated = isMenuOnly || isBillTest ? '0000' : dateToMilitary(dateCreated)
        const dayNow = isMenuOnly || isBillTest ? dayCreated : (new Date()).getDay()
        const militaryNow = isMenuOnly || isBillTest ? '2400' : dateToMilitary(new Date())

        let menusForBill = []

        if (days[dayCreated].was_overnight && !isMenuOnly) {
            // Some meals/menus are started the day prior
            // Those that extend to today have start > end, which means end will be +24 hrs
            // Therefore, +24 hours to created and now
            addMenusForBill(
                days,
                meals,
                menus,
                shiftDOTW(dayCreated, -1,),
                addHoursToMilitary(militaryCreated, 24),
                addHoursToMilitary(militaryNow, militaryNow < militaryCreated ? 48 : 24),
                menusForBill,
            )
        }

        addMenusForBill(
            days,
            meals,
            menus,
            dayCreated,
            militaryCreated,
            militaryNow < militaryCreated ? addHoursToMilitary(militaryNow, 24) : militaryNow,
            menusForBill,
            isMenuOnly
        )


        if (dayCreated !== dayNow) {
            // Some bills go overnight
            addMenusForBill(
                days,
                meals,
                menus,
                dayNow,
                '0000',
                militaryNow,
                menusForBill
            )
        }

        return menusForBill
        // return menusForBill.reverse()
    }
)
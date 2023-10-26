import { demoDate, isDemo } from '../constants/demo';
import { dateToMilitary } from '../functions/dateAndTime';
// import { fullDays } from '../constants/DOTW';

// RETURN THE CURRENT DAY, CURRENT MEALS, AND CURRENT MENUS

export const getCurrentMenus = (days, meals) => {
  let now = isDemo() ? demoDate : new Date()
  let today = now.getDay()
  let nowMilitary = dateToMilitary(now)
  let available_days = []
  let available_meals = []
  let available_menus = []

  /*
    If you can find a service from today, check those meals
    If that service extends to previous, must check that as well
  */

  let serviceIndex = days[today].services.findIndex(service => nowInsideTimeFrame(nowMilitary, service))

  if (~serviceIndex) {
    let service = days[today].services[serviceIndex]

    if (service.start === 'prev') {
      let yesterday = (today + 6) % 7
      let yesterdaysLastService = days[yesterday].services[days[yesterday].services.length - 1]

      let potentialMeals = yesterdaysLastService.mealOrder.filter(meal_id => meals[meal_id] && nowInsideTimeFrame(nowMilitary, meals[meal_id]))

      potentialMeals.forEach(meal_id => {
        let menusAvailable = false

        meals[meal_id].menus.forEach(menu => {
          if (!available_menus.includes(menu.menu_id) && nowInsideTimeFrame(nowMilitary, menu)) {
            menusAvailable = true
            available_menus.push(menu.menu_id)
          }
        })

        if (menusAvailable) {
          if (!available_days.includes(yesterday)) {
            available_days.push(yesterday)
          }
          if (!available_meals.includes(meal_id)) {
            available_meals.push(meal_id)
          }
        }
      })
    }

    let potentialMeals = service.mealOrder.filter(meal_id => meals[meal_id] && nowInsideTimeFrame(nowMilitary, meals[meal_id]))

    potentialMeals.forEach(meal_id => {
      let menusAvailable = false

      meals[meal_id].menus.forEach(menu => {
        if (!available_menus.includes(menu.menu_id) && nowInsideTimeFrame(nowMilitary, menu)) {
          menusAvailable = true
          available_menus.push(menu.menu_id)
        }
      })

      if (menusAvailable) {
        if (!available_days.includes(today)) {
          available_days.push(today)
        }
        if (!available_meals.includes(meal_id)) {
          available_meals.push(meal_id)
        }
      }
    })
  }

  return { available_days, available_meals, available_menus }
}

const nowInsideTimeFrame = (now, period) => {

  let { start, end, } = period

  if (start === 'prev') {
    start = '0000'
  }
  if (end === 'next') {
    end = '2400'
  }

  if (start > end) {
    end = add2400ToMilitary(end)
  }

  return start <= now && end >= now
}

function add2400ToMilitary(mili) {
  return ((mili * 1) + 2400).toString()
}

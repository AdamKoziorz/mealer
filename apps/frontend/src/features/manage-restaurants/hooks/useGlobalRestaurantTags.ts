import { useUserRestaurants } from "@entities/restaurant"

// A custom hook to query the currently selected Restaurant
export const useGlobalRestaurantTags = () => {
    const { data = [] } = useUserRestaurants();

    const globalDescriptors = 
        [...new Set(data?.map(restaurant => restaurant.descriptors))]

    const globalItems =
        [...new Set(data?.map(restaurant => restaurant.menu_items))]

    return { globalDescriptors, globalItems }
}
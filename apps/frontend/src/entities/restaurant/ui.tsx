import type { UserRestaurant } from "./api"

export interface RestaurantDisplayProps {
    restaurant: UserRestaurant
}

export const RestaurantDisplay = ({restaurant}: RestaurantDisplayProps) => {
    return (
        <div className="flex space-between">
            <h2 className="text-2xl none">
            {restaurant.name}
            </h2>
        </div>
    )
}
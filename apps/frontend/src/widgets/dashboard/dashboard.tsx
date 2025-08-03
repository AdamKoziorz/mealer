import { UserRestaurantAPI, type UserRestaurant } from "@entities/restaurant";
import { RestaurantDisplay } from "@entities/restaurant/ui";
import { useQuery } from "@tanstack/react-query"

export const RestaurantDashboard = () => {
    const { isPending, isError, data } = useQuery({
        queryKey: ["userRestaurants"],
        queryFn: UserRestaurantAPI.get,
      });

    return (
        <div className="!p-12 !m-4 !border-2 !border-solid !rounded-xl">
            <h1 className="text-4xl !pb-8">Your Restaurants</h1>
                {isPending ? <span className="text-2xl">Loading...</span> :
                isError ? <span className="text-2xl">Error!</span> :
                data.map((restaurant: UserRestaurant) => 
                    <RestaurantDisplay 
                        key={restaurant.id}
                        restaurant={restaurant}
                    />
                )}
        </div>   
    )
}
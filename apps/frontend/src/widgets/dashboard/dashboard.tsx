import { UserRestaurantAPI, type UserRestaurant } from "@entities/restaurant";
import { useRestaurantManagerStore } from "@features/manage-restaurants";
import { RestaurantDetails } from "@features/manage-restaurants";
import { useQuery } from "@tanstack/react-query"


export const RestaurantDashboard = () => {
    const { isPending, isError, data } = useQuery({
        queryKey: ["userRestaurants"],
        queryFn: UserRestaurantAPI.get,
      });

    const RestaurantManagerStore = useRestaurantManagerStore();

    if (isPending) return <div>Loading...</div>;
    if (isError) return <div>Error!</div>;

    const component = (() => { 
        switch (RestaurantManagerStore.context) {
            case 'rm/set-idle':
            case 'rm/click-empty-to-add':
                return <>
                    <h1 className="text-4xl !pb-8">Your Restaurants</h1>
                    { data.map((restaurant: UserRestaurant) => 
                        <div 
                            key={restaurant.id}
                            className="flex space-between"
                        >
                            <h2 className="text-2xl none">
                                {restaurant.name}
                            </h2>
                        </div>
                    )}
                </>

            case 'rm/select-restaurant':
                return <RestaurantDetails/>

            default:
                return undefined;
        }


    })();

    return (
        <div className="!p-12 !m-4 !border-2 !border-solid !rounded-xl">
            {component}
        </div>   
    )
}
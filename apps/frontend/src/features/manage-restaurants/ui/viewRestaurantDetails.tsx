import { UserRestaurantAPI } from "@entities/restaurant";
import { useRestaurantManagerStore } from "@features/manage-restaurants/model";
import { useQuery } from "@tanstack/react-query";

export const RestaurantDetails = () => {
    const { isPending, isError, data, error } = useQuery({
       queryKey: ["userRestaurants"],
       queryFn: UserRestaurantAPI.get,
    });
    
    const { selectedRestaurant } = useRestaurantManagerStore();

    // Pending and Error states (not implemented)
    if (isPending) console.log("Loading...");
    if (isError) console.error(`Error: ${error}`);

    // This is essential to make sure that we are actually getting
    // the proper restaurant from the server loaded into the popup
    const viewRestaurant = data!.find(
        (restaurant) => 
            restaurant.id === selectedRestaurant);

    return (
        <div className="text-black p-16 flex flex-col gap-6">
            <h1 className="text-xl font-semibold">{viewRestaurant?.name}</h1>
            <h2 className="text-large font-semibold">{viewRestaurant?.rating}</h2>
            <h2 className="text-large font-semibold">{viewRestaurant?.price_range}</h2>
            <h2 className="text-large font-semibold">{viewRestaurant?.tags}</h2>
            <h2 className="text-large font-semibold">{viewRestaurant?.notable_items}</h2>
        </div>
    )
}
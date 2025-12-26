import { UserRestaurantAPI } from "@entities/restaurant";
import { useRMStore } from "@features/manage-restaurants/hooks";
import { RestaurantDetails } from "@features/manage-restaurants/ui";
import { useQuery } from "@tanstack/react-query"


export const RestaurantDashboard = () => {
    const { isPending, isError } = useQuery({
        queryKey: ["userRestaurants"],
        queryFn: UserRestaurantAPI.get,
      });

    const RestaurantManagerStore = useRMStore();

    const renderDashboard = () => { 
        switch (RestaurantManagerStore.context) {
            case 'rm/set-idle':
            case 'rm/click-empty-to-add':
                return <h1 className="text-4xl font-semibold">Welcome to Mealer!</h1>

            case 'rm/select-restaurant':
                if (isPending) return <div>Loading...</div>;
                if (isError) return <div>Error!</div>;
                return <RestaurantDetails/>

            case 'rm/moving-restaurant':
                return <div className="text-4xl font-semibold">Moving Restaurant...</div>

            default:
                return null;
        }
    };

    return (
        <div className="!p-12 !m-4 !border-2 !border-solid !rounded-xl !bg-red-50">
            {renderDashboard()}
        </div>   
    )
}
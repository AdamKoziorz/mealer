import { UserRestaurantAPI } from '@entities';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { RestaurantMap } from '@widgets';

// Please note that the "Map" feature is going to be refactored so that
// it only contains logic related to the map itself (including markers),
// and not the actual dashboard itself that will appear when users
// log into the app.

// The UI and the handling of the pending/fetching/error states is very
// premature, and eventually, types will need to be added to the data.

const HomePage = () => {

    const { isPending, isError, data } = useQuery({ queryKey: ['userRestaurants'], queryFn: UserRestaurantAPI.get})
    
    return (
        <div className="flex h-full">
            <div className="flex w-150 flex-col text-black">
                <h1 className="text-4xl">List of Restaurants</h1>
                {isPending ? <span className="text-2xl">Loading...</span> :
                 isError ? <span className="text-2xl">Error!</span> :
                 data.map((restaurant: any) => <li key={restaurant.id} className="text-2xl">{restaurant.name}</li>)
                }
            </div>
            <div className="flex-auto relative h-screen">
                <RestaurantMap />
            </div>
        </div>
    );
}

export const Route = createFileRoute('/')({
  component: HomePage
});
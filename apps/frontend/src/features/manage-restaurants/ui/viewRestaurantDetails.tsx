import { CostRating, StarRating } from "@features/manage-restaurants"
import { deleteSelectedRestaurant, useRestaurantManagerStore, useSelectedRestaurantQuery } from "@features/manage-restaurants/model";
import { Button } from "@shared/ui";

export const RestaurantDetails = () => {
    const { isPending, isError, error, selectedRestaurant } = useSelectedRestaurantQuery();
    const selectedRestaurantDelete = deleteSelectedRestaurant();
    const RestaurantManagerStore = useRestaurantManagerStore();

    // Pending and Error states (not implemented)
    if (isPending) console.log("Loading...");
    if (isError) console.error(`Error: ${error}`);

    const onBackClick = () => {
        RestaurantManagerStore.dispatch({
            type: 'rm/set-idle'
        })
    }

    const onDeleteClick = () => {
        if (selectedRestaurant) {
            selectedRestaurantDelete.mutate(selectedRestaurant);
        }
    }

    // This is essential to make sure that we are actually getting
    // the proper restaurant from the server loaded into the popup
    return (
        <div className="text-black p-16 flex flex-col gap-4">
            <h1 className="text-4xl font-semibold">{selectedRestaurant?.name}</h1>
            <StarRating/>
            <CostRating/>
            <h2 className="text-large font-semibold">{selectedRestaurant?.tags}</h2>
            <h2 className="text-large font-semibold">{selectedRestaurant?.notable_items}</h2>
            <div aria-label="Button Container" className="flex flex-row justify-evenly">
                <Button variant={'default'} onClick={onBackClick}>Go Back</Button>
                <Button variant={'destructive'} onClick={onDeleteClick}>Delete</Button>
            </div>
        </div>
    )
}
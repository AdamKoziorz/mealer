import { Button } from "@shared/ui"
import { useRMStore, useUpdateSelectedRestaurant } from "../hooks"
import { useUserRestaurants } from "@entities/restaurant";
import { useQueryClient } from "@tanstack/react-query";

export const MoveRestaurantPopUp = () => {
    const updateSelectedRestaurant = useUpdateSelectedRestaurant();
    const RMStore = useRMStore();
    const { data: restaurants } = useUserRestaurants()
    const queryClient = useQueryClient()

    const handleSave = () => {
        const currentState = useRMStore.getState();
        const selectedRestaurantId = currentState.selectedRestaurant;
        
        if (!selectedRestaurantId) {
            console.error('Missing selected restaurant or current location');
            return;
        }

        const restaurant = restaurants?.find(
            (restaurant) => restaurant.id === selectedRestaurantId
        );

        if (!restaurant) {
            console.error('Restaurant not found');
            return;
        }

        // Update the restaurant with the new location
        updateSelectedRestaurant.mutate({
            ...restaurant,
            longitude: currentState.dragLocation!.lng,
            latitude: currentState.dragLocation!.lat
        }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["userRestaurants"] });
                RMStore.activeMapPopup?.instance.remove(); 
                RMStore.dispatch({
                    type: 'rm/select-restaurant',
                    selectedRestaurant: selectedRestaurantId,
                    clickLocation: currentState.dragLocation!
                });
            }
        });
    }

    const handleCancel = () => {
        const currentState = useRMStore.getState();
        const selectedRestaurantId = currentState.selectedRestaurant;

        RMStore.dispatch({
            type: 'rm/select-restaurant',
            selectedRestaurant: selectedRestaurantId!,
            clickLocation: currentState.clickLocation!
        });
    }


    return (
        <div className="flex flex-col gap-4">
            <Button 
                variant={'secondary'}
                onClick={handleSave}
                className="w-full">Set Location</Button>
            <Button 
                variant={'destructive'}
                onClick={handleCancel}
                className="w-full">Cancel</Button>
        </div>
     )
}
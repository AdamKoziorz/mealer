import { UserRestaurantAPI, useUserRestaurants } from "@entities/restaurant";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRMStore } from "./useRMStore";

// A custom hook to query the currently selected Restaurant (SelRest)
export const useSelectedRestaurant = () => {
    const selRestID = useRMStore(state => state.selectedRestaurant)

    const { data = [], ...queryState } = useUserRestaurants();

    const restaurant = data?.find(
        (restaurant) => restaurant.id === selRestID
    ) ?? null;

    return {
        ...queryState,
        selectedRestaurant: restaurant
    }
}

// A custom hook to delete the currently selected Restaurant
export const useDeleteSelectedRestaurant = () => {
    const queryClient = useQueryClient();
    const RMStore = useRMStore();

    const createMutation = useMutation({
        mutationFn: UserRestaurantAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userRestaurants"] });
            RMStore.dispatch({
                type: 'rm/set-idle'
            })

        },
    });

    return createMutation;
}


// A custom hook to alter the currently selected Restaurant
export const useUpdateSelectedRestaurant = () => {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: UserRestaurantAPI.put,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userRestaurants"] });
        },
    });

    return createMutation;
}
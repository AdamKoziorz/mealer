import type { UserRestaurant } from '@entities/restaurant';
import { create } from 'zustand';
import { redux } from 'zustand/middleware'

/**
 * This Zustand store helps manage the UI state while the user interacts
 * with the map and markers. This state is used to determine what the user
 * sees and when they can manage the markers
 */

type MapPopup = {
    element: HTMLDivElement;
    instance: maplibregl.Popup;
}

type RestaurantManagerStoreContext =
    | 'rm/set-idle'
    | 'rm/select-restaurant'
    | 'rm/click-empty-to-add'

type RestaurantManagerStoreState = {
    selectedRestaurant: UserRestaurant['id'] | null;
    clickLocation: maplibregl.LngLat | null;
    activeMapPopup: MapPopup | null;
    context: RestaurantManagerStoreContext;
}

type RestaurantManagerStoreAction =
    | { type: 'rm/set-idle' }
    | { type: 'rm/select-restaurant';
        selectedRestaurant: UserRestaurant['id'];
        clickLocation: maplibregl.LngLat }
    | { type: 'rm/click-empty-to-add';
        clickLocation : maplibregl.LngLat;
        activeMapPopup: MapPopup }

type RestaurantManagerStore = RestaurantManagerStoreState & {
    dispatch:
        (action: RestaurantManagerStoreAction)
            => RestaurantManagerStoreAction
}

const RestaurantManagerStoreReducer = (
    state: RestaurantManagerStoreState,
    action: RestaurantManagerStoreAction
) => {
    switch (action.type) {
        case 'rm/set-idle': {
            return {
                ... state,
                selectedRestaurant: null,
                clickLocation : null,
                activeMapPopup: null,
                context: action.type
            }
        };
        case 'rm/select-restaurant': {
            return {
                ... state,
                selectedRestaurant: action.selectedRestaurant,
                clickLocation: action.clickLocation,
                activeMapPopup: null,
                context: action.type
            }
        };

        case 'rm/click-empty-to-add': {
            return {
                ... state,
                selectedRestaurant: null,
                clickLocation: action.clickLocation,
                activeMapPopup: action.activeMapPopup,
                context: action.type
            }
        }
        default: {
            return state;
        }
    }
}

const RestaurantManagerStoreInitialState: RestaurantManagerStoreState = {
    selectedRestaurant: null,
    clickLocation : null,
    activeMapPopup: null,
    context: 'rm/set-idle'
}

export const useRMStore = create<RestaurantManagerStore>()(
    redux(RestaurantManagerStoreReducer, RestaurantManagerStoreInitialState)
)
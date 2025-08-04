/*
This file manages a Zustand store specific to managing restaurants, which
is offered to the user through the map widget and sidebar widget. This store
is set up using a redux middleware so that we are able to take advantage
of reducers.

Managing restaurants can be modelled as a finite state machine, where each
"state" is an interaction context, and the user can dispatch actions to
transition between contexts. I chose to use this over xstate because xstate
seems to be overkill for this and I would prefer to use something simple
and go more complex if needed.
*/

import type { UserRestaurant } from "@entities/restaurant"
import { create } from 'zustand';
import { redux } from 'zustand/middleware'

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
        clickLocation: maplibregl.LngLat;
        activeMapPopup: MapPopup }
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
    // If we need more granular control over whether we remove
    // popups in the future, then we can place this in the
    // switch block
    state.activeMapPopup?.instance.remove();

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
                activeMapPopup: action.activeMapPopup,
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

export const useRestaurantManagerStore = create<RestaurantManagerStore>()(
    redux(RestaurantManagerStoreReducer, RestaurantManagerStoreInitialState)
)

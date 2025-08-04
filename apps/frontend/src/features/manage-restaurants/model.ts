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

// Helper type
type MapPopup = {
    element: HTMLDivElement;
    instance: maplibregl.Popup;
}

// Our contexts
type ManageRestaurantContext = 
    | 'idle'
    | 'viewing-restaurant'
    | 'adding-restaurant'
    | 'editing-restaurant'
    | 'confirming-restaurant-deletion'

// Our store interface
interface RestaurantManagerStore {

    // Our state, which contain our context, popups, and
    // other information
    context: ManageRestaurantContext
    selectedRestaurant: UserRestaurant["id"] | null;
    clickLocation: maplibregl.LngLat | null;
    activeMapPopup: MapPopup | null;

    // Core actions that our store provides, which
    // are to be implemented by the actual Zustand store
    setContext: (next: ManageRestaurantContext) => void;
    selectRestaurant: (restaurantID: UserRestaurant["id"] | null) => void;
    setClickLocation: (location: maplibregl.LngLat | null) => void;
    setPopup: (popup: MapPopup | null) => void;
}

// Our actual Zustand store
export const useRestaurantManagerStore = create<RestaurantManagerStore>((set) => ({
    context: 'idle',
    selectedRestaurant: null,
    clickLocation: null,
    activeMapPopup: null,

    setContext: (next) => {
        set({ context: next })
    },
    selectRestaurant: (restaurantID) => set({ selectedRestaurant: restaurantID }),
    setClickLocation: (loc) => set({ clickLocation: loc }),
    setPopup: (popup) => {
        set((state) => {
            if (state.activeMapPopup?.instance) {
                state.activeMapPopup.instance.remove()
            }
            
            return { activeMapPopup: popup }
        })
    }
}))
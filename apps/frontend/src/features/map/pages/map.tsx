import { MapView } from "../components/layout/MapView";

// Please note that the "Map" feature is going to be refactored so that
// it only contains logic related to the map itself (including markers),
// and not the actual dashboard itself that will appear when users
// log into the app.

export const MapPage = () => {

    return (
        <div className="flex h-full">
            <div className="flex-auto relative h-screen">
                <MapView />
            </div>
            <div className="flex w-150 flex-col">
                Okay!
            </div>
        </div>
    );
}

import { createFileRoute } from '@tanstack/react-router';
import { Map } from '@widgets';

// Please note that the "Map" feature is going to be refactored so that
// it only contains logic related to the map itself (including markers),
// and not the actual dashboard itself that will appear when users
// log into the app.

const HomePage = () => {
    return (
        <div className="flex h-full">
            <div className="flex w-150 flex-col"></div>
            <div className="flex-auto relative h-screen">
                <Map />
            </div>
        </div>
    );
}

export const Route = createFileRoute('/')({
  component: HomePage
});
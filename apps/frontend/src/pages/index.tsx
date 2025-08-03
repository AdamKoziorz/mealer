import { createFileRoute } from '@tanstack/react-router';
import { RestaurantMap } from '@widgets/map';
import { RestaurantDashboard } from '@widgets/dashboard';

const HomePage = () => {
    return (
        <main className="flex h-full">
            <section aria-label="Restaurant Dashboard" className="flex w-150 flex-col text-black">
                <RestaurantDashboard />
            </section>
            <section aria-label="Restaurant Map" className="flex-auto relative h-screen">
                <RestaurantMap />
            </section>
        </main>
    );
}

export const Route = createFileRoute('/')({
  component: HomePage
});
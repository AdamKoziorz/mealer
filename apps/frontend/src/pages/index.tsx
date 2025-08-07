import { createFileRoute } from '@tanstack/react-router';
import { RestaurantMap } from '@widgets/map';
import { RestaurantDashboard } from '@widgets/dashboard';

const HomePage = () => {
    return (
        <main className="relative w-screen h-screen">
            <section aria-label="Restaurant Map" className="absolute inset-0 z-0">
                <RestaurantMap />
            </section>
            <section aria-label="Restaurant Dashboard" className="absolute top-4 left-4 z-10 w-150 max-w-[30vw] flex-col text-black">
                <RestaurantDashboard />
            </section>
        </main>
    );
}

export const Route = createFileRoute('/')({
  component: HomePage
});
import { createFileRoute } from '@tanstack/react-router';
import { MapPage } from '../features/map/pages/map';

// At least for now, the "main" route of the app is just the map page.
export const Route = createFileRoute('/')({
  component: MapPage
});
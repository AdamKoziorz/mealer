import { useRestaurantManagerStore } from "@features/manage-restaurants/model";

export const ViewRestaurantPopUp = () => {
    const { selectedRestaurant } = useRestaurantManagerStore();

  return (
   <div className="text-black p-16 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{selectedRestaurant}</h1>
    </div>
  )
}
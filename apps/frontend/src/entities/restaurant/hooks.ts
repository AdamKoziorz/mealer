import { useQuery } from "@tanstack/react-query";
import { UserRestaurantAPI } from "@entities/restaurant";

export const useUserRestaurants = () => {
  return useQuery({
    queryKey: ["userRestaurants"],
    queryFn: UserRestaurantAPI.get,
  });
};
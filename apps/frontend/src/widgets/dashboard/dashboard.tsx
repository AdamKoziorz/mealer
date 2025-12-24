import { UserRestaurantAPI } from "@entities/restaurant";
import { fetchMe, logout } from "@entities/user/api";
import { useRMStore } from "@features/manage-restaurants/hooks";
import { RestaurantDetails } from "@features/manage-restaurants/ui";
import { Button } from "@shared/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const RestaurantDashboard = () => {

  const queryClient = useQueryClient();
  
  // 1️⃣ Auth query
  const {
    data: user,
    isPending: authLoading,
  } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  // 2️⃣ Restaurants query (only runs if logged in)
  const {
    isPending: restaurantsLoading,
    isError,
  } = useQuery({
    queryKey: ["userRestaurants"],
    queryFn: UserRestaurantAPI.get,
    enabled: !!user,
  });

  const RestaurantManagerStore = useRMStore();

  // 3️⃣ Login UI
  if (authLoading) {
    return (
      <div className="!p-12">Checking session…</div>
    );
  }

  if (!user) {
    return (
      <div className="!p-12 !m-4 !border-2 !rounded-xl !bg-red-50">
        <h1 className="text-3xl font-semibold mb-4">
        Welcome to Mealer!
        </h1>
        <p className="!mt-2">
        My name is Adam Koziorz, and I built this web app with a goal to help foodies
        track their restaurants better. What are you waiting for? Sign in now to start tracking!
        </p>
        <p className="!mt-2">
        Note that only Google OAuth is supported at this time.
        </p>
        <Button onClick={() => {
          window.location.href = "http://localhost:6789/auth/google"
        }} variant={'destructive'} className="!mt-4 !px-4">
          Sign in with Google
        </Button>
        <Button onClick={() => {
          window.open("https://adamkoziorz.github.io", "_blank", "noopener,noreferrer")
        }} variant={'default'} className="!mt-4 !px-4 !ml-4">
          View my Personal Site!
        </Button>

      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    queryClient.invalidateQueries({ queryKey: ["me"]}); // Forces refetch of /me → null
  };

  // 4️⃣ Existing dashboard logic (unchanged)
  const renderDashboard = () => {
    switch (RestaurantManagerStore.context) {
      case "rm/set-idle":
      case "rm/click-empty-to-add":
        return (
          <>
            <h1 className="text-4xl font-semibold">
              Hello There!
            </h1>
            <p className="!mt-2">
            If you don't yet have a restaurant, try clicking on the map! Once you do,
            you can click on your markers to view and edit your thoughts!
            </p>
            <Button onClick={handleLogout} variant={'default'} className="!mt-4 !px-4">
              Log Out
            </Button>
         </>
        );

      case "rm/select-restaurant":
        if (restaurantsLoading) return <div>Loading...</div>;
        if (isError) return <div>Error!</div>;
        return <RestaurantDetails />;

      case "rm/moving-restaurant":
        return (
          <div className="text-4xl font-semibold">
            Moving Restaurant...
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="!p-12 !m-4 !border-2 !rounded-xl !bg-red-50">
      {renderDashboard()}
    </div>
  );
};
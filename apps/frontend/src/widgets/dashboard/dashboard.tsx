import { UserRestaurantAPI } from "@entities/restaurant";
import { fetchMe, logout } from "@entities/user/api";
import { useRMStore } from "@features/manage-restaurants/hooks";
import { RestaurantDetails } from "@features/manage-restaurants/ui";
import { Button } from "@shared/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const SERVER_URL = import.meta.env.VITE_API_URL;

export const RestaurantDashboard = () => {
  const queryClient = useQueryClient();
  const authParams =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search);
  const authError = authParams?.get("error");
  const authReason = authParams?.get("reason");

  const {
    data: user,
    isPending: authLoading,
  } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const {
    isPending: restaurantsLoading,
    isError,
  } = useQuery({
    queryKey: ["userRestaurants"],
    queryFn: UserRestaurantAPI.get,
    enabled: !!user,
  });

  const RestaurantManagerStore = useRMStore();

  if (authLoading) {
    return (
      <div className="!p-4 !pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:!p-12">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="!p-4 !pb-[calc(env(safe-area-inset-bottom)+1rem)] !bg-red-50 sm:!m-4 sm:!rounded-xl sm:!border-2 sm:!p-12">
        <h1 className="mb-4 text-3xl font-semibold">Welcome to Mealer!</h1>
        {authError === "auth_failed" ? (
          <div className="!mb-4 !rounded-lg !border !border-red-300 !bg-white !p-3 text-sm text-red-700">
            Google sign-in did not complete.
            {authReason ? ` Reason: ${authReason}` : " Please try again."}
          </div>
        ) : null}
        <p className="!mt-2">
          My name is Adam Koziorz, and I built this web app with a goal to help
          foodies track their restaurants better. What are you waiting for? Sign
          in now to start tracking!
        </p>
        <p className="!mt-2">
          Note that only Google OAuth is supported at this time.
        </p>
        <div className="!mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              window.location.assign(`${SERVER_URL}/auth/google`);
            }}
            variant={"destructive"}
            className="!px-4"
          >
            Sign in with Google
          </Button>
          <Button
            onClick={() => {
              window.open(
                "https://adamkoziorz.github.io",
                "_blank",
                "noopener,noreferrer"
              );
            }}
            variant={"default"}
            className="!px-4"
          >
            View my Personal Site!
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const renderDashboard = () => {
    switch (RestaurantManagerStore.context) {
      case "rm/set-idle":
      case "rm/click-empty-to-add":
        return (
          <>
            <h1 className="text-4xl font-semibold">Hello There!</h1>
            <p className="!mt-2">
              If you don&apos;t yet have a restaurant, try clicking on the map!
              Once you do, you can click on your markers to view and edit your
              thoughts!
            </p>
            <Button
              onClick={handleLogout}
              variant={"default"}
              className="!mt-4 !px-4"
            >
              Log Out
            </Button>
          </>
        );

      case "rm/select-restaurant":
        if (restaurantsLoading) return <div>Loading...</div>;
        if (isError) return <div>Error!</div>;
        return <RestaurantDetails />;

      case "rm/moving-restaurant":
        return <div className="text-4xl font-semibold">Moving Restaurant...</div>;

      default:
        return null;
    }
  };

  return (
    <div className="!bg-red-50 !p-4 !pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:!m-4 sm:!rounded-xl sm:!border-2 sm:!p-12">
      {renderDashboard()}
    </div>
  );
};

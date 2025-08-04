// This app uses zod + react hook forms for client side input validation
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UserRestaurantAPI, type UserRestaurant } from "@entities/restaurant";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Input } from "@shared/ui";
import { Button } from "@shared/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui";
import { useRestaurantManagerStore } from "@features/manage-restaurants/model";

const AddRestaurantPopupFormSchema = z.object({
  restaurantName: z.string().min(1, {
    message: "Please input a non-empty name!",
  }),
});

// This popup provides a form to the user that allows them to add restaurants
// onto the map. Requires the location of where the popup opened, and a
// function that determines the closing behaviour of the popup if successful
export const AddRestaurantPopUp = () => {
  const queryClient = useQueryClient();
  
  const RestaurantManagerStore = useRestaurantManagerStore();

  // Eventually, we are also going to have to do some state handling
  // (We do not have any Pending/Error state handling yet)
  const createMutation = useMutation({
    mutationFn: UserRestaurantAPI.post,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRestaurants"] });
      RestaurantManagerStore.dispatch({
        type: 'rm/set-idle'
      })
    },
  });

  const addRestaurantPopUpForm = useForm<
    z.infer<typeof AddRestaurantPopupFormSchema>
  >({
    resolver: zodResolver(AddRestaurantPopupFormSchema),
    defaultValues: {
      restaurantName: "",
    },
  });

  function onSubmit(data: z.infer<typeof AddRestaurantPopupFormSchema>) {
    const newRestaurant: UserRestaurant = {
      id: crypto.randomUUID(),          // TODO: Should be on backend
      name: data.restaurantName,
      address: "",                      
      longitude: RestaurantManagerStore.clickLocation!.lng,    // I know this is not null - assert
      latitude: RestaurantManagerStore.clickLocation!.lat,     // I know this is not null - assert
      rating: 5,                        
      price_range: 1,                 
      tags: [],                       
      notable_items: [],                
    }

    createMutation.mutate(newRestaurant);
  }

  return (
    <div role="form" className="text-black p-16 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Add Restaurant</h1>
      <Form {...addRestaurantPopUpForm}>
        <form
          onSubmit={addRestaurantPopUpForm.handleSubmit(onSubmit)}
          className="space-y-6 flex flex-col gap-4"
        >
          <FormField
            control={addRestaurantPopUpForm.control}
            name="restaurantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restaurant Name</FormLabel>
                <FormControl>
                  <Input placeholder="Yummies" {...field}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
          <Button type="submit" className="text-white w-1/3">
            Create
          </Button>
        </form>
      </Form>
    </div>
  );
};
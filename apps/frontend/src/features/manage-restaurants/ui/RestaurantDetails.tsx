import {
    useRMStore,
    useDeleteSelectedRestaurant,
    useSelectedRestaurant,
    useGlobalRestaurantTags,
    useUpdateSelectedRestaurant
} from "@features/manage-restaurants/hooks";
import { TagList } from "@features/manage-restaurants/ui";
import { CostRating, StarRating } from "./RestaurantRatings";
import { Button, Textarea } from "@shared/ui";
import { useEffect, useMemo, useState } from "react";
import type { UserRestaurant } from "@entities/restaurant";

export const RestaurantDetails = () => {

    const { isPending, isError, selectedRestaurant } = useSelectedRestaurant();
    const selectedRestaurantDelete = useDeleteSelectedRestaurant();
    const updateSelectedRestaurant = useUpdateSelectedRestaurant();
    const RestaurantManagerStore = useRMStore();
    const { globalDescriptors, globalItems } = useGlobalRestaurantTags();

    const [note, setNote] = useState("");

    useEffect(() => {
         if (selectedRestaurant) setNote(selectedRestaurant.notes)
    }, [selectedRestaurant])

    const handleBackClick = () => {
        RestaurantManagerStore.dispatch({
            type: 'rm/set-idle'
        })
    }

    const handleDeleteClick = () => {
        if (selectedRestaurant) {
            selectedRestaurantDelete.mutate(selectedRestaurant);
        }
    }

    const handleUpdate = (partial: Partial<UserRestaurant | null>) => {
        if (!selectedRestaurant) return;
        updateSelectedRestaurant.mutate({ ...selectedRestaurant, ...partial });
    };


    // Memoized tags to be prop drilled to their corresponding tags
    const globalDescriptorTags = useMemo(() => (
        [...new Set(globalDescriptors.flat())].map(label => ({ label }))
    ), [globalDescriptors]);

    const globalItemTags = useMemo(() => (
        [...new Set(globalItems.flat())].map(label => ({ label }))
    ), [globalItems]);

    const localDescriptorTags = useMemo(() => (
        (selectedRestaurant?.descriptors ?? []).map(label => ({ label }))
    ), [selectedRestaurant]);

    const localItemTags = useMemo(() => (
        (selectedRestaurant?.menu_items ?? []).map(label => ({ label }))
    ), [selectedRestaurant]);


    // Pending and Error states (not implemented)
    if (isPending) return <div>Loading...</div>
    if (isError) return <div>Error!</div>

    return (
        <div className="text-black p-16 flex flex-col gap-1">
            <h1 className="text-4xl font-semibold !mb-6 !text-ellipsis !break-words !line-clamp-3">{selectedRestaurant?.name}</h1>
            <StarRating/>
            <CostRating/>
            <h2 className="text-xl !pt-6 !pb-2">Descriptors</h2>
            <TagList
                localTags={localDescriptorTags}
                setLocalTags={(newTags) => handleUpdate({ descriptors: newTags.map(t => t.label)})}
                globalTags={globalDescriptorTags}
                setGlobalTags={() => {}}
            />
            <h2 className="text-xl !pt-6 !pb-2">Menu Items</h2>
            <TagList
                localTags={localItemTags}
                setLocalTags={(newTags) =>  handleUpdate({ menu_items: newTags.map(t => t.label)})}
                globalTags={globalItemTags}
                setGlobalTags={() => {}}
            />
            <h2 className="text-xl !pt-6 !pb-2">Other Comments</h2>
            <Textarea 
                className="resize-none !p-2 !h-50 !bg-white"
                onChange={(e) => {setNote(e.target.value)}}
                onBlur={() => handleUpdate({ notes: note })}
                value={note}
            />
            <div aria-label="Button Container" className="flex flex-row justify-between !pt-12">
                <Button variant={'default'} onClick={handleBackClick} className="w-1/3">Close</Button>
                <Button variant={'destructive'} onClick={handleDeleteClick} className="w-1/3">Delete</Button>
            </div>
        </div>
    )
}
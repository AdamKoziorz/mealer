import Rating from '@mui/material/Rating';
import Box from '@mui/material/Box';
import StarIcon from '@mui/icons-material/Star';
import CostIcon from '@mui/icons-material/AttachMoney';
import styled from '@emotion/styled';

import { 
    useUpdateSelectedRestaurant,
    useSelectedRestaurant
} from '@features/manage-restaurants/hooks';

import { useEffect, useState } from 'react';


/**
 * This code violates the DRY principle. Maybe in the future, I will
 * refactor this. However, I do not see it as particularly urgent to
 * refactor given the fact that I know for a fact there will only be
 * these two ratings that exist for a restaurant.
 */

const STAR_LABELS: { [index: string]: string } = {
  0: 'No Star Rating',
  0.5: 'Dogshit',
  1: 'Trash',
  1.5: 'Not Good',
  2: 'Mid',
  2.5: 'Alright',
  3: 'Decent',
  3.5: 'Good',
  4: 'Great',
  4.5: 'Elite',
  5: 'Peak',
};

const COST_LABELS: { [index: string]: string } = {
  0: 'No Cost Rating',
  1: 'Cheap',
  2: 'Affordable',
  3: 'Reasonable',
  4: 'Pricey',
  5: 'Bougie'
};

function getStarLabelText(value: number) {
  return `${value} Star${value !== 1 ? 's' : ''}, ${STAR_LABELS[value]}`;
}

function getCostLabelText(value: number) {
  return `${value} Cost${value !== 1 ? 's' : ''}, ${COST_LABELS[value]}`;
}

const StyledCostRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: 'rgba(30, 137, 34, 1)',
  },
  '& .MuiRating-iconHover': {
    color: 'rgba(20, 106, 23, 1)',
  },
});

export const StarRating = () => {
    const { isPending, isError, error, selectedRestaurant } = useSelectedRestaurant();
    const selectedRestaurantUpdate = useUpdateSelectedRestaurant();

    // Pending and Error states (not implemented)
    if (isPending) console.log("Loading...");
    if (isError) console.error(`Error: ${error}`);

    const [value, setValue] = useState<number | null>(null);
    const [hover, setHover] = useState(-1);

    // Initialize the rating
    useEffect(() => {
        if (selectedRestaurant) {
          const safeCurrentValue = (selectedRestaurant.rating ? selectedRestaurant.rating : 0) / 2;
          setValue(safeCurrentValue)
        }
    }, [selectedRestaurant])

  return (
    <Box sx={{ width: 250, display: 'flex', alignItems: 'center' }}>
      <Rating
        name="star-rating"
        value={value}
        precision={0.5}
        getLabelText={getStarLabelText}
        onChange={(_, newValue) => {
          let safeNewValue = newValue ? (newValue * 2) : null;
          if (selectedRestaurant) {
            selectedRestaurantUpdate.mutate({...selectedRestaurant, rating: safeNewValue});
          }
          setValue(newValue);
        }}
        onChangeActive={(_, newHover) => {
          setHover(newHover);
        }}
        emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
      />
      {value !== null && (
        <Box sx={{ ml: 2 }}>{STAR_LABELS[hover !== -1 ? hover : value]}</Box>
      )}
    </Box>
  );
}


export const CostRating = () => {
    const { isPending, isError, error, selectedRestaurant } = useSelectedRestaurant();
    const selectedRestaurantUpdate = useUpdateSelectedRestaurant();

    // Pending and Error states (not implemented)
    if (isPending) console.log("Loading...");
    if (isError) console.error(`Error: ${error}`);

    const [value, setValue] = useState<number | null>(null);
    const [hover, setHover] = useState(-1);

    // Initialize the rating
    useEffect(() => {
      if (selectedRestaurant) {
        const safeCurrentValue = (selectedRestaurant.price_range ? selectedRestaurant.price_range : 0);
        setValue(safeCurrentValue)
      }
    }, [selectedRestaurant])

  return (
    <Box sx={{ width: 250, display: 'flex', alignItems: 'center' }}>
      <StyledCostRating
        name="cost-rating"
        value={value}
        precision={1}
        getLabelText={getCostLabelText}
        onChange={(_, newValue) => {
          let safeNewValue = newValue ? newValue : null;
          if (selectedRestaurant) {
            selectedRestaurantUpdate.mutate({...selectedRestaurant, price_range: safeNewValue});
          }
          setValue(newValue);
        }}
        onChangeActive={(_, newHover) => {
          setHover(newHover);
        }}
        emptyIcon={<CostIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
        icon={<CostIcon fontSize="inherit" />}
      />
      {value !== null && (
        <Box sx={{ ml: 2 }}>{COST_LABELS[hover !== -1 ? hover : (value ?? 0)]}</Box>
      )}
    </Box>
  );
}
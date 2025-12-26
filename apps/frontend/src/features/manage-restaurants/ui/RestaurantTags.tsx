import React, { useState } from 'react';

import {
  Stack,
  Chip,
  TextField,
  Autocomplete,
  IconButton
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

// Should this maybe be outside of the /ui folder?
export interface Tag {
  label: string;
}

interface TagListProps {
  localTags: Tag[];
  setLocalTags: (tags: Tag[]) => void;
  globalTags: Tag[];
  setGlobalTags: (tags: Tag[]) => void;
}

// Unfortunately need to override Material UI's defaults to get the font
// consistent with what I have in ~/app/index.css's :root. Right now, I honestly
// do not see it all that worth to create a custom theme.
const rootTextStyle = {
  fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  lineHeight: 1.5
};



// A TagList is a container of tags (chips) that represent 
// any specific data relating to a restaurant that is stored
// as an array
//
// "local" pertains to this specific Restaurant's TagLists
// "global" pertains to all Restaurants and their TagLists
//
// We do this because we want to have autocomplete

export const TagList: React.FC<TagListProps> = ({
  localTags,
  setLocalTags,
  globalTags,
  setGlobalTags
}) => {

  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // When we add a tag, we want to make sure that it is added to
  // both this restaurant's tag lists and all other restaurant's tag lists
  const addTag = (tagLabel: string) => {
    const tag: Tag = { label: tagLabel.trim() };
    if (!tag.label) return;

    if (!globalTags.find(t => t.label === tag.label)) {
      setGlobalTags([...globalTags, tag]);
    }

    if (!localTags.find(t => t.label === tag.label)) {
      setLocalTags([...localTags, tag]);
    }

    setInputValue('');
    setIsAdding(false);
  };

  // When we delete a local tag, the parent component will know to
  // rerender the component with a new global tag list
  const deleteLocalTag = (tag: Tag) => {
    setLocalTags(localTags.filter(t => t.label !== tag.label));
  };

  return (
    <Stack 
      direction="row"
      spacing={1}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      sx={rootTextStyle}>
      {localTags.map((tag, index) => (
        <Chip
          key={index}
          label={tag.label}
          onDelete={() => deleteLocalTag(tag)}
          sx={rootTextStyle}
        />
      ))}

      {isAdding ? (
        <Autocomplete
          freeSolo
          options={[... new Set(globalTags
            .map(t => t.label)
            .filter(label => !localTags.find(t => t.label === label)))]}
          inputValue={inputValue}
          onInputChange={(_, value) => setInputValue(value)}
          onChange={(_, value) => {
            if (typeof value === 'string') addTag(value);
          }}
          disablePortal
          sx={{
            '& + .MuiAutocomplete-popper .MuiAutocomplete-option': rootTextStyle
          }}
          renderInput={(params) => (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <TextField
                {...params}
                variant="standard"
                placeholder="Enter tags..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(inputValue);
                  } else if (e.key === 'Escape') {
                    setInputValue('');
                    setIsAdding(false);
                  }
                }}
                autoFocus
                sx={{
                  minWidth: 120,
                  '& input': rootTextStyle
                }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  setInputValue('');
                  setIsAdding(false);
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        />
      ) : (
        <IconButton size="small" onClick={() => setIsAdding(true)}>
          <AddIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>
  );
};

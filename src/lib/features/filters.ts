import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Filter {
  status?: string;
  email?: string;
  number?: number;
  createdAt?: { $gte?: string; $lte?: string };
  asignee?: string;
  issue?: string;
  description?: string;
}

type State = Filter;

const initialState: State = {} as State;

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilters: (_state: State, action: PayloadAction<Filter>) => {
      return action.payload; 
    },
    updateFilter: (state, action: PayloadAction<Filter>) => {
      return { ...state, ...action.payload };
    },
    clearFilters: () => {
      return {} as State;
    },
  },
});

export const { setFilters, updateFilter, clearFilters } = filtersSlice.actions;

export default filtersSlice.reducer;
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '.'

type CounterState = {
  value: number
  status: string
}

const initialState: CounterState = {
  value: 0,
  status: 'idle'
};

function fetchCount(amount: number) {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ data: amount }), 500)
  )
}

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment(state: CounterState) {
      console.log('increment reducer')
      state.value++;
    },
    decrement: (state: CounterState) => {
      console.log('decrement reducer')
      state.value -= 1;
    },
    incrementByAmount(state: CounterState, action: PayloadAction<number>) {
      console.log('increment by amount reducer')
      state.value += action.payload;
    }
  },
  extraReducers: (builder: any) => {
    builder
      .addCase(incrementAsync.pending, (state: CounterState) => {
        state.status = 'loading';
      })
      .addCase(incrementAsync.fulfilled, (state: CounterState, action: PayloadAction<number>) => {
        state.status = 'idle';
        state.value += action.payload;
      });
  }
});

/**
 * Export Actions
 */
export const { increment, decrement, incrementByAmount } = counterSlice.actions
export const incrementAsync = createAsyncThunk('counter/fetchCount',
  async (amount: number) => {
    const response: any = await fetchCount(amount);
    // The value we return becomes the `fulfilled` action payload
    return response.data;
  }
)
/**
 * Export Reducer
 */
export const counterReducer = counterSlice.reducer


export const selectCount = (state: RootState) => state.counter.value
export const selectStatus = (state: RootState) => state.counter.status

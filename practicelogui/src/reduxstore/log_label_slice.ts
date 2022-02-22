import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { RootState } from '.'
import { LogLabelJSON } from '../practice-log/types';
import { Map } from 'immutable'

type LogLabelStoreState = {
  items: LogLabelJSON[]
  isLoading: boolean
  errorMessage: string
}

const initialState: LogLabelStoreState = {
  items: [],
  isLoading: false,
  errorMessage: ""
}

export const asyncFetchLogLabels = createAsyncThunk('logLabel/fetch',
  async (http: AxiosInstance) => {
    const resp: AxiosResponse = await http.get('/api/v1/log/labels')
    const labels: LogLabelJSON[] = resp.data.results

    let childrenIDByParentID = Map<string, string[]>()
    labels.forEach((label: LogLabelJSON) => {
      if (label.parent_id) {
        let children = childrenIDByParentID.get(label.parent_id)
        if (!children) {
          children = []
        }
        children.push(label.id)
        // WARNING: Using immutable map
        childrenIDByParentID = childrenIDByParentID.set(label.parent_id, children)
      }
    })

    labels.forEach((label: LogLabelJSON) => {
      if (childrenIDByParentID.get(label.id)) {
        label.children = childrenIDByParentID.get(label.id) as string[]
      } else {
        label.children = []
      }
    })

    return labels
  }
)

// We can only pass 1 argument to createAsyncThunk
export const asyncUpdateLogLabel = createAsyncThunk('logLabel/update',
  async ({http, label}: { http: AxiosInstance, label: LogLabelJSON }) => {
    await http.put(`/api/v1/log/labels/${label.id}`, label)
  }
)

// Redux Toolkit makes use of the Immer library, which allows developers to write mutable logic in
// reducer functions.
const logLabelSlice = createSlice({
  name: 'logLabel',
  initialState,
  reducers: {},
  extraReducers: (builder: any) => {
    builder
      .addCase(asyncFetchLogLabels.pending, (state: LogLabelStoreState) => {
        state.isLoading = true
      })
      .addCase(asyncFetchLogLabels.fulfilled, (state: LogLabelStoreState, action: PayloadAction<LogLabelJSON[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(asyncFetchLogLabels.rejected, (state: LogLabelStoreState, action: PayloadAction<LogLabelJSON[], string, string, AxiosError>) => {
        state.errorMessage = action.error.message
      })
      .addCase(asyncUpdateLogLabel.pending, (state: LogLabelStoreState) => {
        state.isLoading = true
      })
      .addCase(asyncUpdateLogLabel.fulfilled, (state: LogLabelStoreState) => {
        state.isLoading = false
      })
      .addCase(asyncUpdateLogLabel.rejected, (state: LogLabelStoreState, action: PayloadAction<void, string, string, AxiosError>) => {
        state.errorMessage = action.error.message
      })
  }
});

// Reducer
export const logLabelReducer = logLabelSlice.reducer

// Selectors
export const selectLogLabels = (state: RootState) => state.logLabel.items
export const selectIsLoading = (state: RootState) => state.logLabel.isLoading
export const selectErrorMessage = (state: RootState) => state.logLabel.errorMessage
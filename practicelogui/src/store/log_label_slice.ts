//   /**
//    * This is an internal class helper function to populate log labels as state.
//    */
//    fetchLogLabels() {
//     this.http.get('/api/v1/log/labels')
//       .then((resp: AxiosResponse) => {
//         const labels: LogLabelJSON[] = resp.data.results
//         let childrenIDByParentID = Map<string, string[]>()
//         labels.forEach((label: LogLabelJSON) => {
//           if (label.parent_id) {
//             let children = childrenIDByParentID.get(label.parent_id)
//             if (!children) {
//               children = []
//             }
//             children.push(label.id)
//             // WARNING: Using immutable map
//             childrenIDByParentID = childrenIDByParentID.set(label.parent_id, children)
//           }
//         })
//         labels.forEach((label: LogLabelJSON) => {
//           if (childrenIDByParentID.get(label.id)) {
//             label.children = childrenIDByParentID.get(label.id) as string[]
//           } else {
//             label.children = []
//           }
//         })
//         this.setState({
//           logLabels: labels
//         })
//       })
//       .then(() => {
//         this.fetchLogLabelDurations()
//       })
//       .catch((reason: any) => {
//         this.setState({
//           alertShown: true,
//           alertMessage: `Failed to list log labels due to ${reason}`,
//           alertSeverity: "error"
//         })
//       })
//   }
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError, AxiosInstance, AxiosPromise, AxiosResponse } from 'axios';
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

async function fetchLogLabels(http: AxiosInstance) {
  return http.get('/api/v1/log/labels')
      .then((resp: AxiosResponse) => {
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
      })
}

export const asyncFetchLogLabels = createAsyncThunk('logLabel/fetch', fetchLogLabels)

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
  }
});

export const logLabelReducer = logLabelSlice.reducer

export const selectLogLabels = (state: RootState) => state.logLabel.items
export const selectIsLoading = (state: RootState) => state.logLabel.isLoading
export const selectErrorMessage = (state: RootState) => state.logLabel.errorMessage
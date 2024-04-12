import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  s3Bucket: "s3Bucket",
  contractTitleToBeUploaded: [],
};

export const s3BucketSlice = createSlice({
  name: "s3Bucket",
  initialState,
  reducers: {
    setS3Bucket: (state, action) => {
      state.s3Bucket = action.payload;
    },
    setContractTitleToBeUploaded: (state, action) => {
      state.contractTitleToBeUploaded = action.payload;
    },
  },
});

export const { setS3Bucket, setContractTitleToBeUploaded } =
  s3BucketSlice.actions;

export default s3BucketSlice.reducer;

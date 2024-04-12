import { configureStore } from "@reduxjs/toolkit";
// import rootReducer from "./reducers";

// Reducers
import AppSettings from "./slices/AppSettings";
import s3BucketReducer from "./slices/s3BucketSlice";

// Reducer
const reducer = {
  appSettings: AppSettings,
  s3Bucket: s3BucketReducer,
};

const store = configureStore({ reducer });

export default store;

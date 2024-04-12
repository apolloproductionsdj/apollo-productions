import React from "react";
import { useSelector } from "react-redux";

const ApolloS3Bucket = () => {
  // ========== Selectors ==========
  const { contractTitleToBeUploaded } = useSelector((state) => state.s3Bucket);

  console.log("contractTitleToBeUploaded ===>", contractTitleToBeUploaded);
  return (
    <div className="text-white pl-28">
      {contractTitleToBeUploaded.length > 0 ? (
        <div className="text-[#f7a44a]">Title:</div>
      ) : (
        <div></div>
      )}
      <div>{contractTitleToBeUploaded}</div>
    </div>
  );
};

export default ApolloS3Bucket;

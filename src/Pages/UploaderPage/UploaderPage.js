import React, { useState } from "react";

// Libraries
import { useDropzone } from "react-dropzone";

// Material UI
import CloudUploadIcon from "@mui/icons-material/CloudUpload"; // Example import
import ApolloS3Bucket from "./Components/ApolloS3Bucket";

const Uploader = () => {
  const [fileTitle, setFileTitle] = useState("");

  // Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFilesize: 460 * 1024 * 1024, // Set the max filesize to 460 MB

    onDrop: async (files) => {
      const file = files[0];
      console.log("file:", file);
      // Assuming the file name (without the extension) as the title
      const title = file.path.split("/").pop().split(".")[0];
      setFileTitle(title); // Update the state with the extracted title
    },
  });
  return (
    <div className="bg-black h-screen pt-8">
      <section className="mx-auto pr-5 pl-5">
        <div
          {...getRootProps({
            className: `dropzone border-dashed border-2 ${
              isDragActive
                ? "bg-[#035FFE] text-white animate-pulse"
                : "bg-[#2c2c2c] text-gray-500  border-[#474747]"
            } pl-32 pr-32 pt-8`,
          })}
        >
          <input {...getInputProps()} />
          <div className="flex justify-center">
            <CloudUploadIcon sx={{ fontSize: 100, color: "lightgray" }} />
          </div>
          <p className="flex justify-center text-center font-semibold">
            {isDragActive
              ? "Drop the files here ..."
              : "Drag 'n' drop some files here, or click to select files"}
          </p>
          <p className="flex justify-center pt-3">
            {isDragActive ? "Or" : "Or"}
          </p>
          <div className="flex justify-center pt-3">
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center text-white"
            >
              Browse
            </button>
          </div>
          <p className="flex justify-center text-center pb-5">
            (Only *.pdf files will be accepted)
          </p>
        </div>
      </section>
      <div
        className={` rounded-lg pt-8 mt-5 mb-2 xs:w-11/12 sm:w-10/12 lg:w-11/12 `}
      >
        <ApolloS3Bucket />
      </div>
    </div>
  );
};

export default Uploader;

import React, { useState, useEffect, useRef } from "react";

// Libraries
import { useDropzone } from "react-dropzone";

// Material UI
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
// import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Components
import ApolloS3Bucket from "./Components/ApolloS3Bucket";

// AWS
import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

// Redux
import { useDispatch, useSelector } from "react-redux";

import { setContractTitleToBeUploaded } from "../../redux/slices/s3BucketSlice";
import StepIndicator from "./Components/StepIndicator";

const Uploader = () => {
  const [fileTitle, setFileTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0); // Initialize upload progress state
  const [selectedFile, setSelectedFile] = useState(null); // State to hold the selected file
  const [bucketContents, setBucketContents] = useState([]); // State to hold bucket contents
  console.log("bucketContents:", bucketContents);

  const [isUploadComplete, setIsUploadComplete] = useState(false); // Tracks when a new file is uploaded
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSelectedFolderObjects, setIsLoadingSelectedFolderObjects] =
    useState(false);
  const [folderObjects, setFolderObjects] = useState([]); // The objects in the selected folder
  console.log("folderObjects:", folderObjects);
  const [selectedFolder, setSelectedFolder] = useState(null); // The folder that is currently selected

  const { theme } = useSelector((state) => state.appSettings); // Select the theme from the store

  // Upload File inside Folder===============
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [selectedFileToUpload, setSelectedFileToUpload] = useState(null);
  console.log("selectedFileToUpload =====>>>>>", selectedFileToUpload);
  const [isFileLoadingToS3Folder, setIsFileLoadingToS3Folder] = useState(false);

  const dispatch = useDispatch();
  // ============= Ref ===============
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log("Current bucketContents state:", bucketContents);
  }, [bucketContents]);

  // UseEffect to dispatch action when fileTitle changes
  useEffect(() => {
    if (fileTitle) {
      dispatch(setContractTitleToBeUploaded(fileTitle));
    }
  }, [fileTitle, dispatch]);

  // Function to handle the upload when the button is clicked
  const handleUploadClick = async () => {
    if (selectedFile) {
      console.log("selectedFile ===>>", selectedFile);
      setIsUploading(true);
      setIsUploadComplete(false);
      setUploadProgress(0); // Start with 0 progress

      const incrementProgress = () => {
        setUploadProgress((prevProgress) => {
          if (prevProgress < 100) {
            setTimeout(incrementProgress, 100); // Simulate progress
            return prevProgress + 10; // Increment progress
          }
          return prevProgress;
        });
      };

      incrementProgress(); // Start simulating progress

      try {
        // Your existing upload logic
        await fetchPreSignedUrlAndUpload(selectedFile);
        setUploadProgress(100); // Indicate that upload is fully complete
        setIsUploadComplete(true); // Set upload as complete to show the checkmark
      } catch (error) {
        console.error("Upload failed", error);
        // Handle upload error
      } finally {
        setIsUploading(false); // Stop the uploading state
      }
    }
  };

  // AWS Pre Signed URL
  const fetchPreSignedUrlAndUpload = async (file) => {
    console.log("file:", file);

    const extractDateFromFileName = (fileName) => {
      // Pattern to match six digits representing date in YYMMDD format
      const datePattern = /(\d{2})(\d{2})(\d{2})/;
      const match = fileName.match(datePattern);

      if (match) {
        // Extract year, month, and day from the matched pattern
        const year = parseInt(match[1], 10) + 2000; // Assuming dates are in the 2000s
        const month = parseInt(match[2], 10) - 1; // Month is 0-indexed in JavaScript Date
        const day = parseInt(match[3], 10);

        // Create a new date instance
        const date = new Date(year, month, day);

        // Format date as "November 03, 2024"
        const formattedDate = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "2-digit",
        });

        console.log(formattedDate); // Log formatted date to the console
        return formattedDate; // Return the formatted date
      } else {
        console.log("No date found in file name.");
        return null; // Return null if no date pattern is found
      }
    };

    // Call the function with the file name to extract and log the date
    const extractedDate = extractDateFromFileName(file.name);
    console.log("Extracted Date: ", extractedDate);

    // Extract client last names to use as folder name
    const clientLastNames = extractClientLastNames(file.name);
    // Prepare the file name with the client last names as folder name
    const fileNameWithPath = `${clientLastNames}/${extractedDate}/${file.name}`;
    // Assuming you have an API endpoint to get a pre-signed URL
    const preSignedUrlApi =
      "https://9rhmywkdb4.execute-api.us-east-1.amazonaws.com/beta/upload-url";

    console.log("preSignedURL", preSignedUrlApi);
    try {
      // Request a pre-signed URL from your API
      const response = await fetch(preSignedUrlApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include other headers as required, such as authentication tokens
        },
        body: JSON.stringify({
          fileName: fileNameWithPath, // Use the modified file name with path
          fileType: file.type,
        }),
      });

      console.log("response ====>>", response);

      const data = await response.json();

      console.log("data ===>>", data);

      // Use the pre-signed URL to upload the file to S3
      const uploadResponse = await fetch(data.url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type, // Important: Ensure the content type matches
        },
        body: file,
      });

      if (uploadResponse.ok) {
        console.log("Upload successful");
        setIsUploadComplete(true); // Update state to indicate upload completion

        // Here, you might want to update your application state to reflect the successful upload
      } else {
        console.error("Upload failed");
      }
    } catch (error) {
      console.error("Error fetching pre-signed URL or uploading file:", error);
    }
  };

  const s3Client = new S3Client({
    region: process.env.REACT_APP_AWS_REGION,
    credentials: {
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    },
  });

  const LoadingSpinner = () => {
    return (
      <div role="status">
        <svg
          aria-hidden="true"
          class="w-12 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
      </div>
    );
  };

  const getS3Bucket = async () => {
    const command = new ListObjectsV2Command({
      Bucket: "apollo-dj-documents",
      MaxKeys: 20,
    });

    try {
      let isTruncated = true;
      let nextContinuationToken;
      let folderMap = new Map(); // Use a Map to organize folders and their files

      while (isTruncated) {
        if (nextContinuationToken) {
          command.input.ContinuationToken = nextContinuationToken;
        }

        const response = await s3Client.send(command);

        // Check if Contents exists and is iterable
        if (response.Contents && Array.isArray(response.Contents)) {
          for (const object of response.Contents) {
            const parts = object.Key.split("/");
            if (parts.length > 1) {
              const folderName = parts[0];
              if (!folderMap.has(folderName)) {
                folderMap.set(folderName, []);
              }
              const metadataCommand = new HeadObjectCommand({
                Bucket: "apollo-dj-documents",
                Key: object.Key,
              });
              const metadataResponse = await s3Client.send(metadataCommand);
              const customMetadata = metadataResponse.Metadata;
              folderMap.get(folderName).push({
                key: object.Key,
                lastModified: object.LastModified,
                size: object.Size,
                title: customMetadata?.title || "Title not found",
                userEmail: customMetadata?.user || "User Email not found",
              });
            }
          }
        }

        isTruncated = response.IsTruncated;
        nextContinuationToken = response.NextContinuationToken;
      }

      const foldersArray = Array.from(folderMap.keys()).map((folderName) => {
        const files = folderMap.get(folderName);

        // Find the file with the oldest lastModified date
        const oldestFile = files.reduce(
          (oldest, file) =>
            oldest.lastModified < file.lastModified ? oldest : file,
          files[0]
        );

        // Attempt to extract the date from the oldest file's key
        const dateMatch = oldestFile.key.match(/(\w+)\s(\d{1,2}),\s(\d{4})/);
        let date = new Date();
        if (dateMatch) {
          date = new Date(`${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`);
        }

        return { folderName, files, date };
      });

      // Sort the folders based on the extracted date
      foldersArray.sort((a, b) => a.date - b.date);

      setBucketContents(foldersArray);
    } catch (err) {
      console.error("Error listing bucket contents:", err);
    }
  };

  // Fetch bucket contents when the component mounts
  useEffect(() => {
    getS3Bucket();
  }, []);

  useEffect(() => {
    if (isUploadComplete) {
      console.log("Upload complete, fetching bucket contents again...");
      getS3Bucket().then(() =>
        console.log("Fetched bucket contents after upload:", bucketContents)
      );
    }
  }, [isUploadComplete]);

  const extractClientLastNames = (fileName) => {
    // Assuming fileName is "Lauro-Shattuck Wedding DJ Countersigned The Paseo 250320.pdf"
    const parts = fileName.split("-");
    if (parts.length >= 2) {
      const lastNames = parts[0] + "-" + parts[1].split(" ")[0]; // Gets "Lauro-Shattuck"
      console.log(lastNames); // Should log "Lauro-Shattuck"
      return lastNames;
    }
    return "defaultPath";
  };

  const handleUploadInsideFolder = async (folder) => {
    console.log("what up?");
    setIsUploadingFile(true);
    try {
      const params = {
        Bucket: "apollo-dj-documents",
        Key: `${folder}${selectedFileToUpload.name}`,
        Body: selectedFileToUpload,
        ContentType: selectedFileToUpload.type, // Set content type based on the file type
        // Metadata: {
        //   title: selectedEpubToUploadTitle || "",
        // },
      };

      const response = await s3Client.send(new PutObjectCommand(params));

      handleFolderClick(folder); // Refresh the folder objects after uploading the file
      clearSelectedFileToUpload();
      setIsUploadingFile(false);
      return response;
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw error;
    }
  };

  // Function to handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log("file:", file);
    if (file) {
      setSelectedFileToUpload(file); // Update state with the selected file
    }
  };

  // Function to upload the file to a specified folder
  // const handleFileUpload = async (folderPath) => {
  //   console.log("Uploading to folder:", folderPath);

  //   if (selectedFileToUpload) {
  //     const normalizedFolderPath = folderPath.endsWith("/")
  //       ? folderPath
  //       : `${folderPath}/`;
  //     const fileKey = `${normalizedFolderPath}${selectedFileToUpload.name}`;

  //     console.log("Full S3 Key for upload:", fileKey);

  //     setIsUploadingFile(true);

  //     try {
  //       const uploadParams = {
  //         Bucket: "apollo-dj-documents",
  //         Key: fileKey,
  //         Body: selectedFileToUpload,
  //         ContentType: selectedFileToUpload.type,
  //       };

  //       await s3Client.send(new PutObjectCommand(uploadParams));
  //       console.log("File uploaded successfully to:", fileKey);

  //       // Optionally, refresh the folder view here to show the new file
  //     } catch (error) {
  //       console.error("File upload failed:", error);
  //     } finally {
  //       setIsUploadingFile(false);
  //     }
  //   }
  // };

  const handleFileUpload = async (folderPath) => {
    if (selectedFileToUpload) {
      setIsFileLoadingToS3Folder(true); // Start loading

      const normalizedFolderPath = folderPath.endsWith("/")
        ? folderPath
        : `${folderPath}/`;
      const fileKey = `${normalizedFolderPath}${selectedFileToUpload.name}`;

      try {
        const uploadParams = {
          Bucket: "apollo-dj-documents",
          Key: fileKey,
          Body: selectedFileToUpload,
          ContentType: selectedFileToUpload.type,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        // Construct a file object for UI
        const uploadedFile = {
          key: fileKey,
          lastModified: new Date().toISOString(), // Use current time; adjust as necessary
          size: selectedFileToUpload.size,
          title: "Uploaded File Title", // Adjust based on actual metadata if available
          userEmail: "Uploader Email", // Adjust as necessary
        };

        // Update the UI to reflect the new file in the folder
        const updatedBucketContents = bucketContents.map((folder) => {
          if (folder.folderName === folderPath) {
            return { ...folder, files: [...folder.files, uploadedFile] };
          }
          return folder;
        });

        setBucketContents(updatedBucketContents);

        // Reset the selected file to upload after successful upload
        setSelectedFileToUpload(null);
      } catch (error) {
        console.error("File upload failed:", error);
      } finally {
        setIsFileLoadingToS3Folder(false); // Stop loading regardless of outcome
      }
    }
  };

  const clearSelectedFileToUpload = () => {
    // need to do more here and not use the same four set's below
    console.log("need to clear file to upload");
    // setSelectedFileToUpload(null);
    // setSelectedEpubToUploadTitle("");
    // setIsLoadingFileToUploadTitle(false);
    // setSelectedFileToUploadIsCorrupt(false);
  };

  // =============================================
  // ========== Handle Folder Click ==============
  // =============================================
  const handleFolderClick = async (pathIncludingSlash) => {
    console.log("pathIncludingSlash:", pathIncludingSlash);

    // Toggle folder contents visibility by checking if the clicked folder is already selected
    if (selectedFolder === pathIncludingSlash) {
      // If the folder is already selected, deselect it and clear contents
      setSelectedFolder(null);
      setFolderObjects([]);
      setIsLoadingSelectedFolderObjects(false); // Reset the loading state
      return; // Exit early to avoid reloading the folder contents
    }

    // Set a loading state to true when a new folder is clicked
    setIsLoadingSelectedFolderObjects(true);
    // Clear previous folder's objects
    setFolderObjects([]);
    // Set the newly selected folder
    setSelectedFolder(pathIncludingSlash);

    // Fetch the objects in the newly selected folder
    try {
      const data = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: "apollo-dj-documents",
          Prefix: pathIncludingSlash,
          // Delimiter: "/",
        })
      );
      console.log("Data from ListObjectsV2Command:", data);

      let objectsWithMetadata = await Promise.all(
        data.Contents.map(async (object) => {
          try {
            const metadataResponse = await s3Client.send(
              new HeadObjectCommand({
                Bucket: "apollo-dj-documents",
                Key: object.Key,
              })
            );
            return { ...object, Metadata: metadataResponse.Metadata };
          } catch (error) {
            console.error(
              `Failed to fetch metadata for object: ${object.Key}`,
              error
            );
            return object; // Return the object without metadata if the call fails
          }
        })
      );

      // Filter out any potential folders from the objects list
      objectsWithMetadata = objectsWithMetadata.filter(
        (object) => !object.Key.endsWith("/")
      );

      // Update state with the objects from the selected folder
      console.log("Selected folder:", pathIncludingSlash);
      console.log(
        "Fetched folder objects before setting state:",
        objectsWithMetadata
      );
      setFolderObjects(objectsWithMetadata);
      console.log("State after setting folderObjects:", folderObjects);
    } catch (error) {
      console.error(
        "Error fetching objects for folder:",
        pathIncludingSlash,
        error
      );
    } finally {
      setIsLoadingSelectedFolderObjects(false); // Reset the loading state
    }
  };

  // =============================================
  // =============== Download File ===============
  // =============================================
  const streamToBlob = async (stream, contentType) => {
    const chunks = [];
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
    }

    return new Blob(chunks, { type: contentType });
  };

  const handleDownloadFile = async (key) => {
    try {
      const command = new GetObjectCommand({
        Bucket: "apollo-dj-documents",
        Key: key,
      });

      const response = await s3Client.send(command);
      const readableStream = response.Body;

      // Convert the ReadableStream to a Blob
      const blob = await streamToBlob(readableStream, response.ContentType);
      // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      const modifiedKey = key.includes("/") ? key.split("/")[1] : key;

      downloadLink.download = modifiedKey.replace(/\.epub$/, ""); // Set the download file name
      document.body.appendChild(downloadLink);

      // Trigger the download
      downloadLink.click();

      // Remove the download link from the DOM
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Error downloading File:", error);
      // Handle error as needed
    }
  };

  // =============================================
  // =============== Delete File =================
  // =============================================

  const handleDeleteFile = async (folder) => {
    // Assuming folder is an object with a folderName property
    const folderName = folder.folderName;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the folder and all its contents? ${folderName}`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      // List all objects within the folder
      const listedObjects = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: "apollo-dj-documents",
          Prefix: `${folderName}/`,
        })
      );

      // Ensure that we have objects to work with
      if (listedObjects.Contents && listedObjects.Contents.length > 0) {
        // Generate delete commands for each object
        const deleteCommands = listedObjects.Contents.map(
          (object) =>
            new DeleteObjectCommand({
              Bucket: "apollo-dj-documents",
              Key: object.Key,
            })
        );

        // Execute all delete commands
        for (const command of deleteCommands) {
          await s3Client.send(command);
        }

        console.log(
          `Folder and its contents successfully deleted: ${folderName}`
        );
      } else {
        console.log(`No contents found for folder: ${folderName}`);
      }

      // Refresh the list to reflect the deletion
      getS3Bucket();
    } catch (error) {
      console.error("Error deleting folder and its contents:", error);
    }
  };

  const resetUpload = () => {
    setIsUploadComplete(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setFileTitle("");
  };

  const handleDeleteIndividualFile = async (fileKey) => {
    // Confirm with the user that they want to delete this file
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this file?`
    );

    if (!confirmDelete) {
      return; // Stop if the user cancels the delete action
    }

    try {
      // Execute the command to delete the specific file
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: "apollo-dj-documents",
          Key: fileKey,
        })
      );

      console.log(`File successfully deleted: ${fileKey}`);

      // Optionally, refresh the contents of the folder to reflect the deletion
      // This could involve re-fetching the contents of the current folder
      // For example, if you have a method to fetch folder contents, you can call it here
      // This assumes you have a way to refetch or update your component's state to reflect the deletion
      // handleFolderClick(selectedFolder); or another way to update the UI
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const steps = [
    {
      title: "Ready to Upload",
      done: fileTitle.length > 1 || uploadProgress > 0,
      inProgress: false,
    },
    {
      title: isUploading ? `Uploading... ${uploadProgress}%` : "Uploading",
      done: uploadProgress === 100,
      inProgress: uploadProgress > 0 && uploadProgress < 100,
    },
    { title: "Done", done: uploadProgress === 100, inProgress: false },
  ];

  // Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFilesize: 460 * 1024 * 1024, // Set the max filesize to 460 MB

    onDrop: async (files) => {
      const file = files[0];
      console.log("file:", file);
      setSelectedFile(file); // Set the selected file
      // Assuming the file name (without the extension) as the title
      const title = file.path.split("/").pop().split(".")[0];
      setFileTitle(title); // Update the state with the extracted title
    },
  });
  return (
    <div
      className={`${
        theme === "dark" ? "bg-black" : "bg-gray-200"
      }  h-full pt-40`}
    >
      <section className="mx-auto pr-5 pl-5">
        <div
          {...getRootProps({
            className: `dropzone border-dashed border-2 rounded-lg ${
              isDragActive
                ? "bg-[#035FFE] text-white animate-pulse"
                : theme === "dark"
                ? "bg-[#2c2c2c] text-gray-500 border-[#474747]"
                : "bg-gray-300 text-gray-700 border-gray-400"
            } pl-32 pr-32 pt-8`,
          })}
        >
          <input {...getInputProps()} />
          <div className="flex justify-center">
            <CloudUploadIcon
              sx={{
                fontSize: 100,
                color: theme === "dark" ? "lightgray" : "#4B5563",
              }}
            />
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
        {/* Below I traded out the component for the actual code */}
        {/* <ApolloS3Bucket /> */}
        <div className="text-white pl-28">
          {fileTitle.length > 0 ? (
            <div className="text-[#f7a44a]">Title:</div>
          ) : (
            <div></div>
          )}
          <div>{fileTitle}</div>
        </div>
      </div>
      <div className="pl-28 pt-8">
        <ol className="flex w-full justify-center items-center ">
          {steps.map((step, index) => (
            <li key={index} className="relative w-full mb-6">
              <div className="flex items-center">
                <div
                  className={`z-10 flex items-center justify-center w-6 h-6 ${
                    step.done || step.inProgress ? "bg-blue-600" : "bg-blue-200"
                  } rounded-full ring-0 ring-white dark:bg-blue-900 sm:ring-8 dark:ring-gray-900 shrink-0`}
                >
                  {step.done ? (
                    // Checkmark icon for done
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  ) : (
                    <span
                      className={`flex w-3 h-3 ${
                        step.done || step.inProgress
                          ? "bg-white"
                          : "bg-blue-600"
                      } rounded-full`}
                    ></span>
                  )}
                </div>
                {/* Only render the gray line if it's not the last item */}
                {index < steps.length - 1 && (
                  <div className="flex-auto border-t-2 transition duration-500 ease-in-out border-gray-300"></div>
                )}
              </div>
              <div className="mt-3">
                <h3
                  className={`font-medium ${
                    step.done || step.inProgress
                      ? "text-white" // Text is white when step is done or in progress, assuming the background is dark here
                      : theme === "light"
                      ? "text-black" // Text is black in light theme for better visibility
                      : "text-white" // Text is white in dark theme for better visibility
                  }`}
                >
                  {step.title}
                </h3>
              </div>
            </li>
          ))}
        </ol>

        {/* Upload Button */}
        {fileTitle.length > 0 && (
          <div className="mt-4 flex">
            <button
              onClick={isUploadComplete ? resetUpload : handleUploadClick}
              className={`text-white px-4 py-2 rounded ${
                isUploading ? "bg-gray-500" : "bg-[#f7a44a]"
              } hover:opacity-85`}
              disabled={isUploading} // Disable button during upload
            >
              {isUploadComplete ? "Reset" : "Upload"}
            </button>
            {isUploadComplete && (
              <div className="flex items-center text-green-500 pl-8">
                <CheckCircleIcon /> <span>Upload Complete</span>
              </div>
            )}
          </div>
        )}
      </div>
      {/* flex flex-col items-center justify-center pt-24  */}
      <div
        className={`${
          theme === "dark" ? "bg-black" : "bg-white"
        } flex flex-col   text-gray-300 pl-8 pr-8 pt-16 pb-28`}
      >
        <div
          className={`${
            theme === "dark"
              ? "bg-[#2c2c2c] text-gray-300 "
              : "bg-gray-300 text-gray-600"
          }  rounded-lg p-10`}
        >
          {bucketContents.map((folder) => {
            console.log("folder ---->>>", folder);
            const oldestFile = folder.files.reduce((oldest, file) => {
              return oldest === null ||
                new Date(file.lastModified) < new Date(oldest.lastModified)
                ? file
                : oldest;
            }, null);

            // Extract the date from the oldest file's key
            const dateFromOldestFile = oldestFile
              ? oldestFile.key.split("/")[1]
              : "No Date";

            return (
              <div key={folder.folderName}>
                <div className="flex items-center justify-between p-4 mb-2 border border-gray-400">
                  <div
                    onClick={() => handleFolderClick(folder.folderName)}
                    className="flex items-center cursor-pointer"
                  >
                    <img
                      src="https://cdn4.iconfinder.com/data/icons/small-n-flat/24/folder-blue-512.png"
                      alt="Folder Icon"
                      className="w-6 h-6 mr-2"
                    />

                    <span>{`${folder.folderName} / ${dateFromOldestFile}`}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the folder click event
                      handleDeleteFile(folder);
                    }}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <DeleteIcon />
                  </button>
                </div>
                {/* Check if the current folder is selected to display its contents */}
                {selectedFolder === folder.folderName && (
                  <div className="pl-14 p-2 -mt-2 flex flex-col border border-gray-600 mb-2">
                    {/* Upload button for files inside the selected folder */}
                    <div className="mb-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                      {!selectedFileToUpload ? (
                        <button
                          onClick={() => fileInputRef.current.click()}
                          className="text-white bg-[#f7a44a] hover:bg-[#e69332] font-bold py-2 px-2 rounded transition duration-300 ease-in-out"
                        >
                          Browse Files
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleFileUpload(selectedFolder)}
                            className="text-white bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center justify-center"
                            disabled={isFileLoadingToS3Folder} // Disable the button during the upload
                          >
                            {isFileLoadingToS3Folder ? (
                              <LoadingSpinner />
                            ) : (
                              "Upload"
                            )}
                          </button>
                          <span className="ml-4 text-white">
                            File: {selectedFileToUpload.name}
                          </span>
                        </>
                      )}
                    </div>
                    {/* List files in the selected folder */}
                    {folder.files.map((file, index) => (
                      <div
                        key={file.key}
                        className={`flex items-center justify-between mb-2 p-4 ${
                          theme === "light" ? "text-black" : "text-white"
                        }`}
                      >
                        <div className="flex items-center">
                          <DownloadIcon
                            className={`mr-2 cursor-pointer ${
                              theme === "light"
                                ? "hover:text-black"
                                : "hover:text-[#f7a44a]"
                            } transition duration-300`}
                            onClick={() => handleDownloadFile(file.key)}
                          />
                          {file.key.endsWith(".pdf") && (
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg"
                              alt="PDF icon"
                              className="w-6 h-6 mr-2"
                            />
                          )}
                          <span className="hover:underline cursor-pointer">
                            {file.key.split("/").pop()}{" "}
                            {/* Display file name only */}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">
                            Date Uploaded:{" "}
                            {new Date(file.lastModified).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          {/* Render delete icon for all files except the first one */}
                          {index !== 0 && (
                            <DeleteIcon
                              className="ml-4 cursor-pointer hover:text-red-500"
                              onClick={() => {
                                // Add your delete functionality here
                                console.log("Delete", file.key);
                                // Example: handleDeleteFile(file.key)
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Uploader;

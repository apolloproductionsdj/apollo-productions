import React, { useEffect, useState } from "react";
import couplesFirstDance from "../../Assets/images/couple-first-dance.jpg";
import wordDocCorrect from "../../Assets/images/wordDocCorrect.png";
import tempDJs2 from "../../Assets/images/temp-djs2.jpg";
import { Audio } from "react-loader-spinner";

// Images
import saguaroImage from "../../Assets/images/saguaroImage.png";
// AWS
import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
// import { SkeletonLoader } from "./Components/SkeletonLoader"; // Adjust the import path as necessary
import { useSelector } from "react-redux"; // Import useSelector

// Toast Notifications
import { toast, ToastContainer, css } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ConfirmToast } from "react-confirm-toast";

import DownloadIcon from "@mui/icons-material/Download";

const s3Client = new S3Client({
  region: process.env.REACT_APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  signatureVersion: "v4",
  requestHandler: {
    timeoutInMs: 10000,
  },
  customUserAgent: "Apollo/1.0",
  maxAttempts: 3,
  configuration: {
    addressing: {
      disableMultiregionAccessPoints: true,
    },
  },
});

const HomePage = () => {
  const [bucketContents, setBucketContents] = useState([]); // State to hold bucket contents
  console.log("bucketContents:", bucketContents);
  const [isLoadingSelectedFolderObjects, setIsLoadingSelectedFolderObjects] =
    useState(false);
  const [folderObjects, setFolderObjects] = useState([]); // The objects in the selected folder
  const [isLoadingFromS3, setIsLoadingFromS3] = useState(false);
  console.log("folderObjects:", folderObjects);
  const [selectedFolder, setSelectedFolder] = useState(null); // The folder that is currently selected
  const [selectedFileToUpload, setSelectedFileToUpload] = useState(null);
  console.log("selectedFileToUpload =====>>>>>", selectedFileToUpload);
  const wordDocIconBase64 = "data:image/png;base64,iVBORw0K...SuQmCC";

  const { theme } = useSelector((state) => state.appSettings); // Select the theme from the store

  // Function to group folders by month and year too
  const groupFoldersByMonth = (folders) => {
    return folders.reduce((acc, folder) => {
      const monthYear = folder.date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(folder);
      return acc;
    }, {});
  };

  const groupedFolders = groupFoldersByMonth(bucketContents);

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

  // const handleDownloadFile = async (key) => {
  //   try {
  //     const command = new GetObjectCommand({
  //       Bucket: "apollo-dj-documents",
  //       Key: key,
  //     });

  //     const response = await s3Client.send(command);
  //     const readableStream = response.Body;

  //     // Convert the ReadableStream to a Blob
  //     const blob = await streamToBlob(readableStream, response.ContentType);
  //     // Create a download link
  //     const downloadLink = document.createElement("a");
  //     downloadLink.href = URL.createObjectURL(blob);
  //     const modifiedKey = key.includes("/") ? key.split("/")[1] : key;

  //     downloadLink.download = modifiedKey.replace(/\.epub$/, ""); // Set the download file name
  //     document.body.appendChild(downloadLink);

  //     // Trigger the download
  //     downloadLink.click();

  //     // Remove the download link from the DOM
  //     document.body.removeChild(downloadLink);
  //   } catch (error) {
  //     console.error("Error downloading File:", error);
  //     // Handle error as needed
  //   }
  // };
  const handleDownloadFile = async (key) => {
    console.log("key ====>", key);
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

      // Use the last part of the key (after the last '/') as the download file name
      const splitKey = key.split("/");
      const fileName = splitKey[splitKey.length - 1]; // Get the last part of the path

      downloadLink.download = fileName; // Set the download file name
      console.log("downloadLink.download", downloadLink.download);
      console.log("downloadLink", downloadLink);

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

  // Fetch bucket contents when the component mounts
  useEffect(() => {
    getS3Bucket();
  }, []);

  // const getS3Bucket = async () => {
  //   const command = new ListObjectsV2Command({
  //     Bucket: "apollo-dj-documents",
  //     MaxKeys: 20,
  //   });
  //   setIsLoadingFromS3(true);

  //   try {
  //     let isTruncated = true;
  //     let nextContinuationToken;
  //     let folderMap = new Map(); // Use a Map to organize folders and their files

  //     while (isTruncated) {
  //       if (nextContinuationToken) {
  //         command.input.ContinuationToken = nextContinuationToken;
  //       }

  //       const response = await s3Client.send(command);

  //       // Check if Contents exists and is iterable
  //       if (response.Contents && Array.isArray(response.Contents)) {
  //         for (const object of response.Contents) {
  //           const parts = object.Key.split("/");
  //           if (parts.length > 1) {
  //             const folderName = parts[0];
  //             if (!folderMap.has(folderName)) {
  //               folderMap.set(folderName, []);
  //             }
  //             const metadataCommand = new HeadObjectCommand({
  //               Bucket: "apollo-dj-documents",
  //               Key: object.Key,
  //             });
  //             const metadataResponse = await s3Client.send(metadataCommand);
  //             const customMetadata = metadataResponse.Metadata;
  //             folderMap.get(folderName).push({
  //               key: object.Key,
  //               lastModified: object.LastModified,
  //               size: object.Size,
  //               title: customMetadata?.title || "Title not found",
  //               userEmail: customMetadata?.user || "User Email not found",
  //             });
  //           }
  //         }
  //       }

  //       isTruncated = response.IsTruncated;
  //       nextContinuationToken = response.NextContinuationToken;
  //     }

  //     const foldersArray = Array.from(folderMap.keys()).map((folderName) => {
  //       const files = folderMap.get(folderName);

  //       // Find the file with the oldest lastModified date
  //       const oldestFile = files.reduce(
  //         (oldest, file) =>
  //           oldest.lastModified < file.lastModified ? oldest : file,
  //         files[0]
  //       );

  //       // Attempt to extract the date from the oldest file's key
  //       const dateMatch = oldestFile.key.match(/(\w+)\s(\d{1,2}),\s(\d{4})/);
  //       let date = new Date();
  //       if (dateMatch) {
  //         date = new Date(`${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`);
  //       }

  //       return { folderName, files, date };
  //     });

  //     // Sort the folders based on the extracted date
  //     foldersArray.sort((a, b) => a.date - b.date);
  //     console.log("foldersArray: ====>", foldersArray);
  //     setBucketContents(foldersArray);
  //     setIsLoadingFromS3(false);
  //   } catch (err) {
  //     console.error("Error listing bucket contents:", err);
  //   }
  // };
  const getS3Bucket = async () => {
    setBucketContents([]); // Clear contents immediately to avoid stale data
    setIsLoadingFromS3(true);

    const command = new ListObjectsV2Command({
      Bucket: "apollo-dj-documents",
      MaxKeys: 1000, // Increase to get more items at once
      Delimiter: "/", // Use delimiter to get folder-level results faster
    });

    try {
      const folderMap = new Map();
      const firstResponse = await s3Client.send(command);

      // Process common prefixes (folders) first for quick initial render
      if (firstResponse.CommonPrefixes) {
        const folderPromises = firstResponse.CommonPrefixes.map(
          async (prefix) => {
            const folderName = prefix.Prefix.slice(0, -1); // Remove trailing slash

            // Get just one file to determine folder date
            const folderCommand = new ListObjectsV2Command({
              Bucket: "apollo-dj-documents",
              Prefix: prefix.Prefix,
              MaxKeys: 1,
            });

            try {
              const folderResponse = await s3Client.send(folderCommand);
              if (folderResponse.Contents && folderResponse.Contents[0]) {
                // Get the first file's metadata
                const metadataResponse = await s3Client.send(
                  new HeadObjectCommand({
                    Bucket: "apollo-dj-documents",
                    Key: folderResponse.Contents[0].Key,
                  })
                );

                return {
                  folderName,
                  files: [
                    {
                      key: folderResponse.Contents[0].Key,
                      lastModified: folderResponse.Contents[0].LastModified,
                      size: folderResponse.Contents[0].Size,
                      title:
                        metadataResponse.Metadata?.title || "Title not found",
                      userEmail:
                        metadataResponse.Metadata?.user ||
                        "User Email not found",
                    },
                  ],
                  hasUpgrades:
                    folderResponse.Contents[0].Key.includes("Upgrades"),
                  date: folderResponse.Contents[0].LastModified,
                };
              }
              return null;
            } catch (error) {
              console.error(`Error processing folder ${folderName}:`, error);
              return null;
            }
          }
        );

        // Process all folders in parallel
        const folders = (await Promise.all(folderPromises)).filter(Boolean);

        // Sort folders by date
        folders.sort((a, b) => new Date(a.date) - new Date(b.date));

        setBucketContents(folders);
      }

      // Now load the rest of the files in the background
      const loadFullContents = async () => {
        try {
          if (firstResponse.Contents) {
            const folderContentsPromises = Array.from(folderMap.keys()).map(
              async (folderName) => {
                const folderContents = await s3Client.send(
                  new ListObjectsV2Command({
                    Bucket: "apollo-dj-documents",
                    Prefix: folderName + "/",
                    MaxKeys: 1000,
                  })
                );

                if (folderContents.Contents) {
                  const files = await Promise.all(
                    folderContents.Contents.map(async (file) => {
                      try {
                        const metadataResponse = await s3Client.send(
                          new HeadObjectCommand({
                            Bucket: "apollo-dj-documents",
                            Key: file.Key,
                          })
                        );

                        return {
                          key: file.Key,
                          lastModified: file.LastModified,
                          size: file.Size,
                          title:
                            metadataResponse.Metadata?.title ||
                            "Title not found",
                          userEmail:
                            metadataResponse.Metadata?.user ||
                            "User Email not found",
                        };
                      } catch (error) {
                        console.error(
                          `Error getting metadata for ${file.Key}:`,
                          error
                        );
                        return null;
                      }
                    })
                  );

                  return {
                    folderName,
                    files: files.filter(Boolean),
                    date: files[0]?.lastModified || new Date(),
                  };
                }
                return null;
              }
            );

            const fullContents = (
              await Promise.all(folderContentsPromises)
            ).filter(Boolean);
            fullContents.sort((a, b) => new Date(a.date) - new Date(b.date));
            setBucketContents(fullContents);
          }
        } catch (error) {
          console.error("Error loading full contents:", error);
        }
      };

      // Start loading full contents in the background
      loadFullContents();
    } catch (err) {
      console.error("Error listing bucket contents:", err);
      toast.error("Error loading folders. Please try again.");
    } finally {
      setIsLoadingFromS3(false);
    }
  };

  return (
    <div
      className={`${
        theme === "light" ? "bg-white" : "bg-black"
      } h-screen text-${theme === "light" ? "black" : "white"} pt-22`}
    >
      {/* Background Image Container */}
      <div
        className="overflow-hidden w-full h-96 lg:h-96 bg-cover bg-center"
        style={{
          backgroundImage: `url(${tempDJs2})`,
          backgroundAttachment: "fixed",
          backgroundPosition: "50% 255%", // Adjust as needed
        }}
      ></div>

      {/* Content Container */}
      <div
        className={`${
          theme === "light" ? "bg-white text-black" : "bg-black text-gray-300"
        } flex flex-col pl-8 pr-8 pt-10 pb-28`}
      >
        <div
          className={`${
            theme === "dark" ? "bg-[#2c2c2c]" : "bg-gray-300"
          } p-5 rounded-lg`}
        >
          {/* Check for Loading State */}
          {isLoadingFromS3 ? (
            <div className="flex items-center justify-center space-x-2">
              <Audio
                height="100"
                width="100"
                color="#f7a44a"
                ariaLabel="audio-loading"
                wrapperClass="wrapper-class"
                visible={true}
              />
              <span>Loading...</span>
            </div>
          ) : (
            Object.keys(groupedFolders).map((monthYear) => (
              <div key={monthYear} className="mb-8">
                <h2
                  className={`${
                    theme === "dark" ? "" : "font-bold"
                  } text-md mb-4 text-[#f7a44a]`}
                >
                  {monthYear}
                </h2>
                <div className="space-y-4">
                  {groupedFolders[monthYear].map((folder) => {
                    // Check if any file in the folder includes 'Upgrades'
                    const containsUpgrades = folder.files.some((file) =>
                      file.key.includes("Upgrades")
                    );
                    return (
                      <div
                        key={folder.folderName}
                        className="border border-gray-400 rounded-lg p-4"
                      >
                        <div
                          onClick={() => handleFolderClick(folder.folderName)}
                          className="flex items-center cursor-pointer hover:text-gray-400"
                        >
                          {containsUpgrades ? (
                            <span
                              role="img"
                              aria-label="Cactus"
                              className="mr-2"
                            >
                              <img
                                src={saguaroImage}
                                alt="Cactus"
                                className="w-6 h-6 mr-2" // You can adjust the width and height as needed
                              />
                            </span>
                          ) : (
                            <img
                              src="https://cdn4.iconfinder.com/data/icons/small-n-flat/24/folder-blue-512.png"
                              alt="Folder Icon"
                              className="w-6 h-6 mr-2"
                            />
                          )}
                          <span
                            className={`${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-700"
                            } font-semibold`}
                          >
                            {folder.folderName} /
                          </span>
                          <span
                            className={`${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            } pl-1 text-sm`}
                          >
                            {new Date(folder.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          {/* {containsUpgrades && (
                            <div className="bg-green-500 text-white text-xs font-semibold ml-4 px-2.5 py-0.5 rounded dark:bg-green-700">
                              Saguaro Package
                            </div>
                          )} */}
                        </div>
                        {selectedFolder === folder.folderName && (
                          <div className="mt-4">
                            {folder.files.map((file) => {
                              const fileExtension = file.key
                                .split(".")
                                .pop()
                                .toLowerCase();
                              let iconSrc;
                              let iconAlt = "File";

                              if (fileExtension === "pdf") {
                                iconSrc =
                                  "https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg";
                                iconAlt = "PDF icon";
                              } else if (
                                fileExtension === "doc" ||
                                fileExtension === "docx"
                              ) {
                                iconSrc = wordDocCorrect; // Assuming you've already imported this
                                iconAlt = "Word document icon";
                              }
                              // More file types can be handled here

                              return (
                                <div
                                  key={file.key}
                                  className="flex items-center mt-2 pl-5"
                                >
                                  <DownloadIcon
                                    className="cursor-pointer hover:text-[#f7a44a] transition duration-300 mr-2"
                                    onClick={() => handleDownloadFile(file.key)}
                                  />
                                  {iconSrc && (
                                    <img
                                      src={iconSrc}
                                      alt={iconAlt}
                                      className="w-6 h-6 mr-2"
                                    />
                                  )}
                                  <span>{file.key.split("/").pop()}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;

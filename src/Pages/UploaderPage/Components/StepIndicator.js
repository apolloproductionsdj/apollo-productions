import React from "react";

import { useSelector } from "react-redux";

const StepIndicator = ({ uploadProgress }) => {
  // ========== Selectors ==========
  const { contractTitleToBeUploaded } = useSelector((state) => state.s3Bucket);

  console.log(contractTitleToBeUploaded.length);
  const steps = [
    {
      title: "Ready to Upload",
      // Change done condition based on contractTitleToBeUploaded.length
      done: contractTitleToBeUploaded.length > 1 || uploadProgress > 0,
      inProgress: false,
    },
    {
      title: "Uploading",
      done: uploadProgress === 100,
      inProgress: uploadProgress > 0 && uploadProgress < 100,
    },
    { title: "Done", done: uploadProgress === 100, inProgress: false },
  ];

  return (
    <div className="pl-28 ">
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
                      step.done || step.inProgress ? "bg-white" : "bg-blue-600"
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
                    ? "text-white"
                    : "dark:text-white"
                }`}
              >
                {step.title}
              </h3>
            </div>
          </li>
        ))}
      </ol>
      <div className="pl-96">
        <button className="text-white bg-[#f7a44a] px-4 py-2 rounded">
          Upload
        </button>
      </div>
    </div>
  );
};

export default StepIndicator;

import { View } from "@aws-amplify/ui-react";
import apdjLogo from "../../Assets/images/APDJ.png"; // Ensure the path is correct

export const CustomHeader = () => {
  return (
    <View
      className="bg-[#2c2c2c] mb-10"
      textAlign="center"
      padding="var(--amplify-space-large)"
    >
      {/* Use the `img` tag directly with the imported image as the source */}
      <div className="flex items-center justify-center">
        <img
          src={apdjLogo}
          className="object-contain h-32 w-48" // Adjust size as needed
          alt="Company Logo"
        />
      </div>
    </View>
  );
};

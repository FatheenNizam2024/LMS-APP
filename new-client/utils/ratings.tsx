// C:\Lms-App - Copy\client\utils\ratings.tsx

import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { View,  } from "react-native";

export default function Ratings({ rating }: { rating: any }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      // Add key prop here
      stars.push(<FontAwesome key={i} name="star" size={18} color={"#FF8D07"} />);
    } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
      // Add key prop here
      stars.push(
        <Ionicons key={i} name="star-half-outline" size={18} color={"#FF8D07"} />
      );
    } else {
      // Add key prop here
      stars.push(<Ionicons key={i} name="star-outline" size={18} color={"#FF8D07"} />);
    }
  }

  return (
    <View style={{ flexDirection: "row", marginTop: 4, marginLeft: 2, gap: 4 }}>
      {stars}
    </View>
  );
}
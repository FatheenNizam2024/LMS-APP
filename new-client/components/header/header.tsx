import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";
//import useUser from "@/hooks/auth/useUser";
import { router } from "expo-router";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function Header({ user, avatarUrl }: { user: User | null | undefined, avatarUrl: string | null }) {
  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
  });
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          <Image
            // THE FIX: It uses the avatarUrl prop directly.
            source={{
              uri: avatarUrl || "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png",
            }}
            style={styles.image}
          />
        </TouchableOpacity>
        <View>
          <Text style={[styles.helloText, { fontFamily: "Raleway_700Bold" }]}>
            Welcome to Mars Tech Learning!
          </Text>
          <Text style={[styles.text, { fontFamily: "Raleway_700Bold" }]}>
            {user?.name}
          </Text>
        </View>
      </View>
      {/* The TouchableOpacity for the bell/cart icon has been removed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // This will now push the header to the left
    marginHorizontal: 16,
    marginBottom: 16,
    width: "90%",
  },
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
 image: {
    width: hp('5.5%'), // ~45px on a standard phone
    height: hp('5.5%'),
    marginRight: wp('2%'), // ~8px
    borderRadius: hp('2.75%'), // Half of the height
},
text: {
    fontSize: wp('4%'), // ~16px
  },
  helloText: { color: "#7C7C80", fontSize: 14 },
});
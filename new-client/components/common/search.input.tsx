import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { useFonts, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";

// NEW PROP DEFINITION
type Props = {
  homeScreen?: boolean;
  value?: string;
  setValue?: (value: string) => void;
};

export default function SearchInput({ homeScreen, value, setValue }: Props) {
  let [fontsLoaded, fontError] = useFonts({ Nunito_700Bold });
  if (!fontsLoaded && !fontError) return null;

  // The Search screen will be responsible for its own list.
  // The Home screen will now handle the filtering.
  if (!homeScreen) {
    // We will need to build the search screen functionality separately.
    // For now, let's just show the input.
    return (
        <View style={styles.filteringContainer}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.input, { fontFamily: "Nunito_700Bold" }]}
                    placeholder="Search courses..."
                    placeholderTextColor={"#C6C7CC"}
                />
                 <TouchableOpacity style={styles.searchIconContainer}>
                    <AntDesign name="search1" size={20} color={"#fff"} />
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  // Render logic for the Home Screen
  return (
    <View style={styles.filteringContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.input, { fontFamily: "Nunito_700Bold" }]}
          placeholder="Search courses..."
          value={value}
          onChangeText={setValue} // Use the function passed from HomeScreen
          placeholderTextColor={"#C6C7CC"}
        />
        <TouchableOpacity
          style={styles.searchIconContainer}
          onPress={() => router.push("/(tabs)/search")}
        >
          <AntDesign name="search1" size={20} color={"#fff"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  filteringContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1},
    shadowOpacity: 0.2
  },
  searchIconContainer: {
    width: 38,
    height: 38,
    backgroundColor: "#2467EC",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "black",
    paddingVertical: 10,
    height: 48,
  },
});
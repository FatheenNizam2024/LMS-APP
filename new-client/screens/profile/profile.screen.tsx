// C:\LMS App copy Part 2\Lms-App - Copy\new-client\screens\profile\profile.screen.tsx

"use client";
import Loader from "@/components/loader/loader";
import useUser from "@/hooks/auth/useUser";
import { AntDesign, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { Nunito_400Regular, Nunito_700Bold, Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import axiosInstance from "@/utils/axios.instance";
import { Toast } from "react-native-toast-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SERVER_URI } from "@/utils/uri"; // Import SERVER_URI

export default function ProfileScreen() {
  const { user, loading, refetch } = useUser();
  const [imageLoader, setImageLoader] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  // if (!fontsLoaded && !fontError) {
  //   return null;
  // }

  useEffect(() => {
    const getAvatarUrl = async () => {
      // Check if the avatar is stored in MinIO (identified by the 'minio' url placeholder)
      if (user?.avatar?.public_id && user.avatar.url === 'minio') {
        try {
          // THE FIX: Pass the public_id as a query parameter.
          const res = await axiosInstance.get(`/get-avatar-url`, {
            params: {
              objectName: user.avatar.public_id
            }
          });
          setAvatarUrl(res.data.url);
        } catch (e) {
          console.log("Could not fetch MinIO avatar URL, using fallback.");
          setAvatarUrl('https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png');
        }
      } else if (user?.avatar?.url) {
          setAvatarUrl(user.avatar.url);
      } else {
        setAvatarUrl('https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png');
      }
    };
    if (!loading) {
        getAvatarUrl();
    }
  }, [user, loading]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const logoutHandler = async () => {
    setImageLoader(true);
    try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        await axiosInstance.get(`${SERVER_URI}/logout`, {
            headers: {
                "access-token": accessToken,
                "refresh-token": refreshToken,
            },
        });
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
        Toast.show("Logged out successfully", { type: "success" });
        router.replace("/(routes)/login");
    } catch (error: any) {
        console.error("Logout failed:", error);
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
        Toast.show(error.response?.data?.message || "Failed to log out.", { type: "danger" });
        router.replace("/(routes)/login");
    } finally {
        setImageLoader(false);
    }
  };
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageLoader(true);
      try {
        const asset = result.assets[0];
        const uri = asset.uri;

        // THE FIX: Determine the MIME type from the file extension
        const fileExtension = uri.split('.').pop()?.toLowerCase();
        let mimeType = 'image/jpeg'; // Default
        if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'webp') {
          mimeType = 'image/webp';
        }
        
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Pass both the image data and the detected mimeType
        await axiosInstance.put('/update-student-avatar-minio', { 
            avatar: `data:${mimeType};base64,${base64}` 
        });

        Toast.show("Profile picture updated!", { type: "success" });
        refetch();
      } catch (error: any) {
        Toast.show(error.response?.data?.message || "Failed to update picture.", { type: "danger" });
        console.log(error);
      } finally {
        setImageLoader(false);
      }
    }
  };

  const removeImage = async () => {
    setImageLoader(true);
    try {
        await axiosInstance.put('/update-student-avatar-minio', { avatar: null });
        Toast.show("Profile picture removed", { type: "success" });
        refetch();
    } catch (error: any) {
        Toast.show(error.response?.data?.message || "Failed to remove picture", { type: "danger" });
    } finally {
        setImageLoader(false);
    }
  };

  const handleRemovePress = () => {
      Alert.alert("Remove Picture", "Are you sure you want to remove your profile picture?", [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: removeImage },
      ]);
  };

  return (
    <>
      {loading || imageLoader || !avatarUrl ? <Loader /> : (
        <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1, paddingTop: 60 }}>
          <ScrollView>
            <View style={styles.profileContainer}>
              <View>
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                />
                <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
                  <Ionicons name="camera-outline" size={25} color="#333" />
                </TouchableOpacity>
              </View>
              {user?.avatar?.public_id && (
                <TouchableOpacity onPress={handleRemovePress}>
                    <Text style={styles.removeText}>Remove Picture</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.menuContainer}>
              <Text style={styles.menuHeader}>Account Details</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push({
                    pathname: "/(routes)/profile-details",
                    params: { user: JSON.stringify(user) }
                })}
              >
                <View style={styles.menuItemContent}>
                  <View style={styles.iconContainer}><FontAwesome name="user-o" size={20} color={"black"} /></View>
                  <View>
                    <Text style={styles.menuItemText}>Detail Profile</Text>
                    <Text style={styles.menuItemSubText}>Information Account</Text>
                  </View>
                </View>
                <AntDesign name="right" size={26} color={"#CBD5E0"} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(routes)/enrolled-courses")}>
                <View style={styles.menuItemContent}>
                  <View style={styles.iconContainer}><MaterialCommunityIcons name="book-account-outline" size={20} color={"black"} /></View>
                  <View>
                    <Text style={styles.menuItemText}>Enrolled courses</Text>
                    <Text style={styles.menuItemSubText}>View all your courses</Text>
                  </View>
                </View>
                <AntDesign name="right" size={26} color={"#CBD5E0"} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={logoutHandler}>
                <View style={styles.menuItemContent}>
                  <View style={styles.iconContainer}><Ionicons name="log-out-outline" size={20} color={"black"} /></View>
                  <TouchableOpacity onPress={logoutHandler}>
                    <Text style={styles.menuItemText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
                <AntDesign name="right" size={26} color={"#CBD5E0"} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      )}
    </>
  );
}

const styles = StyleSheet.create({
    profileContainer: { alignItems: 'center',  },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e0e0e0' },
    cameraIcon: { position: "absolute", bottom: 0, right: 0, width: 30, height: 30, backgroundColor: "#f5f5f5", borderRadius: 15, justifyContent: "center", alignItems: "center" },
    removeText: { color: 'red', marginTop: 10, fontFamily: 'Nunito_600SemiBold' },
    userName: { textAlign: "center", fontSize: 25, paddingTop: 10, fontFamily: "Raleway_700Bold" },
    menuContainer: { marginHorizontal: 16, marginTop: 30 },
    menuHeader: { fontSize: 20, marginBottom: 16, fontFamily: "Raleway_700Bold" },
    menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    menuItemContent: { flexDirection: "row", alignItems: "center", columnGap: 30 },
    iconContainer: { borderWidth: 2, borderColor: "#dde2ec", padding: 15, borderRadius: 100, width: 55, height: 55, justifyContent: 'center', alignItems: 'center',  },
    menuItemText: { fontSize: 16, fontFamily: "Nunito_700Bold" },
    menuItemSubText: { color: "#575757", fontFamily: "Nunito_400Regular" },
});
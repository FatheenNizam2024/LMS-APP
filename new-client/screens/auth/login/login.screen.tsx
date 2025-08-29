import {
  View, Text, ScrollView, Image, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { AntDesign,  Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Raleway_700Bold, Raleway_600SemiBold } from "@expo-google-fonts/raleway";
import { Nunito_700Bold, Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import { useState } from "react";
import { commonStyles } from "@/styles/common/common.styles";
import { router } from "expo-router";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import { Toast } from "react-native-toast-notifications";

export default function LoginScreen() {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [buttonSpinner, setButtonSpinner] = useState(false);
  const [userInfo, setUserInfo] = useState({ username: "", password: "" });

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold, Raleway_700Bold, Nunito_700Bold, Nunito_600SemiBold,
  });

  if (!fontsLoaded && !fontError) { return null; }

  const handleSignIn = async () => {
    if (!userInfo.username || !userInfo.password) {
        Toast.show("Please enter username and password", { type: "danger" });
        return;
    }
    setButtonSpinner(true);
    await axios
      .post(`${SERVER_URI}/student-login`, {
        username: userInfo.username,
        password: userInfo.password,
      })
      .then((res) => {
        Toast.show(res.data.message, { type: "success" });
        router.push({
            pathname: "/(routes)/verifyAccount",
            params: { userId: res.data.userId, isStudent: "true" } // Pass a flag
        });
      })
      .catch((error) => {
        Toast.show(error.response?.data?.message || "An error occurred", { type: "danger" });
      })
      .finally(() => {
        setButtonSpinner(false);
      });
  };

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1, paddingTop: 20 }}>
      <ScrollView>
        <Image style={styles.signInImage} source={require("@/assets/sign-in/sign_in.png")} />
        <Text style={[styles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>Welcome Back!</Text>
        <Text style={styles.learningText}>Login with your provided credentials</Text>
        <View style={styles.inputContainer}>
          <View>
            <TextInput
              style={[styles.input, { paddingLeft: 40 }]}
              placeholder="Username"
              value={userInfo.username}
              onChangeText={(value) => setUserInfo({ ...userInfo, username: value })}
            />
            <AntDesign style={styles.icon1} name="user" size={20} color={"#A1A1A1"} />
            <View style={{ marginTop: 15 }}>
              <TextInput
                style={commonStyles.input}
                secureTextEntry={!isPasswordVisible}
                placeholder="Password"
                value={userInfo.password}
                onChangeText={(value) => setUserInfo({ ...userInfo, password: value })}
              />
              <TouchableOpacity style={styles.visibleIcon} onPress={() => setPasswordVisible(!isPasswordVisible)}>
                {isPasswordVisible ? (
                  <Ionicons name="eye-off-outline" size={23} color={"#747474"} />
                ) : (
                  <Ionicons name="eye-outline" size={23} color={"#747474"} />
                )}
              </TouchableOpacity>
              <SimpleLineIcons style={styles.icon2} name="lock" size={20} color={"#A1A1A1"} />
            </View>
            <TouchableOpacity style={styles.loginButton} onPress={handleSignIn} disabled={buttonSpinner}>
              {buttonSpinner ? (
                <ActivityIndicator size="small" color={"white"} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
            {/* MODIFICATION: The "Don't have an account?" section is now removed */}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  signInImage: { width: "60%", height: 250, alignSelf: "center", marginTop: 50 },
  welcomeText: { textAlign: "center", fontSize: 24 },
  learningText: { textAlign: "center", color: "#575757", fontSize: 15, marginTop: 5 },
  inputContainer: { marginHorizontal: 16, marginTop: 30 },
  input: { height: 55, marginHorizontal: 16, borderRadius: 8, paddingLeft: 40, fontSize: 16, backgroundColor: "white", color: "#A1A1A1" },
  icon1: { position: "absolute", left: 26, top: 17.8 },
  visibleIcon: { position: "absolute", right: 30, top: 15 },
  icon2: { position: "absolute", left: 23, top: 17.8 },
  loginButton: { padding: 16, borderRadius: 8, marginHorizontal: 16, backgroundColor: "#2467EC", marginTop: 30 },
  loginButtonText: { color: "white", textAlign: "center", fontSize: 16, fontFamily: "Raleway_700Bold" },
});
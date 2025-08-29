// C:\LMS App copy Part 2\Lms-App - Copy\new-client\screens\auth\verify\verify.account.tsx

import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
} from "react-native";
import React, { useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import { Toast } from "react-native-toast-notifications";

export default function VerifyAccountScreen() {
  const { userId } = useLocalSearchParams();
  const [code, setCode] = useState(new Array(4).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef<any>([...Array(4)].map(() => React.createRef()));

  const handleInput = (text: any, index: any) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 3) {
      inputs.current[index + 1].current.focus();
    }
    if (text === "" && index > 0) {
      inputs.current[index - 1].current.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join("");
    if (otp.length !== 4) {
        Toast.show("Please enter the 4-digit code.", { type: "danger" });
        return;
    }
    setIsLoading(true);
    await axios
      .post(`${SERVER_URI}/student-verify-otp`, {
        userId: userId,
        otp: otp,
      })
      .then(async (res) => {
        // THE DEFINITIVE FIX: Store tokens BEFORE navigating
        await AsyncStorage.setItem("access_token", res.data.accessToken);
        await AsyncStorage.setItem("refresh_token", res.data.refreshToken);
        Toast.show("Login Successful!", { type: "success" });
        // Use replace to clear the auth stack
        router.replace("/(tabs)");
      })
      .catch((error) => {
        Toast.show(error.response?.data?.message || "Verification failed!", {
          type: "danger",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Verify Your Login</Text>
      <Text style={styles.subText}>
        We have sent a verification code to your registered email address.
      </Text>
      <View style={styles.inputContainer}>
        {code.map((_, index) => (
          <TextInput
            key={index} style={styles.inputBox} keyboardType="number-pad" maxLength={1}
            onChangeText={(text) => handleInput(text, index)} value={code[index]}
            ref={inputs.current[index]} autoFocus={index === 0}
          />
        ))}
      </View>
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleVerify} disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>
      <View style={styles.loginLink}>
        <Text style={styles.backText}>Entered wrong credentials?</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.loginText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "#F6F7F9" },
  headerText: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subText: { fontSize: 16, color: "#666", marginBottom: 20, textAlign: "center" },
  inputContainer: { flexDirection: "row", marginBottom: 20 },
  inputBox: { width: 60, height: 60, borderWidth: 1, borderColor: "#ddd", textAlign: "center", marginRight: 10, borderRadius: 10, fontSize: 20, backgroundColor: '#fff' },
  button: { backgroundColor: "#2467EC", width: '100%', height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginTop: 20 },
  buttonDisabled: { backgroundColor: '#A9A9A9' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  loginLink: { flexDirection: "row", marginTop: 30 },
  loginText: { color: "#2467EC", marginLeft: 5, fontSize: 16, fontWeight: 'bold' },
  backText: { fontSize: 16 },
});
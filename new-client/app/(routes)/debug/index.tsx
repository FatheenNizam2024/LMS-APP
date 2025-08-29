import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { SERVER_URI } from '@/utils/uri';
import { Stack } from 'expo-router';

export default function DebugScreen() {

  const onShare = async () => {
    try {
      await Share.share({
        message: `Compiled SERVER_URI: ${SERVER_URI}`,
      });
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Build Info" }} />
      <Text style={styles.label}>Compiled SERVER_URI:</Text>
      <Text style={styles.uri}>{SERVER_URI || "Not Defined!"}</Text>
      <TouchableOpacity style={styles.button} onPress={onShare}>
        <Text style={styles.buttonText}>Share URI</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  uri: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    backgroundColor: '#fff',
  },
  button: {
      backgroundColor: '#007BFF',
      padding: 15,
      borderRadius: 8,
  },
  buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
  }
});
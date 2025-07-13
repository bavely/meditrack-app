// app/(auth)/login.tsx
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../store/auth-store'
export default function LoginScreen() {
  const router = useRouter()
  const { login, isLoading, isAuthenticated } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
   const [submitLoading, setSubmitLoading] = useState(false);

    const handleLogin = async () => {
    if (!email.trim() || !password) {
      return Alert.alert('Error', 'Please fill in both email and password.');
    }

    setSubmitLoading(true);
    try {
      await login(email.trim(), password);
      if (!isAuthenticated) {
        router.replace('/(tabs)');
      }
      
    } catch (err: unknown) {
      let message = 'An unexpected error occurred. Please try again.';
      if (err instanceof Error) {
        message = err.message;
        if (err.message.includes('graphQLErrors')) {
          const parsedError = JSON.parse(err.message);
          if (parsedError.graphQLErrors && parsedError.graphQLErrors.length > 0) {
            message = parsedError.graphQLErrors[0].message;
          }
        }
      }
      Alert.alert('Login Failed', message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} disabled={isLoading || submitLoading} />
      <Text style={styles.link} onPress={() => router.push('/(auth)/signup')}>
        Don&apos;t have an account? Sign up
      </Text>
      <Text style={styles.link} onPress={() => router.push('/(auth)/forgot-password')}>
        Forgot password?
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24, flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  link: { marginTop: 16, color: 'blue', textAlign: 'center' },
})

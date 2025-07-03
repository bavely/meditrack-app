// app/(auth)/login.tsx
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native'
import Button from '../../components/ui/Button'
import { getUserProfile } from "../../services/userService"
import { useAuthStore } from '../../store/auth-store'
export default function LoginScreen() {
  const router = useRouter()
  const { login, isLoading, user, setUser } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const { error, supaUser } = await login(email.trim(), password)
    console.log('Login result:', JSON.stringify(supaUser) , error )
    if (supaUser) {
      // Fetch user profile after login
      const profile = await getUserProfile()
      console.log('User profile:', profile)
      setUser(profile)
    }
    if (error) {
      Alert.alert('Login Failed', error)
    } else {
      router.replace('/(tabs)')
    }
  }

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
      <Button title="Login" onPress={handleLogin} disabled={isLoading} />
      <Text style={styles.link} onPress={() => router.push('/(auth)/signup')}>
        Don&apos;t have an account? Sign up
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

// app/(auth)/signup.tsx
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../utils/auth'

export default function SignupScreen() {
  const router = useRouter()
  const { signup, isLoading } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = async () => {
    const { error } = await signup(email.trim(), password)
    if (error) {
      Alert.alert('Signup Failed', error)
    } else {
      Alert.alert('Success', 'Check your email for confirmation.')
      router.replace('/(auth)/login')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
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
      <Button title="Sign Up" onPress={handleSignup} disabled={isLoading} />
      <Text style={styles.link} onPress={() => router.push('/(auth)/login')}>
        Already have an account? Log in
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

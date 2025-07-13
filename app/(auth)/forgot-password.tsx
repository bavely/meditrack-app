import Button from '@/components/ui/Button';
import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { resetPassword } from '../../services/userService';

const ForgotPassword = () => {
    const [email, setEmail] = React.useState('');
    const handleResetPassword = async () => {
        console.log('Resetting password for:', email);
    if (!email.trim()) {
      return alert('Please enter your email.');
    }
        try {
        const response = await resetPassword(email);
        alert(response );
        } catch (error) {
        console.error(error);
        }
    };
  return (
    <View>
      <Text>Enter your email:</Text>
        <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ borderWidth: 1, padding: 10, margin: 10 }}
            value={email}
            onChangeText={setEmail}
        />

        <Button
            title="Reset Password"
            onPress={handleResetPassword}
        />
    </View>
  )
}

export default ForgotPassword
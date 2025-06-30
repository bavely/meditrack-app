import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';



export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
    <View style={styles.container}>
      <View>

          Go to home screen!

      </View>
      <View>
 
          Go to explore screen!

      </View>
      <View>

          Go to home screen!
        
      </View>
    </View>
      
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});

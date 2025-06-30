import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <View>
          <Link href="/" style={styles.link}>
            Go to home screen!
          </Link>
        </View>
        <View>
          <Link href="/" style={styles.link}>
            Go to explore screen!
          </Link>
        </View>
        <View>
          <Link href="/" style={styles.link}>
            Go to home screen!
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});

import { Colors } from "@/constants/Colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "./ui/Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  buttonTitle,
  onButtonPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      
      {buttonTitle && onButtonPress && (
        <Button
          title={buttonTitle}
          onPress={onButtonPress}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
  },
});
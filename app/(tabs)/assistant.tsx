import { Send } from "lucide-react-native";
import { useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import ChatMessage from "../../components/ChatMessage";
import { Colors } from "../../constants/Colors";
import { useAIAssistantStore } from "../../store/ai-assistant-store";

export default function AssistantScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const [question, setQuestion] = useState("");
  const flatListRef = useRef<FlatList>(null);
  
  const { messages, isLoading, askQuestion } = useAIAssistantStore();
  
  const handleSendQuestion = async () => {
    if (!question.trim() || isLoading) return;
    
    const trimmedQuestion = question.trim();
    setQuestion("");
    
    await askQuestion(trimmedQuestion);
    
    // Scroll to bottom after a short delay to ensure new messages are rendered
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medication Assistant</Text>
        <Text style={styles.headerSubtitle}>
          Ask me anything about your medications
        </Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatMessage message={item} />}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          value={question}
          onChangeText={setQuestion}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSendQuestion}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!question.trim() || isLoading) && styles.disabledSendButton,
          ]}
          onPress={handleSendQuestion}
          disabled={!question.trim() || isLoading}
        >
          <Send size={20} color={Colors[colorScheme].foreground} />
        </TouchableOpacity>
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Thinking...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}


function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    header: {
      padding: 16,
      backgroundColor: Colors[colorScheme].background,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].text,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: Colors[colorScheme].text,
    },
    messagesList: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
      paddingTop: 8,
    },
    inputContainer: {
      flexDirection: "row",
      padding: 12,
      backgroundColor: Colors[colorScheme].background,
      borderTopWidth: 1,
      borderTopColor: Colors[colorScheme].text,
      alignItems: "flex-end",
    },
    input: {
      flex: 1,
      backgroundColor: Colors[colorScheme].tint,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      paddingRight: 48,
      maxHeight: 120,
      fontSize: 16,
    },
    sendButton: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: "center",
      alignItems: "center",
    },
    disabledSendButton: {
      opacity: 0.5,
    },
    loadingContainer: {
      position: "absolute",
      bottom: 80,
      left: 0,
      right: 0,
      alignItems: "center",
      padding: 8,
    },
    loadingText: {
      backgroundColor: Colors[colorScheme].tint,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      fontSize: 14,
      color: Colors[colorScheme].foreground,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  });
}

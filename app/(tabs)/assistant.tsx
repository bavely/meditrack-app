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
import ChatMessage from "../../components/ChatMessage";
import { Colors } from "../../constants/Colors";
import { spacing } from "../../constants/Theme";
import { useAIAssistantStore } from "../../store/ai-assistant-store";

export default function AssistantScreen() {
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
          <Send size={20} color="#FFFFFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color:  Colors.light.text,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    padding: spacing.sm + spacing.xs,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.text,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs / 2,
    paddingRight: spacing.xl + spacing.md,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    position: "absolute",
    right: spacing.lg - spacing.xs,
    bottom: spacing.lg - spacing.xs,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
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
    padding: spacing.sm,
  },
  loadingText: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
    fontSize: 14,
    color: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
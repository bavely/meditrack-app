import Button from "@/components/ui/Button";
import { ApolloError } from "@apollo/client";
import { Link } from "expo-router";
import React from "react";
import { Text, TextInput, View } from "react-native";
import { resetPassword } from "../../services/userService";
const ForgotPassword = () => {
  const [email, setEmail] = React.useState("");
  const [userMsg, setUserMsg] = React.useState({
    type: "",
    message: "",
  });
  const handleResetPassword = async () => {
    if (!email.trim()) {
      setUserMsg({
        type: "error",
        message: "Please enter an email address.",
      });
      return;
    }
    console.log("Resetting password for:", email);
    resetPassword(email)
      .then((res) => {
        let respcontent = res.data.forgotPassword;
        setUserMsg({
          type: "success",
          message: respcontent.data.message,
        });
      })
      .catch((err) => {
        if (err instanceof ApolloError) {
          if (err.graphQLErrors && err.graphQLErrors.length > 0) {
            setUserMsg({
              type: "error",
              message: err.graphQLErrors[0].message,
            });
          }
        }
      });
  };
  console.log(userMsg);
  return (
    <View className="flex-1 flex  justify-center px-[24]">
      {userMsg.type && (
        <Text
          className={`${userMsg.type === "success" ? "text-[green]" : "text-[red]"}`}
        >
          {userMsg.message}
        </Text>
      )}
      <Text>Enter your email:</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        className="border border-[#ccc] rounded-md p-3 my-2"
      />

      <Button title="Reset Password" onPress={handleResetPassword} />
      <Link className="text-blue-500 text-center my-4" href="/(auth)/login">
        Login
      </Link>
    </View>
  );
};

export default ForgotPassword;

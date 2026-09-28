import { Redirect } from "expo-router";

/** Deep-link landing route for the managed auth broker. */
export default function AuthCallback() {
  return <Redirect href="/" />;
}

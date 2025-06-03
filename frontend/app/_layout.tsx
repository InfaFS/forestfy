import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StatusBar } from "react-native";
import { Colors } from "../constants/Colors";
import { useActiveAccount } from "thirdweb/react";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
	const colorScheme = useColorScheme();
	const account = useActiveAccount();
	const router = useRouter();
	const segments = useSegments();

	useEffect(() => {
		const inAuthGroup = segments[0] !== "(tabs)";
		const inLoginScreen = segments[0] === "login";

		if (!account && inAuthGroup) {
			// Redirigir a login si no hay cuenta y estamos en una ruta protegida
			router.replace("/login");
		} else if (account && inLoginScreen) {
			// Redirigir a la página principal si hay cuenta y estamos en login
			router.replace("/(tabs)/focus");
		}
	}, [account, segments[0]]); // Solo dependemos del primer segmento para evitar actualizaciones innecesarias

	return (
		<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
			<StatusBar
				backgroundColor={Colors[colorScheme ?? "light"].background}
				barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
			/>
			<Stack
				screenOptions={{
					animation: "slide_from_bottom",
					animationDuration: 200,
					contentStyle: {
						backgroundColor: Colors[colorScheme ?? "light"].background,
					},
					headerShown: false,
				}}
			>
				<Stack.Screen 
					name="login" 
					options={{ 
						headerShown: false,
						animation: "slide_from_bottom",
					}} 
				/>
				<Stack.Screen 
					name="(tabs)" 
					options={{ 
						headerShown: false,
						animation: "slide_from_bottom",
					}} 
				/>
				<Stack.Screen 
					name="+not-found" 
					options={{
						headerShown: false,
						animation: "slide_from_bottom",
					}}
				/>
			</Stack>
		</ThemeProvider>
	);
}

export default function RootLayout() {
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<ThirdwebProvider>
			<RootLayoutNav />
		</ThirdwebProvider>
	);
}

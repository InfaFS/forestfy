import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedButton } from "@/components/ThemedButton";
import { useConnect } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { useRouter } from "expo-router";
import { useActiveAccount } from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";
import { client } from "@/constants/thirdweb";

export default function LoginScreen() {
	const { connect, isConnecting } = useConnect();
	const router = useRouter();
	const account = useActiveAccount();

	// Si ya está conectado, redirigir a la página principal
	React.useEffect(() => {
		if (account) {
			router.replace("/(tabs)/focus");
		}
	}, [account]);

	return (
		<ThemedView style={styles.container}>
			<ThemedView style={styles.contentContainer}>
				<ThemedText type="title" style={styles.title}>
					Bienvenido a Forestfy
				</ThemedText>
				<ThemedText type="subtext" style={styles.subtitle}>
					Conecta tu wallet para acceder a todas las funcionalidades
				</ThemedText>

				<ThemedView style={styles.buttonContainer}>
					<ThemedButton
						title="Conectar con Google"
						loading={isConnecting}
						loadingTitle="Conectando..."
						onPress={() => {
							connect(async () => {
								const w = inAppWallet({
									auth: {
										options: ["google"],
									},
									smartAccount: {
										chain: baseSepolia,
										sponsorGas: true,
									},
								});
								await w.connect({
									client,
									strategy: "google",
								});
								return w;
							});
						}}
					/>
				</ThemedView>
			</ThemedView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 60,
	},
	contentContainer: {
		flex: 1,
		padding: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 24,
		marginBottom: 10,
		textAlign: "center",
	},
	subtitle: {
		textAlign: "center",
		marginBottom: 30,
	},
	buttonContainer: {
		width: "100%",
		maxWidth: 300,
		gap: 12,
		alignItems: "center",
	},
	button: {
		width: "100%",
		height: 50,
		borderRadius: 25,
	},
}); 
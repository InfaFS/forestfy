import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedButton } from "@/components/ThemedButton";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";

export default function ConfigScreen() {
	const account = useActiveAccount();
	const wallet = useActiveWallet();
	const { disconnect } = useDisconnect();

	return (
		<ProtectedRoute>
			<ThemedView style={styles.container}>
				<ThemedView style={styles.titleContainer}>
					<ThemedText type="title">Configuración</ThemedText>
				</ThemedView>
				<ThemedView style={styles.contentContainer}>
					<ThemedText type="subtitle">Tu cuenta</ThemedText>
					<ThemedText type="subtext">
						Wallet conectada: {account && shortenAddress(account.address)}
					</ThemedText>
					<ThemedButton
						title="Desconectar Wallet"
						variant="secondary"
						onPress={() => {
							if (wallet) {
								disconnect(wallet);
							}
						}}
					/>
				</ThemedView>
			</ThemedView>
		</ProtectedRoute>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 60,
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 20,
	},
	contentContainer: {
		padding: 20,
		gap: 16,
	},
}); 
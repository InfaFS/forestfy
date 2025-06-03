import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function TreesScreen() {
	return (
		<ProtectedRoute>
			<ThemedView style={styles.container}>
				<ThemedView style={styles.titleContainer}>
					<ThemedText type="title">Trees</ThemedText>
				</ThemedView>
				<ThemedView style={styles.contentContainer}>
					<ThemedText type="subtitle">Tu bosque virtual</ThemedText>
					<ThemedText type="subtext">
						Aquí podrás ver y gestionar todos tus árboles plantados.
					</ThemedText>
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
		gap: 8,
	},
}); 
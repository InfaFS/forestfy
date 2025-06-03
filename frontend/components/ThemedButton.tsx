import { useThemeColor } from "@/hooks/useThemeColor";
import {
	type PressableProps,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	ViewStyle,
} from "react-native";
import { ThemedText } from "./ThemedText";

export type ThemedButtonProps = {
	lightColor?: string;
	darkColor?: string;
	onPress?: PressableProps["onPress"];
	title: string;
	loading?: boolean;
	loadingTitle?: string;
	variant?: "primary" | "secondary";
	style?: ViewStyle;
};

export function ThemedButton(props: ThemedButtonProps) {
	const variant = props.variant ?? "primary";
	const bg = useThemeColor(
		{ light: props.lightColor, dark: props.darkColor },
		"tint",
	);
	const textInverted = useThemeColor(
		{ light: props.lightColor, dark: props.darkColor },
		"textInverted",
	);
	const text = useThemeColor(
		{ light: props.lightColor, dark: props.darkColor },
		"text",
	);
	const textColor = variant == "secondary" ? text : textInverted;
	return (
		<TouchableOpacity
			disabled={props.loading}
			activeOpacity={0.5}
			style={[
				styles.button,
				{
					borderColor: variant == "secondary" ? bg : "transparent",
					borderWidth: variant == "secondary" ? 1 : 0,
					backgroundColor: variant == "secondary" ? "transparent" : bg,
				},
				props.style,
			]}
			onPress={(e) => {
				props.onPress?.(e);
			}}
		>
			{props.loading && (
				<ActivityIndicator animating={props.loading} color={textColor} />
			)}
			<ThemedText type="defaultSemiBold" style={{ color: textColor }}>
				{props.loading ? props.loadingTitle : props.title}
			</ThemedText>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	button: {
		width: "100%",
		height: 50,
		flexDirection: "row",
		gap: 8,
		padding: 12,
		borderRadius: 25,
		justifyContent: "center",
		alignItems: "center",
	},
});

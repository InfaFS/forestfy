import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
				tabBarStyle: {
					backgroundColor: Colors[colorScheme ?? "light"].background,
					borderTopColor: Colors[colorScheme ?? "light"].border,
				},
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="trees"
				options={{
					title: "Trees",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "leaf" : "leaf-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="focus"
				options={{
					title: "Focus",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "timer" : "timer-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="config"
				options={{
					title: "Config",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "settings" : "settings-outline"}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}

import { Tabs } from "expo-router";
import { View } from "react-native";
import { colors } from "@/theme/colors";

export default function RootLayout() {
    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.accent,
                    tabBarInactiveTintColor: "#8A8EA3",
                    tabBarStyle: {
                        backgroundColor: colors.bg2,
                        borderTopColor: colors.border,
                    },
                }}
            >
                <Tabs.Screen name="(tabs)/log" options={{ title: "Log" }} />
                <Tabs.Screen
                    name="(tabs)/calendar"
                    options={{ title: "Calendar" }}
                />
                <Tabs.Screen
                    name="(tabs)/reports"
                    options={{ title: "Reports" }}
                />
                <Tabs.Screen
                    name="(tabs)/insights"
                    options={{ title: "Insights" }}
                />
            </Tabs>
        </View>
    );
}

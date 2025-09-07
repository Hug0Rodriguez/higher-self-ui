import { Text as RNText, TextProps } from "react-native";
import { colors } from "../theme/colors";

export function Text(props: TextProps & { dim?: boolean }) {
    return (
        <RNText
            {...props}
            style={[
                { color: props.dim ? colors.sub : colors.text },
                props.style,
            ]}
        />
    );
}

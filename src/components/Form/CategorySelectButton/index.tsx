import React from "react";
import { RectButtonProps } from "react-native-gesture-handler";
import { Category, Container, Icon } from "./styles";

interface Props extends RectButtonProps {
  title: string;
}

export function CategorySelectButton({ title, ...rest }: Props) {
  return (
    <Container {...rest}>
      <Category>{title}</Category>
      <Icon name="chevron-down" />
    </Container>
  );
}

import { PressKit, pressMetadata } from "./PressKit";

export const metadata = pressMetadata("en");

export default function PressPage() {
  return <PressKit lang="en" />;
}

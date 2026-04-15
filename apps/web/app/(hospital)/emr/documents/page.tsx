import { TopBar } from "@/components/hospital/TopBar";
import DocumentVault from "@/components/emr/DocumentVault";

export default function DocumentsPage() {
  return (
    <>
      <TopBar title="Document Vault" />
      <DocumentVault />
    </>
  );
}

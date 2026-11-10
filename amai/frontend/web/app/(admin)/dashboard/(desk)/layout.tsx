import AdminGate from "@/components/admin/AdminGate";

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}

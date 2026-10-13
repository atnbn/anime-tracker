type AuthNoticeTone = "error" | "success" | "warning";

type AuthNoticeProps = {
  message: string;
  tone: AuthNoticeTone;
};

const toneLabels: Record<AuthNoticeTone, string> = {
  error: "Error",
  success: "Success",
  warning: "Heads up",
};

export default function AuthNotice({ message, tone }: AuthNoticeProps) {
  return (
    <div className={`auth-notice auth-notice-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <strong>{toneLabels[tone]}</strong>
      <p>{message}</p>
    </div>
  );
}

import { renderToString } from "react-dom/server";
import { Layout } from "../layouts/layout";

export type ResetPasswordEmailProps = {
  name: string;
  otp: string;
  confirmUrl: string;
};

const ResetPasswordEmail = (props: ResetPasswordEmailProps) => {
  return (
    <Layout headerIcon="🔐" headerTitle="Redefinição de Senha">
      <p>
        Olá <strong>{props.name}</strong>,
      </p>

      <p>Recebemos uma solicitação para redefinir a senha da sua conta Orça. Use o código abaixo para continuar:</p>

      <div className="email-code">{props.otp}</div>

      <div style={{ textAlign: "center" }}>
        <a href={props.confirmUrl} className="email-button">
          Redefinir Senha
        </a>
      </div>

      <div className="email-divider"></div>

      <p style={{ textAlign: "center", fontSize: "14px", color: "#757575" }}>
        Ou copie este link em seu navegador:
        <br />
        <span style={{ wordBreak: "break-all" }}>{props.confirmUrl}</span>
      </p>

      <p>
        <em>Este código expira em 1 hora por questões de segurança.</em>
      </p>

      <div className="email-warning">
        <strong>Segurança:</strong> Se você não solicitou esta redefinição, ignore este e-mail e verifique a segurança da sua conta.
      </div>
    </Layout>
  );
};

export const resetPasswordEmailRenderer = (props: ResetPasswordEmailProps) => renderToString(<ResetPasswordEmail {...props} />);

import { renderToString } from "react-dom/server";
import { Layout } from "../layouts/Layout";

export type SignUpEmailProps = {
  name: string;
  otp: string;
  confirmUrl: string;
};

const SignUpEmail = (props: SignUpEmailProps) => {
  return (
    <Layout headerIcon="🎉" headerTitle="Bem-vindo ao Orça!">
      <p>
        Olá <strong>{props.name}</strong>,
      </p>

      <p>Estamos felizes em tê-lo conosco. Para ativar sua conta e começar a controlar suas finanças, use o código abaixo:</p>

      <div className="email-code">{props.otp}</div>

      <div style={{ textAlign: "center" }}>
        <a href={props.confirmUrl} className="email-button">
          Confirmar E-mail
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

      <div className="email-warning">Se você não se cadastrou no Orça, ignore este e-mail.</div>
    </Layout>
  );
};

export const signUpEmailRenderer = (props: SignUpEmailProps) => renderToString(<SignUpEmail {...props} />);

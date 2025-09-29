import { renderToString } from "react-dom/server";
import { Layout } from "../layouts/Layout";

export type DeleteAccountEmailProps = {
  name: string;
  otp: string;
  confirmUrl: string;
};

export const DeleteAccountEmail = (props: DeleteAccountEmailProps) => {
  return (
    <Layout headerIcon="⚠️" headerTitle="Confirmação de Exclusão">
      <p>
        Olá <strong>{props.name}</strong>,
      </p>

      <p>
        Recebemos uma solicitação para <strong>excluir permanentemente</strong> sua conta Orça e todos os dados associados.
      </p>

      <div className="email-warning">
        <strong>⚠️ Atenção: Esta ação é irreversível</strong>
        <br />
        <br />
        Serão excluídos permanentemente:
        <ul>
          <li>Sua assinatura</li>
          <li>Seu perfil e configurações</li>
          <li>Todas as despesas e receitas cadastradas</li>
          <li>Suas categorias personalizadas e relatórios</li>
          <li>Seu histórico financeiro completo</li>
        </ul>
      </div>

      <div className="email-code">{props.otp}</div>

      <div style={{ textAlign: "center" }}>
        <a href={props.confirmUrl} className="email-button">
          Confirmar Exclusão da Conta
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
        <strong>Segurança:</strong> Se você não solicitou esta exclusão, ignore este e-mail e verifique a segurança da sua conta.
      </div>
    </Layout>
  );
};

export const deleteAccountEmailRenderer = (props: DeleteAccountEmailProps) => renderToString(<DeleteAccountEmail {...props} />);

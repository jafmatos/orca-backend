import { signUpEmailRenderer } from "./templates/SignUpEmail";
import { resetPasswordEmailRenderer } from "./templates/ResetPasswordEmail";
import { deleteAccountEmailRenderer } from "./templates/DeleteAccountEmail";

type TemplateName = "sign-up-email" | "reset-password-email" | "delete-account-email";

type TemplateRenderer = (props: any) => string;

const renderers: Record<TemplateName, TemplateRenderer> = {
  "sign-up-email": signUpEmailRenderer,
  "reset-password-email": resetPasswordEmailRenderer,
  "delete-account-email": deleteAccountEmailRenderer,
};

export class EmailTemplateService {
  async render(templateName: TemplateName, props: any): Promise<string> {
    try {
      const renderer = renderers[templateName];
      const renderedView = renderer(props);

      return renderedView;
    } catch (error: any) {
      throw new Error(`Failed to render template ${templateName}: ${error.message}`);
    }
  }
}
